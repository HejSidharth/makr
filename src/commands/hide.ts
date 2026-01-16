import { Command } from 'commander';
import chalk from 'chalk';
import { setProjectVisibility } from '../lib/config.js';
import { success, error } from '../lib/ui.js';

export function createHideCommand(): Command {
  return new Command('hide')
    .description('Hide a project from the main view')
    .argument('<name>', 'Project name to hide')
    .action(async (name: string) => {
      try {
        const result = await setProjectVisibility(name, true);
        
        if (result) {
          success(`Project "${name}" is now hidden`);
          console.log(chalk.gray('  Use "makr view all" to see it'));
          console.log(chalk.gray(`  To unhide: makr unhide "${name}"`));
        } else {
          error(`Project "${name}" not found`);
        }
      } catch (err) {
        error(`Failed to hide project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}
