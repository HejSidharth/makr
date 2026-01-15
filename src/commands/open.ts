import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import { getRecentProjects } from '../lib/config.js';
import { success, error, warning } from '../lib/ui.js';

export function createOpenCommand(): Command {
  const cmd = new Command('open')
    .description('Open a project (shows cd command for easy copy-paste)')
    .argument('<name>', 'Project name to open')
    .action(async (name: string) => {
      try {
        const projects = await getRecentProjects();
        const project = projects.find(p => p.name === name);

        if (!project) {
          error(`Project "${name}" not found in recent projects`);
          console.log('');
          console.log(chalk.gray('Available projects:'));
          projects.slice(0, 5).forEach(p => {
            console.log(chalk.gray(`  - ${p.name}`));
          });
          console.log('');
          console.log(chalk.gray('Use "makr view" to see all projects'));
          process.exit(1);
        }

        // Check if path exists
        try {
          await fs.access(project.path);
        } catch {
          warning(`Project path no longer exists: ${project.path}`);
          process.exit(1);
        }

        console.log('');
        success(`Project: ${chalk.bold(project.name)}`);
        console.log('');
        console.log(chalk.gray('  Type:'), project.type);
        console.log(chalk.gray('  Language:'), project.language);
        console.log('');
        console.log(chalk.cyan.bold('  cd ' + project.path));
        console.log('');
      } catch (err) {
        error(`Failed to open project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return cmd;
}
