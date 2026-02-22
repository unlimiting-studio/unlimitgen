export function parseOptionPairs(optionPairs: string[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const pair of optionPairs) {
    const idx = pair.indexOf('=');
    if (idx <= 0) {
      throw new Error(`잘못된 --option 형식입니다: ${pair}. 예: quality=high`);
    }
    const key = pair.slice(0, idx).trim();
    const raw = pair.slice(idx + 1).trim();
    out[key] = inferValue(raw);
  }
  return out;
}

function inferValue(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

export function mergeOptions(base: Record<string, unknown>, jsonString?: string): Record<string, unknown> {
  if (!jsonString) return base;
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('--options-json 파싱 실패: 유효한 JSON 문자열을 입력해 주세요.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('--options-json은 JSON object 여야 합니다.');
  }
  return { ...base, ...(parsed as Record<string, unknown>) };
}
