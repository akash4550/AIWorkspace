import { Request, Response } from 'express';

import { getValidatedRequest } from '../../core/middlewares/validateRequest';
import { GlobalSearchRequest } from './search.dto';
import { SearchService } from './services/search.service';

export class SearchController {
  private readonly searchService: SearchService;

  constructor() {
    this.searchService = new SearchService();
  }

  async globalSearch(
    req: Request,
    res: Response,
  ): Promise<void> {
    const { query } =
      getValidatedRequest<GlobalSearchRequest>(req);

    const result =
      await this.searchService.performGlobalSearch({
        organizationId: req.user!.organizationId,
        userId: req.user!.id,
        role: req.user!.role,
        term: query.q,
        modules: query.modules,
        limit: query.limit,
        offset: query.offset,
      });

    res.status(200).json({
      data: result,
    });
  }
}