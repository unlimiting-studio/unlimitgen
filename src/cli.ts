#!/usr/bin/env node
import { Command } from 'commander';
import { MODEL_CATALOG } from './core/catalog.js';
import { generateImage, generateVideo } from './core/generate.js';
import { Modality, Provider } from './core/types.js';
import { resolveApiKey } from './utils/auth.js';
import { mergeOptions, parseOptionPairs } from './utils/options.js';
import { parseParts } from './utils/parts.js';

const program = new Command();

program
  .name('unlimitgen')
  .description('Gemini/OpenAI/Grok 이미지/비디오 생성 CLI')
  .version('0.1.0');

program
  .command('models')
  .description('지원 모델과 옵션 확인')
  .option('-p, --provider <provider>', 'provider 필터 (gemini|openai|grok)')
  .option('-m, --modality <modality>', 'modality 필터 (image|video)')
  .action((opts: { provider?: Provider; modality?: Modality }) => {
    const items = MODEL_CATALOG.filter((item) => (!opts.provider || item.provider === opts.provider) && (!opts.modality || item.modality === opts.modality));

    if (items.length === 0) {
      console.log('조건에 맞는 모델이 없습니다.');
      return;
    }

    for (const item of items) {
      console.log(`- [${item.provider}/${item.modality}] ${item.model}`);
      console.log(`  입력지원: text=${item.supportsText}, image=${item.supportsImageInput}`);
      console.log(`  옵션: ${item.options.join(', ')}`);
      if (item.notes) {
        console.log(`  비고: ${item.notes}`);
      }
    }
  });

const generate = program.command('generate').description('콘텐츠 생성');

generate
  .command('image')
  .description('이미지 생성')
  .requiredOption('-p, --provider <provider>', 'gemini|openai|grok')
  .requiredOption('-m, --model <model>', '모델 ID')
  .requiredOption('--part <part...>', '순서 보장 입력. 예: text:고양이 image:./cat.png text:배경은 숲')
  .option('-o, --out <dir>', '출력 폴더', './outputs')
  .option('--option <pair...>', '모델 옵션 key=value. 예: quality=high size=1024x1024')
  .option('--options-json <json>', '모델 옵션 JSON 문자열')
  .action(async (opts: { provider: Provider; model: string; part: string[]; out: string; option?: string[]; optionsJson?: string }) => {
    const provider = assertProvider(opts.provider);
    const apiKey = await resolveApiKey(provider);
    const parts = parseParts(opts.part);
    const options = mergeOptions(parseOptionPairs(opts.option), opts.optionsJson);

    const result = await generateImage(
      {
        provider,
        model: normalizeModel(opts.model),
        parts,
        outDir: opts.out,
        options
      },
      apiKey
    );

    printResult(result);
  });

generate
  .command('video')
  .description('동영상 생성')
  .requiredOption('-p, --provider <provider>', 'gemini|openai|grok')
  .requiredOption('-m, --model <model>', '모델 ID')
  .requiredOption('--part <part...>', '순서 보장 입력. 예: text:광고 영상 image:./first-frame.png')
  .option('-o, --out <dir>', '출력 폴더', './outputs')
  .option('--option <pair...>', '모델 옵션 key=value. 예: seconds=8 size=1280x720')
  .option('--options-json <json>', '모델 옵션 JSON 문자열')
  .option('--poll-interval-ms <ms>', '상태 폴링 주기(ms)', '5000')
  .option('--timeout-ms <ms>', '타임아웃(ms)', '900000')
  .action(async (opts: { provider: Provider; model: string; part: string[]; out: string; option?: string[]; optionsJson?: string; pollIntervalMs: string; timeoutMs: string }) => {
    const provider = assertProvider(opts.provider);
    const apiKey = await resolveApiKey(provider);
    const parts = parseParts(opts.part);
    const options = mergeOptions(parseOptionPairs(opts.option), opts.optionsJson);

    const result = await generateVideo(
      {
        provider,
        model: normalizeModel(opts.model),
        parts,
        outDir: opts.out,
        options,
        pollIntervalMs: Number(opts.pollIntervalMs),
        timeoutMs: Number(opts.timeoutMs)
      },
      apiKey
    );

    printResult(result);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`오류: ${message}`);
  process.exit(1);
});

function assertProvider(input: string): Provider {
  if (input === 'gemini' || input === 'openai' || input === 'grok') {
    return input;
  }
  throw new Error(`지원하지 않는 provider: ${input}`);
}

function printResult(result: { provider: string; model: string; modality: string; outputs: string[]; meta?: Record<string, unknown> }): void {
  console.log(`완료: ${result.provider}/${result.modality}/${result.model}`);
  if (result.outputs.length === 0) {
    console.log('출력 파일이 없습니다. (모델 응답에 바이너리 결과 미포함)');
  } else {
    for (const output of result.outputs) {
      console.log(`- ${output}`);
    }
  }
  if (result.meta) {
    console.log(`meta: ${JSON.stringify(result.meta)}`);
  }
}

function normalizeModel(model: string): string {
  const lowered = model.toLowerCase();
  const fromCatalog = MODEL_CATALOG.find((item) => item.model.toLowerCase() === lowered);
  return fromCatalog?.model ?? model;
}
