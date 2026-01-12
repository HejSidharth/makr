import simpleGit from 'simple-git';
import path from 'path';
import { promises as fs } from 'fs';

export async function cloneRepo(
  url: string,
  targetDir: string,
  branch?: string
): Promise<string> {
  const git = simpleGit();

  const options = branch ? ['--branch', branch] : [];

  await git.clone(url, targetDir, options);

  return targetDir;
}

export async function resolveClonePath(
  specifiedPath: string | undefined,
  templateName: string,
  clonePath: string
): Promise<string> {
  if (specifiedPath) {
    return specifiedPath;
  }

  const resolvedPath = path.resolve(clonePath, templateName);
  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  return resolvedPath;
}

export async function removeGitMetadata(targetDir: string): Promise<void> {
  const gitDir = path.join(targetDir, '.git');
  await fs.rm(gitDir, { recursive: true, force: true });
}
