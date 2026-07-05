import { Response, NextFunction } from 'express';
import { shopService } from '../services/shop.service';
import { AuthenticatedRequest } from '../types';

export const shopController = {
  async listCategories(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await shopService.getCategoryTree();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  },

  async listProducts(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await shopService.listProducts(req.query as any);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getProductById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const product = await shopService.findProductById(parseInt(req.params.id, 10));
      res.json(product);
    } catch (err) {
      next(err);
    }
  },
};
