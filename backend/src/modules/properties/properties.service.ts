import { propertiesRepository, PropertiesRepository } from './properties.repository';
import {
  CreatePropertyInput,
  UpdatePropertyInput,
  ListPropertiesQuery,
  listPropertiesQuerySchema,
} from './properties.schema';
import { ApiError } from '@/shared/errors';
import { storageService, IStorageService } from '@/shared/storage';
import { verifyImageMagicBytes } from '@/shared/utils';

export interface UserContext {
  userId: string;
  agencyId: string;
  role: string;
}

export class PropertiesService {
  constructor(
    private repo: PropertiesRepository = propertiesRepository,
    private storage: IStorageService = storageService
  ) {}

  async listProperties(agencyId: string, query: any) {
    const parsedQuery = listPropertiesQuerySchema.shape.query.parse(query);
    return this.repo.findAll(agencyId, parsedQuery);
  }

  async getProperty(id: string, agencyId: string) {
    const property = await this.repo.findById(id, agencyId);
    if (!property) {
      throw ApiError.notFound('Property not found');
    }
    return property;
  }

  async createProperty(agencyId: string, user: UserContext, input: CreatePropertyInput) {
    if (input.referenceCode) {
      const existing = await this.repo.findByReferenceCode(input.referenceCode, agencyId);
      if (existing && existing.deletedAt === null) {
        throw ApiError.conflict('Reference code already exists in this agency');
      }
    }

    let assignedAgentId: string | null = null;
    if (user.role === 'AGENT') {
      assignedAgentId = user.userId;
    } else {
      assignedAgentId = input.assignedAgentId !== undefined ? input.assignedAgentId : user.userId;
    }

    return this.repo.create(agencyId, user.userId, input, assignedAgentId);
  }

  async updateProperty(id: string, user: UserContext, input: UpdatePropertyInput) {
    const property = await this.getProperty(id, user.agencyId);

    // AGENT can only edit if assignedAgentId === self
    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to edit this property');
    }

    if (input.referenceCode && input.referenceCode !== property.referenceCode) {
      const existing = await this.repo.findByReferenceCode(input.referenceCode, user.agencyId);
      if (existing && existing.id !== id && existing.deletedAt === null) {
        throw ApiError.conflict('Reference code already exists in this agency');
      }
    }

    const updated = await this.repo.update(id, user.agencyId, input, user.userId);
    if (!updated) {
      throw ApiError.notFound('Property not found');
    }
    return updated;
  }

  async deleteProperty(id: string, user: UserContext) {
    if (user.role !== 'ADMIN') {
      throw ApiError.forbidden('Only administrators can archive properties');
    }

    await this.getProperty(id, user.agencyId);
    await this.repo.softDelete(id, user.agencyId);
  }

  async publishProperty(id: string, user: UserContext) {
    const property = await this.getProperty(id, user.agencyId);

    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to publish this property');
    }

    // Validation rules for publishing:
    // Block publishing unless the property has a title, price, city, at least one image, and status is not DRAFT/INACTIVE.
    const errors: string[] = [];
    if (!property.title || property.title.trim().length === 0) {
      errors.push('title is required');
    }
    if (!property.price || Number(property.price) <= 0) {
      errors.push('price must be greater than 0');
    }
    if (!property.city || property.city.trim().length === 0) {
      errors.push('city is required');
    }
    if (!property.images || property.images.length === 0) {
      errors.push('at least one image is required');
    }
    if (property.status === 'DRAFT' || property.status === 'INACTIVE') {
      errors.push(`property status cannot be ${property.status}`);
    }

    if (errors.length > 0) {
      throw ApiError.badRequest(`Cannot publish property: ${errors.join(', ')}`);
    }

    return this.repo.setPublishStatus(id, user.agencyId, true);
  }

  async unpublishProperty(id: string, user: UserContext) {
    const property = await this.getProperty(id, user.agencyId);

    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to unpublish this property');
    }

    return this.repo.setPublishStatus(id, user.agencyId, false);
  }

  async uploadImages(
    id: string,
    user: UserContext,
    files: Express.Multer.File[]
  ) {
    const property = await this.getProperty(id, user.agencyId);

    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to manage images for this property');
    }

    if (!files || files.length === 0) {
      throw ApiError.badRequest('No files provided');
    }

    if (files.length > 10) {
      throw ApiError.badRequest('Maximum 10 files can be uploaded per request');
    }

    const currentImageCount = await this.repo.countImages(id, user.agencyId);
    if (currentImageCount + files.length > 15) {
      throw ApiError.badRequest(
        `Property already has ${currentImageCount} images. Maximum 15 images allowed per property.`
      );
    }

    // Verify all file sizes and magic bytes before saving any file
    const validatedFiles: { buffer: Buffer; originalname: string; mimetype: string }[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        throw ApiError.badRequest(`File ${file.originalname} exceeds the 5MB size limit`);
      }

      const detectedMime = verifyImageMagicBytes(file.buffer);
      if (!detectedMime) {
        throw ApiError.badRequest(
          `Invalid file format for ${file.originalname}. Only JPEG, PNG, and WebP images are allowed.`
        );
      }

      validatedFiles.push({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: detectedMime,
      });
    }

    // Save files using storage service
    const hasExistingPrimary = property.images.some((img) => img.isPrimary);
    const toCreate: { url: string; storageKey: string; isPrimary: boolean; sortOrder: number }[] = [];

    for (let i = 0; i < validatedFiles.length; i++) {
      const vFile = validatedFiles[i];
      const stored = await this.storage.uploadFile(vFile, `agencies/${user.agencyId}/properties/${id}`);
      const isPrimary = !hasExistingPrimary && i === 0;
      toCreate.push({
        url: stored.url,
        storageKey: stored.storageKey,
        isPrimary,
        sortOrder: currentImageCount + i,
      });
    }

    await this.repo.addImages(id, user.agencyId, toCreate);
    return this.getProperty(id, user.agencyId);
  }

  async setPrimaryImage(id: string, imageId: string, user: UserContext) {
    const property = await this.getProperty(id, user.agencyId);

    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to manage images for this property');
    }

    const image = await this.repo.findImageById(imageId, id, user.agencyId);
    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    await this.repo.setPrimaryImage(imageId, id, user.agencyId);
    return this.getProperty(id, user.agencyId);
  }

  async deleteImage(id: string, imageId: string, user: UserContext) {
    const property = await this.getProperty(id, user.agencyId);

    if (user.role === 'AGENT' && property.assignedAgentId !== user.userId) {
      throw ApiError.forbidden('You do not have permission to manage images for this property');
    }

    const image = await this.repo.findImageById(imageId, id, user.agencyId);
    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    const deleted = await this.repo.deleteImage(imageId, id, user.agencyId);
    if (deleted) {
      const keyToDelete = deleted.storageKey || deleted.url;
      if (keyToDelete && !keyToDelete.startsWith('http')) {
        await this.storage.deleteFile(keyToDelete);
      }
    }

    return this.getProperty(id, user.agencyId);
  }
}

export const propertiesService = new PropertiesService();
