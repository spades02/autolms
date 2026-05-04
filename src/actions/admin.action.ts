"use server";

import { clerkClient } from "@clerk/nextjs/server";
import User, { type UserRole } from "@/database/user.model";
import Course from "@/database/course.model";
import Enrollment from "@/database/enrollment.model";
import Lecture from "@/database/lecture.model";
import Quiz from "@/database/quiz.model";
import QuizAttempt from "@/database/quizAttempt.model";
import Assignment from "@/database/assignment.model";
import Submission from "@/database/submission.model";
import ChatSession from "@/database/chatSession.model";
import Notification from "@/database/notification.model";
import AuditLog from "@/database/auditLog.model";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/actions/user.action";
import { revalidatePath } from "next/cache";

const ALLOWED_ROLES: UserRole[] = ["student", "faculty", "admin"];

async function writeAudit(params: {
  actor: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AuditLog.create({
      actor: params.actor,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.log("audit log failed", err);
  }
}

export async function getPlatformStats() {
  await requireRole("admin");
  await connectToDatabase();

  const [
    studentCount,
    facultyCount,
    adminCount,
    courseCount,
    publishedLectures,
    publishedQuizzes,
    publishedAssignments,
    attemptCount,
    submissionCount,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    User.countDocuments({ role: "faculty" }),
    User.countDocuments({ role: "admin" }),
    Course.countDocuments({}),
    Lecture.countDocuments({ status: "Published" }),
    Quiz.countDocuments({ status: "published" }),
    Assignment.countDocuments({ status: "published" }),
    QuizAttempt.countDocuments({}),
    Submission.countDocuments({}),
  ]);

  return {
    users: { student: studentCount, faculty: facultyCount, admin: adminCount },
    courseCount,
    publishedLectures,
    publishedQuizzes,
    publishedAssignments,
    attemptCount,
    submissionCount,
  };
}

export async function getAllUsers() {
  await requireRole("admin");
  await connectToDatabase();
  const users = await User.find({})
    .sort({ joinedAt: -1 })
    .select({ _id: 1, name: 1, username: 1, email: 1, role: 1, joinedAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(users));
}

export async function updateUserRole(userId: string, role: UserRole) {
  const admin = await requireRole("admin");
  if (!ALLOWED_ROLES.includes(role)) {
    throw new Error("Invalid role");
  }
  await connectToDatabase();

  const target = await User.findById(userId);
  if (!target) throw new Error("User not found");
  if (target.role === role) {
    return JSON.parse(JSON.stringify(target));
  }

  // Don't let the last admin demote themselves into a role with no admin left.
  if (target.role === "admin" && role !== "admin") {
    const adminsLeft = await User.countDocuments({ role: "admin" });
    if (adminsLeft <= 1) {
      throw new Error(
        "Cannot demote the last admin — promote another admin first.",
      );
    }
  }

  const previousRole = target.role;
  target.role = role;
  await target.save();

  // Mirror to Clerk so client gates/auth metadata stay in sync.
  try {
    await clerkClient.users.updateUserMetadata(target.clerkId, {
      publicMetadata: { userId: target._id, role },
    });
  } catch (err) {
    console.log("clerk metadata sync failed", err);
  }

  await writeAudit({
    actor: String(admin._id),
    action: "role.update",
    targetType: "user",
    targetId: String(target._id),
    metadata: {
      email: target.email,
      previousRole,
      newRole: role,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return JSON.parse(JSON.stringify(target));
}

export async function getAllCoursesForAdmin() {
  await requireRole("admin");
  await connectToDatabase();
  const courses = await Course.find({})
    .populate({ path: "faculty", model: User, select: "_id name email" })
    .sort({ createdAt: -1 })
    .lean<any[]>();

  if (courses.length === 0) return [];

  const ids = courses.map((c) => c._id);
  const [enrollmentCounts, lectureCounts] = await Promise.all([
    Enrollment.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]),
    Lecture.aggregate([
      { $match: { course: { $in: ids } } },
      { $group: { _id: "$course", count: { $sum: 1 } } },
    ]),
  ]);
  const enrollById = new Map(
    enrollmentCounts.map((c: any) => [String(c._id), c.count]),
  );
  const lectureById = new Map(
    lectureCounts.map((c: any) => [String(c._id), c.count]),
  );

  return JSON.parse(
    JSON.stringify(
      courses.map((c) => ({
        ...c,
        enrollmentCount: enrollById.get(String(c._id)) ?? 0,
        lectureCount: lectureById.get(String(c._id)) ?? 0,
      })),
    ),
  );
}

export async function adminDeleteCourse(courseId: string) {
  const admin = await requireRole("admin");
  await connectToDatabase();

  const course = await Course.findById(courseId);
  if (!course) throw new Error("Course not found");

  // Gather child ids for cascading deletes.
  const lectures = await Lecture.find({ course: course._id })
    .select({ _id: 1 })
    .lean<{ _id: any }[]>();
  const quizzes = await Quiz.find({ course: course._id })
    .select({ _id: 1 })
    .lean<{ _id: any }[]>();
  const assignments = await Assignment.find({ course: course._id })
    .select({ _id: 1 })
    .lean<{ _id: any }[]>();

  const lectureIds = lectures.map((l) => l._id);
  const quizIds = quizzes.map((q) => q._id);
  const assignmentIds = assignments.map((a) => a._id);

  const counts = {
    lectures: 0,
    quizzes: 0,
    quizAttempts: 0,
    assignments: 0,
    submissions: 0,
    enrollments: 0,
    chatSessions: 0,
    notifications: 0,
  };

  // Delete in dependency order so nothing dangles even if a step fails.
  counts.notifications = (
    await Notification.deleteMany({
      refId: {
        $in: [...lectureIds, ...quizIds, ...assignmentIds, course._id],
      },
    })
  ).deletedCount;
  counts.chatSessions = (
    await ChatSession.deleteMany({ lecture: { $in: lectureIds } })
  ).deletedCount;
  counts.quizAttempts = (
    await QuizAttempt.deleteMany({ quiz: { $in: quizIds } })
  ).deletedCount;
  counts.submissions = (
    await Submission.deleteMany({ assignment: { $in: assignmentIds } })
  ).deletedCount;
  counts.assignments = (
    await Assignment.deleteMany({ course: course._id })
  ).deletedCount;
  counts.quizzes = (await Quiz.deleteMany({ course: course._id })).deletedCount;
  counts.lectures = (
    await Lecture.deleteMany({ course: course._id })
  ).deletedCount;
  counts.enrollments = (
    await Enrollment.deleteMany({ course: course._id })
  ).deletedCount;
  await Course.deleteOne({ _id: course._id });

  await writeAudit({
    actor: String(admin._id),
    action: "course.delete",
    targetType: "course",
    targetId: String(course._id),
    metadata: {
      title: course.title,
      faculty: String(course.faculty),
      cascade: counts,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/admin");
  return { ok: true, counts };
}

export async function getRecentAuditLogs(limit = 50) {
  await requireRole("admin");
  await connectToDatabase();
  const logs = await AuditLog.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate({ path: "actor", model: User, select: "_id name email" })
    .lean();
  return JSON.parse(JSON.stringify(logs));
}
