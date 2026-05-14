import { Request, Response } from 'express';
import { config } from '../config';
import { ApiResponse } from '../utils/ApiResponse';

export const generateQuiz = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, numQuestions, questionTypes, difficulty, topic } = req.body;

    const response = await fetch(`${config.aiServiceUrl}/api/quiz-generator/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        num_questions: numQuestions || 5,
        question_types: questionTypes || ['MULTIPLE_CHOICE'],
        difficulty: difficulty || 'INTERMEDIATE',
        topic,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { detail?: string };
      res.status(response.status).json(
        ApiResponse.error(errorData.detail || 'Gjenerimi i kuizit deshtoi')
      );
      return;
    }

    const data = await response.json();
    res.json(ApiResponse.success(data));
  } catch (error) {
    console.error('GenerateQuiz error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te kontaktonte sherbimin AI'));
  }
};

export const summarizeContent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, title } = req.body;

    const response = await fetch(`${config.aiServiceUrl}/api/content-summarizer/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        title,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { detail?: string };
      res.status(response.status).json(
        ApiResponse.error(errorData.detail || 'Permbledhja e permbajtjes deshtoi')
      );
      return;
    }

    const data = await response.json();
    res.json(ApiResponse.success(data));
  } catch (error) {
    console.error('SummarizeContent error:', error);
    res.status(500).json(ApiResponse.error('Deshtoi te kontaktonte sherbimin AI'));
  }
};
