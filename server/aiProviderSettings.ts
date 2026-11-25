import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { AiProviderId } from '../src/types/studio.ts';

export interface StoredAiProviderSettings {
  apiKey?: string;
  endpoint?: string;
}

type SettingsFile = Partial<Record<AiProviderId, StoredAiProviderSettings>>;
interface EncryptedFile {
  version: 1;
  iv: string;
  tag: string;
  data: string;
}

function defaultDirectory(): string {
  const userDirectory = process.env.APPDATA || process.env.LOCALAPPDATA || os.homedir();
  return process.env.VLI_DATA_DIR || path.join(userDirectory, '.visual-line-interface');
}

export class AiProviderSettingsStore {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly directory = defaultDirectory()) {}

  private async getKey(): Promise<Buffer> {
    const keyPath = path.join(this.directory, 'ai-provider.key');
    try {
      const key = await fs.readFile(keyPath);
      if (key.length !== 32) throw new Error('Stored AI settings encryption key is invalid.');
      return key;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const key = randomBytes(32);
    try {
      await fs.writeFile(keyPath, key, { flag: 'wx', mode: 0o600 });
      return key;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
      const existing = await fs.readFile(keyPath);
      if (existing.length !== 32) throw new Error('Stored AI settings encryption key is invalid.');
      return existing;
    }
  }

  private async read(): Promise<SettingsFile> {
    const settingsPath = path.join(this.directory, 'ai-provider-settings.json');
    let file: EncryptedFile;
    try {
      file = JSON.parse(await fs.readFile(settingsPath, 'utf8')) as EncryptedFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw new Error(`Unable to read encrypted AI settings: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (file.version !== 1 || !file.iv || !file.tag || !file.data) {
      throw new Error('Encrypted AI settings have an unsupported format.');
    }
    try {
      const decipher = createDecipheriv('aes-256-gcm', await this.getKey(), Buffer.from(file.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(file.tag, 'base64'));
      const plaintext = Buffer.concat([
        decipher.update(Buffer.from(file.data, 'base64')),
        decipher.final(),
      ]).toString('utf8');
      const parsed: unknown = JSON.parse(plaintext);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Expected an AI settings object.');
      }
      return parsed as SettingsFile;
    } catch (error) {
      throw new Error(`Unable to decrypt AI provider settings: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async write(settings: SettingsFile): Promise<void> {
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', await this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(settings), 'utf8'), cipher.final()]);
    const file: EncryptedFile = {
      version: 1,
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
      data: encrypted.toString('base64'),
    };
    const filePath = path.join(this.directory, 'ai-provider-settings.json');
    const temporaryPath = `${filePath}.${randomBytes(8).toString('hex')}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(file), { mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
  }

  async get(provider: AiProviderId): Promise<StoredAiProviderSettings> {
    await this.queue;
    return (await this.read())[provider] ?? {};
  }

  async update(
    provider: AiProviderId,
    patch: { apiKey?: string; clearApiKey?: boolean; endpoint?: string; clearEndpoint?: boolean }
  ): Promise<StoredAiProviderSettings> {
    const operation = this.queue.then(async () => {
      const settings = await this.read();
      const current = { ...(settings[provider] ?? {}) };
      if (patch.clearApiKey) delete current.apiKey;
      else if (patch.apiKey !== undefined) current.apiKey = patch.apiKey;
      if (patch.clearEndpoint) delete current.endpoint;
      else if (patch.endpoint !== undefined) current.endpoint = patch.endpoint;
      if (Object.keys(current).length) settings[provider] = current;
      else delete settings[provider];
      await this.write(settings);
      return current;
    });
    this.queue = operation.then(() => undefined, () => undefined);
    return operation;
  }
}

export const aiProviderSettings = new AiProviderSettingsStore();
