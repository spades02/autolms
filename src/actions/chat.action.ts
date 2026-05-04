"use server";

import ChatSession from "@/database/chatSession.model";
import Lecture from "@/database/lecture.model";
import Enrollment from "@/database/enrollment.model";
import { connectToDatabase } from "@/lib/mongoose";
import { requireRole } from "@/actions/user.action";
import { generateContent } from "@/lib/generate";

const CHAT_HISTORY_FOR_PROMPT = 10;

const GROUNDING_SYSTEM = [
  "You are a study assistant for a single specific lecture.",
  "Answer ONLY using information present in the provided lecture transcript.",
  "If the answer is not in the transcript, reply: \"That isn't covered in this lecture — try asking about something the lecture discusses.\"",
  "Keep replies concise (max ~5 sentences) unless the student explicitly asks for more depth.",
  "Do not say things like 'According to the transcript' — just answer plainly.",
  "Do not invent facts, citations, or references that aren't in the transcript.",
].join(" ");

async function loadStudentSession(lectureId: string) {
  const user = await requireRole("student", "admin");
  await connectToDatabase();

  const lecture = await Lecture.findById(lectureId);
  if (!lecture) throw new Error("Lecture not found");
  if (lecture.status !== "Published") {
    throw new Error("Lecture is not published");
  }

  const enrolled = await Enrollment.exists({
    course: lecture.course,
    student: user._id,
  });
  if (!enrolled && user.role !== "admin") {
    throw new Error("Not enrolled in this course");
  }

  const session = await ChatSession.findOneAndUpdate(
    { student: user._id, lecture: lecture._id },
    { $setOnInsert: { student: user._id, lecture: lecture._id, messages: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  return { user, lecture, session };
}

export async function getChatHistory(lectureId: string) {
  const { lecture, session } = await loadStudentSession(lectureId);
  return {
    hasTranscript: !!lecture.transcript?.trim(),
    messages: JSON.parse(JSON.stringify(session.messages)),
  };
}

export async function sendChatMessage(
  lectureId: string,
  userMessage: string,
) {
  const trimmed = userMessage?.trim();
  if (!trimmed) throw new Error("Type a question first.");

  const { lecture, session } = await loadStudentSession(lectureId);
  if (!lecture.transcript?.trim()) {
    throw new Error(
      "This lecture has no transcript yet — ask the instructor to publish it first.",
    );
  }

  const userMsg = {
    role: "user" as const,
    content: trimmed,
    createdAt: new Date(),
  };
  session.messages.push(userMsg);

  // Build a compact prompt: transcript + last N exchanges + current question.
  const recent = session.messages
    .slice(-CHAT_HISTORY_FOR_PROMPT - 1, -1)
    .map((m: any) => `${m.role === "user" ? "Student" : "Assistant"}: ${m.content}`)
    .join("\n");

  const prompt = [
    "Lecture transcript:",
    lecture.transcript,
    "",
    recent ? `Recent conversation:\n${recent}\n` : "",
    `Student: ${trimmed}`,
    "Assistant:",
  ]
    .filter(Boolean)
    .join("\n");

  let assistantText: string;
  try {
    assistantText = await generateContent({
      prompt,
      system: GROUNDING_SYSTEM,
    });
  } catch (err: any) {
    // Roll back the user message we just optimistically pushed so the next
    // attempt doesn't double up.
    session.messages.pop();
    await session.save();
    throw new Error(err?.message ?? "Could not reach the assistant. Try again.");
  }

  const assistantMsg = {
    role: "assistant" as const,
    content: assistantText.trim(),
    createdAt: new Date(),
  };
  session.messages.push(assistantMsg);
  await session.save();

  return JSON.parse(JSON.stringify(assistantMsg));
}
