import { NextResponse } from "next/server";
import { transcribeAudio, TranscribeError } from "@/lib/transcribe";

export const maxDuration = 300;

export const POST = async (req: Request) => {
  const { url } = await req.json();

  if (!url || (Array.isArray(url) && url.length === 0)) {
    return NextResponse.json(
      { error: "audio url not provided" },
      { status: 400 },
    );
  }

  const audioUrl = Array.isArray(url) ? url[0] : url;

  try {
    const text = await transcribeAudio(audioUrl);
    return NextResponse.json(text);
  } catch (error) {
    const status = error instanceof TranscribeError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "transcription failed";
    return NextResponse.json({ error: message }, { status });
  }
};
