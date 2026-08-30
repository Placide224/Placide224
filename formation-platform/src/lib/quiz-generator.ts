"use server";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireCreator } from "@/lib/authz";

const draftSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string().min(1),
        explanation: z.string().optional(),
        choices: z
          .array(z.object({ label: z.string().min(1), isCorrect: z.boolean() }))
          .min(2),
      })
    )
    .min(1),
});

export type QuizDraft = z.infer<typeof draftSchema>;
export type GenerateQuizState = { draft?: QuizDraft; error?: string };

const generateQuizTool: Anthropic.Tool = {
  name: "propose_quiz",
  description: "Propose une liste de questions à choix unique pour un quiz de formation.",
  input_schema: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "Énoncé de la question" },
            explanation: {
              type: "string",
              description: "Courte explication de la bonne réponse, affichée après correction",
            },
            choices: {
              type: "array",
              minItems: 2,
              maxItems: 5,
              items: {
                type: "object",
                properties: {
                  label: { type: "string" },
                  isCorrect: { type: "boolean" },
                },
                required: ["label", "isCorrect"],
              },
            },
          },
          required: ["prompt", "choices"],
        },
      },
    },
    required: ["questions"],
  },
};

export async function generateQuizDraft(
  _prevState: GenerateQuizState,
  formData: FormData
): Promise<GenerateQuizState> {
  await requireCreator();

  const sourceText = String(formData.get("sourceText") ?? "").trim();
  const count = Math.min(10, Math.max(1, Number(formData.get("count") ?? 5)));

  if (sourceText.length < 50) {
    return { error: "Collez au moins quelques phrases de contenu de la leçon." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "ANTHROPIC_API_KEY n'est pas configurée sur le serveur." };
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      tools: [generateQuizTool],
      tool_choice: { type: "tool", name: "propose_quiz" },
      messages: [
        {
          role: "user",
          content: `Tu es un concepteur pédagogique. À partir du contenu de leçon ci-dessous, propose exactement ${count} questions de quiz à choix unique (une seule bonne réponse par question, 3 à 4 choix par question), en français, qui vérifient la compréhension du contenu. Ajoute une courte explication pour chaque question.\n\nContenu de la leçon:\n"""\n${sourceText}\n"""`,
        },
      ],
    });

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
    );
    if (!toolUse) {
      return { error: "Aucune proposition de quiz reçue, réessayez." };
    }

    const parsed = draftSchema.safeParse(toolUse.input);
    if (!parsed.success) {
      return { error: "Réponse du modèle mal formée, réessayez." };
    }

    return { draft: parsed.data };
  } catch {
    return { error: "Échec de la génération du quiz. Vérifiez la clé API et réessayez." };
  }
}
