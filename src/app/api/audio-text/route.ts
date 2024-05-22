import { NextResponse } from "next/server";
import { AssemblyAI } from "assemblyai";
import { NextApiRequest } from "next";

export const POST = async (req: Request, res: NextResponse) => {
  const client = new AssemblyAI({
    apiKey: "38a2df8b8f954a82b2d6742f824c45cf",
  });
  const { url } = await req.json();

  const audio_url = url[0];
  // const audio_url = JSON.stringify(url);

  

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

