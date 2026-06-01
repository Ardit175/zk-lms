import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCategorySchema, updateCategorySchema } from '../validators/category.validator';

const router = Router();

router.get('/', getCategories);
router.post('/', requireAuth, requireRole('ADMIN'), validate(createCategorySchema), createCategory);
router.put('/:id', requireAuth, requireRole('ADMIN'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', requireAuth, requireRole('ADMIN'), deleteCategory);

export default router;
