import { env } from '../../../config/env';

import { AIProvider } from './ai-provider.interface';
import { MockAIProvider } from './mock.provider';
import { OpenAIProvider } from './openai.provider';

export const createAIProvider = (): AIProvider => {
  if (env.AI_PROVIDER === 'MOCK') {
    return new MockAIProvider();
  }

  if (!env.OPENAI_API_KEY || !env.AI_MODEL) {
    throw new Error('OpenAI provider configuration is incomplete');
  }

  return new OpenAIProvider({
    apiKey: env.OPENAI_API_KEY,
    model: env.AI_MODEL,
    timeoutMs: env.AI_TIMEOUT_MS,
    maxOutputTokens: env.AI_MAX_OUTPUT_TOKENS,
  });
};