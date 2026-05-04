import { AssemblyAI } from "assemblyai";

const POLLING_INTERVAL_MS = 3000;
const POLLING_TIMEOUT_MS = 600_000; // 10 min, plenty for long lectures
const MAX_ATTEMPTS = 3;

export class TranscribeError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "TranscribeError";
  }
}

/**
 * Transcribes a remote audio/video URL via AssemblyAI with retry on transient
 * network errors. Returns the transcript text on success; throws
 * TranscribeError on failure.
 */
export async function transcribeAudio(audioUrl: string): Promise<string> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) {
    throw new TranscribeError("ASSEMBLYAI_API_KEY not configured", 500);
  }

  const client = new AssemblyAI({ apiKey });

  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`assemblyai attempt ${attempt}/${MAX_ATTEMPTS}`, audioUrl);
      const transcript = await client.transcripts.transcribe(
        { audio_url: audioUrl },
        {
          pollingInterval: POLLING_INTERVAL_MS,
          pollingTimeout: POLLING_TIMEOUT_MS,
        },
      );

      if (transcript.status === "error") {
        console.log("assemblyai transcript error", transcript.error);
        throw new TranscribeError(
          transcript.error ?? "transcription failed",
          502,
        );
      }

      if (!transcript.text) {
        throw new TranscribeError(
          "transcript completed but contained no text",
          502,
        );
      }

      return transcript.text;
    } catch (error: any) {
      if (error instanceof TranscribeError) throw error;
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

  throw new TranscribeError(
    lastError?.message ?? "transcription failed",
    500,
  );
}
