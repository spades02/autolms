import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const maxDuration = 300;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const POST = async (req: Request) => {
  const { text } = await req.json();

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "prompt text not provided" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { text: reply } = await generateText({
      model: google("gemini-flash-latest"),
      system:
        "Output ONLY the educational resource the user asked for (quiz, assignment, notes, project idea, exam paper, summary, or any custom resource named in the prompt). " +
        "Do not add any preamble, introduction, conclusion, or meta-commentary. " +
        "Begin the response immediately with the first line of the resource itself (e.g. the first quiz question, the first note heading, etc.). " +
        "STRICT RULE: Never reference, mention, or allude to the source material anywhere in the response — not in openings, not in question stems, not in answers. " +
        "BANNED phrases (do not use these or any variation, in any position): 'According to the text', 'Based on the text', 'Based on the provided text', " +
        "'According to the transcript', 'According to the lecture', 'According to the video', 'As mentioned in the text', 'As stated in the text', " +
        "'In the text', 'From the text', 'Per the text', 'The text says', 'The transcript shows', 'The lecturer says', 'The speaker says', " +
        "'The author says', 'Here is', 'Sure', 'Of course'. " +
        "Also do not name or refer to any instructor, professor, author, or speaker mentioned in the transcript. " +
        "Write every quiz question, note, summary sentence, etc. as if the topic stands on its own — never as if it were derived from a source.",
      prompt: text,
    });

    if (!reply) {
      return NextResponse.json(
        { error: "model returned no content" },
        { status: 502 }
      );
    }

    console.log("ai-sdk reply length", reply.length);
    return NextResponse.json(reply);
  } catch (error: any) {
    console.log("ai-sdk error", error?.message);
    return NextResponse.json(
      { error: error?.message ?? "generation failed" },
      { status: 500 }
    );
  }
};
