import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { AiProviderSettingsStore } from '../server/aiProviderSettings';
import {
  commitGitChanges,
  configureGitSigning,
  connectGitRemote,
  disconnectGitRemote,
  getGitStatus,
  initializeGitRepository,
  stageGitChanges,
} from '../server/gitManager';
import { ProjectRegistry } from '../server/projectRegistry';
import { readJsonResponse } from '../src/services/http';

test('project registry imports a local Node project and removes only its record', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'vli-project-registry-'));
  try {
    const projectDirectory = path.join(temporaryDirectory, 'existing-app');
    await mkdir(projectDirectory);
    await writeFile(path.join(projectDirectory, 'package.json'), JSON.stringify({
      name: 'existing-app',
      scripts: { dev: 'vite' },
      devDependencies: { vite: '^6.0.0' },
    }));
    const registry = new ProjectRegistry(path.join(temporaryDirectory, 'data', 'projects.json'));
    const project = await registry.importDirectory(projectDirectory);
    assert.equal(project.projectName, 'existing-app');
    assert.equal(project.framework, 'vite');
    assert.equal(project.origin, 'imported');
    assert.equal((await registry.list()).length, 1);
    assert.equal(await registry.remove(project.id), true);
    assert.equal((await registry.list()).length, 0);
    assert.equal(await readFile(path.join(projectDirectory, 'package.json'), 'utf8').then(Boolean), true);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('Git workflows initialize, stage, commit, connect/disconnect and configure local signing', async (t) => {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' });
  } catch {
    t.skip('Git is not installed on this test host.');
    return;
  }

  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'vli-git-workflow-'));
  try {
    const repositoryDirectory = path.join(temporaryDirectory, 'repo');
    await mkdir(repositoryDirectory);
    await writeFile(path.join(repositoryDirectory, 'README.md'), 'Local test project\n');

    assert.equal((await initializeGitRepository(repositoryDirectory)).isRepository, true);
    await assert.rejects(
      connectGitRemote(repositoryDirectory, 'https://user:token@example.test/repo.git'),
      /without embedded credentials/
    );
    const remoteStatus = await connectGitRemote(repositoryDirectory, 'https://example.test/team/repo.git');
    assert.equal(remoteStatus.remotes[0]?.url, 'https://example.test/team/repo.git');
    const signingStatus = await configureGitSigning(repositoryDirectory, {
      name: 'VLI Test',
      email: 'vli@example.test',
      enabled: true,
      format: 'openpgp',
      signingKey: 'ABCD1234',
    });
    assert.equal(signingStatus.enabled, true);
    assert.equal(signingStatus.status.isRepository, true);

    await configureGitSigning(repositoryDirectory, {
      name: 'VLI Test',
      email: 'vli@example.test',
      enabled: false,
      format: 'openpgp',
    });
    const staged = await stageGitChanges(repositoryDirectory);
    assert.deepEqual(staged.staged, ['README.md']);
    const committed = await commitGitChanges(repositoryDirectory, 'Initial project commit');
    assert.equal(committed.staged.length, 0);
    assert.equal(committed.modified.length, 0);
    assert.equal((await getGitStatus(repositoryDirectory)).isRepository, true);
    const disconnected = await disconnectGitRemote(repositoryDirectory);
    assert.equal(disconnected.remotes.length, 0);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('AI provider credentials are encrypted at rest and can be removed', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'vli-ai-settings-'));
  try {
    const store = new AiProviderSettingsStore(temporaryDirectory);
    const credential = 'sk-secret-example-should-not-be-plaintext';
    await store.update('openai', { apiKey: credential, endpoint: 'https://api.example.test/v1' });
    const encryptedFile = await readFile(path.join(temporaryDirectory, 'ai-provider-settings.json'), 'utf8');
    assert.equal(encryptedFile.includes(credential), false);
    assert.deepEqual(await store.get('openai'), {
      apiKey: credential,
      endpoint: 'https://api.example.test/v1',
    });
    await store.update('openai', { clearApiKey: true });
    assert.deepEqual(await store.get('openai'), { endpoint: 'https://api.example.test/v1' });
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test('API JSON parser gives a useful message when a server returns the Vite HTML fallback', async () => {
  await assert.rejects(
    readJsonResponse(new Response('<!doctype html><html></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })),
    /local API returned an HTML page instead of JSON/
  );
  assert.deepEqual(
    await readJsonResponse<{ ok: boolean }>(new Response('{"ok":true}', {
      headers: { 'content-type': 'application/json' },
    })),
    { ok: true }
  );
});
