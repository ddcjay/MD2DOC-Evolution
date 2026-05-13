import { Buffer } from 'buffer';

const globalScope = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer;
  process?: { env: Record<string, string | undefined> };
};

globalScope.Buffer = globalScope.Buffer || Buffer;
globalScope.process = globalScope.process || { env: { API_KEY: '' } };
globalScope.process.env = globalScope.process.env || { API_KEY: '' };
