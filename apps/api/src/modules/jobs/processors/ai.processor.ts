import { Job } from 'bullmq';
import { BaseJobData } from '../services/job.service';
import { AIService } from '../../ai/services/ai.service';
import { ContextBuilder } from '../../ai/context/context.builder';
import { PROMPTS } from '../../ai/prompts';

export interface AIJobData extends BaseJobData {
  taskType: 'SUMMARIZE_PROJECT' | 'SUMMARIZE_DOCUMENT';
  entityId: string;
}

/**
 * Processor for handling heavy AI background tasks to avoid blocking HTTP threads.
 */
export const aiProcessor = async (job: Job<AIJobData>) => {
  const { organizationId, userId, taskType, entityId } = job.data;

  if (!organizationId || !userId) {
    throw new Error('Tenant context (organizationId, userId) missing in AI job payload');
  }

  const aiService = new AIService();

  try {
    if (taskType === 'SUMMARIZE_PROJECT') {
      const context = await ContextBuilder.buildProjectContext(organizationId, entityId);
      
      const response = await aiService.generateCompletion(
        organizationId,
        userId,
        'BACKGROUND_PROJECT_SUMMARY',
        {
          systemPrompt: PROMPTS.SYSTEM.DEFAULT_ASSISTANT,
          prompt: `${PROMPTS.FEATURES.PROJECT_SUMMARY}\n\n${context}`
        }
      );

      // E.g., save response to DB or notify user
      console.log(`[AIWorker] Generated project summary for org ${organizationId}`);
      return { success: true, text: response.text };
    }

    throw new Error(`Unsupported AI background task type: ${taskType}`);
  } catch (error: any) {
    console.error(`[AIWorker] Job failed: ${error.message}`);
    throw error;
  }
};
