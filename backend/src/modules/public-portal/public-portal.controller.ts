import { Request, Response, NextFunction } from 'express';
import { publicPortalService, PublicPortalService } from './public-portal.service';

export class PublicPortalController {
  constructor(private service: PublicPortalService = publicPortalService) {}

  listProperties = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicProperties(req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getProperty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await this.service.getPublicPropertyDetails(req.params.id);
      return res.status(200).json({ success: true, data: property });
    } catch (error) {
      return next(error);
    }
  };

  getFilters = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = await this.service.getFilterOptions();
      return res.status(200).json({ success: true, data: filters });
    } catch (error) {
      return next(error);
    }
  };

  createInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const inquiry = await this.service.submitInquiry(req.body);
      return res.status(201).json({
        success: true,
        message: 'Inquiry submitted successfully',
        data: inquiry,
      });
    } catch (error) {
      return next(error);
    }
  };
}

export const publicPortalController = new PublicPortalController();
