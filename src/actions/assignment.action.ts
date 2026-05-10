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
import {
  createNotification,
  fanOutCourseNotification,
} from "@/actions/notification.action";
import {
  generateEmbedding,
  gradeSubmissionWithRubric,
} from "@/lib/generate";
import { extractTextFromUpload } from "@/lib/extractText";
import { cosineSimilarity } from "@/lib/similarity";
import { revalidatePath } from "next/cache";

const PLAGIARISM_THRESHOLD = 0.85;

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
  rubric?: string;
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
    rubric: params.rubric ?? "",
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
    rubric?: string;
    dueDate?: string | Date;
    allowLate?: boolean;
    attachments?: { url: string; name: string; size?: number }[];
  },
) {
  const assignment = await loadAssignmentForFaculty(id);

  if (typeof patch.title === "string") assignment.title = patch.title;
  if (typeof patch.instructions === "string")
    assignment.instructions = patch.instructions;
  if (typeof patch.rubric === "string") assignment.rubric = patch.rubric;
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

/**
 * Internal — runs text extraction + AI grading + embedding for a saved
 * submission. Failures don't propagate; the submission stays usable.
 */
export async function runAutoGrade(submissionId: string) {
  await connectToDatabase();
  const sub = await Submission.findById(submissionId);
  if (!sub) return;

  // Extract text once and store it for later (also feeds embedding).
  let text = "";
  try {
    text = await extractTextFromUpload({
      url: sub.fileUrl,
      fileName: sub.fileName,
    });
    sub.extractedText = text;
    sub.extractionFailed = false;
  } catch (err: any) {
    sub.extractionFailed = true;
    await sub.save();
    console.log("extraction failed", submissionId, err?.message);
    return;
  }

  // Embedding for plagiarism scan (cheap, doesn't depend on rubric).
  try {
    const emb = await generateEmbedding(text);
    sub.embedding = emb;
  } catch (err: any) {
    console.log("embedding failed", submissionId, err?.message);
  }

  // AI grade only if the assignment has a rubric set.
  const assignment = await Assignment.findById(sub.assignment);
  if (assignment?.rubric?.trim()) {
    try {
      const result = await gradeSubmissionWithRubric({
        instructions: assignment.instructions ?? "",
        rubric: assignment.rubric,
        submissionText: text,
      });
      sub.aiGrade = Math.max(0, Math.min(10, result.score));
      sub.aiFeedback = result.feedback;
      sub.aiGradedAt = new Date();
    } catch (err: any) {
      console.log("ai grade failed", submissionId, err?.message);
    }
  }

  await sub.save();
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
        gradeApproved: false,
        aiGrade: null,
        aiFeedback: "",
        aiGradedAt: undefined,
        embedding: [],
        extractedText: "",
        extractionFailed: false,
        reviewedAt: undefined,
        reviewedBy: undefined,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  // Synchronous AI pipeline. Failures are logged but never bubble up.
  try {
    await runAutoGrade(String(submission._id));
  } catch (err) {
    console.log("auto-grade pipeline error", err);
  }

  // Notify the course faculty that a submission landed.
  try {
    const course = await Course.findById(assignment.course).lean<{
      _id: any;
      faculty: any;
    }>();
    if (course) {
      await createNotification({
        recipient: String(course.faculty),
        kind: "submission_received",
        title: `Submission: ${assignment.title}`,
        body: `${user.name || user.username || user.email} submitted${isLate ? " (late)" : ""}.`,
        link: `/faculty/assignments/${assignment._id}`,
        refId: String(submission._id),
      });
    }
  } catch (err) {
    console.log("submission_received notify failed", err);
  }

  revalidatePath(`/student/courses/${assignment.course}/assignments`);
  revalidatePath(`/student/assignments/${params.assignmentId}`);
  revalidatePath(`/faculty/assignments/${params.assignmentId}`);

  // Re-load so the caller sees the AI grade if it landed.
  const fresh = await Submission.findById(submission._id).lean();
  return JSON.parse(JSON.stringify(fresh));
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
    .lean<any[]>();

  // Compute pairwise plagiarism similarities once and decorate each row.
  const decorated = submissions.map((s) => ({ ...s, mostSimilar: null as any }));
  const withEmb = decorated.filter(
    (s) => Array.isArray(s.embedding) && s.embedding.length > 0,
  );
  for (let i = 0; i < withEmb.length; i++) {
    let bestScore = -1;
    let bestIdx = -1;
    for (let j = 0; j < withEmb.length; j++) {
      if (i === j) continue;
      const score = cosineSimilarity(withEmb[i].embedding, withEmb[j].embedding);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0 && bestScore >= PLAGIARISM_THRESHOLD) {
      const target = withEmb[bestIdx];
      withEmb[i].mostSimilar = {
        submissionId: String(target._id),
        score: bestScore,
        studentName:
          target.student?.name ||
          target.student?.username ||
          target.student?.email ||
          "—",
      };
    }
  }
  return JSON.parse(JSON.stringify(decorated));
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
    if (patch.grade < 0 || patch.grade > 10) {
      throw new Error("Grade must be between 0 and 10.");
    }
    submission.grade = patch.grade;
  }

  submission.status = "Reviewed";
  submission.gradeApproved = true;
  submission.reviewedAt = new Date();
  submission.reviewedBy = user._id;
  await submission.save();

  // Notify the student that their submission was reviewed.
  try {
    await createNotification({
      recipient: String(submission.student),
      kind: "submission_reviewed",
      title: `Reviewed: ${assignment.title}`,
      body:
        submission.grade !== null
          ? `Grade: ${submission.grade} / 10.`
          : "Your submission has feedback.",
      link: `/student/assignments/${assignment._id}`,
      refId: String(submission._id),
    });
  } catch (err) {
    console.log("submission_reviewed notify failed", err);
  }

  revalidatePath(`/faculty/assignments/${assignment._id}`);
  revalidatePath(`/student/assignments/${assignment._id}`);
  return JSON.parse(JSON.stringify(submission));
}

/**
 * Faculty trigger to re-run the auto-grade pipeline on a single submission
 * (e.g. after editing the rubric, or if the original run errored).
 */
export async function rerunAutoGrade(submissionId: string) {
  await requireRole("faculty", "admin");
  await connectToDatabase();
  const sub = await Submission.findById(submissionId);
  if (!sub) throw new Error("Submission not found");
  const assignment = await Assignment.findById(sub.assignment);
  if (!assignment) throw new Error("Assignment not found");
  await assertFacultyOwnsCourse(String(assignment.course));
  await runAutoGrade(String(sub._id));
  revalidatePath(`/faculty/assignments/${assignment._id}`);
  return { ok: true };
}
