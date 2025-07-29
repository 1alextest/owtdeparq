import { Logger } from '@nestjs/common';

export enum AIErrorType {
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  API_ERROR = 'API_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  NETWORK_ERROR = 'NETWORK_ERROR'
}

export class AIError extends Error {
  constructor(
    public type: AIErrorType,
    public message: string,
    public provider: string,
    public originalError?: any,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIErrorHandler {
  private static logger = new Logger('AIErrorHandler');

  static handleProviderError(
    error: any,
    provider: string,
    operation: string
  ): AIError {
    this.logger.error(`${provider} ${operation} failed:`, error);

    // Handle specific error types
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new AIError(
        AIErrorType.NETWORK_ERROR,
        `Cannot connect to ${provider} service`,
        provider,
        error,
        true
      );
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
      return new AIError(
        AIErrorType.TIMEOUT_ERROR,
        `${provider} request timed out`,
        provider,
        error,
        true
      );
    }

    // Handle HTTP status codes
    if (error.status || error.response?.status) {
      const status = error.status || error.response?.status;
      
      switch (status) {
        case 401:
          return new AIError(
            AIErrorType.CONFIGURATION_ERROR,
            `${provider} authentication failed - check API key`,
            provider,
            error,
            false
          );
        
        case 429:
          return new AIError(
            AIErrorType.QUOTA_EXCEEDED,
            `${provider} rate limit exceeded`,
            provider,
            error,
            true
          );
        
        case 500:
        case 502:
        case 503:
        case 504:
          return new AIError(
            AIErrorType.API_ERROR,
            `${provider} server error (${status})`,
            provider,
            error,
            true
          );
        
        default:
          return new AIError(
            AIErrorType.API_ERROR,
            `${provider} API error (${status}): ${error.message}`,
            provider,
            error,
            false
          );
      }
    }

    // Handle parsing errors
    if (error.message?.includes('parse') || error.message?.includes('Invalid response')) {
      return new AIError(
        AIErrorType.PARSING_ERROR,
        `Failed to parse ${provider} response: ${error.message}`,
        provider,
        error,
        false
      );
    }

    // Handle configuration errors
    if (error.message?.includes('not configured') || error.message?.includes('missing API key')) {
      return new AIError(
        AIErrorType.CONFIGURATION_ERROR,
        `${provider} configuration error: ${error.message}`,
        provider,
        error,
        false
      );
    }

    // Default error
    return new AIError(
      AIErrorType.API_ERROR,
      `${provider} ${operation} failed: ${error.message}`,
      provider,
      error,
      false
    );
  }

  static shouldRetry(error: AIError, attemptCount: number, maxRetries: number = 2): boolean {
    if (attemptCount >= maxRetries) {
      return false;
    }

    return error.retryable && (
      error.type === AIErrorType.NETWORK_ERROR ||
      error.type === AIErrorType.TIMEOUT_ERROR ||
      error.type === AIErrorType.API_ERROR ||
      error.type === AIErrorType.QUOTA_EXCEEDED
    );
  }

  static getRetryDelay(attemptCount: number): number {
    // Exponential backoff: 1s, 2s, 4s, etc.
    return Math.min(1000 * Math.pow(2, attemptCount), 10000);
  }

  static formatErrorForUser(error: AIError): string {
    switch (error.type) {
      case AIErrorType.CONFIGURATION_ERROR:
        return `AI service configuration issue. Please check your settings.`;
      
      case AIErrorType.QUOTA_EXCEEDED:
        return `AI service quota exceeded. Please try again later.`;
      
      case AIErrorType.NETWORK_ERROR:
        return `Cannot connect to AI service. Please check your internet connection.`;
      
      case AIErrorType.TIMEOUT_ERROR:
        return `AI service request timed out. Please try again.`;
      
      case AIErrorType.PARSING_ERROR:
        return `AI service returned an unexpected response format.`;
      
      default:
        return `AI service temporarily unavailable. Please try again.`;
    }
  }
}