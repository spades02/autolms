import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Lecture from "@/database/lecture.model";
import { transcribeAudio } from "@/lib/transcribe";
import { generateLectureSummary } from "@/lib/generate";
import { requireRole } from "@/actions/user.action";
import { assertFacultyOwnsCourse } from "@/actions/course.action";
import { createNotification } from "@/actions/notification.action";

export const maxDuration = 60;

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireRole("faculty", "admin");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectToDatabase();

  const lecture = await Lecture.findById(params.id);
  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  try {
    await assertFacultyOwnsCourse(String(lecture.course));
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (lecture.status === "Processing") {
    return NextResponse.json(
      { status: lecture.status, message: "already processing" },
      { status: 409 },
    );
  }
  if (lecture.status === "Published") {
    return NextResponse.json(
      { status: lecture.status, message: "already published" },
      { status: 409 },
    );
  }

  // Mark as processing before doing the long work so the UI can poll the
  // status and show a spinner.
  lecture.status = "Processing";
  lecture.processingError = "";
  await lecture.save();

  try {
    const transcript = await transcribeAudio(lecture.videoUrl);
    const summary = await generateLectureSummary(transcript);

    lecture.transcript = transcript;
    lecture.summary = summary;
    lecture.status = "ReviewReady";
    await lecture.save();

    try {
      await createNotification({
        recipient: String(lecture.uploadedBy),
        kind: "lecture_processing_done",
        title: `Ready for review: ${lecture.title}`,
        body: "Transcript and summary generated. Edit and publish when ready.",
        link: `/faculty/lectures/${lecture._id}`,
        refId: String(lecture._id),
      });
    } catch (notifyErr) {
      console.log("processing_done notify failed", notifyErr);
    }

    return NextResponse.json({
      status: lecture.status,
      transcriptLength: transcript.length,
      summaryLength: summary.length,
    });
  } catch (error: any) {
    const message = error?.message ?? "processing failed";
    console.log("lecture processing error", message);
    lecture.status = "Failed";
    lecture.processingError = message;
    await lecture.save();

    try {
      await createNotification({
        recipient: String(lecture.uploadedBy),
        kind: "lecture_processing_failed",
        title: `Processing failed: ${lecture.title}`,
        body: message,
        link: `/faculty/lectures/${lecture._id}`,
        refId: String(lecture._id),
      });
    } catch (notifyErr) {
      console.log("processing_failed notify failed", notifyErr);
    }

    return NextResponse.json(
      { status: "Failed", error: message },
      { status: 500 },
    );
  }
}
