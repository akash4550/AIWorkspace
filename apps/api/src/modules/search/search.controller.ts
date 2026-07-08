import { Request, Response, NextFunction } from 'express';
import { SearchService } from './services/search.service';

export class SearchController {
  private searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  async globalSearch(req: Request, res: Response, next: NextFunction) {
    try {
      const { q, modules, limit, offset } = req.query;
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const parsedModules = modules ? (modules as string).split(',') : undefined;
      const parsedLimit = limit ? parseInt(limit as string, 10) : 20;
      const parsedOffset = offset ? parseInt(offset as string, 10) : 0;

      const result = await this.searchService.performGlobalSearch({
        organizationId,
        userId,
        term: q as string || '',
        modules: parsedModules,
        limit: parsedLimit,
        offset: parsedOffset
      });

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
