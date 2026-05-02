import { NextResponse } from "next/server";

// AssemblyAI accepts video URLs directly (mp4/mkv/mov/webm) and extracts the
// audio server-side, so we no longer need ApyHub's video→audio conversion.
// ApyHub's only URL-based extractor is the synchronous endpoint, which truncates
// long videos to a few seconds and has no async/job variant.
// This route is now a passthrough to keep the call site in create/page.tsx
// unchanged — it returns the EdgeStore video URL as-is so /api/audio-text can
// hand it directly to AssemblyAI.

export const POST = async (req: Request) => {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "video url not provided" }, { status: 400 });
  }

  return NextResponse.json(url);
};
