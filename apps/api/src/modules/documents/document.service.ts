import { DocumentRepository } from './document.repository';
import { StorageFactory } from '../../core/storage/StorageFactory';
import { UploadDocumentDto, DocumentQueryDto, RenameDocumentDto, MoveDocumentDto } from './document.dto';
import { eventBus } from '../../core/events/EventBus';

export class DocumentService {
  private repository: DocumentRepository;
  private storageProvider;

  constructor() {
    this.repository = new DocumentRepository();
    this.storageProvider = StorageFactory.getProvider();
  }

  async uploadDocument(
    organizationId: string,
    uploadedById: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto
  ) {
    // Generate a tenant-isolated storage path
    let pathPrefix = `org_${organizationId}`;
    if (dto.projectId) pathPrefix += `/project_${dto.projectId}`;
    if (dto.taskId) pathPrefix += `/task_${dto.taskId}`;

    const uploadResult = await this.storageProvider.uploadFile(file, pathPrefix);

    const document = await this.repository.create({
      organizationId,
      uploadedById,
      projectId: dto.projectId,
      taskId: dto.taskId,
      fileName: file.originalname,
      originalName: file.originalname,
      mimeType: uploadResult.mimeType,
      fileSize: uploadResult.size,
      storageKey: uploadResult.key,
      storageProvider: this.storageProvider.getProviderName(),
      version: 1,
      isLatest: true,
    });

    eventBus.emitEvent('TaskUpdated', { organizationId, documentId: document.id, action: 'DocumentUploaded' });

    return document;
  }

  async uploadVersion(
    organizationId: string,
    uploadedById: string,
    parentDocumentId: string,
    file: Express.Multer.File
  ) {
    const parent = await this.repository.findById(organizationId, parentDocumentId);
    if (!parent) throw new Error('Parent document not found');

    const pathPrefix = `org_${organizationId}/doc_${parent.id}`;
    const uploadResult = await this.storageProvider.uploadFile(file, pathPrefix);

    // Mark previous as not latest
    await this.repository.updateSafe(parentDocumentId, organizationId, { isLatest: false });

    // In a real implementation we should also update any other older versions to ensure only one isLatest
    // For simplicity, we assume we just update the immediate parent.

    const newVersion = await this.repository.create({
      organizationId,
      uploadedById,
      projectId: parent.projectId,
      taskId: parent.taskId,
      fileName: file.originalname,
      originalName: file.originalname,
      mimeType: uploadResult.mimeType,
      fileSize: uploadResult.size,
      storageKey: uploadResult.key,
      storageProvider: this.storageProvider.getProviderName(),
      version: parent.version + 1,
      isLatest: true,
      parentDocumentId: parent.id,
    });

    return newVersion;
  }

  async getDocuments(organizationId: string, query: DocumentQueryDto) {
    const result = await this.repository.findMany(organizationId, query);
    // Attach presigned URLs or just local URLs
    const dataWithUrls = await Promise.all(result.data.map(async (doc) => ({
      ...doc,
      url: await this.storageProvider.getFileUrl(doc.storageKey)
    })));

    return { ...result, data: dataWithUrls };
  }

  async getDocument(organizationId: string, id: string) {
    const doc = await this.repository.findById(organizationId, id);
    if (!doc) throw new Error('Document not found');
    
    return {
      ...doc,
      url: await this.storageProvider.getFileUrl(doc.storageKey)
    };
  }

  async getVersions(organizationId: string, id: string) {
    const versions = await this.repository.getVersions(organizationId, id);
    return Promise.all(versions.map(async (doc) => ({
      ...doc,
      url: await this.storageProvider.getFileUrl(doc.storageKey)
    })));
  }

  async renameDocument(organizationId: string, id: string, dto: RenameDocumentDto) {
    return this.repository.updateSafe(id, organizationId, { fileName: dto.fileName });
  }

  async moveDocument(organizationId: string, id: string, dto: MoveDocumentDto) {
    return this.repository.updateSafe(id, organizationId, { 
      projectId: dto.projectId || null,
      taskId: dto.taskId || null 
    });
  }

  async deleteDocument(organizationId: string, id: string) {
    const doc = await this.repository.findById(organizationId, id);
    if (!doc) throw new Error('Document not found');

    await this.storageProvider.deleteFile(doc.storageKey);
    return this.repository.updateSafe(id, organizationId, { deletedAt: new Date() });
  }
}
