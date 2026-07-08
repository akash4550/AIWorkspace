import { Request, Response } from 'express';
import { ContactService } from './contact.service';
import { createContactSchema, updateContactSchema } from './contact.validator';

const contactService = new ContactService();

export class ContactController {
  async create(req: Request, res: Response) {
    try {
      const dto = createContactSchema.parse(req.body);
      const contact = await contactService.createContact(req.user!.organizationId, dto);
      res.status(201).json({ data: contact });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const result = await contactService.getContacts(req.user!.organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const contact = await contactService.getContact(req.user!.organizationId, req.params.id as string);
      res.json({ data: contact });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const dto = updateContactSchema.parse(req.body);
      const contact = await contactService.updateContact(req.user!.organizationId, req.params.id as string, dto);
      res.json({ data: contact });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await contactService.deleteContact(req.user!.organizationId, req.params.id as string);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
