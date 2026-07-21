import { OrganizationRepository } from './organization.repository';
import { UpdateOrganizationDto } from './organization.dto';
import { AppError } from '../../core/errors/AppError';

export class OrganizationService {
    private repository: OrganizationRepository;

    constructor() {
        this.repository = new OrganizationRepository();
    }

    async getOrganization(organizationId: string) {
        const org = await this.repository.findById(organizationId);
        if (!org) {
            throw new AppError('Organization not found', 404);
        }
        return org;
    }

    async updateOrganization(organizationId: string, data: UpdateOrganizationDto) {
        if (data.slug) {
            const existing = await this.repository.findBySlug(data.slug);
            if (existing && existing.id !== organizationId) {
                throw new AppError('Slug is already taken by another organization', 400);
            }
        }

        const organization = await this.repository.update(organizationId, data);
        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        return organization;
    }
}
