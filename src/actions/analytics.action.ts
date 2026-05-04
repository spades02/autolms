"use server";

import Course from "@/database/course.model";
import Enrollment from "@/database/enrollment.model";
import Lecture from "@/database/lecture.model";
import Quiz from "@/database/quiz.model";
import QuizAttempt from "@/database/quizAttempt.model";
import Assignment from "@/database/assignment.model";
import Submission from "@/database/submission.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";
import { assertFacultyOwnsCourse } from "@/actions/course.action";

const HIST_BUCKETS = 5;

function bucketize(scoresPct: number[]): number[] {
  const buckets = Array(HIST_BUCKETS).fill(0);
  for (const pct of scoresPct) {
    let idx = Math.floor((pct / 100) * HIST_BUCKETS);
    if (idx >= HIST_BUCKETS) idx = HIST_BUCKETS - 1;
    if (idx < 0) idx = 0;
    buckets[idx] += 1;
  }
  return buckets;
}

export async function getFacultyCourseInsights(courseId: string) {
  await requireRole("faculty", "admin");
  await assertFacultyOwnsCourse(courseId);
  await connectToDatabase();

  const [enrollmentCount, lectures, quizzes, assignments] = await Promise.all([
    Enrollment.countDocuments({ course: courseId }),
    Lecture.find({ course: courseId }).select({ status: 1 }).lean<{ status: string }[]>(),
    Quiz.find({ course: courseId })
      .select({ _id: 1, title: 1, status: 1, questions: 1 })
      .sort({ createdAt: -1 })
      .lean<{ _id: any; title: string; status: string; questions: any[] }[]>(),
    Assignment.find({ course: courseId })
      .select({ _id: 1, title: 1, status: 1, dueDate: 1 })
      .sort({ dueDate: 1 })
      .lean<{ _id: any; title: string; status: string; dueDate: Date }[]>(),
  ]);

  const lectureCount = {
    Uploaded: 0,
    Processing: 0,
    ReviewReady: 0,
    Published: 0,
    Failed: 0,
  } as Record<string, number>;
  for (const l of lectures) {
    lectureCount[l.status] = (lectureCount[l.status] ?? 0) + 1;
  }

  // Quiz analytics: attempts + mean + histogram per quiz.
  const quizIds = quizzes.map((q) => q._id);
  const attempts = await QuizAttempt.find({ quiz: { $in: quizIds } })
    .select({ quiz: 1, score: 1, total: 1 })
    .lean<{ quiz: any; score: number; total: number }[]>();
  const attemptsByQuiz = new Map<string, number[]>();
  for (const a of attempts) {
    const k = String(a.quiz);
    const list = attemptsByQuiz.get(k) ?? [];
    const pct = a.total === 0 ? 0 : (a.score / a.total) * 100;
    list.push(pct);
    attemptsByQuiz.set(k, list);
  }
  const quizSummaries = quizzes.map((q) => {
    const list = attemptsByQuiz.get(String(q._id)) ?? [];
    const meanScorePct =
      list.length === 0
        ? null
        : list.reduce((sum, n) => sum + n, 0) / list.length;
    return {
      _id: String(q._id),
      title: q.title,
      status: q.status,
      questionCount: q.questions?.length ?? 0,
      attempts: list.length,
      meanScorePct,
      distribution: bucketize(list),
    };
  });

  // Assignment analytics: submissions / late / reviewed / mean grade per assignment.
  const assignmentIds = assignments.map((a) => a._id);
  const subs = await Submission.find({ assignment: { $in: assignmentIds } })
    .select({ assignment: 1, isLate: 1, status: 1, grade: 1 })
    .lean<{ assignment: any; isLate: boolean; status: string; grade: number | null }[]>();
  const subsByAssignment = new Map<string, typeof subs>();
  for (const s of subs) {
    const k = String(s.assignment);
    const list = subsByAssignment.get(k) ?? [];
    list.push(s);
    subsByAssignment.set(k, list);
  }
  const assignmentSummaries = assignments.map((a) => {
    const list = subsByAssignment.get(String(a._id)) ?? [];
    const reviewed = list.filter((s) => s.status === "Reviewed");
    const grades = reviewed
      .map((s) => s.grade)
      .filter((g): g is number => typeof g === "number");
    const meanGrade =
      grades.length === 0
        ? null
        : grades.reduce((sum, n) => sum + n, 0) / grades.length;
    return {
      _id: String(a._id),
      title: a.title,
      status: a.status,
      dueDate: a.dueDate,
      submissions: list.length,
      late: list.filter((s) => s.isLate).length,
      reviewed: reviewed.length,
      meanGrade,
    };
  });

  return {
    enrollmentCount,
    lectureCount,
    quizzes: JSON.parse(JSON.stringify(quizSummaries)),
    assignments: JSON.parse(JSON.stringify(assignmentSummaries)),
  };
}

export async function getStudentCourseProgress(courseId: string) {
  const user = await getCurrentMongoUser();
  if (!user) return null;
  await connectToDatabase();

  // Enforce enrollment (admins are still allowed to look).
  const course = await Course.findById(courseId).lean<{ _id: any; faculty: any }>();
  if (!course) return null;
  const isAdmin = user.role === "admin";
  if (!isAdmin) {
    const enrolled = await Enrollment.exists({
      course: courseId,
      student: user._id,
    });
    if (!enrolled) return null;
  }

  const [quizzes, attempts, assignments, subs] = await Promise.all([
    Quiz.find({ course: courseId, status: "published" })
      .select({ _id: 1, title: 1, questions: 1, maxAttempts: 1 })
      .lean<{ _id: any; title: string; questions: any[]; maxAttempts: number }[]>(),
    QuizAttempt.find({ student: user._id })
      .select({ quiz: 1, score: 1, total: 1 })
      .lean<{ quiz: any; score: number; total: number }[]>(),
    Assignment.find({ course: courseId, status: "published" })
      .select({ _id: 1, title: 1, dueDate: 1 })
      .sort({ dueDate: 1 })
      .lean<{ _id: any; title: string; dueDate: Date }[]>(),
    Submission.find({ student: user._id })
      .select({ assignment: 1, status: 1, isLate: 1, grade: 1 })
      .lean<
        { assignment: any; status: string; isLate: boolean; grade: number | null }[]
      >(),
  ]);

  const attemptsByQuiz = new Map<string, { score: number; total: number }[]>();
  for (const a of attempts) {
    const k = String(a.quiz);
    const list = attemptsByQuiz.get(k) ?? [];
    list.push({ score: a.score, total: a.total });
    attemptsByQuiz.set(k, list);
  }

  const quizRows = quizzes.map((q) => {
    const list = attemptsByQuiz.get(String(q._id)) ?? [];
    const used = list.length;
    const total = q.questions?.length ?? 0;
    const remaining =
      q.maxAttempts === 0 ? null : Math.max(0, q.maxAttempts - used);
    const bestPct =
      list.length === 0
        ? null
        : Math.max(
            ...list.map((a) =>
              a.total === 0 ? 0 : (a.score / a.total) * 100,
            ),
          );
    return {
      _id: String(q._id),
      title: q.title,
      questionCount: total,
      attemptsUsed: used,
      attemptsRemaining: remaining,
      bestScorePct: bestPct,
    };
  });

  const subByAssignment = new Map(
    subs.map((s) => [String(s.assignment), s] as const),
  );
  const assignmentRows = assignments.map((a) => {
    const sub = subByAssignment.get(String(a._id));
    return {
      _id: String(a._id),
      title: a.title,
      dueDate: a.dueDate,
      status: sub?.status ?? null,
      isLate: sub?.isLate ?? false,
      grade: sub?.grade ?? null,
    };
  });

  const summary = {
    quizzesAttempted: quizRows.filter((q) => q.attemptsUsed > 0).length,
    quizzesTotal: quizRows.length,
    assignmentsSubmitted: assignmentRows.filter((a) => a.status !== null).length,
    assignmentsTotal: assignmentRows.length,
  };

  return {
    quizzes: JSON.parse(JSON.stringify(quizRows)),
    assignments: JSON.parse(JSON.stringify(assignmentRows)),
    summary,
  };
}
