import OpenAI from 'openai';

import {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
} from './ai-provider.interface';

export interface OpenAIProviderOptions {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxOutputTokens: number;
}

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';

  private readonly client: OpenAI;
  private readonly model: string;
  private readonly maxOutputTokens: number;

  constructor(options: OpenAIProviderOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      timeout: options.timeoutMs,
      maxRetries: 2,
      logLevel: 'off',
    });

    this.model = options.model;
    this.maxOutputTokens = options.maxOutputTokens;
  }

  async generateCompletion(
    request: AICompletionRequest,
  ): Promise<AICompletionResponse> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_completion_tokens:
        request.maxTokens ?? this.maxOutputTokens,
      temperature: request.temperature,
      stop: request.stopSequences,
      store: false,
    });

    return {
      text: completion.choices[0]?.message.content ?? '',
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
      provider: this.name,
      model: completion.model,
    };
  }
}