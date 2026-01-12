import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { CloneOptions } from '../types/index.js';
import { getTemplateByName, normalizeGitHubUrl, readConfig, updateLastUsed } from '../lib/config.js';
import { cloneRepo, removeGitMetadata, resolveClonePath } from '../lib/git.js';
import { forkRepository, parseGitHubRepo } from '../lib/github.js';
import { success, error, handleCancel, displayTemplateDetails, warning } from '../lib/ui.js';

export function createCloneCommand(): Command {
  const cmd = new Command('clone')
    .description('Clone a template to your local machine')
    .argument('<name>', 'Template name to clone')
    .option('-d, --dir <path>', 'Target directory (default: ~/projects/<name>)')
    .option('-b, --branch <branch>', 'Specific branch to clone')
    .option('--fork', 'Fork the template to your GitHub account before cloning (private by default)')
    .option('--keep-git', 'Keep git history in the cloned folder');

  cmd.action(async (name: string, options: CloneOptions, command: Command) => {
    try {
      const template = await getTemplateByName(name);

      if (!template) {
        error(`Template "${name}" not found. Use "gtempl list" to see available templates.`);
        process.exit(1);
      }

      displayTemplateDetails(template);

      const confirm = await p.confirm({
        message: `Clone "${template.name}"?`,
        initialValue: true
      });

      if (handleCancel(confirm) || !confirm) {
        return;
      }

      const forkSource = command.getOptionValueSource('fork');
      const keepGitSource = command.getOptionValueSource('keepGit');

      let shouldFork = options.fork ?? false;
      let keepGit = options.keepGit ?? false;

      if (forkSource !== 'cli') {
        const forkAnswer = await p.confirm({
          message: `Fork "${template.name}" to your GitHub account first?`,
          initialValue: false
        });
        if (handleCancel(forkAnswer)) return;
        shouldFork = forkAnswer === true;
      }

      if (keepGitSource !== 'cli') {
        const keepGitAnswer = await p.confirm({
          message: `Keep git history for "${template.name}"?`,
          initialValue: false
        });
        if (handleCancel(keepGitAnswer)) return;
        keepGit = keepGitAnswer === true;
      }

      const config = await readConfig();
      const clonePath = await resolveClonePath(options.dir, template.name, config.config.clonePath);

      const branch = options.branch;
      const baseUrl = normalizeGitHubUrl(template.url);
      const repoRef = parseGitHubRepo(baseUrl);

      if (!repoRef) {
        error('Unable to parse GitHub repository URL for cloning.');
        process.exit(1);
      }

      let cloneUrl = baseUrl;

      if (shouldFork) {
        if (!config.config.githubToken) {
          error('GitHub token is required to fork repositories. Run "gtempl init" to set one.');
          process.exit(1);
        }

        const spinner = ora({
          text: `Forking ${repoRef.owner}/${repoRef.repo}...`,
          color: 'cyan'
        }).start();

        try {
          const fork = await forkRepository(config.config.githubToken, repoRef.owner, repoRef.repo);
          cloneUrl = fork.cloneUrl;
          spinner.succeed(chalk.green(`Fork ready: ${fork.owner}/${fork.repo}`));
        } catch (forkError) {
          spinner.fail(chalk.red('Failed to fork repository'));
          error(forkError instanceof Error ? forkError.message : 'Unknown error');
          process.exit(1);
        }
      }

      const spinner = ora({
        text: branch ? `Cloning ${branch} branch...` : 'Cloning template...',
        color: 'cyan'
      }).start();

      try {
        await cloneRepo(cloneUrl, clonePath, branch);

        if (!keepGit) {
          await removeGitMetadata(clonePath);
          warning('Removed .git history (use --keep-git to preserve it)');
        }

        spinner.succeed(chalk.green(`Template cloned to: ${clonePath}`));

        await updateLastUsed(template.name);

        console.log('');
        success('Ready to start coding!');
        console.log(chalk.gray(`  cd ${clonePath}`));
      } catch (cloneError) {
        spinner.fail(chalk.red('Failed to clone template'));
        error(cloneError instanceof Error ? cloneError.message : 'Unknown error');
        process.exit(1);
      }
    } catch (err) {
      error(`Failed to clone template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
