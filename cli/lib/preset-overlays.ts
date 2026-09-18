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
 * Apply preset overlays to a package.json object using fill-gaps-only strategy.
 * Never replaces existing dependencies - only adds missing ones.
 */
export function applyPresetToPackageJson(
  pkg: Record<string, any>,
  preset: string,
  stackKey: string
): Record<string, any> {
  const overlay = getPackageJsonOverlay(preset, stackKey);
  
  if (overlay.dependencies) {
    pkg.dependencies = pkg.dependencies || {};
    for (const [dep, version] of Object.entries(overlay.dependencies)) {
      // Only add if not already in dependencies OR devDependencies (fill gaps only)
      if (!pkg.dependencies[dep] && !(pkg.devDependencies && pkg.devDependencies[dep])) {
        pkg.dependencies[dep] = version;
      }
    }
  }
  
  if (overlay.devDependencies) {
    pkg.devDependencies = pkg.devDependencies || {};
    for (const [dep, version] of Object.entries(overlay.devDependencies)) {
      // Only add if not already in devDependencies OR dependencies (fill gaps only)
      if (!pkg.devDependencies[dep] && !pkg.dependencies[dep]) {
        pkg.devDependencies[dep] = version;
      }
    }
  }
  
  if (overlay.scripts) {
    pkg.scripts = pkg.scripts || {};
    for (const [script, command] of Object.entries(overlay.scripts)) {
      // Only add if script doesn't exist (fill gaps only)
      if (!pkg.scripts[script]) {
        pkg.scripts[script] = command;
      }
    }
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
 * 
 * Uses fill-gaps-only strategy - only adds dependencies that don't exist in scaffold.
 * Never downgrades existing scaffold pins.
 * 
 * Note: Both Next.js and SvelteKit scaffolds already include most of these tools.
 * Preset fills gaps and documents opinions in AGENTS.md.
 */
function getNigelReactOverlay(stackKey: string): PackageJsonOverlay {
  if (stackKey === 'nextjs') {
    // Next.js scaffold already has: Query ^5.59, Zustand ^5, Vitest ^2.1, Playwright ^1.48
    // Only add Tailwind tooling if missing (fill gaps only)
    return {
      dependencies: {},
      devDependencies: {
        'tailwindcss': '^3.4.0',
        'postcss': '^8.4.0',
        'autoprefixer': '^10.4.0',
      },
    };
  } else if (stackKey === 'sveltekit') {
    // SvelteKit scaffold has: Tailwind 4, Vitest, Playwright
    // Only add TanStack Svelte Query if missing (fill gaps only)
    return {
      dependencies: {
        '@tanstack/svelte-query': '^5.0.0',
      },
      devDependencies: {},
    };
  }

  return {
    dependencies: {},
    devDependencies: {},
  };
}

/**
 * Generate preset-specific config files (e.g., tailwind.config.js, vitest.config.ts).
 * 
 * Note: For SvelteKit, scaffold already provides all configs, so we return empty map.
 * Caller is responsible for checking if files exist before writing.
 */
export function generatePresetConfigFiles(
  preset: string,
  stackKey: string,
  variables: TemplateVariables
): Map<string, string> {
  const files = new Map<string, string>();

  if (preset === 'nigel-react' && stackKey === 'nextjs') {
    // Only generate config files for Next.js - SvelteKit scaffold has them
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
