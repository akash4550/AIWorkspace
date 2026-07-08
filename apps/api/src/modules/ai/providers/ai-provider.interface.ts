export interface AICompletionRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
}

export interface AICompletionResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}

export interface AIProvider {
  /**
   * Identifies the provider (e.g. 'openai', 'anthropic', 'mock')
   */
  readonly name: string;

  /**
   * Generates a standard text completion
   */
  generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse>;
  
  /**
   * Placeholder for Structured JSON Output
   */
  generateJSON?<T>(request: AICompletionRequest): Promise<T>;
}
