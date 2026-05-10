"use server";

import Course from "@/database/course.model";
import Enrollment from "@/database/enrollment.model";
import EnrollmentRequest from "@/database/enrollmentRequest.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";
import { createNotification } from "@/actions/notification.action";
import { revalidatePath } from "next/cache";

const JOIN_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const JOIN_CODE_LEN = 6;
const MAX_JOIN_CODE_TRIES = 8;

function randomJoinCode() {
  let out = "";
  for (let i = 0; i < JOIN_CODE_LEN; i++) {
    out += JOIN_CODE_ALPHABET.charAt(
      Math.floor(Math.random() * JOIN_CODE_ALPHABET.length),
    );
  }
  return out;
}

async function generateUniqueJoinCode() {
  for (let i = 0; i < MAX_JOIN_CODE_TRIES; i++) {
    const code = randomJoinCode();
    const exists = await Course.exists({ joinCode: code });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique join code; try again.");
}

/**
 * Faculty creates a new course. Returns the saved course (with joinCode).
 */
export async function createCourse(params: {
  title: string;
  description?: string;
  code?: string;
}) {
  const user = await requireRole("faculty", "admin");
  await connectToDatabase();

  const joinCode = await generateUniqueJoinCode();

  const course = await Course.create({
    title: params.title,
    description: params.description ?? "",
    code: params.code,
    joinCode,
    faculty: user._id,
  });

  revalidatePath("/faculty");

  return JSON.parse(JSON.stringify(course));
}

/**
 * Faculty: list all courses they own.
 */
export async function getFacultyCourses() {
  const user = await requireRole("faculty", "admin");
  await connectToDatabase();

  const courses = await Course.find({ faculty: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(courses));
}

/**
 * Student: list all courses they are enrolled in.
 */
export async function getStudentCourses() {
  const user = await getCurrentMongoUser();
  if (!user) return [];

  await connectToDatabase();

  const enrollments = await Enrollment.find({ student: user._id })
    .populate({
      path: "course",
      model: Course,
      populate: {
        path: "faculty",
        model: User,
        select: "_id name username picture",
      },
    })
    .sort({ enrolledAt: -1 })
    .lean();

  const courses = enrollments
    .map((e: any) => e.course)
    .filter((c: any) => c);

  return JSON.parse(JSON.stringify(courses));
}

/**
 * Course detail with role-aware access. Faculty (owner) and admin see it
 * unconditionally. Students see it only if enrolled.
 */
export async function getCourseById(id: string) {
  const user = await getCurrentMongoUser();
  if (!user) return null;

  await connectToDatabase();

  const course = await Course.findById(id).populate({
    path: "faculty",
    model: User,
    select: "_id name username picture",
  });
  if (!course) return null;

  const isFacultyOwner = String(course.faculty._id) === String(user._id);
  const isAdmin = user.role === "admin";

  let isEnrolled = false;
  if (!isFacultyOwner && !isAdmin) {
    isEnrolled = !!(await Enrollment.exists({
      course: course._id,
      student: user._id,
    }));
  }

  if (!isFacultyOwner && !isAdmin && !isEnrolled) return null;

  const enrollmentCount = await Enrollment.countDocuments({
    course: course._id,
  });

  return {
    course: JSON.parse(JSON.stringify(course)),
    role: isFacultyOwner || isAdmin ? "faculty" : "student",
    enrollmentCount,
  };
}

/**
 * Throws if the current user is not the course's faculty (or an admin).
 * Returns the course document on success.
 */
export async function assertFacultyOwnsCourse(courseId: string) {
  const user = await getCurrentMongoUser();
  if (!user) throw new Error("Unauthorized");

  await connectToDatabase();
  const course = await Course.findById(courseId).lean<{
    _id: any;
    faculty: any;
  }>();
  if (!course) throw new Error("Course not found");

  const isFacultyOwner = String(course.faculty) === String(user._id);
  const isAdmin = user.role === "admin";
  if (!isFacultyOwner && !isAdmin) {
    throw new Error("Forbidden: not the course owner");
  }
  return { user, course };
}

/**
 * Student: requests enrollment in a course by its join code. Phase 6 changed
 * the semantics from instant-enroll to request-and-approve — faculty must
 * approve via /faculty/courses/[id]/enrollments before the student is added.
 */
export async function joinCourseByCode(code: string) {
  const user = await requireRole("student");
  await connectToDatabase();

  const trimmed = code.trim().toUpperCase();
  if (!trimmed) throw new Error("Enter a course code.");

  const course = await Course.findOne({ joinCode: trimmed });
  if (!course) throw new Error("No course matches that code.");

  if (String(course.faculty) === String(user._id)) {
    throw new Error("Faculty cannot enroll in their own course.");
  }

  // Already enrolled?
  const existingEnrollment = await Enrollment.exists({
    course: course._id,
    student: user._id,
  });
  if (existingEnrollment) {
    throw new Error("You are already enrolled in this course.");
  }

  // Already pending?
  const existingPending = await EnrollmentRequest.findOne({
    course: course._id,
    student: user._id,
    status: "pending",
  });
  if (existingPending) {
    throw new Error("You already have a pending request for this course.");
  }

  const request = await EnrollmentRequest.create({
    course: course._id,
    student: user._id,
    status: "pending",
  });

  // Notify the course faculty. refId on the request itself so each row is
  // unique under the (recipient, kind, refId) constraint.
  try {
    await createNotification({
      recipient: String(course.faculty),
      kind: "enrollment_request_created",
      title: `New enrollment request: ${course.title}`,
      body: `${user.name || user.username || user.email} wants to join.`,
      link: `/faculty/courses/${course._id}/enrollments`,
      refId: String(request._id),
    });
  } catch (err) {
    console.log("enrollment notify failed", err);
  }

  revalidatePath("/student");

  return JSON.parse(JSON.stringify(course));
}
