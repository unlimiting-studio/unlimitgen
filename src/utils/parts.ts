import { InputPart } from '../core/types.js';

export function parseParts(rawParts: string[]): InputPart[] {
  const parsed: InputPart[] = [];
  for (const raw of rawParts) {
    const idx = raw.indexOf(':');
    if (idx <= 0) {
      throw new Error(`잘못된 --part 형식입니다: ${raw}. 예: text:고양이, image:/tmp/cat.png`);
    }
    const type = raw.slice(0, idx).trim();
    const value = raw.slice(idx + 1).trim();

    if (!value) {
      throw new Error(`빈 값은 허용되지 않습니다: ${raw}`);
    }

    if (type === 'text') {
      parsed.push({ type: 'text', value });
      continue;
    }
    if (type === 'image') {
      parsed.push({ type: 'image', value });
      continue;
    }

    throw new Error(`지원하지 않는 part 타입입니다: ${type}. text/image만 지원합니다.`);
  }

  if (parsed.length === 0) {
    throw new Error('최소 1개의 --part가 필요합니다.');
  }

  return parsed;
}

export function joinTextParts(parts: InputPart[]): string {
  return parts.filter((p) => p.type === 'text').map((p) => p.value).join('\n');
}

export function imageParts(parts: InputPart[]): string[] {
  return parts.filter((p) => p.type === 'image').map((p) => p.value);
}
