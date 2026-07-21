import { Request, Response } from 'express';

import { getValidatedRequest } from '../../core/middlewares/validateRequest';
import {
  AskAssistantRequest,
  SummarizeTaskRequest,
} from './ai.dto';
import { ContextBuilder } from './context/context.builder';
import { PROMPTS } from './prompts';
import { AIService } from './services/ai.service';

export class AIController {
  private readonly aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  async summarizeTask(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { params } =
      getValidatedRequest<SummarizeTaskRequest>(req);

    const organizationId =
      req.user!.organizationId;

    const context =
      await ContextBuilder.buildTaskContext(
        organizationId,
        params.taskId,
      );

    const response =
      await this.aiService.generateCompletion(
        organizationId,
        req.user!.id,
        'TASK_SUMMARY',
        {
          systemPrompt:
            PROMPTS.SYSTEM.DEFAULT_ASSISTANT,
          prompt:
            `${PROMPTS.FEATURES.TASK_SUMMARY}\n\n${context}`,
        },
      );

    res.status(200).json({
      data: response.text,
    });
  }

  async askAssistant(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { body } =
      getValidatedRequest<AskAssistantRequest>(req);

    const organizationId =
      req.user!.organizationId;

    let context: string;

    switch (body.contextType) {
      case 'TASK':
        context =
          await ContextBuilder.buildTaskContext(
            organizationId,
            body.entityId,
          );
        break;

      case 'PROJECT':
        context =
          await ContextBuilder.buildProjectContext(
            organizationId,
            body.entityId,
          );
        break;

      case 'GLOBAL':
        context = 'General Workspace Context';
        break;
    }

    const response =
      await this.aiService.generateCompletion(
        organizationId,
        req.user!.id,
        'WORKSPACE_ASSISTANT',
        {
          systemPrompt:
            PROMPTS.SYSTEM.DEFAULT_ASSISTANT,
          prompt:
            `User Query: ${body.query}\n\nRelevant Context:\n${context}`,
        },
      );

    res.status(200).json({
      data: response.text,
    });
  }
}