import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI, createPartFromUri } from '@google/genai';
import { GenerateImageRequest, GenerateResult, GenerateVideoRequest } from '../core/types.js';
import { detectMimeTypeFromPath, fileExists, writeBase64File } from '../utils/io.js';
import { imageParts, joinTextParts } from '../utils/parts.js';

export async function generateImageWithGemini(req: GenerateImageRequest, apiKey: string): Promise<GenerateResult> {
  const ai = new GoogleGenAI({ apiKey });
  const text = joinTextParts(req.parts);
  const images = imageParts(req.parts);

  if (req.model.startsWith('imagen-')) {
    if (!text) {
      throw new Error('Imagen 계열은 text 파트가 필요합니다.');
    }
    if (images.length > 0) {
      throw new Error(`${req.model}은 이 CLI에서 text-to-image만 지원합니다. (image 입력 불가)`);
    }

    const response = await ai.models.generateImages({
      model: req.model,
      prompt: text,
      config: req.options as any
    });

    const outputs: string[] = [];
    for (const image of response.generatedImages ?? []) {
      const b64 = image.image?.imageBytes;
      if (!b64) continue;
      const mime = (req.options.outputMimeType as string | undefined) ?? 'image/png';
      const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
      outputs.push(await writeBase64File(b64, req.outDir, 'gemini-image', ext));
    }

    return { provider: 'gemini', model: req.model, modality: 'image', outputs };
  }

  const contentParts: any[] = [];
  for (const part of req.parts) {
    if (part.type === 'text') {
      contentParts.push({ text: part.value });
      continue;
    }

    if (!(await fileExists(part.value))) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${part.value}`);
    }
    const uploaded = await ai.files.upload({ file: part.value });
    if (!uploaded.uri || !uploaded.mimeType) {
      throw new Error(`Gemini 파일 업로드 결과에 uri/mimeType이 없습니다: ${part.value}`);
    }
    contentParts.push(createPartFromUri(uploaded.uri, uploaded.mimeType));
  }

  const response = await ai.models.generateContent({
    model: req.model,
    contents: [{ role: 'user', parts: contentParts }],
    config: {
      responseModalities: ['IMAGE', 'TEXT'],
      ...(req.options as Record<string, unknown>)
    }
  });

  const outputs: string[] = [];
  const candidates = (response as any).candidates ?? [];
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts ?? [];
    for (const part of parts) {
      const b64 = part?.inlineData?.data;
      const mime = part?.inlineData?.mimeType as string | undefined;
      if (!b64) continue;
      const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
      outputs.push(await writeBase64File(b64, req.outDir, 'gemini-image', ext));
    }
  }

  return { provider: 'gemini', model: req.model, modality: 'image', outputs };
}

export async function generateVideoWithGemini(req: GenerateVideoRequest, apiKey: string): Promise<GenerateResult> {
  const ai = new GoogleGenAI({ apiKey });
  const text = joinTextParts(req.parts);
  const images = imageParts(req.parts);

  if (!text && images.length === 0) {
    throw new Error('Gemini 비디오는 text 또는 image 입력이 필요합니다.');
  }

  if (images.length > 1) {
    throw new Error('Gemini 비디오는 현재 이미지 입력 1개만 지원합니다.');
  }

  const source: Record<string, unknown> = {};
  if (text) source.prompt = text;

  if (images[0]) {
    if (!(await fileExists(images[0]))) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${images[0]}`);
    }
    const bytes = await fs.readFile(images[0]);
    source.image = {
      imageBytes: bytes.toString('base64'),
      mimeType: await detectMimeTypeFromPath(images[0])
    };
  }

  let operation = await ai.models.generateVideos({
    model: req.model,
    source,
    config: req.options as any
  });

  const started = Date.now();
  while (!operation.done) {
    if (Date.now() - started > req.timeoutMs) {
      throw new Error('Gemini 비디오 생성 대기 시간이 초과되었습니다. --timeout-ms를 늘려주세요.');
    }
    await new Promise((resolve) => setTimeout(resolve, req.pollIntervalMs));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  const generated = operation.response?.generatedVideos ?? [];
  if (generated.length === 0) {
    throw new Error('Gemini 비디오 생성 결과가 비어 있습니다.');
  }

  const outputs: string[] = [];
  for (let i = 0; i < generated.length; i += 1) {
    const downloadPath = path.resolve(req.outDir, `gemini-video-${Date.now()}-${i + 1}.mp4`);
    await ai.files.download({ file: generated[i], downloadPath });
    outputs.push(downloadPath);
  }

  return {
    provider: 'gemini',
    model: req.model,
    modality: 'video',
    outputs,
    meta: { operationName: operation.name }
  };
}
