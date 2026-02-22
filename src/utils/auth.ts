import inquirer from 'inquirer';
import { Provider } from '../core/types.js';

const ENV_KEYS: Record<Provider, string[]> = {
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  grok: ['XAI_API_KEY']
};

export async function resolveApiKey(provider: Provider): Promise<string> {
  const keys = ENV_KEYS[provider];
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }

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
