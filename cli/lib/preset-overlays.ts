/**
 * Preset overlays - apply preset-specific dependencies and configurations.
 * 
 * Presets extend base scaffolds without forking them. When a preset is applied,
 * it adds or overrides dependencies, devDependencies, and scripts.
 */
import type { TemplateVariables } from './template-renderer.js';

export interface PackageJsonOverlay {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
}

/**
 * Apply preset overlays to a package.json object.
 */
export function applyPresetToPackageJson(
  pkg: Record<string, any>,
  preset: string,
  stackKey: string
): Record<string, any> {
  const overlay = getPackageJsonOverlay(preset, stackKey);
  
  if (overlay.dependencies) {
    pkg.dependencies = { ...pkg.dependencies, ...overlay.dependencies };
  }
  
  if (overlay.devDependencies) {
    pkg.devDependencies = { ...pkg.devDependencies, ...overlay.devDependencies };
  }
  
  if (overlay.scripts) {
    pkg.scripts = { ...pkg.scripts, ...overlay.scripts };
  }
  
  return pkg;
}

/**
 * Get package.json overlay for a specific preset and stack.
 */
function getPackageJsonOverlay(preset: string, stackKey: string): PackageJsonOverlay {
  if (preset === 'nigel-react') {
    return getNigelReactOverlay(stackKey);
  }
  
  return {};
}

/**
 * Nigel React preset: TanStack Query + Zustand + Tailwind + Vitest + Playwright
 */
function getNigelReactOverlay(stackKey: string): PackageJsonOverlay {
  const overlay: PackageJsonOverlay = {
    dependencies: {
      '@tanstack/react-query': '^5.0.0',
    },
    devDependencies: {
      'tailwindcss': '^3.4.0',
      'postcss': '^8.4.0',
      'autoprefixer': '^10.4.0',
      'vitest': '^1.0.0',
      '@vitest/ui': '^1.0.0',
      'playwright': '^1.40.0',
      '@playwright/test': '^1.40.0',
    },
  };

  if (stackKey === 'nextjs') {
    overlay.dependencies = {
      ...overlay.dependencies,
      'zustand': '^4.5.0',
    };
  } else if (stackKey === 'sveltekit') {
    // SvelteKit uses built-in stores, TanStack Query already added
    overlay.dependencies = {
      ...overlay.dependencies,
      '@tanstack/svelte-query': '^5.0.0',
    };
    // Remove React Query for SvelteKit
    delete overlay.dependencies['@tanstack/react-query'];
  }

  return overlay;
}

/**
 * Generate preset-specific config files (e.g., tailwind.config.js, vitest.config.ts).
 */
export function generatePresetConfigFiles(
  preset: string,
  stackKey: string,
  variables: TemplateVariables
): Map<string, string> {
  const files = new Map<string, string>();

  if (preset === 'nigel-react') {
    files.set('tailwind.config.js', generateTailwindConfig(stackKey));
    files.set('postcss.config.js', generatePostcssConfig());
    files.set('vitest.config.ts', generateVitestConfig(stackKey));
    files.set('playwright.config.ts', generatePlaywrightConfig());
  }

  return files;
}

function generateTailwindConfig(stackKey: string): string {
  const content = stackKey === 'nextjs'
    ? `'./src/**/*.{js,ts,jsx,tsx,mdx}'`
    : `'./src/**/*.{html,js,svelte,ts}'`;

  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [${content}],
  theme: {
    extend: {},
  },
  plugins: [],
}
`;
}

function generatePostcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
}

function generateVitestConfig(stackKey: string): string {
  if (stackKey === 'nextjs') {
    return `import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
`;
  }

  return `import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
  },
})
`;
}

function generatePlaywrightConfig(): string {
  return `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
`;
}
