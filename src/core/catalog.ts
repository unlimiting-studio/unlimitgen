import { Modality, Provider } from './types.js';

export interface ModelCatalogItem {
  provider: Provider;
  modality: Modality;
  model: string;
  supportsText: boolean;
  supportsImageInput: boolean;
  options: string[];
  notes?: string;
}

export const MODEL_CATALOG: ModelCatalogItem[] = [
  {
    provider: 'gemini',
    modality: 'image',
    model: 'gemini-3-pro-image-preview',
    supportsText: true,
    supportsImageInput: true,
    options: ['responseModalities', 'temperature', 'topP', 'topK', 'seed']
  },
  {
    provider: 'gemini',
    modality: 'image',
    model: 'gemini-2.5-flash-image-preview',
    supportsText: true,
    supportsImageInput: true,
    options: ['responseModalities', 'temperature', 'topP', 'topK', 'seed']
  },
  {
    provider: 'gemini',
    modality: 'image',
    model: 'imagen-4.0-generate-001',
    supportsText: true,
    supportsImageInput: false,
    options: ['negativePrompt', 'numberOfImages', 'aspectRatio', 'guidanceScale', 'seed', 'outputMimeType', 'imageSize', 'enhancePrompt']
  },
  {
    provider: 'gemini',
    modality: 'image',
    model: 'imagen-4.0-ultra-generate-001',
    supportsText: true,
    supportsImageInput: false,
    options: ['negativePrompt', 'numberOfImages', 'aspectRatio', 'guidanceScale', 'seed', 'outputMimeType', 'imageSize', 'enhancePrompt']
  },
  {
    provider: 'gemini',
    modality: 'image',
    model: 'imagen-4.0-fast-generate-001',
    supportsText: true,
    supportsImageInput: false,
    options: ['negativePrompt', 'numberOfImages', 'aspectRatio', 'guidanceScale', 'seed', 'outputMimeType', 'imageSize', 'enhancePrompt']
  },
  {
    provider: 'openai',
    modality: 'image',
    model: 'gpt-image-1.5',
    supportsText: true,
    supportsImageInput: true,
    options: ['background', 'moderation', 'n', 'output_format', 'output_compression', 'quality', 'size', 'stream']
  },
  {
    provider: 'openai',
    modality: 'image',
    model: 'gpt-image-1',
    supportsText: true,
    supportsImageInput: true,
    options: ['background', 'moderation', 'n', 'output_format', 'output_compression', 'quality', 'size', 'stream', 'input_fidelity']
  },
  {
    provider: 'openai',
    modality: 'image',
    model: 'gpt-image-1-mini',
    supportsText: true,
    supportsImageInput: true,
    options: ['background', 'moderation', 'n', 'output_format', 'output_compression', 'quality', 'size', 'stream']
  },
  {
    provider: 'grok',
    modality: 'image',
    model: 'grok-imagine-image',
    supportsText: true,
    supportsImageInput: true,
    options: ['n', 'output_format', 'quality', 'size'],
    notes: 'xAI는 OpenAI 호환 SDK 경로를 사용'
  },
  {
    provider: 'grok',
    modality: 'image',
    model: 'grok-imagine-image-pro',
    supportsText: true,
    supportsImageInput: true,
    options: ['n', 'output_format', 'quality', 'size'],
    notes: 'xAI는 OpenAI 호환 SDK 경로를 사용'
  },
  {
    provider: 'gemini',
    modality: 'video',
    model: 'veo-3.1-generate-preview',
    supportsText: true,
    supportsImageInput: true,
    options: ['numberOfVideos', 'fps', 'durationSeconds', 'seed', 'aspectRatio', 'resolution', 'negativePrompt', 'enhancePrompt', 'generateAudio']
  },
  {
    provider: 'gemini',
    modality: 'video',
    model: 'veo-3.1-fast-generate-preview',
    supportsText: true,
    supportsImageInput: true,
    options: ['numberOfVideos', 'fps', 'durationSeconds', 'seed', 'aspectRatio', 'resolution', 'negativePrompt', 'enhancePrompt', 'generateAudio']
  },
  {
    provider: 'openai',
    modality: 'video',
    model: 'sora-2',
    supportsText: true,
    supportsImageInput: true,
    options: ['seconds', 'size']
  },
  {
    provider: 'openai',
    modality: 'video',
    model: 'sora-2-pro',
    supportsText: true,
    supportsImageInput: true,
    options: ['seconds', 'size']
  },
  {
    provider: 'grok',
    modality: 'video',
    model: 'grok-imagine-video',
    supportsText: true,
    supportsImageInput: true,
    options: ['seconds', 'size'],
    notes: 'xAI는 OpenAI 호환 SDK 경로를 사용'
  }
];

export function getModelItem(provider: Provider, modality: Modality, model: string): ModelCatalogItem | undefined {
  return MODEL_CATALOG.find((item) => item.provider === provider && item.modality === modality && item.model === model);
}
