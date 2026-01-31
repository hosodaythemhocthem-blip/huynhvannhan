import { ProjectFile } from "../types";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

type ChunkCallback = (chunk: string) => void;

export async function generateCodeExpansion(
  files: ProjectFile[],
  userPrompt: string,
  onChunk: ChunkCallback
): Promise<void> {
  if (!GEMINI_API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY chưa được cấu hình");
  }

  const context = files
    .map(
      (f) =>
        `FILE: ${f.path}\n----------------\n${f.content}\n`
    )
    .join("\n\n");

  const prompt = `
You are a senior software engineer.

PROJECT FILES:
${context}

USER REQUEST:
${userPrompt}

RULES:
- Only modify existing files
- Do not invent new files
- Return full updated file content
`;

  const res = await fetch(
    `${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      ?.join("") || "";

  onChunk(text);
}
