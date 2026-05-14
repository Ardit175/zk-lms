export interface ApiResponseType<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiResponse {
  static success<T>(data: T): ApiResponseType<T> {
    return {
      success: true,
      data,
    };
  }

  static error(message: string): ApiResponseType<never> {
    return {
      success: false,
      error: message,
    };
  }
}
