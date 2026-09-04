export type AIProvider = 'GITHUB_MODELS' | 'OPENAI' | 'ANTHROPIC' | 'GEMINI';

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  isFreeTier: boolean;
  requiresBYOK: boolean;
}

export interface PromptExecutionRequest {
  provider?: AIProvider;
  modelId: string;
  prompt: string;
  systemContext?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface PromptExecutionResponse {
  provider: AIProvider;
  modelId: string;
  outputText: string;
  promptTokens: number;
  completionTokens: number;
  executionTimeMs: number;
}
