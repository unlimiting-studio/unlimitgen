import fs from 'node:fs';
import OpenAI from 'openai';
import { GenerateImageRequest, GenerateResult, GenerateVideoRequest, Provider } from '../core/types.js';
import { imageParts, joinTextParts } from '../utils/parts.js';
import { fileExists, writeBase64File, writeBufferFile } from '../utils/io.js';

interface OpenAILikeConfig {
  provider: Provider;
  apiKey: string;
  baseURL?: string;
}

function makeClient(config: OpenAILikeConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL
  });
}

export async function generateImageWithOpenAILike(req: GenerateImageRequest, config: OpenAILikeConfig): Promise<GenerateResult> {
  const client = makeClient(config);
  const prompt = joinTextParts(req.parts);
  const images = imageParts(req.parts);

  if (!prompt) {
    throw new Error('이미지 생성에는 최소 1개의 text 파트가 필요합니다.');
  }

  if (images.length === 0) {
    const result = await client.images.generate({
      model: req.model,
      prompt,
      ...(req.options as Record<string, never>)
    });

    const outputs: string[] = [];
    for (const image of result.data ?? []) {
      if (!image.b64_json) continue;
      const ext = ((req.options.output_format as string | undefined) ?? 'png').replace('jpeg', 'jpg');
      outputs.push(await writeBase64File(image.b64_json, req.outDir, `${config.provider}-image`, ext));
    }

    return { provider: config.provider, model: req.model, modality: 'image', outputs };
  }

  const uploadables: fs.ReadStream[] = [];
  for (const imagePath of images) {
    if (!(await fileExists(imagePath))) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${imagePath}`);
    }
    uploadables.push(fs.createReadStream(imagePath));
  }

  const edited = await client.images.edit({
    model: req.model,
    prompt,
    image: uploadables as unknown as fs.ReadStream,
    ...(req.options as Record<string, never>)
  } as any);

  const outputs: string[] = [];
  for (const image of edited.data ?? []) {
    if (!image.b64_json) continue;
    const ext = ((req.options.output_format as string | undefined) ?? 'png').replace('jpeg', 'jpg');
    outputs.push(await writeBase64File(image.b64_json, req.outDir, `${config.provider}-image`, ext));
  }

  return { provider: config.provider, model: req.model, modality: 'image', outputs };
}

export async function generateVideoWithOpenAILike(req: GenerateVideoRequest, config: OpenAILikeConfig): Promise<GenerateResult> {
  const client = makeClient(config);
  const prompt = joinTextParts(req.parts);
  const images = imageParts(req.parts);

  if (!prompt) {
    throw new Error('동영상 생성에는 최소 1개의 text 파트가 필요합니다.');
  }

  if (images.length > 1) {
    throw new Error('OpenAI/xAI 비디오는 현재 이미지 참조 1개만 지원합니다.');
  }

  const createReq: Record<string, unknown> = {
    model: req.model,
    prompt,
    ...(req.options as Record<string, unknown>)
  };

  if (images[0]) {
    if (!(await fileExists(images[0]))) {
      throw new Error(`이미지 파일을 찾을 수 없습니다: ${images[0]}`);
    }
    createReq.input_reference = fs.createReadStream(images[0]);
  }

  let job = await client.videos.create(createReq as any);

  const started = Date.now();
  while (job.status !== 'completed') {
    if (job.status === 'failed') {
      throw new Error(`비디오 생성 실패: ${job.error?.message ?? '알 수 없는 오류'}`);
    }
    if (Date.now() - started > req.timeoutMs) {
      throw new Error('비디오 생성 대기 시간이 초과되었습니다. --timeout-ms를 늘려주세요.');
    }
    await new Promise((resolve) => setTimeout(resolve, req.pollIntervalMs));
    job = await client.videos.retrieve(job.id);
  }

  const response = await client.videos.downloadContent(job.id, { variant: 'video' });
  const arrayBuffer = await response.arrayBuffer();
  const outputPath = await writeBufferFile(Buffer.from(arrayBuffer), req.outDir, `${config.provider}-video`, 'mp4');

  return {
    provider: config.provider,
    model: req.model,
    modality: 'video',
    outputs: [outputPath],
    meta: { jobId: job.id }
  };
}
