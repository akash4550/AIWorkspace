import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  private service: AnalyticsService;

  constructor() {
    this.service = new AnalyticsService();
  }

  async getMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const metricName = String(req.params.metricName);
      
      // Parse query string into filters
      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        projectId: req.query.projectId as string,
        teamId: req.query.teamId as string,
        userId: req.query.userId as string,
      };

      const result = await this.service.getMetric(organizationId, metricName, filters);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async getReport(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const reportType = String(req.params.reportType);

      const filters = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        projectId: req.query.projectId as string,
        teamId: req.query.teamId as string,
        userId: req.query.userId as string,
      };

      const report = await this.service.getReport(organizationId, reportType, filters);
      res.status(200).json({ data: report });
    } catch (error) {
      next(error);
    }
  }
}
