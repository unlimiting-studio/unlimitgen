import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import inquirer from 'inquirer';
import { Provider } from '../core/types.js';

const ENV_KEYS: Record<Provider, string[]> = {
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  grok: ['XAI_API_KEY']
};

const TOKEN_DIR = path.join(os.homedir(), '.config', 'unlimitgen');
const TOKEN_FILE = path.join(TOKEN_DIR, 'tokens.json');

type TokenStore = Partial<Record<Provider, string>>;

export async function resolveApiKey(provider: Provider): Promise<string> {
  const fromEnv = resolveFromEnv(provider);
  if (fromEnv) return fromEnv;

  const stored = await getStoredToken(provider);
  if (stored) return stored;

  return promptForToken(provider);
}

export async function authAndStoreToken(provider: Provider): Promise<void> {
  const token = await promptForToken(provider);
  await setStoredToken(provider, token);
}

export async function getStoredToken(provider: Provider): Promise<string | undefined> {
  const store = await readTokenStore();
  const token = store[provider];
  return token && token.trim().length > 0 ? token : undefined;
}

export async function setStoredToken(provider: Provider, token: string): Promise<void> {
  await fs.mkdir(TOKEN_DIR, { recursive: true });

  const current = await readTokenStore();
  current[provider] = token.trim();

  await fs.writeFile(TOKEN_FILE, `${JSON.stringify(current, null, 2)}\n`, { mode: 0o600 });
  await fs.chmod(TOKEN_FILE, 0o600);
}

export function getTokenFilePath(): string {
  return TOKEN_FILE;
}

function resolveFromEnv(provider: Provider): string | undefined {
  const keys = ENV_KEYS[provider];
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

async function readTokenStore(): Promise<TokenStore> {
  try {
    const raw = await fs.readFile(TOKEN_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed as TokenStore;
  } catch {
    return {};
  }
}

async function promptForToken(provider: Provider): Promise<string> {
  const answer = await inquirer.prompt<{ token: string }>([
    {
      type: 'password',
      name: 'token',
      message: `${provider.toUpperCase()} API 토큰을 입력하세요 (입력 내용 숨김):`,
      mask: '*',
      validate: (input: string) => (input.trim().length > 0 ? true : '토큰이 비어 있습니다.')
    }
  ]);

  return answer.token.trim();
}
