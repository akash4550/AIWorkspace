import OpenAI from 'openai';
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
} from './ai-provider.interface';
import { AIProviderError } from './ai-provider.error';

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

    let completion: OpenAI.Chat.Completions.ChatCompletion;

    try {
  completion = await this.client.chat.completions.create({
    model: this.model,
    messages,
    max_completion_tokens:
      request.maxTokens ?? this.maxOutputTokens,
    temperature: request.temperature,
    stop: request.stopSequences,
    store: false,
  });
} catch (error: unknown) {
  throw this.normalizeError(error);
}

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
    private normalizeError(error: unknown): AIProviderError {
    if (error instanceof OpenAI.APIConnectionTimeoutError) {
      return new AIProviderError(
        'AI provider request timed out',
        {
          provider: this.name,
          model: this.model,
          statusCode: 504,
          providerCode: 'timeout',
        },
      );
    }

    if (error instanceof OpenAI.RateLimitError) {
      return new AIProviderError(
        'AI provider rate limit exceeded',
        {
          provider: this.name,
          model: this.model,
          statusCode: 429,
          requestId: error.requestID ?? undefined,
          providerCode: error.code ?? 'rate_limit',
        },
      );
    }

    if (error instanceof OpenAI.APIConnectionError) {
      return new AIProviderError(
        'AI provider is temporarily unavailable',
        {
          provider: this.name,
          model: this.model,
          statusCode: 503,
          providerCode: 'connection_error',
        },
      );
    }

    if (error instanceof OpenAI.APIError) {
      return new AIProviderError(
        'AI provider request failed',
        {
          provider: this.name,
          model: this.model,
          statusCode: 502,
          requestId: error.requestID ?? undefined,
          providerCode: error.code ?? undefined,
        },
      );
    }

    return new AIProviderError(
      'AI provider request failed',
      {
        provider: this.name,
        model: this.model,
        statusCode: 502,
      },
    );
  }
}
