import { generateObject, generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const DEFAULT_SYSTEM =
  "Output ONLY the educational artifact the user asked for. " +
  "Do not add any preamble, introduction, conclusion, or meta-commentary. " +
  "Begin the response immediately with the first line of the artifact itself. " +
  "STRICT RULE: Never reference, mention, or allude to the source material anywhere in the response. " +
  "BANNED phrases (do not use these or any variation, in any position): 'According to the text', 'Based on the text', " +
  "'Based on the provided text', 'According to the transcript', 'According to the lecture', 'According to the video', " +
  "'As mentioned in the text', 'As stated in the text', 'In the text', 'From the text', 'Per the text', " +
  "'The text says', 'The transcript shows', 'The lecturer says', 'The speaker says', 'The author says', " +
  "'Here is', 'Sure', 'Of course'. " +
  "Also do not name or refer to any instructor, professor, author, or speaker mentioned in the transcript. " +
  "Write every sentence as if the topic stands on its own — never as if it were derived from a source.";

export class GenerateError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
  ) {
    super(message);
    this.name = "GenerateError";
  }
}

/**
 * Calls Gemini Flash to generate text. The default system prompt forbids
 * preambles and source-text references; pass a custom `system` to override.
 */
export async function generateContent(opts: {
  prompt: string;
  system?: string;
}): Promise<string> {
  const { prompt, system = DEFAULT_SYSTEM } = opts;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new GenerateError("GOOGLE_GENERATIVE_AI_API_KEY not configured", 500);
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new GenerateError("prompt text not provided", 400);
  }

  try {
    const { text } = await generateText({
      model: google("gemini-flash-latest"),
      system,
      prompt,
    });

    if (!text) {
      throw new GenerateError("model returned no content", 502);
    }

    console.log("ai-sdk reply length", text.length);
    return text;
  } catch (error: any) {
    if (error instanceof GenerateError) throw error;
    console.log("ai-sdk error", error?.message);
    throw new GenerateError(error?.message ?? "generation failed", 500);
  }
}

/**
 * Generate a concise lecture summary from a transcript. Used by the lecture
 * processing pipeline when the AI artifacts are first produced.
 */
export async function generateLectureSummary(transcript: string) {
  return generateContent({
    prompt:
      "Following given content is the text generated from an educational video. " +
      "Be restricted to this given text, don't use your own vector space. " +
      "Generate a concise summary that captures the key concepts, definitions, " +
      "and takeaways a student should walk away with. Use clear, plain language " +
      "and structure with short headings or bullet points where helpful. " +
      "Content:\n\n" +
      transcript,
  });
}

/**
 * Calls Gemini Flash to produce a structured object validated by a Zod schema.
 * Used wherever the application needs JSON it can trust (e.g. quiz drafting).
 */
export async function generateStructured<T>(opts: {
  prompt: string;
  schema: z.ZodType<T>;
  system?: string;
}): Promise<T> {
  const { prompt, schema, system = DEFAULT_SYSTEM } = opts;

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new GenerateError("GOOGLE_GENERATIVE_AI_API_KEY not configured", 500);
  }
  if (typeof prompt !== "string" || !prompt.trim()) {
    throw new GenerateError("prompt text not provided", 400);
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-flash-latest"),
      system,
      prompt,
      schema,
    });
    return object as T;
  } catch (error: any) {
    if (error instanceof GenerateError) throw error;
    console.log("ai-sdk structured error", error?.message);
    throw new GenerateError(error?.message ?? "generation failed", 500);
  }
}

const QUIZ_SCHEMA = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        options: z.array(z.string().min(1)).length(4),
        correctIndex: z.number().int().min(0).max(3),
        explanation: z.string().optional(),
      }),
    )
    .min(1),
});

export type GeneratedQuiz = z.infer<typeof QUIZ_SCHEMA>;

/**
 * Drafts an MCQ quiz from a lecture transcript. Each question has exactly four
 * options, a single correct answer index, and an optional explanation.
 */
export async function generateQuizQuestions(
  transcript: string,
  count = 10,
): Promise<GeneratedQuiz> {
  const target = Math.max(1, Math.min(20, Math.floor(count)));
  return generateStructured({
    schema: QUIZ_SCHEMA,
    prompt:
      "Following content is the text generated from an educational lecture. " +
      "Be restricted to this given text, don't use your own vector space. " +
      `Generate exactly ${target} multiple-choice questions assessing the key ` +
      "concepts. Each question must have exactly 4 options with a single " +
      "correct answer (correctIndex 0-3). Include a one-sentence explanation. " +
      "Do not reference 'the text', 'the lecture', or the speaker. " +
      "Content:\n\n" +
      transcript,
  });
}
