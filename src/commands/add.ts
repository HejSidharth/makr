import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { AddOptions } from '../types/index.js';
import {
  addTemplate,
  validateGitHubUrl,
  normalizeGitHubUrl
} from '../lib/config.js';
import { parseTags } from '../lib/templates.js';
import { success, error, handleCancel, title } from '../lib/ui.js';

export function createAddCommand(): Command {
  const cmd = new Command('add')
    .description('Add a new GitHub template')
    .option('-n, --name <name>', 'Template name')
    .option('-u, --url <url>', 'GitHub repository URL')
    .option('-d, --description <description>', 'Template description')
    .option('-t, --tags <tags>', 'Comma-separated tags');

  cmd.action(async (options: AddOptions) => {
    const group = p.group({
      name: () => {
        if (options.name) return Promise.resolve(options.name);
        return p.text({
          message: 'Template name:',
          placeholder: 'my-starter',
          validate: (value) => {
            if (!value) return 'Template name is required';
            return undefined;
          }
        });
      },
      url: ({ results }) => {
        if (options.url) return Promise.resolve(options.url);
        return p.text({
          message: 'GitHub URL:',
          placeholder: 'https://github.com/user/repo',
          validate: (value) => {
            if (!value) return 'GitHub URL is required';
            if (!validateGitHubUrl(value)) return 'Invalid GitHub URL format';
            return undefined;
          }
        });
      },
      description: () => {
        if (options.description) return Promise.resolve(options.description);
        return p.text({
          message: 'Description (optional):',
          placeholder: 'A full-stack starter kit'
        });
      },
      tags: () => {
        if (options.tags) return Promise.resolve(options.tags);
        return p.text({
          message: 'Tags (comma-separated, optional):',
          placeholder: 'typescript,react,nextjs'
        });
      }
    });

    try {
      title('Add New Template');

      const result = await group;

      if (handleCancel(result)) return;

      const tags = parseTags(result.tags || '');
      const normalizedUrl = normalizeGitHubUrl(result.url as string);

      const spinner = ora('Adding template...').start();

      await addTemplate({
        name: result.name!,
        url: normalizedUrl,
        description: result.description || undefined,
        tags
      });

      spinner.stop();
      success(`Template "${result.name}" added successfully!`);
      console.log(chalk.gray(`  URL: ${normalizedUrl}`));
      if (tags.length > 0) {
        console.log(chalk.gray(`  Tags: ${tags.join(', ')}`));
      }
    } catch (err) {
      error(`Failed to add template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
