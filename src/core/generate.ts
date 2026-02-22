import { generateImageWithGemini, generateVideoWithGemini } from '../providers/gemini.js';
import { generateImageWithOpenAILike, generateVideoWithOpenAILike } from '../providers/openaiLike.js';
import { GenerateImageRequest, GenerateResult, GenerateVideoRequest } from './types.js';

export async function generateImage(req: GenerateImageRequest, apiKey: string): Promise<GenerateResult> {
  if (req.provider === 'gemini') {
    return generateImageWithGemini(req, apiKey);
  }
  if (req.provider === 'openai') {
    return generateImageWithOpenAILike(req, { provider: 'openai', apiKey });
  }
  return generateImageWithOpenAILike(req, {
    provider: 'grok',
    apiKey,
    baseURL: 'https://api.x.ai/v1'
  });
}

export async function generateVideo(req: GenerateVideoRequest, apiKey: string): Promise<GenerateResult> {
  if (req.provider === 'gemini') {
    return generateVideoWithGemini(req, apiKey);
  }
  if (req.provider === 'openai') {
    return generateVideoWithOpenAILike(req, { provider: 'openai', apiKey });
  }
  return generateVideoWithOpenAILike(req, {
    provider: 'grok',
    apiKey,
    baseURL: 'https://api.x.ai/v1'
  });
}
