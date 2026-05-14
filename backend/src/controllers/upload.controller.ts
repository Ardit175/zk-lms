import { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json(ApiResponse.error('Asnje skedar nuk u ngarkua'));
      return;
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    res.json(ApiResponse.success({
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    }));
  } catch (error) {
    console.error('UploadFile error:', error);
    res.status(500).json(ApiResponse.error('Ngarkimi i skedarit deshtoi'));
  }
};
