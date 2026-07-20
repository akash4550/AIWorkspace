import { Request, Response } from 'express';

import { getValidatedRequest } from '../../../core/middlewares/validateRequest';
import { ContactService } from './contact.service';
import type {
  CreateContactRequest,
  DeleteContactRequest,
  GetContactRequest,
  ListContactsRequest,
  UpdateContactRequest,
} from './contact.validator';

const contactService = new ContactService();

export class ContactController {
  async create(req: Request, res: Response) {
    const { body } = getValidatedRequest<CreateContactRequest>(req);

    const contact = await contactService.createContact(
      req.user!.organizationId,
      body,
    );

    res.status(201).json({ data: contact });
  }

  async getAll(req: Request, res: Response) {
    const { query } = getValidatedRequest<ListContactsRequest>(req);

    const result = await contactService.getContacts(
      req.user!.organizationId,
      query,
    );

    res.json(result);
  }

  async getOne(req: Request, res: Response) {
    const { params } = getValidatedRequest<GetContactRequest>(req);

    const contact = await contactService.getContact(
      req.user!.organizationId,
      params.id,
    );

    res.json({ data: contact });
  }

  async update(req: Request, res: Response) {
    const { body, params } =
      getValidatedRequest<UpdateContactRequest>(req);

    const contact = await contactService.updateContact(
      req.user!.organizationId,
      params.id,
      body,
    );

    res.json({ data: contact });
  }

  async delete(req: Request, res: Response) {
    const { params } = getValidatedRequest<DeleteContactRequest>(req);

    await contactService.deleteContact(
      req.user!.organizationId,
      params.id,
    );

    res.status(204).send();
  }
}