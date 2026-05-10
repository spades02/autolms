"use server";

import ForumThread from "@/database/forumThread.model";
import ForumPost from "@/database/forumPost.model";
import Course from "@/database/course.model";
import Enrollment from "@/database/enrollment.model";
import User from "@/database/user.model";
import { connectToDatabase } from "@/lib/mongoose";
import {
  getCurrentMongoUser,
  requireRole,
} from "@/actions/user.action";
import { createNotification } from "@/actions/notification.action";
import { revalidatePath } from "next/cache";

async function assertCanAccessCourse(courseId: string) {
  const user = await getCurrentMongoUser();
  if (!user) throw new Error("Unauthorized");
  await connectToDatabase();
  const course = await Course.findById(courseId).lean<{
    _id: any;
    faculty: any;
    title: string;
  }>();
  if (!course) throw new Error("Course not found");

  const isFaculty =
    String(course.faculty) === String(user._id) || user.role === "admin";

  if (!isFaculty) {
    const enrolled = await Enrollment.exists({
      course: courseId,
      student: user._id,
    });
    if (!enrolled) throw new Error("Not enrolled");
  }
  return { user, course, isFaculty };
}

export async function createThread(params: {
  courseId: string;
  title: string;
  body: string;
}) {
  if (!params.title?.trim()) throw new Error("Title is required.");
  if (!params.body?.trim()) throw new Error("Body is required.");

  const { user, course } = await assertCanAccessCourse(params.courseId);

  const thread = await ForumThread.create({
    course: params.courseId,
    author: user._id,
    title: params.title.trim(),
    body: params.body.trim(),
    answered: false,
    lastActivityAt: new Date(),
  });

  // Notify faculty (skip if author is the faculty themselves).
  if (String(course.faculty) !== String(user._id)) {
    try {
      await createNotification({
        recipient: String(course.faculty),
        kind: "forum_thread_created",
        title: `New forum thread: ${thread.title}`,
        body: `${user.name || user.username || user.email} posted in ${course.title}.`,
        link: `/faculty/courses/${params.courseId}/forum/${thread._id}`,
        refId: String(thread._id),
      });
    } catch (err) {
      console.log("forum thread notify failed", err);
    }
  }

  revalidatePath(`/faculty/courses/${params.courseId}/forum`);
  revalidatePath(`/student/courses/${params.courseId}/forum`);
  return JSON.parse(JSON.stringify(thread));
}

export async function listThreads(courseId: string) {
  await assertCanAccessCourse(courseId);
  await connectToDatabase();
  const threads = await ForumThread.find({ course: courseId })
    .populate({
      path: "author",
      model: User,
      select: "_id name username picture role",
    })
    .sort({ lastActivityAt: -1 })
    .lean();
  return JSON.parse(JSON.stringify(threads));
}

export async function getThread(threadId: string) {
  const me = await getCurrentMongoUser();
  if (!me) throw new Error("Unauthorized");
  await connectToDatabase();

  const thread = await ForumThread.findById(threadId)
    .populate({
      path: "author",
      model: User,
      select: "_id name username picture role",
    })
    .lean<any>();
  if (!thread) throw new Error("Thread not found");

  const { isFaculty } = await assertCanAccessCourse(String(thread.course));

  const posts = await ForumPost.find({ thread: thread._id })
    .populate({
      path: "author",
      model: User,
      select: "_id name username picture role",
    })
    .sort({ createdAt: 1 })
    .lean();

  return {
    thread: JSON.parse(JSON.stringify(thread)),
    posts: JSON.parse(JSON.stringify(posts)),
    canMarkAnswered: isFaculty,
  };
}

export async function replyToThread(params: {
  threadId: string;
  body: string;
}) {
  if (!params.body?.trim()) throw new Error("Reply cannot be empty.");

  const me = await getCurrentMongoUser();
  if (!me) throw new Error("Unauthorized");
  await connectToDatabase();

  const thread = await ForumThread.findById(params.threadId);
  if (!thread) throw new Error("Thread not found");

  const { course } = await assertCanAccessCourse(String(thread.course));

  const post = await ForumPost.create({
    thread: thread._id,
    author: me._id,
    body: params.body.trim(),
  });

  thread.lastActivityAt = new Date();
  await thread.save();

  // Notify thread author + faculty (skip the actor themselves; dedupe by Set).
  const recipients = new Set<string>();
  if (String(thread.author) !== String(me._id)) {
    recipients.add(String(thread.author));
  }
  if (String(course.faculty) !== String(me._id)) {
    recipients.add(String(course.faculty));
  }
  await Promise.all(
    Array.from(recipients).map((r) =>
      createNotification({
        recipient: r,
        kind: "forum_reply_posted",
        title: `New reply in: ${thread.title}`,
        body: `${me.name || me.username || me.email} replied.`,
        link: `${
          String(course.faculty) === r
            ? `/faculty/courses/${thread.course}/forum/${thread._id}`
            : `/student/courses/${thread.course}/forum/${thread._id}`
        }`,
        // Use post id so every reply produces its own notification.
        refId: String(post._id),
      }),
    ),
  );

  revalidatePath(`/faculty/courses/${thread.course}/forum/${thread._id}`);
  revalidatePath(`/student/courses/${thread.course}/forum/${thread._id}`);
  return JSON.parse(JSON.stringify(post));
}

export async function markThreadAnswered(threadId: string, postId: string) {
  await requireRole("faculty", "admin");
  await connectToDatabase();

  const thread = await ForumThread.findById(threadId);
  if (!thread) throw new Error("Thread not found");
  await assertCanAccessCourse(String(thread.course));

  const post = await ForumPost.findById(postId);
  if (!post || String(post.thread) !== String(thread._id)) {
    throw new Error("Reply not part of this thread.");
  }

  thread.answered = true;
  thread.pinnedAnswerId = post._id;
  await thread.save();

  revalidatePath(`/faculty/courses/${thread.course}/forum/${thread._id}`);
  revalidatePath(`/student/courses/${thread.course}/forum/${thread._id}`);
  return JSON.parse(JSON.stringify(thread));
}
