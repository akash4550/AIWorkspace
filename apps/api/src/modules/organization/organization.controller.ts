import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';
import { getValidatedRequest } from '../../core/middlewares/validateRequest';
import { UpdateOrganizationRequest } from './organization.validator';

export class OrganizationController {
    private service: OrganizationService;

    constructor() {
        this.service = new OrganizationService();
    }

    getOrganization = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const organization = await this.service.getOrganization(organizationId);
        res.status(200).json({ success: true, data: organization });
    };

    updateOrganization = async (req: Request, res: Response) => {
        const organizationId = req.user!.organizationId;
        const { body } = getValidatedRequest<UpdateOrganizationRequest>(req);
        const updatedOrganization = await this.service.updateOrganization(organizationId, body);
        res.status(200).json({ success: true, data: updatedOrganization });
    };
}
