import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import {
  buildProjectRunArgs,
  findAvailableProjectPort,
  supportedProjectEditors,
  validateProjectRunInput,
} from '../server/projectActions';

test('project run commands bind to the allocated port and local host', () => {
  assert.deepEqual(buildProjectRunArgs('vite', 'frontend', 43127), [
    'run',
    'dev',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    '43127',
    '--strictPort',
  ]);
  assert.deepEqual(buildProjectRunArgs('angular', 'frontend', 43127), [
    'run',
    'dev',
    '--',
    '--host',
    '127.0.0.1',
    '--port',
    '43127',
  ]);
  assert.deepEqual(buildProjectRunArgs('vite', 'api', 43127), ['run', 'dev']);
});

test('run requests require an absolute project path and a supported target', () => {
  assert.throws(
    () => validateProjectRunInput({ directory: 'relative/path', target: 'frontend', framework: 'vite' }),
    /absolute project folder/
  );
  assert.throws(
    () => validateProjectRunInput({ directory: 'C:\\project', target: 'shell', framework: 'vite' }),
    /supported project target/
  );
});

test('the OS returns an available ephemeral port for a project run', async () => {
  const port = await findAvailableProjectPort();
  assert.ok(port > 0 && port <= 65535);
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('project editor options include VS Code, Antigravity, Cursor, Codex, and Claude Code', () => {
  const ids = new Set(supportedProjectEditors.map((editor) => editor.id));
  assert.ok(ids.has('vscode'));
  assert.ok(ids.has('antigravity'));
  assert.ok(ids.has('cursor'));
  assert.ok(ids.has('codex'));
  assert.ok(ids.has('claude-code'));
});
