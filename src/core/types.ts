export type Provider = 'gemini' | 'openai' | 'grok';
export type Modality = 'image' | 'video';
export type InputPart =
  | { type: 'text'; value: string }
  | { type: 'image'; value: string };

export interface GenerateImageRequest {
  provider: Provider;
  model: string;
  parts: InputPart[];
  outDir: string;
  options: Record<string, unknown>;
}

export interface GenerateVideoRequest {
  provider: Provider;
  model: string;
  parts: InputPart[];
  outDir: string;
  options: Record<string, unknown>;
  pollIntervalMs: number;
  timeoutMs: number;
}

export interface GenerateResult {
  provider: Provider;
  model: string;
  modality: Modality;
  outputs: string[];
  meta?: Record<string, unknown>;
}
