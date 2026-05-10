"use server";

import Notification from "@/database/notification.model";
import Enrollment from "@/database/enrollment.model";
import Assignment from "@/database/assignment.model";
import Submission from "@/database/submission.model";
import { connectToDatabase } from "@/lib/mongoose";
import { getCurrentMongoUser } from "@/actions/user.action";
import { revalidatePath } from "next/cache";

export type NotificationKind =
  | "lecture_published"
  | "quiz_published"
  | "assignment_published"
  | "assignment_due_soon"
  | "enrollment_request_created"
  | "enrollment_request_decided"
  | "forum_thread_created"
  | "forum_reply_posted"
  | "submission_received"
  | "submission_reviewed"
  | "lecture_processing_done"
  | "lecture_processing_failed";

export type CreateNotificationInput = {
  recipient: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  refId?: string;
};

/**
 * Idempotent notification create. Relies on the unique index
 * (recipient, kind, refId) — duplicate inserts are silently ignored.
 */
export async function createNotification(input: CreateNotificationInput) {
  await connectToDatabase();
  try {
    await Notification.create({
      recipient: input.recipient,
      kind: input.kind,
      title: input.title,
      body: input.body ?? "",
      link: input.link ?? "",
      refId: input.refId,
    });
  } catch (err: any) {
    // Duplicate key (E11000) means the notification already exists — fine.
    if (err?.code !== 11000) {
      console.log("createNotification failed", err?.message ?? err);
    }
  }
}

/**
 * Internal helper: fan out a notification to every student enrolled in a
 * course. Failure of any single insert never bubbles up.
 */
export async function fanOutCourseNotification(params: {
  courseId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  refId?: string;
}) {
  await connectToDatabase();
  const enrollments = await Enrollment.find({
    course: params.courseId,
  })
    .select({ student: 1 })
    .lean<{ student: any }[]>();

  await Promise.all(
    enrollments.map((e) =>
      createNotification({
        recipient: String(e.student),
        kind: params.kind,
        title: params.title,
        body: params.body,
        link: params.link,
        refId: params.refId,
      }),
    ),
  );
}

export async function listNotifications(limit = 30) {
  const user = await getCurrentMongoUser();
  if (!user) return [];
  await connectToDatabase();
  const items = await Notification.find({ recipient: user._id })
    .sort({ readAt: 1, createdAt: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export async function getUnreadCount() {
  const user = await getCurrentMongoUser();
  if (!user) return 0;
  await connectToDatabase();
  return Notification.countDocuments({
    recipient: user._id,
    readAt: null,
  });
}

export async function markRead(id: string) {
  const user = await getCurrentMongoUser();
  if (!user) throw new Error("Unauthorized");
  await connectToDatabase();
  await Notification.updateOne(
    { _id: id, recipient: user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  revalidatePath("/notifications");
  return { ok: true };
}

export async function markAllRead() {
  const user = await getCurrentMongoUser();
  if (!user) throw new Error("Unauthorized");
  await connectToDatabase();
  await Notification.updateMany(
    { recipient: user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  revalidatePath("/notifications");
  return { ok: true };
}

/**
 * Side-effect helper invoked from student-facing pages: creates
 * `assignment_due_soon` notifications for any published assignment due in the
 * next 24h that the current student is enrolled in and has not submitted.
 * Idempotent thanks to the (recipient, kind, refId) unique index.
 */
export async function pollDueSoonForCurrentStudent() {
  const user = await getCurrentMongoUser();
  if (!user || user.role === "faculty") return;
  await connectToDatabase();

  const enrollments = await Enrollment.find({ student: user._id })
    .select({ course: 1 })
    .lean<{ course: any }[]>();
  if (enrollments.length === 0) return;
  const courseIds = enrollments.map((e) => e.course);

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const dueSoon = await Assignment.find({
    course: { $in: courseIds },
    status: "published",
    dueDate: { $gt: now, $lte: horizon },
  })
    .select({ _id: 1, title: 1, dueDate: 1 })
    .lean<{ _id: any; title: string; dueDate: Date }[]>();
  if (dueSoon.length === 0) return;

  // Skip assignments the student already submitted.
  const subs = await Submission.find({
    assignment: { $in: dueSoon.map((a) => a._id) },
    student: user._id,
  })
    .select({ assignment: 1 })
    .lean<{ assignment: any }[]>();
  const submitted = new Set(subs.map((s) => String(s.assignment)));

  await Promise.all(
    dueSoon
      .filter((a) => !submitted.has(String(a._id)))
      .map((a) =>
        createNotification({
          recipient: String(user._id),
          kind: "assignment_due_soon",
          title: `Due soon: ${a.title}`,
          body: `Submit before ${new Date(a.dueDate).toLocaleString()}.`,
          link: `/student/assignments/${a._id}`,
          refId: String(a._id),
        }),
      ),
  );
}
