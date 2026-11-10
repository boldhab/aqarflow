import { Request, Response, NextFunction } from 'express';
import { publicPortalService, PublicPortalService } from './public-portal.service';

export class PublicPortalController {
  constructor(private service: PublicPortalService = publicPortalService) {}

  listListings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.getPublicListings(req.query as any);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return next(error);
    }
  };

  getListingDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const property = await this.service.getPublicPropertyDetails(req.params.id);
      return res.status(200).json({ success: true, data: property });
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
