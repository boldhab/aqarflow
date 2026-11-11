import { Response, NextFunction } from 'express';
import { propertiesService, PropertiesService } from './properties.service';
import { AuthenticatedRequest } from '@/shared/types';
import { ApiError } from '@/shared/errors';

export class PropertiesController {
  constructor(private service: PropertiesService = propertiesService) {}

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const result = await this.service.listProperties(req.user.agencyId, req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.getProperty(req.params.id, req.user.agencyId);
      return res.status(200).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.createProperty(req.user.agencyId, req.user, req.body);
      return res.status(201).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.updateProperty(req.params.id, req.user, req.body);
      return res.status(200).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      await this.service.deleteProperty(req.params.id, req.user);
      return res.status(200).json({ success: true, message: 'Property deleted successfully' });
    } catch (error) {
      return next(error);
    }
  };

  publish = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.publishProperty(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Property published successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  unpublish = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.unpublishProperty(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Property unpublished successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  checkImageUploadPermission = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.getProperty(req.params.id, req.user.agencyId);
      if (req.user.role === 'AGENT' && property.assignedAgentId !== req.user.userId) {
        throw ApiError.forbidden('You do not have permission to manage images for this property');
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };

  uploadImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const files = (req.files as Express.Multer.File[]) || [];
      const property = await this.service.uploadImages(req.params.id, req.user, files);
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Images uploaded successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  setPrimaryImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.setPrimaryImage(
        req.params.id,
        req.params.imageId,
        req.user
      );
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Primary image updated successfully',
      });
    } catch (error) {
      return next(error);
    }
  };

  deleteImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw ApiError.unauthorized();
      const property = await this.service.deleteImage(
        req.params.id,
        req.params.imageId,
        req.user
      );
      return res.status(200).json({
        success: true,
        data: property,
        message: 'Image deleted successfully',
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const propertiesController = new PropertiesController();
