"use server";

import EnrollmentRequest from "@/database/enrollmentRequest.model";
import Enrollment from "@/database/enrollment.model";
import Course from "@/database/course.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/actions/user.action";
import { assertFacultyOwnsCourse } from "@/actions/course.action";
import { createNotification } from "@/actions/notification.action";
import { revalidatePath } from "next/cache";

export async function listPendingRequests(courseId: string) {
  await assertFacultyOwnsCourse(courseId);
  await connectToDatabase();
  const rows = await EnrollmentRequest.find({
    course: courseId,
    status: "pending",
  })
    .populate({
      path: "student",
      model: User,
      select: "_id name username email picture",
    })
    .sort({ requestedAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(rows));
}

export async function getPendingRequestCount(courseId: string) {
  // Internal helper for badge counts; faculty/admin only.
  await assertFacultyOwnsCourse(courseId);
  await connectToDatabase();
  return EnrollmentRequest.countDocuments({
    course: courseId,
    status: "pending",
  });
}

async function loadAndAssertOwnership(requestId: string) {
  await connectToDatabase();
  const req = await EnrollmentRequest.findById(requestId);
  if (!req) throw new Error("Request not found");
  await assertFacultyOwnsCourse(String(req.course));
  return req;
}

export async function approveRequest(requestId: string) {
  const me = await requireRole("faculty", "admin");
  const req = await loadAndAssertOwnership(requestId);
  if (req.status !== "pending") {
    throw new Error(`Request already ${req.status}.`);
  }

  // Idempotent enrollment create.
  await Enrollment.updateOne(
    { course: req.course, student: req.student },
    { $setOnInsert: { course: req.course, student: req.student } },
    { upsert: true },
  );

  req.status = "approved";
  req.decidedBy = me._id;
  req.decidedAt = new Date();
  await req.save();

  const course = await Course.findById(req.course).lean<{
    _id: any;
    title: string;
  }>();

  try {
    await createNotification({
      recipient: String(req.student),
      kind: "enrollment_request_decided",
      title: `Approved: ${course?.title ?? "Course"}`,
      body: "Your enrollment request was approved. The course is now in your dashboard.",
      link: `/student/courses/${req.course}`,
      refId: String(req._id),
    });
  } catch (err) {
    console.log("approval notify failed", err);
  }

  revalidatePath(`/faculty/courses/${req.course}/enrollments`);
  revalidatePath(`/faculty/courses/${req.course}`);
  revalidatePath(`/student`);

  return JSON.parse(JSON.stringify(req));
}

export async function rejectRequest(requestId: string) {
  const me = await requireRole("faculty", "admin");
  const req = await loadAndAssertOwnership(requestId);
  if (req.status !== "pending") {
    throw new Error(`Request already ${req.status}.`);
  }

  req.status = "rejected";
  req.decidedBy = me._id;
  req.decidedAt = new Date();
  await req.save();

  const course = await Course.findById(req.course).lean<{
    _id: any;
    title: string;
  }>();

  try {
    await createNotification({
      recipient: String(req.student),
      kind: "enrollment_request_decided",
      title: `Rejected: ${course?.title ?? "Course"}`,
      body: "Your enrollment request was rejected. Contact the instructor for details.",
      link: `/student`,
      refId: String(req._id),
    });
  } catch (err) {
    console.log("rejection notify failed", err);
  }

  revalidatePath(`/faculty/courses/${req.course}/enrollments`);

  return JSON.parse(JSON.stringify(req));
}
