import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExecutionPlan,
  buildGeneratedPackageJson,
  buildScaffoldConfigFiles,
  buildScaffoldManifest,
  DEFAULT_PROJECT_CONFIG,
  getPendingFileRenames,
  STUDIO_PACKAGES,
  validateProjectCompatibility,
} from '../src/data/studioCatalog';
import { buildProjectCreationPrompt, recommendStackOffline } from '../src/data/stackAdvisor';
import type { ProjectConfig, StudioPackage } from '../src/types/studio';

test('validateProjectCompatibility detects port collision and invalid project names', () => {
  const broken: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    projectName: 'bad space name',
    devPort: 4173,
    previewPort: 4173,
  };
  const issues = validateProjectCompatibility(broken);
  const ids = issues.map((i) => i.id);
  assert.ok(ids.includes('invalid-name'), 'expected invalid-name error');
  assert.ok(ids.includes('port-collision'), 'expected port-collision error');
});

test('validateProjectCompatibility detects duplicate target paths in bulk rename overrides', () => {
  const broken: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    fileRenameOverrides: {
      'src/App.tsx': 'src/duplicate.tsx',
      'src/components/AppShell.tsx': 'src/duplicate.tsx',
    },
  };
  const issues = validateProjectCompatibility(broken);
  assert.ok(
    issues.some((i) => i.id === 'rename-path-collision'),
    'expected rename-path-collision error'
  );
});

test('buildScaffoldManifest and getPendingFileRenames apply feature-sliced layout & kebab-case rules', () => {
  const cfg: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    framework: 'vite',
    viteUiFramework: 'react',
    directoryLayoutMode: 'feature-sliced',
    directoryNamingConvention: 'kebab-case',
    autoAlignFileNaming: true,
    fileRenameOverrides: {},
  };
  const manifest = buildScaffoldManifest(cfg);
  const shellEntry = manifest.find((f) => f.id === 'file-shell');
  assert.ok(shellEntry, 'expected AppShell manifest entry');
  assert.equal(shellEntry.targetPath, 'src/features/my-awesome-app/components/app-shell.tsx');

  const pending = getPendingFileRenames(cfg);
  assert.ok(
    pending.some(
      (r) =>
        r.from === 'src/components/AppShell.tsx' &&
        r.to === 'src/features/my-awesome-app/components/app-shell.tsx'
    )
  );
});

test('buildExecutionPlan adapts shell syntax for zsh vs powershell and includes custom npm imports', () => {
  const customPkg: StudioPackage = {
    id: 'npm-zod',
    name: 'zod',
    npmName: 'zod',
    category: 'Routing & State',
    description: 'TypeScript-first schema validation',
    version: '3.24.2',
    availableVersions: ['3.24.2'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: [],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit'],
    status: 'available',
    configSummary: 'MIT · Imported from npm registry',
    docsUrl: 'https://zod.dev',
    isCustomNpm: true,
  };

  const cfg: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    selectedPackageIds: [...DEFAULT_PROJECT_CONFIG.selectedPackageIds, 'npm-zod'],
    initGit: true,
  };
  const allPkgs = [...STUDIO_PACKAGES, customPkg];

  const zshSteps = buildExecutionPlan(cfg, allPkgs, 'zsh');
  const psSteps = buildExecutionPlan(cfg, allPkgs, 'powershell');

  const extraStep = zshSteps.find((s) => s.id === 'step-extra-pkgs');
  assert.ok(extraStep?.command.includes('zod'), 'expected custom npm package zod in install step');

  const gitStep = zshSteps.find((s) => s.id === 'step-git');
  assert.ok(gitStep?.command.includes('Visual Line Interface'), 'expected Visual Line Interface commit message');

  const psVerify = psSteps.find((s) => s.id === 'step-verify');
  assert.ok(psVerify?.command.includes('$env:NODE_OPTIONS='), 'expected PowerShell env syntax');
});

test('buildGeneratedPackageJson and buildScaffoldConfigFiles synthesize concrete config manifests', () => {
  const cfg: ProjectConfig = {
    ...DEFAULT_PROJECT_CONFIG,
    framework: 'vite',
    viteUiFramework: 'react',
    compiler: 'swc',
    styling: 'tailwind',
    tailwindVersion: '4.1',
    devTools: ['biome'],
    testing: 'vitest',
    devPort: 5180,
    previewPort: 4180,
  };

  const pkgJson = JSON.parse(buildGeneratedPackageJson(cfg, STUDIO_PACKAGES)) as {
    name: string;
    scripts: Record<string, string>;
    devDependencies: Record<string, string>;
  };
  assert.equal(pkgJson.name, 'my-awesome-app');
  assert.equal(pkgJson.scripts.dev, 'vite --port 5180');
  assert.ok(pkgJson.devDependencies['@biomejs/biome'], 'expected @biomejs/biome in devDependencies');

  const configs = buildScaffoldConfigFiles(cfg, STUDIO_PACKAGES);
  const paths = configs.map((c) => c.filePath);
  assert.ok(paths.includes('vite.config.ts'), 'expected vite.config.ts');
  assert.ok(paths.includes('tsconfig.json'), 'expected tsconfig.json');
  assert.ok(paths.includes('biome.json'), 'expected biome.json');
  assert.ok(paths.includes('vitest.config.ts'), 'expected vitest.config.ts');

  const viteCfg = configs.find((c) => c.filePath === 'vite.config.ts');
  assert.ok(viteCfg?.content.includes('@vitejs/plugin-react-swc'), 'expected SWC plugin in vite.config.ts');
  assert.ok(viteCfg?.content.includes('port: 5180'), 'expected configured devPort in vite.config.ts');
});

test('recommendStackOffline and buildProjectCreationPrompt operate deterministically offline', () => {
  const rec = recommendStackOffline('Build a B2B SaaS portal with Next.js, Playwright, and Biome', DEFAULT_PROJECT_CONFIG);
  assert.equal(rec.suggestedConfig.framework, 'nextjs');
  assert.equal(rec.suggestedConfig.testing, 'playwright');
  assert.ok(rec.suggestedConfig.devTools.includes('biome'));

  const manifest = buildScaffoldManifest(DEFAULT_PROJECT_CONFIG);
  const plan = buildExecutionPlan(DEFAULT_PROJECT_CONFIG, STUDIO_PACKAGES, 'zsh');
  const prompt = buildProjectCreationPrompt({
    config: DEFAULT_PROJECT_CONFIG,
    packages: STUDIO_PACKAGES,
    executionPlan: plan,
    manifest,
    goal: 'Visual developer workstation console',
  });

  assert.ok(prompt.includes('Visual Line Interface'), 'expected Visual Line Interface header in generated prompt');
  assert.ok(prompt.includes('my-awesome-app'), 'expected project name in generated prompt');
  assert.ok(prompt.includes('Visual developer workstation console'), 'expected goal in generated prompt');
});
