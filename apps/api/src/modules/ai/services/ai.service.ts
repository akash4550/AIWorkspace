import { PrismaClient } from '@prisma/client';
import { AIProvider, AICompletionRequest } from '../providers/ai-provider.interface';
import { MockAIProvider } from '../providers/mock.provider';

const prisma = new PrismaClient();

export class AIService {
  private provider: AIProvider;

  constructor() {
    // In the future, this could be dynamic based on env vars (e.g., 'openai' vs 'anthropic')
    this.provider = new MockAIProvider();
  }

  /**
   * Generates a completion and logs the usage to the database for billing/tracking.
   */
  async generateCompletion(
    organizationId: string,
    userId: string,
    feature: string,
    request: AICompletionRequest
  ) {
    if (!organizationId) throw new Error('organizationId is required for AI Usage Tracking');

    const startTime = Date.now();
    
    try {
      const response = await this.provider.generateCompletion(request);
      const latencyMs = Date.now() - startTime;

      // Log successful usage asynchronously (don't await to block the return)
      this.logUsage(organizationId, userId, feature, true, latencyMs, response).catch(err => {
        console.error('Failed to log AI Usage:', err);
      });

      return response;
    } catch (error: any) {
      const latencyMs = Date.now() - startTime;
      
      this.logUsage(organizationId, userId, feature, false, latencyMs, null, error.message).catch(err => {
        console.error('Failed to log AI Error Usage:', err);
      });

      throw error;
    }
  }

  private async logUsage(
    organizationId: string, 
    userId: string, 
    feature: string, 
    success: boolean, 
    latencyMs: number, 
    response: any, 
    errorMessage?: string
  ) {
    await prisma.aIUsageLog.create({
      data: {
        organizationId,
        userId,
        feature,
        provider: this.provider.name,
        model: response?.model || 'unknown',
        promptTokens: response?.usage?.promptTokens || 0,
        completionTokens: response?.usage?.completionTokens || 0,
        totalTokens: response?.usage?.totalTokens || 0,
        latencyMs,
        success,
        errorMessage
      }
    });
  }
}
