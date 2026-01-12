import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import os from 'os';
import path from 'path';
import { ensureConfigDir, readConfig, writeConfig } from '../lib/config.js';
import { success, error, handleCancel, title } from '../lib/ui.js';

export function createInitCommand(): Command {
  const cmd = new Command('init')
    .description('Initialize gtempl configuration');

  cmd.action(async () => {
    try {
      title('Initialize gtempl');

      await ensureConfigDir();
      const config = await readConfig();

      const group = p.group({
        clonePath: () => p.text({
          message: 'Default clone path:',
          placeholder: path.join(os.homedir(), 'projects'),
          initialValue: config.config.clonePath
        }),
        defaultBranch: () => p.text({
          message: 'Default branch:',
          placeholder: 'main',
          initialValue: config.config.defaultBranch
        }),
        githubToken: () => p.password({
          message: 'GitHub token (optional, required for forks/private repos):',
          mask: '•'
        })
      });

      const result = await group;

      if (handleCancel(result)) return;

      const spinner = ora('Saving configuration...').start();

      config.config.clonePath = result.clonePath || config.config.clonePath;
      config.config.defaultBranch = result.defaultBranch || config.config.defaultBranch;
      config.config.githubToken = result.githubToken || null;

      await writeConfig(config);

      spinner.stop();

      success('Configuration saved successfully!');
      console.log('');
      console.log(chalk.gray('  Clone path:'), chalk.cyan(config.config.clonePath));
      console.log(chalk.gray('  Default branch:'), chalk.cyan(config.config.defaultBranch));
      console.log(chalk.gray('  GitHub token:'), config.config.githubToken ? chalk.green('✓ Set') : chalk.yellow('✗ Not set'));
    } catch (err) {
      error(`Failed to initialize: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
