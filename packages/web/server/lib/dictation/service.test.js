import { mkdtemp, rm } from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { createDictationService } from './service.js';

const temporaryDirectories = [];

async function createService() {
  const modelsDir = await mkdtemp(path.join(os.tmpdir(), 'openchamber-dictation-'));
  temporaryDirectories.push(modelsDir);
  return createDictationService({ modelsDir });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe('dictation model download policy', () => {
  it('denies explicit downloads by default', async () => {
    const service = await createService();
    await expect(service.requestModelDownload('whisper-tiny-int8')).resolves.toEqual({
      ok: false,
      forbidden: true,
      error: 'Speech model downloads are disabled by server configuration',
    });
    service.shutdown();
  });

  it('does not auto-download missing STT or TTS models', async () => {
    const service = await createService();
    const disabled = {
      error: 'Speech model downloads are disabled by server configuration',
      retryable: false,
      reasonCode: 'model_download_disabled',
    };
    await expect(
      service.createSttSession({ localModel: 'whisper-tiny-int8' }),
    ).resolves.toEqual(disabled);
    await expect(service.synthesizeSpeech({ text: 'hello' })).resolves.toEqual(disabled);
    service.shutdown();
  });
});
