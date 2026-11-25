import type {
  CompatibilityIssue,
  ExecutionCommandStep,
  FileNamingConvention,
  FrameworkMeta,
  GeneratedConfigFile,
  PackageManagerInfo,
  ProjectConfig,
  RuntimeInfo,
  ScaffoldFileEntry,
  StudioPackage,
  StudioSettings,
} from '../types/studio';

export const FRAMEWORKS: FrameworkMeta[] = [
  {
    id: 'vite',
    name: 'Vite',
    tagline: 'Next-generation frontend tooling & ESM dev server',
    latestVersion: '6.2.0',
    compatibility: 'installed',
    compatibilityLabel: 'Verified',
    defaultPort: 5173,
    supportsSwc: true,
    supportsReactVariant: true,
    docsUrl: 'https://vite.dev',
    summary:
      'Instant server start via native ESM and Rollup-powered production builds. Supports React, Vue, Svelte, Solid, and custom templates.',
    requirements: ['Node.js >= 18.0.0 or >= 20.19.0', 'Any modern package manager'],
    cliPackage: 'create-vite@latest',
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    tagline: 'Full-stack React framework with App Router & RSC',
    latestVersion: '15.2.3',
    compatibility: 'installed',
    compatibilityLabel: 'Verified',
    defaultPort: 3000,
    supportsSwc: true,
    supportsReactVariant: false,
    docsUrl: 'https://nextjs.org',
    summary:
      'Production React framework featuring server components, file-system routing, Turbopack dev acceleration, and built-in SWC compilation.',
    requirements: ['Node.js >= 18.18.0', 'React 19 runtime support'],
    cliPackage: 'create-next-app@latest',
  },
  {
    id: 'astro',
    name: 'Astro',
    tagline: 'Content-driven web framework with zero-JS islands',
    latestVersion: '5.5.2',
    compatibility: 'installed',
    compatibilityLabel: 'Verified',
    defaultPort: 4321,
    supportsSwc: false,
    supportsReactVariant: false,
    docsUrl: 'https://astro.build',
    summary:
      'Static and hybrid SSR architecture built on Vite. Ships minimal client JavaScript by default with optional UI framework islands.',
    requirements: ['Node.js >= 18.20.8 or >= 20.3.0'],
    cliPackage: 'create-astro@latest',
  },
  {
    id: 'vue',
    name: 'Vue',
    tagline: 'Progressive component framework powered by create-vue',
    latestVersion: '3.5.13',
    compatibility: 'installed',
    compatibilityLabel: 'Verified',
    defaultPort: 5173,
    supportsSwc: false,
    supportsReactVariant: false,
    docsUrl: 'https://vuejs.org',
    summary:
      'Official Vue 3 scaffolding powered by Vite, supporting TypeScript, Pinia state management, Vue Router, and Vitest out of the box.',
    requirements: ['Node.js >= 18.3.0'],
    cliPackage: 'create-vue@latest',
  },
  {
    id: 'sveltekit',
    name: 'SvelteKit',
    tagline: 'Full-stack Svelte compiler & adapter ecosystem',
    latestVersion: '2.19.0',
    compatibility: 'available',
    compatibilityLabel: 'CLI Ready',
    defaultPort: 5173,
    supportsSwc: false,
    supportsReactVariant: false,
    docsUrl: 'https://svelte.dev',
    summary:
      'Compiled web application framework with Svelte 5 runes, filesystem routing, SSR/SSG adapters, and Vite integration.',
    requirements: ['Node.js >= 18.13.0'],
    cliPackage: 'sv@latest create',
  },
  {
    id: 'angular',
    name: 'Angular',
    tagline: 'TypeScript-first application framework with CLI tooling',
    latestVersion: '20',
    compatibility: 'available',
    compatibilityLabel: 'CLI Ready',
    defaultPort: 4200,
    supportsSwc: false,
    supportsReactVariant: false,
    docsUrl: 'https://angular.dev',
    summary:
      'A complete TypeScript application framework with routing, dependency injection, and first-party build tooling.',
    requirements: ['Node.js ^20.19.0 or ^22.12.0'],
    cliPackage: '@angular/cli@latest',
  },
];

export const INITIAL_RUNTIMES: RuntimeInfo[] = [
  {
    id: 'node',
    name: 'Node.js',
    installedVersion: null,
    selectedVersion: '',
    status: 'missing',
    binaryPath: 'not found on PATH',
    manager: 'Requires nvm, fnm, or Volta to update',
    architecture: '—',
    notes: 'Detected from the local host. Install or update with a supported Node.js version manager.',
    docsUrl: 'https://nodejs.org/docs/latest/api/',
    releaseNotesUrl: 'https://nodejs.org/en/about/previous-releases',
  },
  {
    id: 'deno',
    name: 'Deno',
    installedVersion: null,
    selectedVersion: '',
    status: 'missing',
    binaryPath: 'not found on PATH',
    manager: 'deno upgrade',
    architecture: '—',
    notes: 'Detected from the local host. The Deno self-updater supports version-specific updates.',
    docsUrl: 'https://docs.deno.com/',
    releaseNotesUrl: 'https://github.com/denoland/deno/releases',
  },
  {
    id: 'bun',
    name: 'Bun',
    installedVersion: null,
    selectedVersion: '',
    status: 'missing',
    binaryPath: 'not found on PATH',
    manager: 'bun upgrade',
    architecture: '—',
    notes: 'Detected from the local host. Bun supports stable and canary self-updates.',
    docsUrl: 'https://bun.sh/docs',
    releaseNotesUrl: 'https://bun.sh/blog',
  },
];

export const INITIAL_PACKAGE_MANAGERS: PackageManagerInfo[] = [
  {
    id: 'pnpm',
    name: 'pnpm',
    version: '',
    lockfile: 'pnpm-lock.yaml',
    status: 'attention',
    compatibleRuntimes: ['node'],
    notes: 'Content-addressable store with strict dependency isolation and fast workspace linking.',
    docsUrl: 'https://pnpm.io/motivation',
  },
  {
    id: 'npm',
    name: 'npm',
    version: '',
    lockfile: 'package-lock.json',
    status: 'attention',
    compatibleRuntimes: ['node', 'deno'],
    notes: 'Default Node.js package manager. Widely compatible with all CLI scaffolds and CI runners.',
    docsUrl: 'https://docs.npmjs.com/',
  },
  {
    id: 'yarn',
    name: 'Yarn',
    version: '',
    lockfile: 'yarn.lock',
    status: 'attention',
    compatibleRuntimes: ['node'],
    notes: 'Yarn Berry via Corepack. Uses Plug’n’Play or node-modules linker.',
    docsUrl: 'https://yarnpkg.com/getting-started',
  },
  {
    id: 'bun',
    name: 'Bun',
    version: '',
    lockfile: 'bun.lock',
    status: 'attention',
    compatibleRuntimes: ['bun', 'node'],
    notes: 'Native binary installer offering near-instant dependency resolution.',
    docsUrl: 'https://bun.sh/docs/cli/install',
  },
];

export const STUDIO_PACKAGES: StudioPackage[] = [
  {
    id: 'bootstrap',
    name: 'Bootstrap',
    npmName: 'bootstrap',
    category: 'Styling & UI',
    description: 'Responsive component and grid system with accessible JavaScript plugins.',
    version: '5.3.8',
    availableVersions: ['5.3.8', '5.3.3'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: ['src/index.css'],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Adds Bootstrap styles and component utilities.',
    docsUrl: 'https://getbootstrap.com/docs/5.3/',
  },
  {
    id: 'mui',
    name: 'Material UI',
    npmName: '@mui/material',
    category: 'Styling & UI',
    description: 'Google Material Design components for React applications.',
    version: '7.3.7',
    availableVersions: ['7.3.7', '7.0.0'],
    isDevDependency: false,
    hasFullIntegration: true,
    integrationFiles: ['src/theme.ts'],
    peerDependencies: ['@emotion/react', '@emotion/styled'],
    compatibleFrameworks: ['vite', 'nextjs', 'react'],
    status: 'available',
    configSummary: 'Adds Material UI components and Emotion styling dependencies.',
    docsUrl: 'https://mui.com/material-ui/',
  },
  {
    id: 'ui-sdk',
    name: 'Microsoft UI SDK',
    npmName: '@ui-sdk/react',
    category: 'Styling & UI',
    description: 'Microsoft Fluent-style React components and UI primitives.',
    version: '0.1.0-beta.17',
    availableVersions: ['0.1.0-beta.17'],
    isDevDependency: false,
    hasFullIntegration: true,
    integrationFiles: ['src/theme.ts'],
    peerDependencies: ['@ui-sdk/core'],
    compatibleFrameworks: ['vite', 'nextjs'],
    status: 'available',
    configSummary: 'Adds Microsoft UI SDK React and core packages.',
    docsUrl: 'https://ui5.github.io/webcomponents-react/',
  },
  {
    id: 'chakra',
    name: 'Chakra UI',
    npmName: '@chakra-ui/react',
    category: 'Styling & UI',
    description: 'Accessible composable React components with theme-aware style props.',
    version: '3.30.0',
    availableVersions: ['3.30.0', '3.22.0'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: ['src/theme.ts'],
    peerDependencies: ['@emotion/react'],
    compatibleFrameworks: ['vite', 'nextjs'],
    status: 'available',
    configSummary: 'Adds Chakra UI and its React styling dependencies.',
    docsUrl: 'https://chakra-ui.com/docs',
  },
  {
    id: 'daisyui',
    name: 'daisyUI',
    npmName: 'daisyui',
    category: 'Styling & UI',
    description: 'Component classes built on Tailwind CSS.',
    version: '5.1.8',
    availableVersions: ['5.1.8', '4.12.24'],
    isDevDependency: true,
    hasFullIntegration: false,
    integrationFiles: ['src/index.css'],
    peerDependencies: ['tailwindcss'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit'],
    status: 'available',
    configSummary: 'Adds daisyUI component classes alongside Tailwind CSS.',
    docsUrl: 'https://daisyui.com/docs/',
  },
  {
    id: 'ant-design',
    name: 'Ant Design',
    npmName: 'antd',
    category: 'Styling & UI',
    description: 'Enterprise-oriented React UI components and design system.',
    version: '5.27.6',
    availableVersions: ['5.27.6', '5.24.0'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: ['src/theme.ts'],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs'],
    status: 'available',
    configSummary: 'Adds Ant Design components for React applications.',
    docsUrl: 'https://ant.design/components/overview',
  },
  {
    id: 'bulma',
    name: 'Bulma',
    npmName: 'bulma',
    category: 'Styling & UI',
    description: 'Modern Flexbox-based CSS framework with no JavaScript dependency.',
    version: '1.0.4',
    availableVersions: ['1.0.4', '0.9.4'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: ['src/index.css'],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Adds the Bulma CSS component system.',
    docsUrl: 'https://bulma.io/documentation/',
  },
  {
    id: 'prime-react',
    name: 'PrimeReact',
    npmName: 'primereact',
    category: 'Styling & UI',
    description: 'Rich React components with themes and icon support.',
    version: '10.9.7',
    availableVersions: ['10.9.7', '10.8.5'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: ['src/theme.ts'],
    peerDependencies: ['primeicons'],
    compatibleFrameworks: ['vite', 'nextjs'],
    status: 'available',
    configSummary: 'Adds PrimeReact components and PrimeIcons.',
    docsUrl: 'https://primereact.org/',
  },
  {
    id: 'tailwindcss',
    name: 'Tailwind CSS',
    npmName: 'tailwindcss',
    category: 'Styling & UI',
    description: 'Utility-first CSS framework with Vite v4 engine plugin and automatic content scanning.',
    version: '4.1.0',
    availableVersions: ['4.1.0', '4.0.14', '3.4.17'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['vite.config.ts', 'src/index.css'],
    peerDependencies: ['@tailwindcss/vite'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'installed',
    configSummary: 'Registers @tailwindcss/vite plugin and injects @import "tailwindcss" stylesheet.',
    docsUrl: 'https://tailwindcss.com/docs/installation/using-vite',
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    npmName: 'typescript',
    category: 'Language & Types',
    description: 'Static type checker and compiler configuration with strict workspace presets.',
    version: '5.8.2',
    availableVersions: ['5.8.2', '5.7.3', '5.6.3'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['tsconfig.json', 'tsconfig.app.json'],
    peerDependencies: ['@types/node'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'installed',
    configSummary: 'Configures bundler moduleResolution, isolatedModules, and strict compiler checks.',
    docsUrl: 'https://www.typescriptlang.org/docs/',
  },
  {
    id: 'eslint',
    name: 'ESLint',
    npmName: 'eslint',
    category: 'Linting & Format',
    description: 'Pluggable JavaScript and TypeScript static analysis with flat configuration.',
    version: '9.22.0',
    availableVersions: ['9.22.0', '9.21.0', '8.57.1'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['eslint.config.js'],
    peerDependencies: ['@eslint/js', 'typescript-eslint'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Generates flat eslint.config.js with framework hooks and TypeScript rules.',
    docsUrl: 'https://eslint.org/docs/latest/use/configure/configuration-files',
  },
  {
    id: 'prettier',
    name: 'Prettier',
    npmName: 'prettier',
    category: 'Linting & Format',
    description: 'Opinionated code formatter for consistent indentation, imports, and CSS classes.',
    version: '3.5.3',
    availableVersions: ['3.5.3', '3.4.2'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['.prettierrc', '.prettierignore'],
    peerDependencies: ['prettier-plugin-tailwindcss'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Writes .prettierrc profile and optional Tailwind class-sorting plugin.',
    docsUrl: 'https://prettier.io/docs/en/',
  },
  {
    id: 'vitest',
    name: 'Vitest',
    npmName: 'vitest',
    category: 'Testing',
    description: 'Vite-native unit and component test runner with instant HMR watch mode.',
    version: '3.0.9',
    availableVersions: ['3.0.9', '3.0.5', '2.1.9'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['vitest.config.ts', 'src/App.test.tsx'],
    peerDependencies: ['@testing-library/react', 'jsdom'],
    compatibleFrameworks: ['vite', 'vue', 'astro', 'sveltekit', 'nextjs'],
    status: 'available',
    configSummary: 'Adds test script to package.json and configures jsdom environment.',
    docsUrl: 'https://vitest.dev/guide/',
  },
  {
    id: 'playwright',
    name: 'Playwright',
    npmName: '@playwright/test',
    category: 'Testing',
    description: 'Cross-browser end-to-end testing suite for Chromium, Firefox, and WebKit.',
    version: '1.51.1',
    availableVersions: ['1.51.1', '1.50.1'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['playwright.config.ts', 'tests/smoke.spec.ts'],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Initialises Playwright config bound to local dev server port.',
    docsUrl: 'https://playwright.dev/docs/intro',
  },
  {
    id: 'shadcn-ui',
    name: 'shadcn/ui',
    npmName: 'shadcn',
    category: 'Styling & UI',
    description: 'Accessible component primitives built on Radix UI and Tailwind CSS.',
    version: '2.4.0',
    availableVersions: ['2.4.0', '2.3.0'],
    isDevDependency: false,
    hasFullIntegration: true,
    integrationFiles: ['components.json', 'src/lib/utils.ts'],
    peerDependencies: ['clsx', 'tailwind-merge', 'lucide-react'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro'],
    status: 'available',
    configSummary: 'Runs shadcn init with path alias resolution and CSS variable tokens.',
    docsUrl: 'https://ui.shadcn.com/docs/installation/vite',
  },
  {
    id: 'react-router',
    name: 'React Router',
    npmName: 'react-router',
    category: 'Routing & State',
    description: 'Declarative client and framework routing with nested layouts and data loaders.',
    version: '7.4.0',
    availableVersions: ['7.4.0', '7.3.0', '6.30.0'],
    isDevDependency: false,
    hasFullIntegration: true,
    integrationFiles: ['src/router.tsx'],
    peerDependencies: ['react', 'react-dom'],
    compatibleFrameworks: ['vite'],
    status: 'available',
    configSummary: 'Installs react-router and scaffolds typed BrowserRouter entry routes.',
    docsUrl: 'https://reactrouter.com/home',
  },
  {
    id: 'biome',
    name: 'Biome',
    npmName: '@biomejs/biome',
    category: 'Linting & Format',
    description: 'Unified Rust-powered formatter and linter replacing ESLint + Prettier.',
    version: '1.9.4',
    availableVersions: ['1.9.4', '1.9.3'],
    isDevDependency: true,
    hasFullIntegration: true,
    integrationFiles: ['biome.json'],
    peerDependencies: [],
    compatibleFrameworks: ['vite', 'nextjs', 'astro', 'vue', 'sveltekit', 'angular'],
    status: 'available',
    configSummary: 'Generates biome.json with organizeImports and recommended lint rules.',
    docsUrl: 'https://biomejs.dev/guides/getting-started/',
  },
  {
    id: 'lucide-react',
    name: 'Lucide Icons',
    npmName: 'lucide-react',
    category: 'Styling & UI',
    description: 'Consistent 1.5px stroke technical icon library with tree-shakable ES exports.',
    version: '0.483.0',
    availableVersions: ['0.483.0', '0.479.0'],
    isDevDependency: false,
    hasFullIntegration: false,
    integrationFiles: [],
    peerDependencies: ['react'],
    compatibleFrameworks: ['vite', 'nextjs', 'astro'],
    status: 'installed',
    configSummary: 'Direct package dependency with zero additional configuration files.',
    docsUrl: 'https://lucide.dev/guide/packages/lucide-react',
  },
];

export interface ToolchainDocEntry {
  id: string;
  label: string;
  category: string;
  docsUrl: string;
  apiUrl?: string;
  summary: string;
}

export const TOOLCHAIN_DOCS: Record<string, ToolchainDocEntry> = {
  typescript: {
    id: 'typescript',
    label: 'TypeScript 5.8 Handbook',
    category: 'Language',
    docsUrl: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    apiUrl: 'https://www.typescriptlang.org/tsconfig/',
    summary: 'Static type definitions, tsconfig compiler options, and moduleResolution guides.',
  },
  javascript: {
    id: 'javascript',
    label: 'MDN JavaScript Reference',
    category: 'Language',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
    apiUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference',
    summary: 'ECMAScript modules, async patterns, and standard built-in APIs.',
  },
  swc: {
    id: 'swc',
    label: 'SWC Rust Compiler',
    category: 'Compiler',
    docsUrl: 'https://swc.rs/docs/getting-started',
    apiUrl: 'https://github.com/vitejs/vite-plugin-react-swc',
    summary: 'Speedy Web Compiler written in Rust for JSX/TSX transforms and React Fast Refresh.',
  },
  standard: {
    id: 'standard',
    label: 'Vite Standard Transform (esbuild / Babel)',
    category: 'Compiler',
    docsUrl: 'https://esbuild.github.io/',
    apiUrl: 'https://vite.dev/guide/features.html',
    summary: 'Default Vite transform pipeline using esbuild and framework-specific plugins.',
  },
  tailwind: {
    id: 'tailwind',
    label: 'Tailwind CSS Documentation',
    category: 'Styling',
    docsUrl: 'https://tailwindcss.com/docs',
    apiUrl: 'https://tailwindcss.com/docs/theme',
    summary: 'Utility classes, CSS-first @theme configuration, and Vite v4 integration.',
  },
  sass: {
    id: 'sass',
    label: 'Dart Sass Documentation',
    category: 'Styling',
    docsUrl: 'https://sass-lang.com/documentation/',
    summary: 'SCSS syntax, @use/@forward module system, and mixins.',
  },
  'css-modules': {
    id: 'css-modules',
    label: 'CSS Modules Guide (Vite)',
    category: 'Styling',
    docsUrl: 'https://vite.dev/guide/features.html#css-modules',
    summary: 'Locally scoped *.module.css class composition with native Vite support.',
  },
  'plain-css': {
    id: 'plain-css',
    label: 'MDN CSS Reference',
    category: 'Styling',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
    summary: 'Modern CSS nesting, custom properties, Grid, and Flexbox.',
  },
  bootstrap: {
    id: 'bootstrap',
    label: 'Bootstrap Documentation',
    category: 'Styling',
    docsUrl: 'https://getbootstrap.com/docs/5.3/',
    summary: 'Responsive grid, components, utilities, and optional JavaScript plugins.',
  },
  mui: {
    id: 'mui',
    label: 'Material UI Documentation',
    category: 'Styling',
    docsUrl: 'https://mui.com/material-ui/',
    summary: 'React components implementing Material Design with Emotion theming.',
  },
  'ui-sdk': {
    id: 'ui-sdk',
    label: 'Microsoft UI SDK Documentation',
    category: 'Styling',
    docsUrl: 'https://ui5.github.io/webcomponents-react/',
    summary: 'Microsoft and Fluent-inspired React UI components.',
  },
  chakra: {
    id: 'chakra',
    label: 'Chakra UI Documentation',
    category: 'Styling',
    docsUrl: 'https://chakra-ui.com/docs',
    summary: 'Accessible React components with theme-aware style props.',
  },
  daisyui: {
    id: 'daisyui',
    label: 'daisyUI Documentation',
    category: 'Styling',
    docsUrl: 'https://daisyui.com/docs/',
    summary: 'Component class names powered by Tailwind CSS.',
  },
  'ant-design': {
    id: 'ant-design',
    label: 'Ant Design Documentation',
    category: 'Styling',
    docsUrl: 'https://ant.design/components/overview',
    summary: 'Enterprise React UI components and design-system tokens.',
  },
  bulma: {
    id: 'bulma',
    label: 'Bulma Documentation',
    category: 'Styling',
    docsUrl: 'https://bulma.io/documentation/',
    summary: 'Flexbox-based CSS components with no JavaScript framework dependency.',
  },
  'prime-react': {
    id: 'prime-react',
    label: 'PrimeReact Documentation',
    category: 'Styling',
    docsUrl: 'https://primereact.org/',
    summary: 'Rich React components, themes, and icons.',
  },
  vitest: {
    id: 'vitest',
    label: 'Vitest Testing Guide',
    category: 'Testing',
    docsUrl: 'https://vitest.dev/guide/',
    apiUrl: 'https://vitest.dev/api/',
    summary: 'Unit/component test runner powered by Vite transform pipeline.',
  },
  playwright: {
    id: 'playwright',
    label: 'Playwright Documentation',
    category: 'Testing',
    docsUrl: 'https://playwright.dev/docs/intro',
    apiUrl: 'https://playwright.dev/docs/api/class-playwright',
    summary: 'Cross-browser end-to-end test automation and trace viewer.',
  },
  eslint: {
    id: 'eslint',
    label: 'ESLint Flat Config Docs',
    category: 'Tooling',
    docsUrl: 'https://eslint.org/docs/latest/',
    summary: 'JavaScript and TypeScript static analysis and rule configuration.',
  },
  prettier: {
    id: 'prettier',
    label: 'Prettier Docs',
    category: 'Tooling',
    docsUrl: 'https://prettier.io/docs/en/options',
    summary: 'Opinionated code formatter options and plugin integration.',
  },
  biome: {
    id: 'biome',
    label: 'Biome Toolchain Docs',
    category: 'Tooling',
    docsUrl: 'https://biomejs.dev/reference/configuration/',
    summary: 'Unified Rust linter, formatter, and import sorter.',
  },
  react: {
    id: 'react',
    label: 'React 19 Documentation',
    category: 'UI Library',
    docsUrl: 'https://react.dev/reference/react',
    summary: 'Hooks, Server Components, and TypeScript component patterns.',
  },
  vue: {
    id: 'vue',
    label: 'Vue 3 Documentation',
    category: 'UI Library',
    docsUrl: 'https://vuejs.org/guide/introduction.html',
    summary: 'Composition API, Single-File Components, and Reactivity.',
  },
  svelte: {
    id: 'svelte',
    label: 'Svelte 5 Documentation',
    category: 'UI Library',
    docsUrl: 'https://svelte.dev/docs/svelte/overview',
    summary: 'Runes reactivity, template directives, and compiler API.',
  },
  solid: {
    id: 'solid',
    label: 'SolidJS Documentation',
    category: 'UI Library',
    docsUrl: 'https://docs.solidjs.com/',
    summary: 'Fine-grained reactive primitives without a virtual DOM.',
  },
  vanilla: {
    id: 'vanilla',
    label: 'Web Platform APIs (MDN)',
    category: 'UI Library',
    docsUrl: 'https://developer.mozilla.org/en-US/docs/Web/API',
    summary: 'Zero-framework DOM, Canvas, and Web Components APIs.',
  },
};

export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  projectType: 'frontend',
  databases: [],
  fullStackLayout: 'workspace',
  apiFramework: 'express',
  framework: 'vite',
  viteUiFramework: 'react',
  language: 'typescript',
  compiler: 'swc',
  devTools: ['eslint', 'prettier'],
  styling: 'tailwind',
  testing: 'vitest',
  runtime: 'node',
  runtimeVersion: '',
  packageManager: 'pnpm',
  projectName: '',
  directory: '',
  installDependencies: true,
  initGit: true,
  strictTypeScript: true,
  tailwindVersion: '4.1',
  devPort: 5173,
  previewPort: 4173,
  memoryLimitMb: 4096,
  networkTimeoutSec: 60,
  selectedPackageIds: ['tailwindcss', 'typescript', 'eslint', 'prettier', 'vitest'],
  directoryNamingConvention: 'kebab-case',
  directoryLayoutMode: 'standard',
  autoAlignFileNaming: true,
  fileRenameOverrides: {},
  selectedRenameFilePaths: [
    'src/App.tsx',
    'src/components/AppShell.tsx',
    'src/hooks/useWorkspaceState.ts',
    'src/index.css',
  ],
};

export const DEFAULT_SETTINGS: StudioSettings = {
  themeMode: 'dark',
  bodyFont: 'IBM Plex Sans',
  accentFont: 'Plus Jakarta Sans',
  fontSize: 14,
  accentColor: '#C7A46A',
  defaultDirectory: '',
  preferredPackageManager: 'pnpm',
  preferredRuntime: 'node',
  shellTarget: 'zsh',
  verboseCommandPreview: true,
  knobSensitivity: 'standard',
  confirmBeforeExecution: false,
  aiEnabled: true,
  aiProvider: 'openrouter',
  aiModel: 'google/gemini-2.5-flash',
  aiCustomModel: '',
};

export function splitStemAndCompoundExt(filename: string): { stem: string; ext: string } {
  if (filename.startsWith('.') && filename.indexOf('.', 1) === -1) {
    return { stem: filename, ext: '' };
  }
  const compoundSuffixes = [
    '.test.tsx',
    '.test.ts',
    '.test.jsx',
    '.test.js',
    '.spec.tsx',
    '.spec.ts',
    '.spec.jsx',
    '.spec.js',
    '.module.css',
    '.module.scss',
    '.config.ts',
    '.config.js',
    '.config.mjs',
    '.d.ts',
  ];
  for (const suffix of compoundSuffixes) {
    if (filename.endsWith(suffix)) {
      return {
        stem: filename.slice(0, filename.length - suffix.length),
        ext: suffix,
      };
    }
  }
  const dotIdx = filename.lastIndexOf('.');
  if (dotIdx <= 0) return { stem: filename, ext: '' };
  return {
    stem: filename.slice(0, dotIdx),
    ext: filename.slice(dotIdx),
  };
}

export function splitIdentifierWords(raw: string): string[] {
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function toCaseStyle(stem: string, convention: FileNamingConvention): string {
  const words = splitIdentifierWords(stem);
  if (words.length === 0) return stem;

  switch (convention) {
    case 'kebab-case':
      return words.map((w) => w.toLowerCase()).join('-');
    case 'snake_case':
      return words.map((w) => w.toLowerCase()).join('_');
    case 'camelCase':
      return words
        .map((w, i) =>
          i === 0
            ? w.toLowerCase()
            : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
        )
        .join('');
    case 'PascalCase':
      return words
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join('');
  }
}

export function matchesNamingConvention(
  filePath: string,
  convention: FileNamingConvention,
  exempt = false
): boolean {
  if (exempt) return true;
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1] ?? '';
  if (!filename || filename.startsWith('.')) return true;

  const { stem } = splitStemAndCompoundExt(filename);
  if (!stem) return false;

  switch (convention) {
    case 'kebab-case':
      return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem);
    case 'snake_case':
      return /^[a-z0-9]+(_[a-z0-9]+)*$/.test(stem);
    case 'camelCase':
      return /^[a-z][a-zA-Z0-9]*$/.test(stem);
    case 'PascalCase':
      return /^[A-Z][a-zA-Z0-9]*$/.test(stem);
  }
}

export function computeConventionTargetPath(
  originalPath: string,
  config: ProjectConfig
): string {
  const projectSlug = toCaseStyle(config.projectName.trim() || 'new-project', 'kebab-case');
  const slashIdx = originalPath.lastIndexOf('/');
  const dirPart = slashIdx === -1 ? '' : originalPath.slice(0, slashIdx);
  const filePart = slashIdx === -1 ? originalPath : originalPath.slice(slashIdx + 1);

  // Determine target directory structure
  let mappedDir = dirPart;
  if (dirPart.startsWith('src')) {
    const subDir = dirPart.slice(3).replace(/^\//, '');
    if (config.directoryLayoutMode === 'feature-sliced') {
      mappedDir = subDir ? `src/features/${projectSlug}/${subDir}` : `src/features/${projectSlug}`;
    } else if (config.directoryLayoutMode === 'domain-scoped') {
      mappedDir = subDir ? `src/modules/${projectSlug}/${subDir}` : `src/modules/${projectSlug}`;
    }
  }

  // Normalize file name if auto-align enabled and not root dotfile/manifest
  const isExempt =
    !dirPart &&
    ['package.json', 'tsconfig.json', 'index.html', 'vite.config.ts', 'vite.config.js'].includes(
      filePart
    );

  let mappedFile = filePart;
  if (config.autoAlignFileNaming && !isExempt && !filePart.startsWith('.')) {
    const { stem, ext } = splitStemAndCompoundExt(filePart);
    mappedFile = `${toCaseStyle(stem, config.directoryNamingConvention)}${ext}`;
  }

  return mappedDir ? `${mappedDir}/${mappedFile}` : mappedFile;
}

export function buildScaffoldManifest(config: ProjectConfig): ScaffoldFileEntry[] {
  const isTs = config.language === 'typescript';
  const extScript = isTs ? 'ts' : 'js';
  const extUi =
    config.framework === 'vue' || config.viteUiFramework === 'vue'
      ? 'vue'
      : config.framework === 'sveltekit' || config.viteUiFramework === 'svelte'
      ? 'svelte'
      : config.framework === 'astro'
      ? 'astro'
      : isTs
      ? 'tsx'
      : 'jsx';

  const styleExt =
    config.styling === 'sass'
      ? 'scss'
      : config.styling === 'css-modules'
      ? 'module.css'
      : 'css';

  const rawFiles: Array<Omit<ScaffoldFileEntry, 'targetPath'>> = [];

  if (config.framework === 'nextjs') {
    rawFiles.push(
      {
        id: 'file-layout',
        originalPath: `src/app/layout.${isTs ? 'tsx' : 'jsx'}`,
        category: 'source',
        conventionExempt: true,
        description: 'Next.js App Router root layout shell',
      },
      {
        id: 'file-page',
        originalPath: `src/app/page.${isTs ? 'tsx' : 'jsx'}`,
        category: 'source',
        conventionExempt: true,
        description: 'App Router index page component',
      },
      {
        id: 'file-shell',
        originalPath: `src/components/AppShell.${isTs ? 'tsx' : 'jsx'}`,
        category: 'source',
        description: 'Primary navigation and shell component',
      },
      {
        id: 'file-hook',
        originalPath: `src/hooks/useWorkspaceState.${extScript}`,
        category: 'source',
        description: 'Client workspace state management hook',
      },
      {
        id: 'file-styles',
        originalPath: `src/app/globals.${styleExt}`,
        category: 'style',
        description: 'Global application stylesheet',
      },
      {
        id: 'file-next-cfg',
        originalPath: `next.config.${extScript === 'ts' ? 'ts' : 'mjs'}`,
        category: 'config',
        conventionExempt: true,
        description: 'Next.js compiler and routing configuration',
      }
    );
  } else if (config.framework === 'astro') {
    rawFiles.push(
      {
        id: 'file-astro-idx',
        originalPath: 'src/pages/index.astro',
        category: 'source',
        conventionExempt: true,
        description: 'Primary Astro entry page',
      },
      {
        id: 'file-astro-layout',
        originalPath: 'src/layouts/BaseLayout.astro',
        category: 'source',
        description: 'Shared document layout wrapper',
      },
      {
        id: 'file-shell',
        originalPath: 'src/components/HeaderPanel.astro',
        category: 'source',
        description: 'Header component island',
      },
      {
        id: 'file-styles',
        originalPath: `src/styles/global.${styleExt}`,
        category: 'style',
        description: 'Global stylesheet entry',
      },
      {
        id: 'file-astro-cfg',
        originalPath: 'astro.config.mjs',
        category: 'config',
        conventionExempt: true,
        description: 'Astro build & integration config',
      }
    );
  } else if (config.framework === 'sveltekit') {
    rawFiles.push(
      {
        id: 'file-sk-page',
        originalPath: 'src/routes/+page.svelte',
        category: 'source',
        conventionExempt: true,
        description: 'SvelteKit root route',
      },
      {
        id: 'file-shell',
        originalPath: 'src/lib/components/AppShell.svelte',
        category: 'source',
        description: 'Shared Svelte layout shell component',
      },
      {
        id: 'file-store',
        originalPath: `src/lib/stores/workspaceState.${extScript}`,
        category: 'source',
        description: 'Reactive workspace state module',
      },
      {
        id: 'file-styles',
        originalPath: `src/app.${styleExt}`,
        category: 'style',
        description: 'Root application stylesheet',
      },
      {
        id: 'file-sk-cfg',
        originalPath: 'svelte.config.js',
        category: 'config',
        conventionExempt: true,
        description: 'SvelteKit adapter configuration',
      }
    );
  } else {
    // Vite / Vue
    rawFiles.push(
      {
        id: 'file-app',
        originalPath: `src/App.${extUi}`,
        category: 'source',
        description: 'Root application component',
      },
      {
        id: 'file-main',
        originalPath: `src/main.${extScript}`,
        category: 'source',
        conventionExempt: true,
        description: 'Application mount entry point',
      },
      {
        id: 'file-shell',
        originalPath: `src/components/AppShell.${extUi}`,
        category: 'source',
        description: 'Primary workstation shell component',
      },
      {
        id: 'file-hook',
        originalPath: `src/hooks/useWorkspaceState.${extScript}`,
        category: 'source',
        description: 'Workspace state composition helper',
      },
      {
        id: 'file-styles',
        originalPath: `src/index.${styleExt}`,
        category: 'style',
        description: 'Primary stylesheet entrypoint',
      },
      {
        id: 'file-vite-cfg',
        originalPath: `vite.config.${extScript}`,
        category: 'config',
        conventionExempt: true,
        description: 'Vite bundler and plugin configuration',
      }
    );
  }

  if (isTs) {
    rawFiles.push({
      id: 'file-tsconfig',
      originalPath: 'tsconfig.json',
      category: 'config',
      conventionExempt: true,
      description: 'TypeScript compiler configuration',
    });
  }

  if (config.devTools.includes('eslint')) {
    rawFiles.push({
      id: 'file-eslint',
      originalPath: 'eslint.config.js',
      category: 'config',
      conventionExempt: true,
      description: 'ESLint flat rules configuration',
    });
  }

  if (config.devTools.includes('prettier')) {
    rawFiles.push({
      id: 'file-prettier',
      originalPath: '.prettierrc',
      category: 'config',
      conventionExempt: true,
      description: 'Prettier formatting rules',
    });
  }

  if (config.devTools.includes('biome')) {
    rawFiles.push({
      id: 'file-biome',
      originalPath: 'biome.json',
      category: 'config',
      conventionExempt: true,
      description: 'Biome linter & formatter configuration',
    });
  }

  if (config.testing === 'vitest') {
    rawFiles.push(
      {
        id: 'file-vitest-cfg',
        originalPath: `vitest.config.${extScript}`,
        category: 'config',
        conventionExempt: true,
        description: 'Vitest test runner configuration',
      },
      {
        id: 'file-unit-test',
        originalPath: `src/App.test.${extScript === 'ts' ? 'tsx' : 'jsx'}`,
        category: 'test',
        description: 'Baseline component unit test',
      }
    );
  } else if (config.testing === 'playwright') {
    rawFiles.push(
      {
        id: 'file-pw-cfg',
        originalPath: `playwright.config.${extScript}`,
        category: 'config',
        conventionExempt: true,
        description: 'Playwright browser E2E suite config',
      },
      {
        id: 'file-e2e-test',
        originalPath: `tests/smoke.spec.${extScript}`,
        category: 'test',
        description: 'End-to-end smoke test suite',
      }
    );
  }

  if (config.selectedPackageIds.includes('react-router')) {
    rawFiles.push({
      id: 'file-router',
      originalPath: `src/router.${extScript === 'ts' ? 'tsx' : 'jsx'}`,
      category: 'source',
      description: 'Application route manifest',
    });
  }

  if (config.selectedPackageIds.includes('shadcn-ui')) {
    rawFiles.push({
      id: 'file-cn-utils',
      originalPath: `src/lib/utils.${extScript}`,
      category: 'source',
      description: 'Class-name merge helper for UI primitives',
    });
  }

  return rawFiles.map((file) => {
    const override = config.fileRenameOverrides[file.originalPath];
    const computedDefault = computeConventionTargetPath(file.originalPath, config);
    return {
      ...file,
      targetPath: override ?? computedDefault,
    };
  });
}

export function getPendingFileRenames(
  config: ProjectConfig
): Array<{ from: string; to: string; category: ScaffoldFileEntry['category'] }> {
  return buildScaffoldManifest(config)
    .filter((f) => f.targetPath !== f.originalPath)
    .map((f) => ({
      from: f.originalPath,
      to: f.targetPath,
      category: f.category,
    }));
}

export function validateProjectCompatibility(config: ProjectConfig): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(config.projectName.trim())) {
    issues.push({
      id: 'invalid-name',
      severity: 'error',
      title: 'Invalid package identifier',
      detail: 'Project name must be a valid npm-compatible folder name without spaces or leading punctuation.',
      affectedControl: 'Project Name',
      suggestedFix: 'Use lowercase letters, numbers, dots, underscores, or hyphens.',
    });
  }

  if (config.framework === 'vite' && config.compiler === 'swc' && config.viteUiFramework !== 'react') {
    issues.push({
      id: 'swc-non-react',
      severity: 'warning',
      title: 'SWC template limited to React',
      detail: `Vite’s official create-vite SWC preset targets React. ${config.viteUiFramework.toUpperCase()} uses the standard Vite compiler plugin.`,
      affectedControl: 'Build Configuration',
      suggestedFix: 'Switch Build Configuration to Standard compiler or select React.',
    });
  }

  if (config.framework !== 'vite' && config.framework !== 'nextjs' && config.compiler === 'swc') {
    issues.push({
      id: 'swc-unsupported-framework',
      severity: 'warning',
      title: 'SWC not applicable for selected framework',
      detail: `${FRAMEWORKS.find((f) => f.id === config.framework)?.name} manages its own Vite/compiler pipeline and ignores --template swc.`,
      affectedControl: 'Build Configuration',
      suggestedFix: 'Select Standard compiler for accurate CLI output.',
    });
  }

  if (config.runtime === 'bun' && config.packageManager === 'yarn') {
    issues.push({
      id: 'bun-yarn-mismatch',
      severity: 'warning',
      title: 'Runtime & package manager mismatch',
      detail: 'Bun runtime selected alongside Yarn. Yarn Berry PnP scripts can require Node.js Corepack shims.',
      affectedControl: 'Package Manager',
      suggestedFix: 'Switch package manager to Bun or runtime to Node.js.',
    });
  }

  if (config.runtime === 'deno' && config.packageManager === 'pnpm') {
    issues.push({
      id: 'deno-pnpm-mismatch',
      severity: 'warning',
      title: 'Deno uses native npm/jsr resolution',
      detail: 'Deno 2 does not execute pnpm lifecycle hooks natively unless Node.js is also present on PATH.',
      affectedControl: 'Runtime Selector',
      suggestedFix: 'Switch runtime to Node.js for pnpm workspaces.',
    });
  }

  if (config.devTools.includes('biome') && (config.devTools.includes('eslint') || config.devTools.includes('prettier'))) {
    issues.push({
      id: 'biome-eslint-overlap',
      severity: 'warning',
      title: 'Overlapping linter & formatter rules',
      detail: 'Biome already handles linting and formatting. Running ESLint + Prettier alongside Biome may produce conflicting IDE diagnostics.',
      affectedControl: 'Development Tools',
      suggestedFix: 'Use either Biome alone or ESLint + Prettier.',
    });
  }

  if (config.devPort === config.previewPort) {
    issues.push({
      id: 'port-collision',
      severity: 'error',
      title: 'Dev and Preview port collision',
      detail: `Both dev server and preview server are assigned port ${config.devPort}.`,
      affectedControl: 'Port Assignment',
      suggestedFix: 'Adjust Preview Port rotary control to a distinct port (e.g. 4173).',
    });
  }

  if (config.framework === 'nextjs' && config.selectedPackageIds.includes('react-router')) {
    issues.push({
      id: 'nextjs-react-router',
      severity: 'warning',
      title: 'Router conflict with Next.js App Router',
      detail: 'Next.js provides built-in file-system routing. Adding react-router is generally redundant.',
      affectedControl: 'Package Tray',
      suggestedFix: 'Remove React Router from package tray when targeting Next.js.',
    });
  }

  // Validate bulk-renamed scaffold manifest against target directory naming conventions
  const manifest = buildScaffoldManifest(config);
  const invalidPaths = manifest.filter(
    (f) =>
      !f.targetPath.trim() ||
      f.targetPath.startsWith('/') ||
      f.targetPath.includes('..') ||
      /\s/.test(f.targetPath)
  );
  if (invalidPaths.length > 0) {
    issues.push({
      id: 'invalid-rename-path',
      severity: 'error',
      title: 'Invalid target file path',
      detail: `${invalidPaths.length} file path(s) contain whitespace, leading slashes, or relative traversal ("..").`,
      affectedControl: 'Bulk File Rename',
      suggestedFix: 'Reset invalid rename overrides to valid relative paths.',
    });
  }

  const targetCounts = new Map<string, number>();
  for (const f of manifest) {
    targetCounts.set(f.targetPath, (targetCounts.get(f.targetPath) ?? 0) + 1);
  }
  const collisions = Array.from(targetCounts.entries()).filter(([, count]) => count > 1);
  if (collisions.length > 0) {
    issues.push({
      id: 'rename-path-collision',
      severity: 'error',
      title: 'Target file path collision',
      detail: `Multiple files map to the same path: ${collisions.map(([p]) => p).join(', ')}.`,
      affectedControl: 'Bulk File Rename',
      suggestedFix: 'Clear conflicting rename overrides so every target file path is unique.',
    });
  }

  const nonCompliant = manifest.filter(
    (f) => !matchesNamingConvention(f.targetPath, config.directoryNamingConvention, f.conventionExempt)
  );
  if (nonCompliant.length > 0) {
    issues.push({
      id: 'naming-convention-mismatch',
      severity: 'warning',
      title: `${nonCompliant.length} file(s) deviate from ${config.directoryNamingConvention}`,
      detail: `Files (${nonCompliant
        .slice(0, 2)
        .map((f) => f.targetPath)
        .join(', ')}${nonCompliant.length > 2 ? ', …' : ''}) do not match the selected directory naming convention.`,
      affectedControl: 'Directory Naming Convention',
      suggestedFix: `Align all project files to ${config.directoryNamingConvention}.`,
    });
  }

  return issues;
}

export function buildExecutionPlan(
  config: ProjectConfig,
  packages: StudioPackage[] = STUDIO_PACKAGES,
  shellTarget: 'zsh' | 'bash' | 'powershell' = 'zsh'
): ExecutionCommandStep[] {
  const safeName = config.projectName.trim() || 'new-project';
  const pm = config.packageManager;
  const steps: ExecutionCommandStep[] = [];

  const pkgVer = (id: string): string | undefined => packages.find((p) => p.id === id)?.version;
  const pinIfNonDefault = (id: string, npmName: string): string => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return npmName;
    const isLatest = pkg.version === pkg.availableVersions[0];
    return isLatest ? npmName : `${npmName}@${pkg.version}`;
  };

  const createCmdPrefix =
    pm === 'npm'
      ? 'npm create'
      : pm === 'pnpm'
      ? 'pnpm create'
      : pm === 'yarn'
      ? 'yarn create'
      : 'bun create';

  const execPrefix =
    pm === 'npm'
      ? 'npx'
      : pm === 'pnpm'
      ? 'pnpm dlx'
      : pm === 'yarn'
      ? 'yarn dlx'
      : 'bunx';

  const addDevCmd =
    pm === 'npm'
      ? 'npm install -D'
      : pm === 'pnpm'
      ? 'pnpm add -D'
      : pm === 'yarn'
      ? 'yarn add -D'
      : 'bun add -D';

  const addProdCmd =
    pm === 'npm'
      ? 'npm install'
      : pm === 'pnpm'
      ? 'pnpm add'
      : pm === 'yarn'
      ? 'yarn add'
      : 'bun add';

  const chainJoin = shellTarget === 'powershell' ? '; ' : ' && ';

  // Step 1: Scaffold command
  let scaffoldCmd = '';
  let scaffoldDesc = '';

  if (config.framework === 'vite') {
    const useSwc = config.compiler === 'swc' && config.viteUiFramework === 'react';
    const baseTpl = config.viteUiFramework;
    const swcPart = useSwc ? '-swc' : '';
    const tsPart = config.language === 'typescript' ? '-ts' : '';
    const template = `${baseTpl}${swcPart}${tsPart}`;
    const npmDoubleDash = pm === 'npm' ? ' --' : '';
    scaffoldCmd = `${createCmdPrefix} vite ${safeName}${npmDoubleDash} --template ${template}`;
    scaffoldDesc = `Scaffold Vite project using template "${template}"`;
  } else if (config.framework === 'nextjs') {
    const tsFlag = config.language === 'typescript' ? '--ts' : '--js';
    const twFlag = config.styling === 'tailwind' ? '--tailwind' : '--no-tailwind';
    const eslintFlag = config.devTools.includes('eslint') ? '--eslint' : '--no-eslint';
    const pmFlag = `--use-${pm}`;
    scaffoldCmd = `${createCmdPrefix} next-app ${safeName} ${tsFlag} ${twFlag} ${eslintFlag} --app --src-dir ${pmFlag}`;
    scaffoldDesc = 'Scaffold Next.js 15 App Router workspace';
  } else if (config.framework === 'astro') {
    const tsFlag = config.language === 'typescript' ? '--typescript strict' : '--no-typescript';
    scaffoldCmd = `${createCmdPrefix} astro ${safeName} --template minimal ${tsFlag} --no-install`;
    scaffoldDesc = 'Scaffold Astro minimal workspace';
  } else if (config.framework === 'vue') {
    const tsFlag = config.language === 'typescript' ? '--ts' : '';
    const vitestFlag = config.testing === 'vitest' ? '--vitest' : '';
    const eslintFlag = config.devTools.includes('eslint') ? '--eslint' : '';
    const parts = [tsFlag, vitestFlag, eslintFlag].filter(Boolean).join(' ');
    scaffoldCmd = `${createCmdPrefix} vue ${safeName}${parts ? ` -- ${parts}` : ''}`;
    scaffoldDesc = 'Scaffold official Vue 3 project via create-vue';
  } else {
    const tsFlag = config.language === 'typescript' ? '--types ts' : '--types jsdoc';
    scaffoldCmd = `${execPrefix} sv create ${safeName} --template minimal ${tsFlag} --no-install`;
    scaffoldDesc = 'Scaffold SvelteKit workspace via sv CLI';
  }

  steps.push({
    id: 'step-scaffold',
    phase: 'Scaffold',
    label: `Scaffold ${FRAMEWORKS.find((f) => f.id === config.framework)?.name} project`,
    command: scaffoldCmd,
    description: scaffoldDesc,
    estimatedSec: 4,
  });

  steps.push({
    id: 'step-cd',
    phase: 'Configure',
    label: 'Enter workspace directory',
    command: `cd ${config.directory.replace(/\/$/, '')}/${safeName}`,
    description: `Set working directory to ${safeName}`,
    estimatedSec: 1,
  });

  const pendingRenames = getPendingFileRenames(config);
  if (pendingRenames.length > 0) {
    const targetDirs = Array.from(
      new Set(
        pendingRenames
          .map((r) => {
            const idx = r.to.lastIndexOf('/');
            return idx === -1 ? '' : r.to.slice(0, idx);
          })
          .filter(Boolean)
      )
    );
    const mkdirCmd =
      targetDirs.length > 0
        ? shellTarget === 'powershell'
          ? `New-Item -ItemType Directory -Force -Path ${targetDirs.join(', ')}${chainJoin}`
          : `mkdir -p ${targetDirs.join(' ')}${chainJoin}`
        : '';
    const mvCmds = pendingRenames.map((r) => `mv ${r.from} ${r.to}`).join(chainJoin);
    steps.push({
      id: 'step-bulk-rename',
      phase: 'Configure',
      label: `Align & bulk-rename ${pendingRenames.length} scaffold file${pendingRenames.length > 1 ? 's' : ''}`,
      command: `${mkdirCmd}${mvCmds}`,
      description: `Restructure generated files to match ${config.directoryLayoutMode} layout and ${config.directoryNamingConvention} naming convention`,
      estimatedSec: 2,
    });
  }

  if (config.installDependencies) {
    const installCmd =
      pm === 'npm'
        ? `npm install --fetch-timeout=${config.networkTimeoutSec * 1000}`
        : pm === 'pnpm'
        ? `pnpm install --network-timeout=${config.networkTimeoutSec * 1000}`
        : pm === 'yarn'
        ? 'yarn install'
        : 'bun install';

    steps.push({
      id: 'step-install',
      phase: 'Dependencies',
      label: `Install base dependencies (${pm})`,
      command: installCmd,
      description: `Resolve lockfile and install base framework packages using ${pm}`,
      estimatedSec: 7,
    });
  }

  // Styling packages (for non-Next or non-auto setups)
  if (config.styling === 'tailwind' && config.framework !== 'nextjs') {
    const chosenTw = pkgVer('tailwindcss');
    const useV3 = config.tailwindVersion === '3.4' || (chosenTw && chosenTw.startsWith('3.'));
    const twPkg = useV3
      ? `tailwindcss@${chosenTw?.startsWith('3.') ? chosenTw : '^3.4'} postcss autoprefixer`
      : `${pinIfNonDefault('tailwindcss', 'tailwindcss')} @tailwindcss/vite`;
    steps.push({
      id: 'step-styling',
      phase: 'Dependencies',
      label: `Install Tailwind CSS v${useV3 ? '3.4' : config.tailwindVersion}`,
      command: `${addDevCmd} ${twPkg}`,
      description: useV3
        ? 'Install Tailwind CSS v3 with PostCSS and Autoprefixer'
        : 'Install Tailwind CSS v4 engine and Vite plugin',
      estimatedSec: 4,
    });
  } else if (config.styling === 'sass') {
    steps.push({
      id: 'step-styling',
      phase: 'Dependencies',
      label: 'Install Sass preprocessor',
      command: `${addDevCmd} sass-embedded`,
      description: 'Install Dart Sass embedded compiler for SCSS stylesheets',
      estimatedSec: 3,
    });
  } else {
    const stylingPackages: Partial<Record<StylingId, { label: string; spec: string }>> = {
      bootstrap: { label: 'Install Bootstrap', spec: 'bootstrap' },
      mui: { label: 'Install Material UI', spec: '@mui/material @emotion/react @emotion/styled' },
      'ui-sdk': { label: 'Install Microsoft UI SDK', spec: '@ui-sdk/core @ui-sdk/react' },
      chakra: { label: 'Install Chakra UI', spec: '@chakra-ui/react @emotion/react' },
      daisyui: { label: 'Install daisyUI', spec: 'daisyui' },
      'ant-design': { label: 'Install Ant Design', spec: 'antd' },
      bulma: { label: 'Install Bulma', spec: 'bulma' },
      'prime-react': { label: 'Install PrimeReact', spec: 'primereact primeicons' },
    };
    const stylingPackage = stylingPackages[config.styling];
    if (stylingPackage) {
      steps.push({
        id: 'step-styling',
        phase: 'Dependencies',
        label: stylingPackage.label,
        command: `${addProdCmd} ${stylingPackage.spec}`,
        description: `${stylingPackage.label.replace('Install ', '')} component system`,
        estimatedSec: 4,
      });
    }
  }

  // Dev tools
  const devToolPackages: string[] = [];
  if (config.devTools.includes('eslint') && config.framework !== 'nextjs') {
    devToolPackages.push(
      pinIfNonDefault('eslint', 'eslint'),
      '@eslint/js',
      ...(config.language === 'typescript' ? ['typescript-eslint'] : [])
    );
  }
  if (config.devTools.includes('prettier')) {
    devToolPackages.push(
      pinIfNonDefault('prettier', 'prettier'),
      ...(config.styling === 'tailwind' ? ['prettier-plugin-tailwindcss'] : [])
    );
  }
  if (config.devTools.includes('biome')) {
    devToolPackages.push(pinIfNonDefault('biome', '@biomejs/biome'));
  }

  if (devToolPackages.length > 0) {
    steps.push({
      id: 'step-devtools',
      phase: 'Tooling',
      label: `Configure ${config.devTools.join(' + ')}`,
      command: `${addDevCmd} ${devToolPackages.join(' ')}`,
      description: 'Install static analysis and formatting toolchain',
      estimatedSec: 4,
    });
  }

  // Testing
  if (config.testing === 'vitest') {
    steps.push({
      id: 'step-testing',
      phase: 'Tooling',
      label: 'Configure Vitest unit testing',
      command: `${addDevCmd} ${pinIfNonDefault('vitest', 'vitest')} jsdom`,
      description: 'Add Vitest runner and DOM test environment',
      estimatedSec: 4,
    });
  } else if (config.testing === 'playwright') {
    steps.push({
      id: 'step-testing',
      phase: 'Tooling',
      label: 'Configure Playwright E2E suite',
      command: `${addDevCmd} ${pinIfNonDefault('playwright', '@playwright/test')}${chainJoin}${execPrefix} playwright install chromium`,
      description: 'Install Playwright test runner and Chromium binary',
      estimatedSec: 8,
    });
  }

  // Optional package add-ons selected in the project setup flow.
  const coreManagedPkgIds = new Set([
    'tailwindcss',
    'typescript',
    'eslint',
    'prettier',
    'biome',
    'vitest',
    'playwright',
    'shadcn-ui',
  ]);
  const extraProdPkgs: string[] = [];
  const extraDevPkgs: string[] = [];

  for (const pkgId of config.selectedPackageIds) {
    if (coreManagedPkgIds.has(pkgId)) continue;
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) continue;
    const spec = pinIfNonDefault(pkg.id, pkg.npmName);
    if (pkg.isDevDependency) {
      extraDevPkgs.push(spec);
    } else {
      extraProdPkgs.push(spec);
    }
  }

  if (config.selectedPackageIds.includes('shadcn-ui')) {
    extraProdPkgs.push('clsx', 'tailwind-merge');
  }

  if (extraProdPkgs.length > 0) {
    steps.push({
      id: 'step-extra-pkgs',
      phase: 'Dependencies',
      label: `Install runtime libraries (${extraProdPkgs.length})`,
      command: `${addProdCmd} ${extraProdPkgs.join(' ')}`,
      description: `Add ${extraProdPkgs.join(', ')} to dependencies`,
      estimatedSec: 3,
    });
  }

  if (extraDevPkgs.length > 0) {
    steps.push({
      id: 'step-extra-dev-pkgs',
      phase: 'Tooling',
      label: `Install dev packages (${extraDevPkgs.length})`,
      command: `${addDevCmd} ${extraDevPkgs.join(' ')}`,
      description: `Add ${extraDevPkgs.join(', ')} to devDependencies`,
      estimatedSec: 3,
    });
  }

  if (config.selectedPackageIds.includes('shadcn-ui')) {
    steps.push({
      id: 'step-shadcn',
      phase: 'Configure',
      label: 'Initialise shadcn/ui primitives',
      command: `${execPrefix} ${pinIfNonDefault('shadcn-ui', 'shadcn')} init -d`,
      description: 'Generate components.json and theme CSS variables',
      estimatedSec: 4,
    });
  }

  if (config.initGit) {
    steps.push({
      id: 'step-git',
      phase: 'Repository',
      label: 'Initialise Git repository',
      command: `git init${chainJoin}git add -A${chainJoin}git commit -m "chore: scaffold via Visual Line Interface"`,
      description: 'Create clean initial commit on main branch',
      estimatedSec: 2,
    });
  }

  const heapPrefix =
    pm === 'bun'
      ? ''
      : shellTarget === 'powershell'
      ? `$env:NODE_OPTIONS="--max-old-space-size=${config.memoryLimitMb}"; `
      : `NODE_OPTIONS="--max-old-space-size=${config.memoryLimitMb}" `;

  const runDevCmd =
    pm === 'npm'
      ? `${heapPrefix}npm run dev -- --port ${config.devPort}`
      : pm === 'pnpm'
      ? `${heapPrefix}pnpm dev --port ${config.devPort}`
      : pm === 'yarn'
      ? `${heapPrefix}yarn dev --port ${config.devPort}`
      : `bun run dev --port ${config.devPort}`;

  steps.push({
    id: 'step-verify',
    phase: 'Verify',
    label: `Launch dev server on :${config.devPort}`,
    command: runDevCmd,
    description: `Verify build pipeline with ${config.memoryLimitMb}MB heap limit on port ${config.devPort}`,
    estimatedSec: 2,
  });

  return steps;
}

export function buildGeneratedPackageJson(
  config: ProjectConfig,
  packages: StudioPackage[]
): string {
  const pkgVer = (id: string, fallback: string) =>
    `^${packages.find((p) => p.id === id)?.version ?? fallback}`;

  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};

  if (config.framework === 'vite') {
    if (config.viteUiFramework === 'react') {
      dependencies.react = '^19.0.0';
      dependencies['react-dom'] = '^19.0.0';
    } else if (config.viteUiFramework === 'vue') {
      dependencies.vue = '^3.5.13';
    } else if (config.viteUiFramework === 'svelte') {
      devDependencies.svelte = '^5.20.0';
    } else if (config.viteUiFramework === 'solid') {
      dependencies['solid-js'] = '^1.9.5';
    }
    devDependencies.vite = '^6.2.0';
  } else if (config.framework === 'nextjs') {
    dependencies.next = '^15.2.3';
    dependencies.react = '^19.0.0';
    dependencies['react-dom'] = '^19.0.0';
  } else if (config.framework === 'astro') {
    dependencies.astro = '^5.5.2';
  } else if (config.framework === 'vue') {
    dependencies.vue = '^3.5.13';
    devDependencies.vite = '^6.2.0';
  } else {
    devDependencies['@sveltejs/kit'] = '^2.19.0';
    devDependencies.svelte = '^5.20.0';
  }

  if (config.selectedPackageIds.includes('react-router')) {
    dependencies['react-router'] = pkgVer('react-router', '7.4.0');
  }
  if (config.selectedPackageIds.includes('lucide-react')) {
    dependencies['lucide-react'] = pkgVer('lucide-react', '0.483.0');
  }
  if (config.selectedPackageIds.includes('shadcn-ui')) {
    dependencies.clsx = '^2.1.1';
    dependencies['tailwind-merge'] = '^3.0.2';
  }

  const coreManagedPkgIds = new Set([
    'tailwindcss',
    'typescript',
    'eslint',
    'prettier',
    'biome',
    'vitest',
    'playwright',
    'shadcn-ui',
  ]);
  for (const pkgId of config.selectedPackageIds) {
    if (coreManagedPkgIds.has(pkgId)) continue;
    const pkg = packages.find((p) => p.id === pkgId);
    if (!pkg) continue;
    if (pkg.isDevDependency) {
      devDependencies[pkg.npmName] = `^${pkg.version}`;
    } else {
      dependencies[pkg.npmName] = `^${pkg.version}`;
    }
  }

  if (config.language === 'typescript') {
    devDependencies.typescript = pkgVer('typescript', '5.8.2');
  }
  if (config.styling === 'tailwind') {
    devDependencies.tailwindcss = pkgVer('tailwindcss', '4.1.0');
    if (config.tailwindVersion === '4.1' && config.framework === 'vite') {
      devDependencies['@tailwindcss/vite'] = '^4.1.0';
    }
  } else if (config.styling === 'sass') {
    devDependencies['sass-embedded'] = '^1.85.1';
  } else {
    if (config.styling === 'bootstrap') dependencies.bootstrap = '^5.3.8';
    if (config.styling === 'mui') {
      dependencies['@mui/material'] = '^7.3.7';
      dependencies['@emotion/react'] = '^11.14.0';
      dependencies['@emotion/styled'] = '^11.14.1';
    }
    if (config.styling === 'ui-sdk') {
      dependencies['@ui-sdk/core'] = '0.1.0-beta.17';
      dependencies['@ui-sdk/react'] = '0.1.0-beta.17';
    }
    if (config.styling === 'chakra') {
      dependencies['@chakra-ui/react'] = '^3.30.0';
      dependencies['@emotion/react'] = '^11.14.0';
    }
    if (config.styling === 'daisyui') devDependencies.daisyui = '^5.1.8';
    if (config.styling === 'ant-design') dependencies.antd = '^5.27.6';
    if (config.styling === 'bulma') dependencies.bulma = '^1.0.4';
    if (config.styling === 'prime-react') {
      dependencies.primereact = '^10.9.7';
      dependencies.primeicons = '^7.0.0';
    }
  }

  if (config.devTools.includes('eslint')) {
    devDependencies.eslint = pkgVer('eslint', '9.22.0');
  }
  if (config.devTools.includes('prettier')) {
    devDependencies.prettier = pkgVer('prettier', '3.5.3');
  }
  if (config.devTools.includes('biome')) {
    devDependencies['@biomejs/biome'] = pkgVer('biome', '1.9.4');
  }
  if (config.testing === 'vitest') {
    devDependencies.vitest = pkgVer('vitest', '3.0.9');
  } else if (config.testing === 'playwright') {
    devDependencies['@playwright/test'] = pkgVer('playwright', '1.51.1');
  }

  const scripts: Record<string, string> = {
    dev:
      config.framework === 'nextjs'
        ? `next dev -p ${config.devPort}`
        : `vite --port ${config.devPort}`,
    build: config.framework === 'nextjs' ? 'next build' : 'vite build',
    preview: `vite preview --port ${config.previewPort}`,
  };

  if (config.devTools.includes('eslint')) scripts.lint = 'eslint .';
  if (config.devTools.includes('biome')) scripts.check = 'biome check .';
  if (config.testing === 'vitest') scripts.test = 'vitest';
  if (config.testing === 'playwright') scripts['test:e2e'] = 'playwright test';

  return JSON.stringify(
    {
      name: config.projectName.trim() || 'new-project',
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts,
      dependencies,
      devDependencies,
    },
    null,
    2
  );
}

export function buildScaffoldConfigFiles(
  config: ProjectConfig,
  packages: StudioPackage[] = STUDIO_PACKAGES
): GeneratedConfigFile[] {
  const isTs = config.language === 'typescript';
  const extScript = isTs ? 'ts' : 'js';
  const manifest = buildScaffoldManifest(config);
  const files: GeneratedConfigFile[] = [];

  files.push({
    id: 'cfg-package-json',
    filePath: 'package.json',
    language: 'json',
    summary: 'Project manifest, scripts, and pinned dependency tree',
    content: buildGeneratedPackageJson(config, packages),
  });

  // 1. Framework / Bundler configuration
  if (config.framework === 'vite' || config.framework === 'vue') {
    const ui = config.framework === 'vue' ? 'vue' : config.viteUiFramework;
    const useSwc = config.compiler === 'swc' && ui === 'react';
    const useTailwindV4Plugin = config.styling === 'tailwind' && config.tailwindVersion === '4.1';

    const imports: string[] = ["import { defineConfig } from 'vite';"];
    const plugins: string[] = [];

    if (ui === 'react') {
      imports.push(
        useSwc
          ? "import react from '@vitejs/plugin-react-swc';"
          : "import react from '@vitejs/plugin-react';"
      );
      plugins.push('react()');
    } else if (ui === 'vue') {
      imports.push("import vue from '@vitejs/plugin-vue';");
      plugins.push('vue()');
    } else if (ui === 'svelte') {
      imports.push("import { svelte } from '@sveltejs/vite-plugin-svelte';");
      plugins.push('svelte()');
    } else if (ui === 'solid') {
      imports.push("import solid from 'vite-plugin-solid';");
      plugins.push('solid()');
    }

    if (useTailwindV4Plugin) {
      imports.push("import tailwindcss from '@tailwindcss/vite';");
      plugins.push('tailwindcss()');
    }

    files.push({
      id: 'cfg-vite',
      filePath: `vite.config.${extScript}`,
      language: isTs ? 'typescript' : 'javascript',
      summary: `Vite config (${ui}${useSwc ? ' + SWC' : ''}) on :${config.devPort} / preview :${config.previewPort}`,
      content: `${imports.join('\n')}\n\nexport default defineConfig({\n  plugins: [${plugins.join(', ')}],\n  server: {\n    port: ${config.devPort},\n    strictPort: true,\n  },\n  preview: {\n    port: ${config.previewPort},\n  },\n});\n`,
    });
  } else if (config.framework === 'nextjs') {
    const nextFile = isTs ? 'next.config.ts' : 'next.config.mjs';
    files.push({
      id: 'cfg-next',
      filePath: nextFile,
      language: isTs ? 'typescript' : 'javascript',
      summary: 'Next.js 15 App Router configuration',
      content: isTs
        ? `import type { NextConfig } from 'next';\n\nconst nextConfig: NextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;\n`
        : `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n};\n\nexport default nextConfig;\n`,
    });
  } else if (config.framework === 'astro') {
    const astroTailwind = config.styling === 'tailwind' ? "import tailwindcss from '@tailwindcss/vite';\n" : '';
    const viteBlock =
      config.styling === 'tailwind'
        ? '  vite: {\n    plugins: [tailwindcss()],\n  },\n'
        : '';
    files.push({
      id: 'cfg-astro',
      filePath: 'astro.config.mjs',
      language: 'javascript',
      summary: `Astro 5 configuration bound to :${config.devPort}`,
      content: `import { defineConfig } from 'astro/config';\n${astroTailwind}\nexport default defineConfig({\n  server: { port: ${config.devPort} },\n${viteBlock}});\n`,
    });
  } else {
    files.push({
      id: 'cfg-sveltekit',
      filePath: 'svelte.config.js',
      language: 'javascript',
      summary: 'SvelteKit adapter and vitePreprocess configuration',
      content: `import adapter from '@sveltejs/adapter-auto';\nimport { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\n\n/** @type {import('@sveltejs/kit').Config} */\nconst config = {\n  preprocess: vitePreprocess(),\n  kit: {\n    adapter: adapter(),\n  },\n};\n\nexport default config;\n`,
    });
  }

  // 2. TypeScript / JavaScript compiler configuration
  if (isTs) {
    files.push({
      id: 'cfg-tsconfig',
      filePath: 'tsconfig.json',
      language: 'json',
      summary: `TypeScript configuration (strict: ${config.strictTypeScript})`,
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            useDefineForClassFields: true,
            module: 'ESNext',
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: 'force',
            noEmit: true,
            jsx: config.viteUiFramework === 'solid' ? 'preserve' : 'react-jsx',
            strict: config.strictTypeScript,
            noUnusedLocals: config.strictTypeScript,
            noUnusedParameters: config.strictTypeScript,
          },
          include: ['src'],
        },
        null,
        2
      ),
    });
  } else {
    files.push({
      id: 'cfg-jsconfig',
      filePath: 'jsconfig.json',
      language: 'json',
      summary: 'JavaScript ESM path resolution configuration',
      content: JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            baseUrl: '.',
            paths: {
              '@/*': ['./src/*'],
            },
          },
          include: ['src'],
        },
        null,
        2
      ),
    });
  }

  // 3. Root Stylesheet matching bulk-renamed target path
  const styleEntry = manifest.find((m) => m.category === 'style');
  if (styleEntry) {
    let styleContent = '';
    if (config.styling === 'tailwind') {
      styleContent =
        config.tailwindVersion === '4.1'
          ? `@import "tailwindcss";\n\n@layer base {\n  :root {\n    color-scheme: dark;\n  }\n}\n`
          : `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
    } else if (config.styling === 'sass') {
      styleContent = `$surface-bg: #101214;\n$text-primary: #f1f3f5;\n$accent: #c7a46a;\n\n:root {\n  background-color: $surface-bg;\n  color: $text-primary;\n}\n`;
    } else {
      styleContent = `:root {\n  --surface-bg: #101214;\n  --text-primary: #f1f3f5;\n  --accent: #c7a46a;\n}\n\nbody {\n  margin: 0;\n  background-color: var(--surface-bg);\n  color: var(--text-primary);\n}\n`;
    }
    files.push({
      id: 'cfg-stylesheet',
      filePath: styleEntry.targetPath,
      language: 'css',
      summary: `Stylesheet target mapped to ${styleEntry.targetPath}`,
      content: styleContent,
    });
  }

  // 4. Linter & Formatter configs
  if (config.devTools.includes('biome')) {
    files.push({
      id: 'cfg-biome',
      filePath: 'biome.json',
      language: 'json',
      summary: 'Unified Biome linter and formatter schema',
      content: JSON.stringify(
        {
          $schema: 'https://biomejs.dev/schemas/1.9.4/schema.json',
          organizeImports: { enabled: true },
          linter: { enabled: true, rules: { recommended: true } },
          formatter: { enabled: true, indentStyle: 'space', indentWidth: 2 },
        },
        null,
        2
      ),
    });
  }

  if (config.devTools.includes('eslint')) {
    files.push({
      id: 'cfg-eslint',
      filePath: 'eslint.config.js',
      language: 'javascript',
      summary: 'ESLint v9 flat configuration',
      content: `import js from '@eslint/js';\n${isTs ? "import tseslint from 'typescript-eslint';\n" : ''}\nexport default [\n  { ignores: ['dist', 'node_modules'] },\n  js.configs.recommended,\n${isTs ? '  ...tseslint.configs.recommended,\n' : ''}];\n`,
    });
  }

  if (config.devTools.includes('prettier')) {
    const prettierConfig: Record<string, unknown> = {
      semi: true,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: 'es5',
    };
    if (config.styling === 'tailwind') {
      prettierConfig.plugins = ['prettier-plugin-tailwindcss'];
    }
    files.push({
      id: 'cfg-prettier',
      filePath: '.prettierrc',
      language: 'json',
      summary: 'Prettier deterministic code formatting rules',
      content: JSON.stringify(prettierConfig, null, 2),
    });
  }

  // 5. Testing runner configuration
  if (config.testing === 'vitest') {
    files.push({
      id: 'cfg-vitest',
      filePath: `vitest.config.${extScript}`,
      language: isTs ? 'typescript' : 'javascript',
      summary: 'Vitest jsdom test runner configuration',
      content: `import { defineConfig } from 'vitest/config';\n\nexport default defineConfig({\n  test: {\n    environment: 'jsdom',\n    globals: true,\n  },\n});\n`,
    });
  } else if (config.testing === 'playwright') {
    files.push({
      id: 'cfg-playwright',
      filePath: `playwright.config.${extScript}`,
      language: isTs ? 'typescript' : 'javascript',
      summary: `Playwright E2E configuration pointing at :${config.devPort}`,
      content: `import { defineConfig } from '@playwright/test';\n\nexport default defineConfig({\n  testDir: './tests',\n  use: {\n    baseURL: 'http://localhost:${config.devPort}',\n    trace: 'on-first-retry',\n  },\n  webServer: {\n    command: '${config.packageManager} run dev',\n    url: 'http://localhost:${config.devPort}',\n    reuseExistingServer: true,\n  },\n});\n`,
    });
  }

  return files;
}


