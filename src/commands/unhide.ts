import { Command } from 'commander';
import { setProjectVisibility } from '../lib/config.js';
import { success, error } from '../lib/ui.js';

export function createUnhideCommand(): Command {
  return new Command('unhide')
    .description('Unhide a previously hidden project')
    .argument('<name>', 'Project name to unhide')
    .action(async (name: string) => {
      try {
        const result = await setProjectVisibility(name, false);
        
        if (result) {
          success(`Project "${name}" is now visible`);
        } else {
          error(`Project "${name}" not found`);
        }
      } catch (err) {
        error(`Failed to unhide project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}
