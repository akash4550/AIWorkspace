import { AIProvider, AICompletionRequest, AICompletionResponse } from './ai-provider.interface';

export class MockAIProvider implements AIProvider {
  readonly name = 'mock';

  async generateCompletion(request: AICompletionRequest): Promise<AICompletionResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculate rough tokens for the mock usage
    const promptTokens = request.prompt.split(' ').length;
    const mockResponseText = `This is a mock AI response generated based on your prompt: "${request.prompt.substring(0, 30)}..."`;
    const completionTokens = mockResponseText.split(' ').length;

    return {
      text: mockResponseText,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
      provider: this.name,
      model: 'mock-model-v1',
    };
  }

  async generateJSON<T>(request: AICompletionRequest): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Attempt a generic mock response based on T if possible, 
    // for this mockup we will just return an empty object cast as T.
    return {} as T;
  }
}
