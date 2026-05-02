import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";

export const maxDuration = 300;

const POLLING_INTERVAL_MS = 3000;
const POLLING_TIMEOUT_MS = 600_000; // 10 min, plenty for long lectures
const MAX_ATTEMPTS = 3;

export const POST = async (req: Request) => {
  const apiKey = process.env.ASSEMBLYAI_API_KEY ?? "38a2df8b8f954a82b2d6742f824c45cf";
  const client = new AssemblyAI({ apiKey });

  const { url } = await req.json();

  if (!url || (Array.isArray(url) && url.length === 0)) {
    return NextResponse.json({ error: "audio url not provided" }, { status: 400 });
  }

  const audio_url = Array.isArray(url) ? url[0] : url;

  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`assemblyai attempt ${attempt}/${MAX_ATTEMPTS}`, audio_url);
      const transcript = await client.transcripts.transcribe(
        { audio_url },
        {
          pollingInterval: POLLING_INTERVAL_MS,
          pollingTimeout: POLLING_TIMEOUT_MS,
        }
      );

      if (transcript.status === "error") {
        console.log("assemblyai transcript error", transcript.error);
        return NextResponse.json(
          { error: transcript.error ?? "transcription failed" },
          { status: 502 }
        );
      }

      if (!transcript.text) {
        return NextResponse.json(
          { error: "transcript completed but contained no text" },
          { status: 502 }
        );
      }

      return NextResponse.json(transcript.text);
    } catch (error: any) {
      lastError = error;
      const message = error?.message ?? String(error);
      console.log(`assemblyai attempt ${attempt} failed: ${message}`);

      const isTransient =
        message.includes("fetch failed") ||
        message.includes("ECONNRESET") ||
        message.includes("ETIMEDOUT") ||
        message.includes("network") ||
        message.includes("EAI_AGAIN");

      if (!isTransient || attempt === MAX_ATTEMPTS) break;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  return NextResponse.json(
    { error: lastError?.message ?? "transcription failed" },
    { status: 500 }
  );
};
