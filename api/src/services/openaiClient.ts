import OpenAI from 'openai';

export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

export function isAiConfigured(): boolean {
  return Boolean(openai);
}

export function requireOpenai(): OpenAI {
  if (!openai) throw new Error('AI is not configured on the server');
  return openai;
}
