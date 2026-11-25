import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildRuntimeUpdateCommands,
  validateRuntimeUpdateRequest,
} from '../server/runtimeManager';

test('runtime update requests accept supported IDs and safe version values only', () => {
  assert.deepEqual(validateRuntimeUpdateRequest({ runtime: 'node', version: 'v22.14.0' }), {
    runtime: 'node',
    version: '22.14.0',
  });
  assert.deepEqual(validateRuntimeUpdateRequest({ runtime: 'bun', version: 'canary' }), {
    runtime: 'bun',
    version: 'canary',
  });
  assert.deepEqual(validateRuntimeUpdateRequest({ runtime: 'deno', version: 'latest' }), {
    runtime: 'deno',
    version: 'latest',
  });
  assert.throws(() => validateRuntimeUpdateRequest({ runtime: 'node;whoami', version: '22.14.0' }));
  assert.throws(() => validateRuntimeUpdateRequest({ runtime: 'node', version: 'latest' }));
  assert.throws(() => validateRuntimeUpdateRequest({ runtime: 'deno', version: 'latest && whoami' }));
  assert.throws(() => validateRuntimeUpdateRequest({ runtime: 'node', version: '1'.repeat(51) }));
});

test('runtime updates use fixed executable arguments and reject unsupported targets', () => {
  assert.deepEqual(buildRuntimeUpdateCommands('node', '22.14.0', 'fnm'), [
    { command: 'fnm', args: ['install', '22.14.0'] },
    { command: 'fnm', args: ['default', '22.14.0'] },
  ]);
  assert.deepEqual(buildRuntimeUpdateCommands('deno', '2.2.6'), [
    { command: 'deno', args: ['upgrade', '--version', '2.2.6'] },
  ]);
  assert.deepEqual(buildRuntimeUpdateCommands('bun', 'stable'), [
    { command: 'bun', args: ['upgrade', '--stable'] },
  ]);
  assert.throws(() => buildRuntimeUpdateCommands('node', '22.14.0'));
  assert.throws(() => buildRuntimeUpdateCommands('bun', '1.2.5'));
});
