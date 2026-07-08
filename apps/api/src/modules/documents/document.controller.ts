import { Request, Response } from 'express';
import { DocumentService } from './document.service';
import { uploadDocumentSchema, renameDocumentSchema, moveDocumentSchema } from './document.validator';

const documentService = new DocumentService();

export class DocumentController {
  async upload(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const uploadedById = req.user!.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const dto = uploadDocumentSchema.parse(req.body);
      const document = await documentService.uploadDocument(organizationId, uploadedById, file, dto);
      
      res.status(201).json({ data: document });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async uploadVersion(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const uploadedById = req.user!.id;
      const { id: parentDocumentId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const document = await documentService.uploadVersion(organizationId, uploadedById, parentDocumentId, file);
      
      res.status(201).json({ data: document });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const result = await documentService.getDocuments(organizationId, req.query);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const document = await documentService.getDocument(organizationId, req.params.id);
      res.json({ data: document });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async getVersions(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const versions = await documentService.getVersions(organizationId, req.params.id);
      res.json({ data: versions });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async rename(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const dto = renameDocumentSchema.parse(req.body);
      const document = await documentService.renameDocument(organizationId, req.params.id, dto);
      res.json({ data: document });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async move(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      const dto = moveDocumentSchema.parse(req.body);
      const document = await documentService.moveDocument(organizationId, req.params.id, dto);
      res.json({ data: document });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const organizationId = req.user!.organizationId;
      await documentService.deleteDocument(organizationId, req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
