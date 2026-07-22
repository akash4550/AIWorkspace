import { Request, Response } from 'express';

import { getValidatedRequest } from '../../core/middlewares/validateRequest';
import { AnalyticsService } from './analytics.service';
import type {
  GetMetricRequest,
  GetReportRequest,
} from './analytics.dto';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  async getMetric(req: Request, res: Response) {
    const { params, query } =
      getValidatedRequest<GetMetricRequest>(req);

    const result = await this.service.getMetric(
      req.user!.organizationId,
      params.metricName,
      query,
    );

    res.status(200).json({ data: result });
  }

  async getReport(req: Request, res: Response) {
    const { params, query } =
      getValidatedRequest<GetReportRequest>(req);

    const report = await this.service.getReport(
      req.user!.organizationId,
      params.reportType,
      query,
    );

    res.status(200).json({ data: report });
  }
}