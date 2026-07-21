import {
  AIProvider as PrismaAIProvider,
} from '@prisma/client';

import { prisma } from '../../../config/prisma';
import { AppError } from '../../../core/errors/AppError';
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
} from '../providers/ai-provider.interface';
import { MockAIProvider } from '../providers/mock.provider';

export class AIService {
  private readonly provider: AIProvider;

  constructor(
    provider: AIProvider = new MockAIProvider(),
  ) {
    this.provider = provider;
  }

  async generateCompletion(
    organizationId: string,
    userId: string,
    feature: string,
    request: AICompletionRequest,
  ): Promise<AICompletionResponse> {
    if (!organizationId) {
      throw new AppError(
        'Organization context is required for AI usage',
        400,
      );
    }

    if (!userId) {
      throw new AppError(
        'User context is required for AI usage',
        400,
      );
    }

    const normalizedFeature = feature.trim();

    if (!normalizedFeature) {
      throw new AppError(
        'AI feature is required',
        400,
      );
    }

    const prompt = request.prompt.trim();

    if (!prompt) {
      throw new AppError(
        'AI prompt is required',
        400,
      );
    }

    const normalizedRequest: AICompletionRequest = {
      ...request,
      prompt,
      systemPrompt:
        request.systemPrompt?.trim() || undefined,
    };

    const provider = this.resolveProvider();
    const startedAt = Date.now();

    let response: AICompletionResponse;

    try {
      response =
        await this.provider.generateCompletion(
          normalizedRequest,
        );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown AI provider error';

      await this.logUsage({
        organizationId,
        userId,
        feature: normalizedFeature,
        provider,
        success: false,
        latencyMs: Date.now() - startedAt,
        response: null,
        errorMessage: message,
      });

      throw error;
    }

    await this.logUsage({
      organizationId,
      userId,
      feature: normalizedFeature,
      provider,
      success: true,
      latencyMs: Date.now() - startedAt,
      response,
    });

    return response;
  }

  private resolveProvider():
    PrismaAIProvider {
    const providerName =
      this.provider.name.trim().toUpperCase();

    if (
      !Object.values(PrismaAIProvider).includes(
        providerName as PrismaAIProvider,
      )
    ) {
      throw new AppError(
        `Unsupported AI provider: ${this.provider.name}`,
        500,
      );
    }

    return providerName as PrismaAIProvider;
  }

  private async logUsage({
    organizationId,
    userId,
    feature,
    provider,
    success,
    latencyMs,
    response,
    errorMessage,
  }: {
    organizationId: string;
    userId: string;
    feature: string;
    provider: PrismaAIProvider;
    success: boolean;
    latencyMs: number;
    response: AICompletionResponse | null;
    errorMessage?: string;
  }): Promise<void> {
    await prisma.aIUsageLog.create({
      data: {
        organizationId,
        userId,
        feature,
        provider,
        model: response?.model ?? 'unknown',
        promptTokens:
          response?.usage.promptTokens ?? 0,
        completionTokens:
          response?.usage.completionTokens ?? 0,
        totalTokens:
          response?.usage.totalTokens ?? 0,
        latencyMs,
        success,
        errorMessage,
      },
    });
  }
}