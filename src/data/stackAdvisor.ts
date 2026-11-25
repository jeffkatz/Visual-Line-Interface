import type {
  AiStackRecommendation,
  ExecutionCommandStep,
  ProjectConfig,
  ScaffoldFileEntry,
  StackPresetProfile,
  StudioPackage,
} from '../types/studio';
import { FRAMEWORKS, INITIAL_PACKAGE_MANAGERS, INITIAL_RUNTIMES, TOOLCHAIN_DOCS } from './studioCatalog';

export const CURATED_STACK_RECOMMENDATIONS: StackPresetProfile[] = [
  {
    id: 'react-workstation',
    title: 'High-Speed React SPA',
    audience: 'Interactive dashboards, developer consoles & web apps',
    keywords: ['vite', 'react', 'spa', 'dashboard', 'console', 'analytics', 'fast', 'swc'],
    recommendation: {
      summary:
        'Vite 6 + React 19 with SWC Rust compilation, TypeScript, Tailwind CSS v4, Vitest, and pnpm for sub-second HMR and crisp component modularity.',
      rationale: [
        'SWC accelerates TypeScript/JSX transforms compared to Babel without heavy bundler config.',
        'pnpm content-addressable store keeps workspace installs fast and deterministic.',
        'Vitest shares the Vite module graph for instant unit and component tests.',
      ],
      warnings: ['Configure client-side routing via React Router if multi-view URLs are needed.'],
      suggestedConfig: {
        framework: 'vite',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'swc',
        styling: 'tailwind',
        testing: 'vitest',
        devTools: ['eslint', 'prettier'],
        packageManager: 'pnpm',
        runtime: 'node',
        projectName: 'react-workstation-app',
        selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest', 'lucide-react'],
        directoryLayoutMode: 'feature-sliced',
        directoryNamingConvention: 'kebab-case',
        devPort: 5173,
      },
    },
  },
  {
    id: 'nextjs-saas',
    title: 'Full-Stack Next.js SaaS',
    audience: 'B2B SaaS portals, SSR apps & API-backed products',
    keywords: ['next', 'nextjs', 'saas', 'b2b', 'ssr', 'seo', 'auth', 'fullstack', 'e2e', 'playwright'],
    recommendation: {
      summary:
        'Next.js 15 App Router with TypeScript, Tailwind CSS, Biome unified linting/formatting, Playwright E2E coverage, and pnpm.',
      rationale: [
        'App Router enables React Server Components, nested layouts, and server route handlers out of the box.',
        'Biome consolidates linting and formatting into a single zero-config Rust binary.',
        'Playwright verifies end-to-end authentication, routing, and SSR hydration flows.',
      ],
      warnings: ['Avoid installing react-router alongside Next.js App Router to prevent routing conflicts.'],
      suggestedConfig: {
        framework: 'nextjs',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'standard',
        styling: 'tailwind',
        testing: 'playwright',
        devTools: ['biome'],
        packageManager: 'pnpm',
        runtime: 'node',
        projectName: 'saas-app-platform',
        selectedPackageIds: ['tailwindcss', 'typescript', 'biome', 'playwright', 'lucide-react'],
        directoryLayoutMode: 'domain-scoped',
        directoryNamingConvention: 'kebab-case',
        devPort: 3000,
      },
    },
  },
  {
    id: 'astro-content',
    title: 'Content & Docs Portal',
    audience: 'Marketing sites, engineering docs & high-Lighthouse portals',
    keywords: ['astro', 'docs', 'documentation', 'blog', 'content', 'marketing', 'landing', 'static', 'seo'],
    recommendation: {
      summary:
        'Astro 5 islands architecture with strict TypeScript, Tailwind CSS, Prettier formatting, and Bun for minimal client JavaScript.',
      rationale: [
        'Ships zero client JavaScript by default while allowing selective interactive islands.',
        'Bun delivers fast dependency resolution and native TypeScript script execution.',
        'Prettier + Tailwind plugin keeps MDX and Astro templates consistently formatted.',
      ],
      warnings: ['Use SWC only with React presets; Astro relies on Vite standard transforms.'],
      suggestedConfig: {
        framework: 'astro',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'standard',
        styling: 'tailwind',
        testing: 'none',
        devTools: ['prettier'],
        packageManager: 'bun',
        runtime: 'bun',
        projectName: 'editorial-docs-portal',
        selectedPackageIds: ['tailwindcss', 'typescript', 'prettier'],
        directoryLayoutMode: 'standard',
        directoryNamingConvention: 'kebab-case',
        devPort: 4321,
      },
    },
  },
  {
    id: 'vue-enterprise',
    title: 'Vue 3 Enterprise Workspace',
    audience: 'Structured single-file component teams & internal admin tools',
    keywords: ['vue', 'vue3', 'admin', 'enterprise', 'pinia', 'internal'],
    recommendation: {
      summary:
        'Official create-vue scaffold with TypeScript, CSS Modules or Tailwind, ESLint + Prettier, Vitest, and pnpm.',
      rationale: [
        'create-vue configures Volar-friendly TypeScript SFC checks and Vite bundling automatically.',
        'Vitest integrates cleanly with Vue Test Utils and Vite transform pipelines.',
        'Domain-scoped directories keep large feature modules cleanly separated.',
      ],
      warnings: ['Ensure ESLint + Prettier rules align if editing Single-File Components (.vue).'],
      suggestedConfig: {
        framework: 'vue',
        viteUiFramework: 'vue',
        language: 'typescript',
        compiler: 'standard',
        styling: 'tailwind',
        testing: 'vitest',
        devTools: ['eslint', 'prettier'],
        packageManager: 'pnpm',
        runtime: 'node',
        projectName: 'vue-enterprise-console',
        selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest'],
        directoryLayoutMode: 'domain-scoped',
        directoryNamingConvention: 'PascalCase',
        devPort: 5173,
      },
    },
  },
  {
    id: 'sveltekit-edge',
    title: 'SvelteKit Edge Application',
    audience: 'Low-bundle-size web apps & edge-deployed interfaces',
    keywords: ['svelte', 'sveltekit', 'edge', 'lightweight', 'runes', 'fast'],
    recommendation: {
      summary:
        'SvelteKit 2 with Svelte 5 runes, TypeScript, Tailwind CSS, Biome, and Playwright on Bun or Node.',
      rationale: [
        'Compiled reactive primitives eliminate virtual DOM overhead for lean runtime bundles.',
        'Built-in filesystem routing and server load functions cover full-stack workflows.',
        'Playwright integrates seamlessly with SvelteKit preview and SSR routes.',
      ],
      warnings: ['Check adapter target (@sveltejs/adapter-auto or node) prior to production deploy.'],
      suggestedConfig: {
        framework: 'sveltekit',
        viteUiFramework: 'svelte',
        language: 'typescript',
        compiler: 'standard',
        styling: 'tailwind',
        testing: 'playwright',
        devTools: ['biome'],
        packageManager: 'pnpm',
        runtime: 'node',
        projectName: 'svelte-edge-studio',
        selectedPackageIds: ['tailwindcss', 'typescript', 'biome', 'playwright'],
        directoryLayoutMode: 'standard',
        directoryNamingConvention: 'kebab-case',
        devPort: 5173,
      },
    },
  },
  {
    id: 'design-system',
    title: 'UI Component & Design System',
    audience: 'Reusable component libraries, shadcn/ui kits & visual prototypes',
    keywords: ['design', 'ui', 'components', 'library', 'shadcn', 'prototype', 'icons'],
    recommendation: {
      summary:
        'Vite + React + SWC configured with Tailwind CSS v4, shadcn/ui primitives, Lucide icons, Vitest, and PascalCase feature directories.',
      rationale: [
        'Includes Tailwind v4, Lucide icons, and shadcn/ui primitive initialisation in one pipeline.',
        'PascalCase filename convention matches React component symbol names cleanly.',
        'Vitest verifies interactive component states and accessibility regressions.',
      ],
      warnings: ['Review generated components.json paths if restructuring src/ into feature-sliced folders.'],
      suggestedConfig: {
        framework: 'vite',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'swc',
        styling: 'tailwind',
        testing: 'vitest',
        devTools: ['biome'],
        packageManager: 'pnpm',
        runtime: 'node',
        projectName: 'ui-component-foundry',
        selectedPackageIds: ['tailwindcss', 'typescript', 'biome', 'vitest', 'lucide-react', 'shadcn-ui'],
        directoryLayoutMode: 'feature-sliced',
        directoryNamingConvention: 'PascalCase',
        devPort: 5173,
      },
    },
  },
  {
    id: 'mern',
    title: 'MERN',
    audience: 'MongoDB · Express · React · Node.js',
    keywords: ['mern', 'mongodb', 'mongo', 'express', 'react', 'node'],
    projectType: 'fullstack',
    databases: ['mongodb'],
    recommendation: {
      summary: 'A React frontend with an Express API, MongoDB driver, and TypeScript on Node.js.',
      rationale: [
        'Keeps database credentials and database access on the API server, not in browser code.',
        'MongoDB is a natural fit for document-shaped application data.',
      ],
      warnings: ['Provide MONGODB_URI in the generated API .env file before starting the API.'],
      suggestedConfig: {
        framework: 'vite',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'swc',
        styling: 'tailwind',
        testing: 'vitest',
        devTools: ['eslint', 'prettier'],
        packageManager: 'npm',
        runtime: 'node',
        projectName: 'mern-app',
        selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest'],
        directoryLayoutMode: 'standard',
        directoryNamingConvention: 'kebab-case',
        devPort: 5173,
      },
    },
  },
  {
    id: 'pern',
    title: 'PERN',
    audience: 'PostgreSQL · Express · React · Node.js',
    keywords: ['pern', 'postgres', 'postgresql', 'express', 'react', 'node'],
    projectType: 'fullstack',
    databases: ['postgresql'],
    recommendation: {
      summary: 'A React frontend with an Express API and PostgreSQL connection pool.',
      rationale: [
        'PostgreSQL provides relational integrity and flexible SQL for application data.',
        'The API layer keeps database credentials off the client.',
      ],
      warnings: ['Provide DATABASE_URL in the generated API .env file before starting the API.'],
      suggestedConfig: {
        framework: 'vite',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'swc',
        styling: 'tailwind',
        testing: 'vitest',
        devTools: ['eslint', 'prettier'],
        packageManager: 'npm',
        runtime: 'node',
        projectName: 'pern-app',
        selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest'],
        directoryLayoutMode: 'standard',
        directoryNamingConvention: 'kebab-case',
        devPort: 5173,
      },
    },
  },
  {
    id: 'mean',
    title: 'MEAN',
    audience: 'MongoDB · Express · Angular · Node.js',
    keywords: ['mean', 'mongodb', 'mongo', 'express', 'angular', 'node'],
    projectType: 'fullstack',
    databases: ['mongodb'],
    recommendation: {
      summary: 'An Angular TypeScript frontend with an Express API and MongoDB.',
      rationale: [
        'Angular provides a structured, TypeScript-first frontend.',
        'MongoDB access is isolated in the Express API.',
      ],
      warnings: ['Provide MONGODB_URI in the generated API .env file before starting the API.'],
      suggestedConfig: {
        framework: 'angular',
        viteUiFramework: 'react',
        language: 'typescript',
        compiler: 'standard',
        styling: 'plain-css',
        testing: 'none',
        devTools: [],
        packageManager: 'npm',
        runtime: 'node',
        projectName: 'mean-app',
        selectedPackageIds: ['typescript'],
        directoryLayoutMode: 'standard',
        directoryNamingConvention: 'kebab-case',
        devPort: 4200,
      },
    },
  },
];

export function recommendStackOffline(
  goal: string,
  currentConfig: ProjectConfig
): AiStackRecommendation {
  const normalized = goal.toLowerCase();
  let bestProfile = CURATED_STACK_RECOMMENDATIONS[0];
  let bestScore = -1;

  for (const profile of CURATED_STACK_RECOMMENDATIONS) {
    let score = 0;
    for (const kw of profile.keywords) {
      if (normalized.includes(kw)) score += 3;
    }
    if (normalized.includes(profile.recommendation.suggestedConfig.framework)) {
      score += 4;
    }
    if (score > bestScore) {
      bestScore = score;
      bestProfile = profile;
    }
  }

  const base = bestProfile.recommendation;
  const cfg = { ...base.suggestedConfig };

  // Apply explicit user overrides detected from the natural-language goal
  if (normalized.includes('bun')) {
    cfg.packageManager = 'bun';
    cfg.runtime = 'bun';
  } else if (normalized.includes('yarn')) {
    cfg.packageManager = 'yarn';
    cfg.runtime = 'node';
  } else if (normalized.includes('npm') && !normalized.includes('pnpm')) {
    cfg.packageManager = 'npm';
  }

  if (normalized.includes('javascript') && !normalized.includes('typescript')) {
    cfg.language = 'javascript';
  }
  if (normalized.includes('sass') || normalized.includes('scss')) {
    cfg.styling = 'sass';
  } else if (normalized.includes('css modules')) {
    cfg.styling = 'css-modules';
  }
  if (normalized.includes('biome')) {
    cfg.devTools = ['biome'];
  } else if (normalized.includes('eslint')) {
    cfg.devTools = ['eslint', 'prettier'];
  }
  if (normalized.includes('playwright')) {
    cfg.testing = 'playwright';
  } else if (normalized.includes('vitest')) {
    cfg.testing = 'vitest';
  }

  const pkgSet = new Set(cfg.selectedPackageIds);
  if (cfg.styling === 'tailwind') pkgSet.add('tailwindcss');
  else pkgSet.delete('tailwindcss');
  if (cfg.language === 'typescript') pkgSet.add('typescript');
  else pkgSet.delete('typescript');
  if (cfg.devTools.includes('biome')) {
    pkgSet.add('biome');
    pkgSet.delete('eslint');
    pkgSet.delete('prettier');
  }
  if (normalized.includes('router') && cfg.framework === 'vite') {
    pkgSet.add('react-router');
  }
  if (normalized.includes('shadcn')) {
    pkgSet.add('shadcn-ui');
    pkgSet.add('lucide-react');
  }
  cfg.selectedPackageIds = Array.from(pkgSet);

  // Derive a clean project slug if a meaningful goal was supplied
  if (goal.trim().length > 2) {
    const slugWords = normalized
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !['with', 'and', 'for', 'the', 'using', 'app', 'build', 'create'].includes(w))
      .slice(0, 3);
    if (slugWords.length >= 2) {
      cfg.projectName = slugWords.join('-');
    } else if (currentConfig.projectName && bestScore <= 0) {
      cfg.projectName = currentConfig.projectName;
    }
  }

  return {
    summary:
      bestScore > 0
        ? `Matched "${bestProfile.title}": ${base.summary}`
        : `Baseline recommendation ("${bestProfile.title}"): ${base.summary}`,
    rationale: base.rationale,
    warnings: base.warnings,
    suggestedConfig: cfg,
  };
}

export function buildProjectCreationPrompt(params: {
  config: ProjectConfig;
  packages: StudioPackage[];
  executionPlan: ExecutionCommandStep[];
  manifest: ScaffoldFileEntry[];
  goal?: string;
}): string {
  const { config, packages, executionPlan, manifest, goal } = params;
  const fw = FRAMEWORKS.find((f) => f.id === config.framework) ?? FRAMEWORKS[0];
  const rt = INITIAL_RUNTIMES.find((r) => r.id === config.runtime) ?? INITIAL_RUNTIMES[0];
  const pm = INITIAL_PACKAGE_MANAGERS.find((p) => p.id === config.packageManager) ?? INITIAL_PACKAGE_MANAGERS[0];

  const selectedPackages = packages.filter((p) => config.selectedPackageIds.includes(p.id));
  const renamedFiles = manifest.filter((m) => m.targetPath !== m.originalPath);
  const safeName = config.projectName.trim() || 'new-project';

  const stackLines = [
    `- **Project Slug**: \`${safeName}\``,
    `- **Target Directory**: \`${config.directory}/${safeName}\``,
    `- **Primary Framework**: ${fw.name} v${fw.latestVersion}${config.framework === 'vite' ? ` (UI Preset: ${config.viteUiFramework})` : ''} — ${fw.docsUrl}`,
    `- **Language & Compiler**: ${config.language === 'typescript' ? 'TypeScript (strict mode enabled)' : 'JavaScript (ESM)'} · Compiler: \`${config.compiler}\``,
    `- **Styling**: ${TOOLCHAIN_DOCS[config.styling]?.label ?? config.styling}${config.styling === 'tailwind' ? ` (v${config.tailwindVersion})` : ''}`,
    `- **Testing**: ${config.testing === 'none' ? 'None' : TOOLCHAIN_DOCS[config.testing]?.label ?? config.testing}`,
    `- **Linting & Formatting**: ${config.devTools.length > 0 ? config.devTools.join(', ') : 'None'}`,
    `- **Runtime & Package Manager**: ${rt.name} (${config.runtimeVersion}) · ${pm.name} (lockfile: \`${pm.lockfile}\`)`,
    `- **Ports & Memory**: Dev server \`:${config.devPort}\`, Preview \`:${config.previewPort}\`, Node Heap \`${config.memoryLimitMb}MB\`, Fetch Timeout \`${config.networkTimeoutSec}s\``,
  ];

  const dependencySection =
    selectedPackages.length > 0
      ? selectedPackages
          .map(
            (pkg) =>
              `- \`${pkg.npmName}@^${pkg.version}\` (${pkg.isDevDependency ? 'devDependency' : 'dependency'}) — ${pkg.configSummary} ([Docs](${pkg.docsUrl}))`
          )
          .join('\n')
      : '- Base framework dependencies only.';

  const directorySection = [
    `- **Directory Layout Mode**: \`${config.directoryLayoutMode}\``,
    `- **Filename Naming Convention**: \`${config.directoryNamingConvention}\` (Auto-align: ${config.autoAlignFileNaming ? 'enabled' : 'disabled'})`,
    '',
    'Target file structure:',
    '```text',
    `${safeName}/`,
    ...manifest.map((f) => `├── ${f.targetPath}   # ${f.description}`),
    '```',
  ];

  if (renamedFiles.length > 0) {
    directorySection.push(
      '',
      'Pre-execution file alignment rules (preserve exact target paths):',
      ...renamedFiles.map((f) => `- \`${f.originalPath}\` → \`${f.targetPath}\``)
    );
  }

  const commandSection = executionPlan
    .map((step, idx) => `${idx + 1}. **[${step.phase}] ${step.label}**\n   \`\`\`bash\n   ${step.command}\n   \`\`\``)
    .join('\n');

  const goalBlock = goal?.trim()
    ? `## 1. Product Goal & Scope\n\nBuild **${safeName}**: ${goal.trim()}\n`
    : `## 1. Product Goal & Scope\n\nBuild **${safeName}**, a production-grade ${fw.name} (${config.language}) application scaffolded with deterministic tooling, clean module boundaries, and verified configuration.\n`;

  return [
    `# Project Creation Prompt — ${safeName}`,
    '',
    '> Generated by **Visual Line Interface**. Paste this specification into your coding agent, AI assistant, or terminal runbook to scaffold and implement the complete project cleanly.',
    '',
    goalBlock,
    '## 2. Technical Stack Specification',
    '',
    ...stackLines,
    '',
    '## 3. Selected Dependencies & Integrations',
    '',
    dependencySection,
    '',
    '## 4. Directory Layout & Naming Conventions',
    '',
    ...directorySection,
    '',
    '## 5. Bootstrap & CLI Execution Sequence',
    '',
    commandSection,
    '',
    '## 6. Engineering & Verification Requirements',
    '',
    `- Use strictly valid ${config.language === 'typescript' ? 'TypeScript (`tsc --noEmit` must pass with zero errors)' : 'ES modules'} and modular component design.`,
    `- Enforce \`${config.directoryNamingConvention}\` file naming across \`${config.directoryLayoutMode}\` directories and update import paths cleanly after file moves.`,
    config.testing !== 'none'
      ? `- Add baseline ${config.testing === 'vitest' ? 'unit/component' : 'end-to-end'} tests covering core user flows.`
      : '- Verify development server startup and production build output.',
    `- Confirm \`${config.packageManager} run build\` and configured linters (${config.devTools.join(', ') || 'compiler checks'}) succeed before completion.`,
  ].join('\n');
}
