import { z } from "zod";

export const TestOptionSchema = z.object({
  text: z.string(),
  correct: z.boolean().optional().default(false),
});

export const TestQuestionSchema = z.object({
  question: z.string(),
  difficulty: z.number().min(1).max(100),
  options: z.array(TestOptionSchema),
});

export const TestSchema = z.object({
  name: z.string(),
  questions: z.array(TestQuestionSchema),
});

export type Test = z.infer<typeof TestSchema>;
export type TestQuestion = z.infer<typeof TestQuestionSchema>;
export type TestOption = z.infer<typeof TestOptionSchema>;
