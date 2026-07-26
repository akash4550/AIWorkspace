describe('createAIProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('creates the mock provider when configured for MOCK', async () => {
    process.env.AI_PROVIDER = 'MOCK';

    const { createAIProvider } = await import(
      '../providers/ai-provider.factory'
    );

    const provider = createAIProvider();

    expect(provider.name).toBe('mock');
  });

  it('creates the OpenAI provider when fully configured', async () => {
    process.env.AI_PROVIDER = 'OPENAI';
    process.env.AI_MODEL = 'test-openai-model';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const { createAIProvider } = await import(
      '../providers/ai-provider.factory'
    );

    const provider = createAIProvider();

    expect(provider.name).toBe('openai');
  });

  it('rejects incomplete OpenAI configuration', async () => {
    process.env.AI_PROVIDER = 'OPENAI';
    delete process.env.AI_MODEL;
    delete process.env.OPENAI_API_KEY;

    const { createAIProvider } = await import(
      '../providers/ai-provider.factory'
    );

    expect(() => createAIProvider()).toThrow(
      'OpenAI provider configuration is incomplete',
    );
  });
});