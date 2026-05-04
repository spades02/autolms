"use server";

import Lecture from "@/database/lecture.model";
import Enrollment from "@/database/enrollment.model";
import Course from "@/database/course.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";
import { assertFacultyOwnsCourse } from "@/actions/course.action";
import { fanOutCourseNotification } from "@/actions/notification.action";
import { revalidatePath } from "next/cache";

export async function createLecture(params: {
  courseId: string;
  title: string;
  weekNumber?: number;
  videoUrl: string;
}) {
  const { user } = await assertFacultyOwnsCourse(params.courseId);
  await connectToDatabase();

  if (!params.title?.trim()) throw new Error("Title is required.");
  if (!params.videoUrl?.trim()) throw new Error("Video URL is required.");

  const lecture = await Lecture.create({
    course: params.courseId,
    title: params.title.trim(),
    weekNumber: params.weekNumber,
    videoUrl: params.videoUrl,
    uploadedBy: user._id,
    status: "Uploaded",
  });

  revalidatePath(`/faculty/courses/${params.courseId}`);

  return JSON.parse(JSON.stringify(lecture));
}

/**
 * Returns lectures for a course. Faculty (owner/admin) see all statuses;
 * students see only Published lectures and only if enrolled.
 */
export async function getLecturesForCourse(courseId: string) {
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
  if (!isFaculty) filter.status = "Published";

  const lectures = await Lecture.find(filter)
    .sort({ weekNumber: 1, createdAt: 1 })
    .lean();

  return JSON.parse(JSON.stringify(lectures));
}

/**
 * Lecture detail. Same role-aware visibility as getLecturesForCourse.
 */
export async function getLectureById(id: string) {
  const user = await getCurrentMongoUser();
  if (!user) return null;

  await connectToDatabase();

  const lecture = await Lecture.findById(id).lean<any>();
  if (!lecture) return null;

  const course = await Course.findById(lecture.course).lean<{
    _id: any;
    faculty: any;
    title: string;
  }>();
  if (!course) return null;

  const isFaculty =
    String(course.faculty) === String(user._id) || user.role === "admin";

  if (!isFaculty) {
    if (lecture.status !== "Published") return null;
    const enrolled = await Enrollment.exists({
      course: course._id,
      student: user._id,
    });
    if (!enrolled) return null;
  }

  return {
    lecture: JSON.parse(JSON.stringify(lecture)),
    course: JSON.parse(JSON.stringify(course)),
    role: isFaculty ? "faculty" : "student",
  };
}

export async function updateLectureContent(
  lectureId: string,
  patch: { transcript?: string; summary?: string },
) {
  await requireRole("faculty", "admin");
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new Error("Lecture not found");

  await assertFacultyOwnsCourse(String(lecture.course));

  if (lecture.status !== "ReviewReady" && lecture.status !== "Published") {
    throw new Error(
      `Cannot edit content while status is ${lecture.status}. Wait for processing to finish.`,
    );
  }

  if (typeof patch.transcript === "string") lecture.transcript = patch.transcript;
  if (typeof patch.summary === "string") lecture.summary = patch.summary;
  await lecture.save();

  revalidatePath(`/faculty/lectures/${lectureId}`);

  return JSON.parse(JSON.stringify(lecture));
}

export async function publishLecture(lectureId: string) {
  await requireRole("faculty", "admin");
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new Error("Lecture not found");

  await assertFacultyOwnsCourse(String(lecture.course));

  if (!lecture.transcript?.trim() || !lecture.summary?.trim()) {
    throw new Error("Transcript and summary must both be filled in to publish.");
  }

  lecture.status = "Published";
  lecture.publishedAt = new Date();
  await lecture.save();

  try {
    await fanOutCourseNotification({
      courseId: String(lecture.course),
      kind: "lecture_published",
      title: `New lecture: ${lecture.title}`,
      body: "A new lecture is now available in your course.",
      link: `/student/lectures/${lecture._id}`,
      refId: String(lecture._id),
    });
  } catch (err) {
    console.log("lecture publish fan-out failed", err);
  }

  revalidatePath(`/faculty/lectures/${lectureId}`);
  revalidatePath(`/faculty/courses/${lecture.course}`);
  revalidatePath(`/student/courses/${lecture.course}`);

  return JSON.parse(JSON.stringify(lecture));
}

export async function retryLectureProcessing(lectureId: string) {
  await requireRole("faculty", "admin");
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new Error("Lecture not found");

  await assertFacultyOwnsCourse(String(lecture.course));

  if (lecture.status !== "Failed") {
    throw new Error("Only failed lectures can be retried.");
  }

  lecture.status = "Uploaded";
  lecture.processingError = "";
  await lecture.save();

  return JSON.parse(JSON.stringify(lecture));
}
