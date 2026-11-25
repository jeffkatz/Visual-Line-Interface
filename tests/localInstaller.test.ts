import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  buildDatabaseScaffold,
  buildScaffoldArgs,
  npmPackageArgs,
  packageManagerPackageArgs,
  prepareProjectPaths,
  prepareProjectPath,
  validateProjectInstallInput,
  withDevelopmentPort,
} from '../server/localInstaller';
import type { ProjectInstallInput } from '../server/localInstaller';

const validInput: ProjectInstallInput = {
  directory: path.resolve(os.tmpdir()),
  projectName: 'starter-app',
  projectType: 'frontend',
  databases: [],
  fullStackLayout: 'workspace',
  apiFramework: 'express',
  framework: 'vite',
  viteUiFramework: 'react',
  language: 'typescript',
  packageManager: 'npm',
  initGit: false,
  technology: {
    compiler: 'swc',
    devTools: ['eslint', 'prettier'],
    styling: 'tailwind',
    testing: 'vitest',
    runtime: 'node',
    runtimeVersion: '',
    strictTypeScript: true,
    tailwindVersion: '4.1',
    devPort: 5173,
    previewPort: 4173,
    selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest'],
  },
  packages: [],
};

test('installer accepts supported package managers with valid package specs', () => {
  const parsed = validateProjectInstallInput({
    ...validInput,
    packages: [{ name: '@types/node', version: '22.14.0', isDevDependency: true }],
  });
  assert.equal(parsed.projectName, 'starter-app');
  assert.deepEqual(parsed.databases, []);
  assert.deepEqual(npmPackageArgs(parsed.packages), [
    ['install', '--save-dev', '@types/node@22.14.0'],
  ]);

  assert.equal(validateProjectInstallInput({ ...validInput, packageManager: 'pnpm' }).packageManager, 'pnpm');
  assert.equal(validateProjectInstallInput({ ...validInput, packageManager: 'yarn' }).packageManager, 'yarn');
  assert.throws(() => validateProjectInstallInput({ ...validInput, packageManager: 'unknown' }), /supported package manager/);
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, projectName: '../outside' }),
    /Project name/
  );
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, databases: ['postgresql'] }),
    /require an API project/
  );
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, projectType: 'api', databases: ['unknown'] }),
    /supported databases/
  );
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, projectType: 'api', databases: ['redis', 'redis'] }),
    /duplicates/
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

test('optional package arguments preserve runtime and development dependency groups', () => {
  const packages = [
    { name: 'zod', version: '3.24.2', isDevDependency: false },
    { name: 'vitest', version: '3.0.0', isDevDependency: true },
  ];
  assert.deepEqual(packageManagerPackageArgs('npm', packages), [
    ['install', 'zod@3.24.2'],
    ['install', '--save-dev', 'vitest@3.0.0'],
  ]);
  assert.deepEqual(packageManagerPackageArgs('pnpm', packages), [
    ['add', 'zod@3.24.2'],
    ['add', '--save-dev', 'vitest@3.0.0'],
  ]);
  assert.deepEqual(packageManagerPackageArgs('yarn', packages), [
    ['add', 'zod@3.24.2'],
    ['add', '--dev', 'vitest@3.0.0'],
  ]);
});

test('development commands use configured ports without duplicating an existing port option', () => {
  assert.equal(withDevelopmentPort('vite', 'vite', 5180), 'vite --port 5180');
  assert.equal(withDevelopmentPort('next dev', 'nextjs', 3001), 'next dev -p 3001');
  assert.equal(withDevelopmentPort('ng serve --port 4201', 'angular', 4200), 'ng serve --port 4201');
});

test('database scaffold adds each selected driver, environment key, and connection check', () => {
  const scaffold = buildDatabaseScaffold(
    ['postgresql', 'mongodb', 'mysql', 'sqlite', 'redis'],
    'sample-database-app'
  );

  assert.deepEqual(
    Object.keys(scaffold.dependencies).sort(),
    ['better-sqlite3', 'mongodb', 'mysql2', 'pg', 'redis'].sort()
  );
  assert.ok(scaffold.devDependencies['@types/pg']);
  assert.ok(scaffold.devDependencies['@types/better-sqlite3']);
  assert.match(scaffold.envExample, /DATABASE_URL=/);
  assert.match(scaffold.envExample, /MONGODB_URI=/);
  assert.match(scaffold.envExample, /MYSQL_URL=/);
  assert.match(scaffold.envExample, /SQLITE_PATH=/);
  assert.match(scaffold.envExample, /REDIS_URL=/);
  assert.match(scaffold.source, /export async function connectDatabases/);
  assert.match(scaffold.source, /await postgresql\.query/);
  assert.match(scaffold.source, /await mongodbClient\.connect/);
  assert.match(scaffold.source, /await mysqlPool\.query/);
  assert.match(scaffold.source, /sqlite\.prepare/);
  assert.match(scaffold.source, /await redisClient\.ping/);
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
  assert.deepEqual(
    buildScaffoldArgs({ ...validInput, framework: 'angular' }),
    [
      'exec',
      '--yes',
      '--package',
      '@angular/cli@latest',
      '--',
      'ng',
      'new',
      'starter-app',
      '--defaults',
      '--skip-install',
      '--skip-git',
      '--routing',
      '--style=css',
      '--analytics=false',
      '--package-manager=npm',
    ]
  );
  assert.throws(
    () => validateProjectInstallInput({ ...validInput, framework: 'angular', language: 'javascript' }),
    /Angular projects require TypeScript/
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

test('full-stack separate layout resolves two sibling project folders without using a hardcoded name', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'vli-fullstack-'));
  try {
    const paths = await prepareProjectPaths({
      ...validInput,
      directory: parent,
      projectName: 'client-api',
      projectType: 'fullstack',
      fullStackLayout: 'separate',
    });
    assert.equal(paths.projectPath, path.join(parent, 'client-api-frontend'));
    assert.equal(paths.apiPath, path.join(parent, 'client-api-api'));
    assert.equal(paths.workspacePath, parent);
  } finally {
    await rm(parent, { recursive: true, force: true });
  }
});
