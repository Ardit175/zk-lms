import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { courses: true } },
      },
    });

    res.json(ApiResponse.success(categories));
  } catch (error) {
    console.error('GetCategories error:', error);
    res.status(500).json(ApiResponse.error('Failed to fetch categories'));
  }
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, iconUrl } = req.body;

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(400).json(ApiResponse.error('Category already exists'));
      return;
    }

    const category = await prisma.category.create({
      data: { name, slug, iconUrl },
    });

    res.status(201).json(ApiResponse.success(category));
  } catch (error) {
    console.error('CreateCategory error:', error);
    res.status(500).json(ApiResponse.error('Failed to create category'));
  }
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);
    const { name, iconUrl } = req.body;

    const data: Record<string, string> = {};
    if (name) {
      data.name = name;
      data.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    if (iconUrl !== undefined) data.iconUrl = iconUrl;

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.json(ApiResponse.success(category));
  } catch (error) {
    console.error('UpdateCategory error:', error);
    res.status(500).json(ApiResponse.error('Failed to update category'));
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = getParam(req.params.id);

    await prisma.category.delete({ where: { id } });

    res.json(ApiResponse.success({ message: 'Category deleted successfully' }));
  } catch (error) {
    console.error('DeleteCategory error:', error);
    res.status(500).json(ApiResponse.error('Failed to delete category'));
  }
};
