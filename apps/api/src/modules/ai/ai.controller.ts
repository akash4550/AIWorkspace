import { Request, Response, NextFunction } from 'express';
import { AIService } from './services/ai.service';
import { ContextBuilder } from './context/context.builder';
import { PROMPTS } from './prompts';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async summarizeTask(req: Request, res: Response, next: NextFunction) {
    try {
      const taskId = String(req.params.taskId);
      const organizationId = req.user!.organizationId;

      const context = await ContextBuilder.buildTaskContext(organizationId, taskId);

      const response = await this.aiService.generateCompletion(
        organizationId,
        req.user!.id,
        'TASK_SUMMARY',
        {
          systemPrompt: PROMPTS.SYSTEM.DEFAULT_ASSISTANT,
          prompt: `${PROMPTS.FEATURES.TASK_SUMMARY}\n\n${context}`
        }
      );

      res.status(200).json({ data: response.text });
    } catch (error) {
      next(error);
    }
  }

  async askAssistant(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, contextType, entityId } = req.body;
      const organizationId = req.user!.organizationId;

      let context = '';
      if (contextType === 'TASK' && entityId) {
        context = await ContextBuilder.buildTaskContext(organizationId, entityId);
      } else if (contextType === 'PROJECT' && entityId) {
        context = await ContextBuilder.buildProjectContext(organizationId, entityId);
      } else {
        context = 'General Workspace Context'; // In a real app, maybe build a global summary
      }

      const response = await this.aiService.generateCompletion(
        organizationId,
        req.user!.id,
        'WORKSPACE_ASSISTANT',
        {
          systemPrompt: PROMPTS.SYSTEM.DEFAULT_ASSISTANT,
          prompt: `User Query: ${query}\n\nRelevant Context:\n${context}`
        }
      );

      res.status(200).json({ data: response.text });
    } catch (error) {
      next(error);
    }
  }
}
