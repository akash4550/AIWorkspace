import { AppError } from '../../../core/errors/AppError';

interface AIProviderErrorOptions {
  provider: string;
  model: string;
  statusCode?: number;
  requestId?: string;
  providerCode?: string;
}

export class AIProviderError extends AppError {
  readonly provider: string;
  readonly model: string;
  readonly requestId?: string;
  readonly providerCode?: string;

  constructor(
    message: string,
    options: AIProviderErrorOptions,
  ) {
    super(message, options.statusCode ?? 502);

    this.name = 'AIProviderError';
    this.provider = options.provider;
    this.model = options.model;
    this.requestId = options.requestId;
    this.providerCode = options.providerCode;
  }
}