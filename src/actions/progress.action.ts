"use server";

import LectureView from "@/database/lectureView.model";
import Lecture from "@/database/lecture.model";
import Enrollment from "@/database/enrollment.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";

/**
 * Idempotent: records the first time the current student opens a lecture.
 * Safe to call on every render.
 */
export async function recordLectureView(lectureId: string) {
  const user = await getCurrentMongoUser();
  if (!user || user.role !== "student") return null;
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId).lean<{
    _id: any;
    course: any;
    status: string;
  }>();
  if (!lecture || lecture.status !== "Published") return null;

  const enrolled = await Enrollment.exists({
    course: lecture.course,
    student: user._id,
  });
  if (!enrolled) return null;

  try {
    const result = await LectureView.findOneAndUpdate(
      { student: user._id, lecture: lecture._id },
      {
        $setOnInsert: {
          student: user._id,
          lecture: lecture._id,
          course: lecture.course,
          firstViewedAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    return JSON.parse(JSON.stringify(result));
  } catch (err: any) {
    if (err?.code !== 11000) {
      console.log("recordLectureView failed", err?.message ?? err);
    }
    return null;
  }
}

export async function markLectureComplete(lectureId: string) {
  const user = await requireRole("student");
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId).lean<{
    _id: any;
    course: any;
    status: string;
  }>();
  if (!lecture) throw new Error("Lecture not found");
  if (lecture.status !== "Published") {
    throw new Error("Lecture is not published.");
  }
  const enrolled = await Enrollment.exists({
    course: lecture.course,
    student: user._id,
  });
  if (!enrolled) throw new Error("Not enrolled");

  await LectureView.findOneAndUpdate(
    { student: user._id, lecture: lecture._id },
    {
      $setOnInsert: {
        student: user._id,
        lecture: lecture._id,
        course: lecture.course,
        firstViewedAt: new Date(),
      },
      $set: { completedAt: new Date() },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { ok: true };
}

/**
 * Aggregate counts for the current student in a given course. Returns
 * {viewed, completed, total}. Total = published lectures the student can see.
 */
export async function getLectureProgressSummary(courseId: string) {
  const user = await getCurrentMongoUser();
  if (!user) return { viewed: 0, completed: 0, total: 0 };
  await connectToDatabase();

  const total = await Lecture.countDocuments({
    course: courseId,
    status: "Published",
  });
  if (total === 0) return { viewed: 0, completed: 0, total: 0 };

  const views = await LectureView.find({
    course: courseId,
    student: user._id,
  })
    .select({ completedAt: 1 })
    .lean<{ completedAt?: Date }[]>();

  return {
    viewed: views.length,
    completed: views.filter((v) => !!v.completedAt).length,
    total,
  };
}

export async function isLectureCompletedByMe(lectureId: string) {
  const user = await getCurrentMongoUser();
  if (!user) return false;
  await connectToDatabase();
  const view = await LectureView.findOne({
    student: user._id,
    lecture: lectureId,
  })
    .select({ completedAt: 1 })
    .lean<{ completedAt?: Date }>();
  return !!view?.completedAt;
}
