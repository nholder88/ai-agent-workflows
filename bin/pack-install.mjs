#!/usr/bin/env node
/**
 * Launcher for global installs: resolves tsx + cli from this package root.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const cli = path.join(pkgRoot, 'cli', 'pack-install.ts');

const child = spawn(
  process.execPath,
  ['--import', 'tsx', cli, ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    cwd: pkgRoot,
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 1);
  }
});
