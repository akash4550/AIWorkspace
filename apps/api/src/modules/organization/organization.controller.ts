import { Request, Response } from 'express';
import { OrganizationService } from './organization.service';

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
        const updatedOrganization = await this.service.updateOrganization(organizationId, req.body);
        res.status(200).json({ success: true, data: updatedOrganization });
    };
}
