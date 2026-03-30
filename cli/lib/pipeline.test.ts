import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInstall } from './pipeline.js';
import type { ToolRegistryFile } from './registry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

function platformKey(): 'win32' | 'darwin' | 'linux' {
  if (process.platform === 'win32') {
    return 'win32';
  }
  if (process.platform === 'darwin') {
    return 'darwin';
  }
  return 'linux';
}

describe('runInstall', () => {
  it('dry-run returns schema v3 manifest with target counts', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'pack-cli-'));
    try {
      const promptsRoot = path.join(tmp, 'fake-prompts');
      const plat = platformKey();
      const unixish = promptsRoot.replace(/\\/g, '/');
      const registry: ToolRegistryFile = {
        version: 1,
        tools: [
          {
            id: 'testtool',
            label: 'Test tool',
            adapterId: 'vscode-agent',
            agentsRootByPlatform: {
              [plat]: unixish,
            },
          },
        ],
      };
      const installRoot = path.join(tmp, 'install-meta');
      const { manifest } = await runInstall({
        repoRoot,
        installRoot,
        toolIds: ['testtool'],
        registry,
        workspaceRoot: null,
        workspaceSkills: false,
        workspaceTemplates: false,
        dryRun: true,
      });
      assert.equal(manifest.schemaVersion, 3);
      assert.equal(manifest.targets.length, 1);
      assert.ok(manifest.targets[0]!.agentFileCount > 0);
      assert.ok(manifest.targets[0]!.templateFileCount > 0);
      assert.equal(manifest.workspace, null);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
