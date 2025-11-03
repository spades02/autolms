import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import { NextApiRequest } from "next";

export const POST = async (req: Request, res: NextResponse) => {
  const client = new AssemblyAI({
    apiKey: "38a2df8b8f954a82b2d6742f824c45cf",
  });
  const { url } = await req.json();

  // Validate incoming payload
  if (!url || (Array.isArray(url) && url.length === 0)) {
    return NextResponse.json({ error: "audio url not provided" }, { status: 400 });
  }

  // allow either array-of-urls or a single string url
  const audio_url = Array.isArray(url) ? url[0] : url;

  try {
    console.log(audio_url)
    console.log("first line of try");
    const transcript = await client.transcripts.transcribe({ audio_url });
    console.log("im assebly", transcript.text);

    if (transcript.status === "error") {
      console.log("error", transcript.error);
    }
    return NextResponse.json(transcript.text);
  } catch (error: any) {
    console.log(error.message)
    return NextResponse.json(error.message, { status: 500 });
  }
}

