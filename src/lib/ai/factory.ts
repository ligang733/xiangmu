export type AIProviderType = 'google' | 'openai' | 'replicate';

export interface AIClient {
  generate(prompt: string, options?: any): Promise<any>;
}

class GoogleProvider implements AIClient {
  async generate(prompt: string) {
    // Placeholder for Google (Gemini) implementation
    console.log('Using Google Provider with prompt:', prompt);
    return { text: "Mock Google Response" };
  }
}

class OpenAIProvider implements AIClient {
  async generate(prompt: string) {
    // Placeholder for OpenAI implementation
    console.log('Using OpenAI Provider with prompt:', prompt);
    return { text: "Mock OpenAI Response" };
  }
}

/**
 * Factory function to get the requested AI client.
 * 
 * @param providerName - Optional. The specific provider to use (e.g., 'google', 'openai').
 * @returns An instance of AIClient.
 * @throws Error if the provider is not supported or invalid.
 */
export const getAIClient = (providerName?: string): AIClient => {
  // 1. Determine the provider key to use
  // Priority: Argument > Environment Variable > Default
  let key = providerName;

  if (!key) {
    // Fallback to .env (Vite uses import.meta.env)
    // We assume VITE_AI_PROVIDER is set in .env
    key = import.meta.env.VITE_AI_PROVIDER;
  }

  // Normalize key
  const normalizedKey = key?.toLowerCase();

  // 2. Return the corresponding provider instance
  switch (normalizedKey) {
    case 'google':
      return new GoogleProvider();
    case 'openai':
      return new OpenAIProvider();
    // Add cases for 'replicate' or others as they are implemented
    default:
      if (!normalizedKey) {
         throw new Error('AI Provider not specified. Please pass a providerName or set VITE_AI_PROVIDER in .env.');
      }
      throw new Error(`Unsupported AI Provider: "${normalizedKey}". Supported providers are: google, openai.`);
  }
};
