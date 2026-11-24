import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildScaffoldArgs,
  npmPackageArgs,
  prepareProjectPath,
  validateProjectInstallInput,
} from '../server/localInstaller';
import type { ProjectInstallInput } from '../server/localInstaller';

const validInput: ProjectInstallInput = {
  directory: path.resolve(os.tmpdir()),
  projectName: 'starter-app',
  framework: 'vite',
  viteUiFramework: 'react',
  language: 'typescript',
  packageManager: 'npm',
  packages: [],
};

test('installer accepts only local npm requests with valid package specs', () => {
  const parsed = validateProjectInstallInput({
    ...validInput,
    packages: [{ name: '@types/node', version: '22.14.0', isDevDependency: true }],
  });
  assert.equal(parsed.projectName, 'starter-app');
  assert.deepEqual(npmPackageArgs(parsed.packages), [
    ['install', '--save-dev', '@types/node@22.14.0'],
  ]);

  assert.throws(
    () => validateProjectInstallInput({ ...validInput, packageManager: 'pnpm' }),
    /npm only/
  );
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, projectName: '../outside' }),
    /Project name/
  );
  assert.throws(
    () =>
      validateProjectInstallInput({
        ...validInput,
        packages: [{ name: 'left-pad;whoami', version: '1.0.0', isDevDependency: false }],
      }),
    /invalid npm package name/
  );
  assert.throws(
    () =>
      validateProjectInstallInput({
        ...validInput,
        packages: [{ name: 'left-pad', version: 'latest', isDevDependency: false }],
      }),
    /invalid pinned version/
  );
});

test('scaffold arguments are selected from fixed framework and template values', () => {
  assert.deepEqual(buildScaffoldArgs(validInput), [
    'create',
    'vite@latest',
    'starter-app',
    '--',
    '--template',
    'react-swc-ts',
  ]);
  assert.deepEqual(
    buildScaffoldArgs({ ...validInput, framework: 'sveltekit', language: 'javascript' }),
    [
      'exec',
      '--yes',
      '--package',
      'sv',
      '--',
      'sv',
      'create',
      'starter-app',
      '--template',
      'minimal',
      '--types',
      'jsdoc',
      '--no-add-ons',
      '--no-install',
    ]
  );
});

test('destination validation confines project names and refuses existing folders', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'vli-installer-'));
  try {
    const request = { ...validInput, directory: parent };
    const target = await prepareProjectPath(request);
    assert.equal(target, path.join(parent, 'starter-app'));

    await mkdir(target);
    await assert.rejects(prepareProjectPath(request), /already exists/);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
