"use server";

import Quiz from "@/database/quiz.model";
import QuizAttempt from "@/database/quizAttempt.model";
import Lecture from "@/database/lecture.model";
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
import { generateQuizQuestions } from "@/lib/generate";
import { revalidatePath } from "next/cache";

async function loadQuizForFaculty(quizId: string) {
  await connectToDatabase();
  const quiz = await Quiz.findById(quizId);
  if (!quiz) throw new Error("Quiz not found");
  await assertFacultyOwnsCourse(String(quiz.course));
  return quiz;
}

export async function generateQuizDraft(params: {
  lectureId: string;
  count?: number;
  title?: string;
}) {
  const user = await requireRole("faculty", "admin");
  await connectToDatabase();

  const lecture = await Lecture.findById(params.lectureId);
  if (!lecture) throw new Error("Lecture not found");
  await assertFacultyOwnsCourse(String(lecture.course));

  if (!lecture.transcript?.trim()) {
    throw new Error(
      "Lecture has no transcript yet — wait for processing to finish.",
    );
  }

  const draft = await generateQuizQuestions(
    lecture.transcript,
    params.count ?? 10,
  );

  const quiz = await Quiz.create({
    course: lecture.course,
    lecture: lecture._id,
    author: user._id,
    title: params.title?.trim() || `Quiz: ${lecture.title}`,
    status: "draft",
    maxAttempts: 1,
    questions: draft.questions,
  });

  revalidatePath(`/faculty/courses/${lecture.course}/quizzes`);
  return JSON.parse(JSON.stringify(quiz));
}

export async function createBlankQuiz(params: {
  courseId: string;
  lectureId?: string;
  title: string;
}) {
  const { user } = await assertFacultyOwnsCourse(params.courseId);
  await connectToDatabase();

  if (!params.title?.trim()) throw new Error("Title is required");

  const quiz = await Quiz.create({
    course: params.courseId,
    lecture: params.lectureId,
    author: user._id,
    title: params.title.trim(),
    status: "draft",
    maxAttempts: 1,
    questions: [],
  });

  revalidatePath(`/faculty/courses/${params.courseId}/quizzes`);
  return JSON.parse(JSON.stringify(quiz));
}

export async function updateQuiz(
  quizId: string,
  patch: {
    title?: string;
    maxAttempts?: number;
    questions?: any[];
  },
) {
  const quiz = await loadQuizForFaculty(quizId);

  if (typeof patch.title === "string") quiz.title = patch.title;
  if (typeof patch.maxAttempts === "number")
    quiz.maxAttempts = Math.max(0, Math.floor(patch.maxAttempts));

  if (Array.isArray(patch.questions)) {
    if (quiz.status === "published" && patch.questions.length === 0) {
      throw new Error("Cannot remove all questions from a published quiz.");
    }
    if (quiz.status === "published") {
      throw new Error(
        "Unpublish the quiz before editing questions.",
      );
    }
    // Light validation: each question needs prompt, ≥2 options, valid correctIndex.
    for (const q of patch.questions) {
      if (!q?.prompt?.trim()) throw new Error("Each question needs a prompt.");
      if (!Array.isArray(q.options) || q.options.length < 2) {
        throw new Error("Each question needs at least two options.");
      }
      if (
        typeof q.correctIndex !== "number" ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      ) {
        throw new Error("Each question needs a valid correct option.");
      }
    }
    quiz.questions = patch.questions;
  }

  await quiz.save();
  revalidatePath(`/faculty/quizzes/${quizId}`);
  return JSON.parse(JSON.stringify(quiz));
}

export async function publishQuiz(quizId: string) {
  const quiz = await loadQuizForFaculty(quizId);
  if (quiz.questions.length === 0) {
    throw new Error("Add at least one question before publishing.");
  }
  quiz.status = "published";
  quiz.publishedAt = new Date();
  await quiz.save();

  try {
    await fanOutCourseNotification({
      courseId: String(quiz.course),
      kind: "quiz_published",
      title: `New quiz: ${quiz.title}`,
      body: `${quiz.questions.length} question${quiz.questions.length === 1 ? "" : "s"} ready to attempt.`,
      link: `/student/courses/${quiz.course}/quizzes`,
      refId: String(quiz._id),
    });
  } catch (err) {
    console.log("quiz publish fan-out failed", err);
  }

  revalidatePath(`/faculty/quizzes/${quizId}`);
  revalidatePath(`/faculty/courses/${quiz.course}/quizzes`);
  revalidatePath(`/student/courses/${quiz.course}/quizzes`);
  return JSON.parse(JSON.stringify(quiz));
}

export async function unpublishQuiz(quizId: string) {
  const quiz = await loadQuizForFaculty(quizId);
  quiz.status = "draft";
  quiz.publishedAt = undefined;
  await quiz.save();
  revalidatePath(`/faculty/quizzes/${quizId}`);
  revalidatePath(`/student/courses/${quiz.course}/quizzes`);
  return JSON.parse(JSON.stringify(quiz));
}

export async function deleteQuiz(quizId: string) {
  const quiz = await loadQuizForFaculty(quizId);
  if (quiz.status === "published") {
    throw new Error("Unpublish before deleting.");
  }
  const courseId = String(quiz.course);
  await Quiz.deleteOne({ _id: quiz._id });
  revalidatePath(`/faculty/courses/${courseId}/quizzes`);
  return { ok: true };
}

export async function getQuizzesForCourse(courseId: string) {
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

  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  if (isFaculty) {
    // Decorate with attempt counts for the faculty list.
    const ids = quizzes.map((q: any) => q._id);
    const counts = await QuizAttempt.aggregate([
      { $match: { quiz: { $in: ids } } },
      { $group: { _id: "$quiz", count: { $sum: 1 } } },
    ]);
    const countByQuiz = new Map(
      counts.map((c: any) => [String(c._id), c.count]),
    );
    return quizzes.map((q: any) => ({
      ...q,
      attemptsCount: countByQuiz.get(String(q._id)) ?? 0,
    }));
  }

  // Decorate with student's best score and remaining attempts.
  const myAttempts = await QuizAttempt.find({
    quiz: { $in: quizzes.map((q: any) => q._id) },
    student: user._id,
  }).lean();
  const myByQuiz = new Map<string, any[]>();
  for (const a of myAttempts as any[]) {
    const list = myByQuiz.get(String(a.quiz)) ?? [];
    list.push(a);
    myByQuiz.set(String(a.quiz), list);
  }
  return quizzes.map((q: any) => {
    const mine = myByQuiz.get(String(q._id)) ?? [];
    const best = mine.reduce(
      (acc, a) => (a.score > acc ? a.score : acc),
      -1,
    );
    const used = mine.length;
    const remaining =
      q.maxAttempts === 0 ? Infinity : Math.max(0, q.maxAttempts - used);
    return {
      ...q,
      attemptsUsed: used,
      attemptsRemaining: remaining === Infinity ? null : remaining,
      bestScore: best === -1 ? null : best,
    };
  });
}

export async function getQuizForFaculty(quizId: string) {
  const quiz = await loadQuizForFaculty(quizId);
  return JSON.parse(JSON.stringify(quiz));
}

export async function getQuizForAttempt(quizId: string) {
  const user = await requireRole("student");
  await connectToDatabase();

  const quiz = await Quiz.findById(quizId);
  if (!quiz || quiz.status !== "published") {
    throw new Error("Quiz not available");
  }

  const enrolled = await Enrollment.exists({
    course: quiz.course,
    student: user._id,
  });
  if (!enrolled) throw new Error("Not enrolled in this course");

  const used = await QuizAttempt.countDocuments({
    quiz: quiz._id,
    student: user._id,
  });
  const remaining =
    quiz.maxAttempts === 0
      ? null
      : Math.max(0, quiz.maxAttempts - used);
  if (remaining !== null && remaining === 0) {
    throw new Error("No attempts remaining");
  }

  // Strip correct answers before sending to the student.
  const safeQuestions = quiz.questions.map((q: any) => ({
    prompt: q.prompt,
    options: q.options,
  }));

  return {
    quiz: {
      _id: String(quiz._id),
      title: quiz.title,
      maxAttempts: quiz.maxAttempts,
      course: String(quiz.course),
      questions: safeQuestions,
    },
    attemptsUsed: used,
    attemptsRemaining: remaining,
  };
}

export async function submitQuizAttempt(
  quizId: string,
  answers: number[],
) {
  const user = await requireRole("student");
  await connectToDatabase();

  const quiz = await Quiz.findById(quizId);
  if (!quiz || quiz.status !== "published") {
    throw new Error("Quiz not available");
  }

  const enrolled = await Enrollment.exists({
    course: quiz.course,
    student: user._id,
  });
  if (!enrolled) throw new Error("Not enrolled");

  // Enforce attempt limit before scoring (avoid wasted writes on race).
  const used = await QuizAttempt.countDocuments({
    quiz: quiz._id,
    student: user._id,
  });
  if (quiz.maxAttempts !== 0 && used >= quiz.maxAttempts) {
    throw new Error("No attempts remaining");
  }

  if (
    !Array.isArray(answers) ||
    answers.length !== quiz.questions.length ||
    answers.some(
      (a, i) =>
        typeof a !== "number" ||
        a < 0 ||
        a >= quiz.questions[i].options.length,
    )
  ) {
    throw new Error("Answer all questions before submitting.");
  }

  let score = 0;
  const perQuestion = quiz.questions.map((q: any, i: number) => {
    const ok = answers[i] === q.correctIndex;
    if (ok) score += 1;
    return {
      prompt: q.prompt,
      options: q.options,
      selected: answers[i],
      correctIndex: q.correctIndex,
      explanation: q.explanation ?? "",
      correct: ok,
    };
  });

  const attempt = await QuizAttempt.create({
    quiz: quiz._id,
    student: user._id,
    answers,
    score,
    total: quiz.questions.length,
    submittedAt: new Date(),
  });

  revalidatePath(`/student/courses/${quiz.course}/quizzes`);

  return {
    attemptId: String(attempt._id),
    score,
    total: quiz.questions.length,
    perQuestion,
    courseId: String(quiz.course),
  };
}

export async function getMyAttempts(quizId: string) {
  const user = await requireRole("student");
  await connectToDatabase();
  const attempts = await QuizAttempt.find({
    quiz: quizId,
    student: user._id,
  })
    .sort({ submittedAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(attempts));
}

export async function getAttemptResult(attemptId: string) {
  const user = await getCurrentMongoUser();
  if (!user) throw new Error("Unauthorized");
  await connectToDatabase();

  const attempt = await QuizAttempt.findById(attemptId).lean<any>();
  if (!attempt) throw new Error("Attempt not found");

  const isOwner = String(attempt.student) === String(user._id);
  const isAdmin = user.role === "admin";

  const quiz = await Quiz.findById(attempt.quiz).lean<any>();
  if (!quiz) throw new Error("Quiz not found");

  let isFaculty = false;
  if (!isOwner && !isAdmin) {
    const course = await Course.findById(quiz.course).lean<any>();
    isFaculty = course && String(course.faculty) === String(user._id);
    if (!isFaculty) throw new Error("Forbidden");
  }

  const perQuestion = quiz.questions.map((q: any, i: number) => ({
    prompt: q.prompt,
    options: q.options,
    selected: attempt.answers[i],
    correctIndex: q.correctIndex,
    explanation: q.explanation ?? "",
    correct: attempt.answers[i] === q.correctIndex,
  }));

  return {
    attempt: JSON.parse(JSON.stringify(attempt)),
    quiz: { _id: String(quiz._id), title: quiz.title, course: String(quiz.course) },
    perQuestion,
  };
}

export async function getAttemptsForQuiz(quizId: string) {
  await loadQuizForFaculty(quizId);
  await connectToDatabase();
  const attempts = await QuizAttempt.find({ quiz: quizId })
    .sort({ submittedAt: -1 })
    .populate({
      path: "student",
      model: User,
      select: "_id name username picture email",
    })
    .lean();
  return JSON.parse(JSON.stringify(attempts));
}
