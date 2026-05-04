"use server";

import Assignment from "@/database/assignment.model";
import Submission from "@/database/submission.model";
import Course from "@/database/course.model";
import Enrollment from "@/database/enrollment.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";
import { assertFacultyOwnsCourse } from "@/actions/course.action";
import { fanOutCourseNotification } from "@/actions/notification.action";
import { revalidatePath } from "next/cache";

async function loadAssignmentForFaculty(id: string) {
  await connectToDatabase();
  const assignment = await Assignment.findById(id);
  if (!assignment) throw new Error("Assignment not found");
  await assertFacultyOwnsCourse(String(assignment.course));
  return assignment;
}

export async function createAssignment(params: {
  courseId: string;
  title: string;
  instructions?: string;
  dueDate: string | Date;
  allowLate?: boolean;
  attachments?: { url: string; name: string; size?: number }[];
}) {
  const { user } = await assertFacultyOwnsCourse(params.courseId);
  await connectToDatabase();

  if (!params.title?.trim()) throw new Error("Title is required.");
  const due = new Date(params.dueDate);
  if (Number.isNaN(due.getTime())) throw new Error("Invalid due date.");

  const assignment = await Assignment.create({
    course: params.courseId,
    author: user._id,
    title: params.title.trim(),
    instructions: params.instructions ?? "",
    dueDate: due,
    allowLate: params.allowLate ?? true,
    attachments: params.attachments ?? [],
    status: "draft",
  });

  revalidatePath(`/faculty/courses/${params.courseId}/assignments`);
  return JSON.parse(JSON.stringify(assignment));
}

export async function updateAssignment(
  id: string,
  patch: {
    title?: string;
    instructions?: string;
    dueDate?: string | Date;
    allowLate?: boolean;
    attachments?: { url: string; name: string; size?: number }[];
  },
) {
  const assignment = await loadAssignmentForFaculty(id);

  if (typeof patch.title === "string") assignment.title = patch.title;
  if (typeof patch.instructions === "string")
    assignment.instructions = patch.instructions;
  if (typeof patch.allowLate === "boolean")
    assignment.allowLate = patch.allowLate;
  if (Array.isArray(patch.attachments))
    assignment.attachments = patch.attachments;
  if (patch.dueDate) {
    const due = new Date(patch.dueDate);
    if (Number.isNaN(due.getTime())) throw new Error("Invalid due date.");
    assignment.dueDate = due;
  }

  await assignment.save();
  revalidatePath(`/faculty/assignments/${id}`);
  return JSON.parse(JSON.stringify(assignment));
}

export async function publishAssignment(id: string) {
  const assignment = await loadAssignmentForFaculty(id);
  assignment.status = "published";
  assignment.publishedAt = new Date();
  await assignment.save();

  try {
    await fanOutCourseNotification({
      courseId: String(assignment.course),
      kind: "assignment_published",
      title: `New assignment: ${assignment.title}`,
      body: `Due ${new Date(assignment.dueDate).toLocaleString()}.`,
      link: `/student/assignments/${assignment._id}`,
      refId: String(assignment._id),
    });
  } catch (err) {
    console.log("assignment publish fan-out failed", err);
  }

  revalidatePath(`/faculty/assignments/${id}`);
  revalidatePath(`/faculty/courses/${assignment.course}/assignments`);
  revalidatePath(`/student/courses/${assignment.course}/assignments`);
  return JSON.parse(JSON.stringify(assignment));
}

export async function unpublishAssignment(id: string) {
  const assignment = await loadAssignmentForFaculty(id);
  assignment.status = "draft";
  assignment.publishedAt = undefined;
  await assignment.save();
  revalidatePath(`/faculty/assignments/${id}`);
  revalidatePath(`/student/courses/${assignment.course}/assignments`);
  return JSON.parse(JSON.stringify(assignment));
}

export async function deleteAssignment(id: string) {
  const assignment = await loadAssignmentForFaculty(id);
  if (assignment.status === "published") {
    throw new Error("Unpublish before deleting.");
  }
  const courseId = String(assignment.course);
  await Assignment.deleteOne({ _id: assignment._id });
  revalidatePath(`/faculty/courses/${courseId}/assignments`);
  return { ok: true };
}

export async function getAssignmentsForCourse(courseId: string) {
  const user = await getCurrentMongoUser();
  if (!user) return [];
  await connectToDatabase();

  const course = await Course.findById(courseId).lean<{
    _id: any;
    faculty: any;
  }>();
  if (!course) return [];

  const isFaculty =
    String(course.faculty) === String(user._id) || user.role === "admin";

  if (!isFaculty) {
    const enrolled = await Enrollment.exists({
      course: courseId,
      student: user._id,
    });
    if (!enrolled) return [];
  }

  const filter: any = { course: courseId };
  if (!isFaculty) filter.status = "published";

  const assignments = await Assignment.find(filter)
    .sort({ dueDate: 1 })
    .lean();

  if (isFaculty) {
    const ids = assignments.map((a: any) => a._id);
    const counts = await Submission.aggregate([
      { $match: { assignment: { $in: ids } } },
      {
        $group: {
          _id: "$assignment",
          total: { $sum: 1 },
          reviewed: {
            $sum: { $cond: [{ $eq: ["$status", "Reviewed"] }, 1, 0] },
          },
        },
      },
    ]);
    const byId = new Map(counts.map((c: any) => [String(c._id), c]));
    return assignments.map((a: any) => {
      const c: any = byId.get(String(a._id));
      return {
        ...a,
        submissionsCount: c?.total ?? 0,
        reviewedCount: c?.reviewed ?? 0,
      };
    });
  }

  // Decorate with the student's own submission status.
  const mySubs = await Submission.find({
    assignment: { $in: assignments.map((a: any) => a._id) },
    student: user._id,
  }).lean<any[]>();
  const subByAssignment = new Map(
    mySubs.map((s: any) => [String(s.assignment), s]),
  );
  return assignments.map((a: any) => ({
    ...a,
    mySubmission: subByAssignment.get(String(a._id))
      ? JSON.parse(JSON.stringify(subByAssignment.get(String(a._id))))
      : null,
  }));
}

export async function getAssignmentById(id: string) {
  const user = await getCurrentMongoUser();
  if (!user) return null;
  await connectToDatabase();

  const assignment = await Assignment.findById(id).lean<any>();
  if (!assignment) return null;

  const course = await Course.findById(assignment.course).lean<any>();
  if (!course) return null;

  const isFaculty =
    String(course.faculty) === String(user._id) || user.role === "admin";

  if (!isFaculty) {
    if (assignment.status !== "published") return null;
    const enrolled = await Enrollment.exists({
      course: course._id,
      student: user._id,
    });
    if (!enrolled) return null;
  }

  const out: any = {
    assignment: JSON.parse(JSON.stringify(assignment)),
    course: JSON.parse(JSON.stringify(course)),
    role: isFaculty ? "faculty" : "student",
  };

  if (!isFaculty) {
    const mine = await Submission.findOne({
      assignment: assignment._id,
      student: user._id,
    }).lean();
    out.mySubmission = mine ? JSON.parse(JSON.stringify(mine)) : null;
  }

  return out;
}

export async function submitAssignment(params: {
  assignmentId: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  note?: string;
}) {
  const user = await requireRole("student");
  await connectToDatabase();

  const assignment = await Assignment.findById(params.assignmentId);
  if (!assignment || assignment.status !== "published") {
    throw new Error("Assignment not available");
  }

  const enrolled = await Enrollment.exists({
    course: assignment.course,
    student: user._id,
  });
  if (!enrolled) throw new Error("Not enrolled");

  const now = new Date();
  const isLate = now > assignment.dueDate;
  if (isLate && !assignment.allowLate) {
    throw new Error(
      "Submissions are closed — the deadline has passed and late uploads are not allowed.",
    );
  }

  const submission = await Submission.findOneAndUpdate(
    { assignment: assignment._id, student: user._id },
    {
      $set: {
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        fileSize: params.fileSize,
        note: params.note ?? "",
        submittedAt: now,
        isLate,
        status: "Submitted",
        feedback: "",
        grade: null,
        reviewedAt: undefined,
        reviewedBy: undefined,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  revalidatePath(`/student/courses/${assignment.course}/assignments`);
  revalidatePath(`/student/assignments/${params.assignmentId}`);
  revalidatePath(`/faculty/assignments/${params.assignmentId}`);
  return JSON.parse(JSON.stringify(submission));
}

export async function getSubmissionsForAssignment(assignmentId: string) {
  await loadAssignmentForFaculty(assignmentId);
  await connectToDatabase();
  const submissions = await Submission.find({ assignment: assignmentId })
    .sort({ submittedAt: -1 })
    .populate({
      path: "student",
      model: User,
      select: "_id name username picture email",
    })
    .lean();
  return JSON.parse(JSON.stringify(submissions));
}

export async function reviewSubmission(
  submissionId: string,
  patch: { feedback?: string; grade?: number | null },
) {
  const user = await requireRole("faculty", "admin");
  await connectToDatabase();

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error("Submission not found");

  const assignment = await Assignment.findById(submission.assignment);
  if (!assignment) throw new Error("Assignment not found");
  await assertFacultyOwnsCourse(String(assignment.course));

  if (typeof patch.feedback === "string") submission.feedback = patch.feedback;
  if (patch.grade === null) submission.grade = null;
  else if (typeof patch.grade === "number") {
    if (patch.grade < 0 || patch.grade > 100) {
      throw new Error("Grade must be between 0 and 100.");
    }
    submission.grade = patch.grade;
  }

  submission.status = "Reviewed";
  submission.reviewedAt = new Date();
  submission.reviewedBy = user._id;
  await submission.save();

  revalidatePath(`/faculty/assignments/${assignment._id}`);
  revalidatePath(`/student/assignments/${assignment._id}`);
  return JSON.parse(JSON.stringify(submission));
}
