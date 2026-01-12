import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getTemplateByName, removeTemplate } from '../lib/config.js';
import { success, error, warning, handleCancel, displayTemplateDetails } from '../lib/ui.js';

export function createRemoveCommand(): Command {
  const cmd = new Command('remove')
    .description('Remove a saved template')
    .argument('<name>', 'Template name to remove');

  cmd.action(async (name: string) => {
    try {
      const template = await getTemplateByName(name);

      if (!template) {
        error(`Template "${name}" not found. Use "makr list" to see available templates.`);
        process.exit(1);
      }

      displayTemplateDetails(template);

      const confirm = await p.confirm({
        message: chalk.yellow('Are you sure you want to remove this template?'),
        initialValue: false
      });

      if (handleCancel(confirm) || !confirm) {
        warning('Operation cancelled');
        return;
      }

      const removed = await removeTemplate(name);

      if (removed) {
        success(`Template "${name}" removed successfully`);
      } else {
        error('Failed to remove template');
        process.exit(1);
      }
    } catch (err) {
      error(`Failed to remove template: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
