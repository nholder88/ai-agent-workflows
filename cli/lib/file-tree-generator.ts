/**
 * File tree generator - maps template specs to project directory structure.
 */
import * as path from 'node:path';
import type { ResolvedContext } from './resolver.js';
import { logger } from './logger.js';

export interface FileNode {
  type: 'directory' | 'file' | 'copy' | 'template';
  sourcePath?: string;
  targetPath: string;
  isTemplate?: boolean;
}

export interface FileTree {
  directories: string[];
  files: FileNode[];
}

/**
 * Generate the file tree structure for a project based on resolved specs.
 * 
 * Distinguishes between:
 * - copied files (static files from template directories)
 * - rendered files (template files with variable substitution)
 * - synthesized files (generated artifacts like AGENTS.md)
 */
export function generateFileTree(resolved: ResolvedContext): FileTree {
  logger.info('file_tree_generation_start', {
    hasFrontend: !!resolved.frontend,
    hasBackend: !!resolved.backend,
  });

  const directories: Set<string> = new Set();
  const files: FileNode[] = [];

  const projectName = resolved.createContext.projectName;
  const outputPath = resolved.createContext.outputPath;

  directories.add('');

  if (resolved.frontend) {
    const spec = resolved.frontend.spec;
    const templateDir = resolved.frontend.templateDir;

    directories.add('src');
    directories.add('src/app');
    directories.add('src/features');
    directories.add('src/lib');
    directories.add('src/components');
    directories.add('tests');
    directories.add('tests/unit');
    directories.add('tests/e2e');
    directories.add('public');
    directories.add('.github');
    directories.add('.github/workflows');

    if (spec.required_routes) {
      for (const route of spec.required_routes) {
        const routePath = route.replace(/^\//, '').replace(/\//g, path.sep);
        if (routePath) {
          directories.add(path.join('src', 'app', routePath));
        }
      }
    }

    const requiredCapabilities = spec.required_capabilities || [];
    const featureFolders = new Set<string>();
    
    for (const cap of requiredCapabilities) {
      if (cap.startsWith('CAP-REP-')) {
        featureFolders.add('reports');
      } else if (cap.startsWith('CAP-FF-') || cap.startsWith('CAP-ADM-')) {
        featureFolders.add('admin');
      }
    }

    for (const feature of featureFolders) {
      directories.add(path.join('src', 'features', feature));
    }

    const envPath = resolved.frontend.stackDef.env;
    if (envPath) {
      files.push({
        type: 'copy',
        sourcePath: path.join(resolved.createContext.repoRoot, envPath),
        targetPath: '.env.example',
      });
    }

    files.push({
      type: 'template',
      targetPath: 'package.json',
      isTemplate: true,
    });

    files.push({
      type: 'template',
      targetPath: 'tsconfig.json',
      isTemplate: true,
    });

    files.push({
      type: 'copy',
      sourcePath: path.join(resolved.createContext.repoRoot, 'templates', 'shared', 'workflows', 'ci-pr.yaml'),
      targetPath: path.join('.github', 'workflows', 'ci-pr.yaml'),
    });
  }

  if (resolved.backend) {
    const spec = resolved.backend.spec;
    const templateDir = resolved.backend.templateDir;

    if (!resolved.frontend) {
      directories.add('src');
      directories.add('tests');
      directories.add('tests/unit');
      directories.add('tests/e2e');
      directories.add('.github');
      directories.add('.github/workflows');
    }

    directories.add('src/api');
    directories.add('src/models');
    directories.add('src/services');

    const requiredCapabilities = spec.required_capabilities || [];
    const serviceFolders = new Set<string>();
    
    for (const cap of requiredCapabilities) {
      if (cap.startsWith('CAP-REP-')) {
        serviceFolders.add('reporting');
      } else if (cap.startsWith('CAP-FF-') || cap.startsWith('CAP-ADM-')) {
        serviceFolders.add('admin');
      }
    }

    for (const service of serviceFolders) {
      directories.add(path.join('src', 'services', service));
    }

    const envPath = resolved.backend.stackDef.env;
    if (envPath && !resolved.frontend) {
      files.push({
        type: 'copy',
        sourcePath: path.join(resolved.createContext.repoRoot, envPath),
        targetPath: '.env.example',
      });
    }

    if (!resolved.frontend) {
      files.push({
        type: 'copy',
        sourcePath: path.join(resolved.createContext.repoRoot, 'templates', 'shared', 'workflows', 'ci-pr.yaml'),
        targetPath: path.join('.github', 'workflows', 'ci-pr.yaml'),
      });
    }
  }

  directories.add('.cursor');
  directories.add('docs');

  logger.info('file_tree_generation_complete', {
    directoriesCount: directories.size,
    filesCount: files.length,
  });

  return {
    directories: Array.from(directories).sort(),
    files,
  };
}
