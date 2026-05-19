import { Request, Response } from 'express';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';

const AI_TIMEOUT_MS = 180_000; // Whisper/transcript jobs can take a while

async function forwardJson(path: string, body: unknown, res: Response): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.aiServiceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as { detail?: string };
      res.status(response.status).json(ApiResponse.error(err.detail || 'Sherbimi AI ktheu gabim'));
      return;
    }
    const data = await response.json();
    res.json(ApiResponse.success(data));
  } finally {
    clearTimeout(timeout);
  }
}

async function forwardFile(
  path: string,
  file: Express.Multer.File,
  extraFields: Record<string, string>,
  res: Response,
): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const form = new FormData();
    const ab = new ArrayBuffer(file.buffer.byteLength);
    new Uint8Array(ab).set(file.buffer);
    const blob = new Blob([ab], { type: file.mimetype || 'application/octet-stream' });
    form.append('file', blob, file.originalname);
    for (const [k, v] of Object.entries(extraFields)) {
      form.append(k, v);
    }

    const response = await fetch(`${config.aiServiceUrl}${path}`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as { detail?: string };
      res.status(response.status).json(ApiResponse.error(err.detail || 'Sherbimi AI ktheu gabim'));
      return;
    }
    const data = await response.json();
    res.json(ApiResponse.success(data));
  } finally {
    clearTimeout(timeout);
  }
}

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, numQuestions, questionTypes, difficulty, topic } = req.body;
    await forwardJson(
      '/api/quiz-generator/generate',
      {
        content,
        num_questions: numQuestions || 5,
        question_types: questionTypes || ['MULTIPLE_CHOICE'],
        difficulty: difficulty || 'INTERMEDIATE',
        topic,
      },
      res,
    );
  } catch (error) {
    console.error('GenerateQuiz error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te kontaktonte sherbimin AI'));
  }
};

export const summarizeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, title } = req.body;
    await forwardJson('/api/content-summarizer/summarize', { content, title }, res);
  } catch (error) {
    console.error('SummarizeContent error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te kontaktonte sherbimin AI'));
  }
};

export const extractPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json(ApiResponse.error('Asnje skedar nuk u ngarkua'));
      return;
    }
    await forwardFile('/api/content-extractor/pdf', req.file, {}, res);
  } catch (error) {
    console.error('ExtractPdf error:', error);
    res.status(500).json(ApiResponse.error('Ekstrakti i PDF-se deshtoi'));
  }
};

export const extractYoutube = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, language } = req.body;
    if (!url || typeof url !== 'string') {
      res.status(400).json(ApiResponse.error('URL i munguar'));
      return;
    }
    await forwardJson('/api/content-extractor/youtube', { url, language }, res);
  } catch (error) {
    console.error('ExtractYoutube error:', error);
    res.status(500).json(ApiResponse.error('Marrja e transcript-it deshtoi'));
  }
};

export const extractAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json(ApiResponse.error('Asnje skedar nuk u ngarkua'));
      return;
    }
    const label = typeof req.body?.label === 'string' ? req.body.label : '';
    await forwardFile('/api/content-extractor/audio', req.file, { label }, res);
  } catch (error) {
    console.error('ExtractAudio error:', error);
    res.status(500).json(ApiResponse.error('Transkriptimi me Whisper deshtoi'));
  }
};
