import { Octokit } from 'octokit';

export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export interface ForkResult {
  cloneUrl: string;
  owner: string;
  repo: string;
}

export function parseGitHubRepo(url: string): GitHubRepoRef | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export async function forkRepository(
  token: string,
  owner: string,
  repo: string
): Promise<ForkResult> {
  const octokit = new Octokit({ auth: token });

  const forkResponse = await octokit.request('POST /repos/{owner}/{repo}/forks', {
    owner,
    repo,
    private: true
  });

  const forkOwner = forkResponse.data.owner?.login;
  const forkRepo = forkResponse.data.name;
  const forkCloneUrl = forkResponse.data.clone_url;

  if (!forkOwner || !forkRepo || !forkCloneUrl) {
    throw new Error('Failed to resolve fork repository details');
  }

  await waitForFork(octokit, forkOwner, forkRepo);

  return { owner: forkOwner, repo: forkRepo, cloneUrl: forkCloneUrl };
}

async function waitForFork(octokit: Octokit, owner: string, repo: string): Promise<void> {
  const maxAttempts = 10;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await octokit.request('GET /repos/{owner}/{repo}', { owner, repo });
      return;
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw new Error('Fork created but not yet available. Try again shortly.');
      }
      await sleep(delayMs);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
