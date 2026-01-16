import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { getTemplateByName, removeTemplate, getRecentProjects, removeRecentProject } from '../lib/config.js';
import { success, error, warning, handleCancel, displayTemplateDetails } from '../lib/ui.js';

export function createRemoveCommand(): Command {
  const cmd = new Command('remove')
    .description('Remove a saved template or recent project')
    .argument('<name>', 'Name of the template or project to remove');

  cmd.action(async (name: string) => {
    try {
      // Check for both template and project
      const template = await getTemplateByName(name);
      const projects = await getRecentProjects({ includeHidden: true });
      const project = projects.find(p => p.name === name);

      if (!template && !project) {
        error(`No template or project found with name "${name}".`);
        process.exit(1);
      }

      let targetType: 'template' | 'project';

      if (template && project) {
        // Both exist, ask user
        const selection = await p.select({
          message: `Found both a template and a project named "${name}". Which one do you want to remove?`,
          options: [
            { value: 'template', label: 'Template', hint: 'Removes from saved templates' },
            { value: 'project', label: 'Project', hint: 'Removes from recent projects list only' },
          ],
        });

        if (handleCancel(selection)) {
          warning('Operation cancelled');
          return;
        }

        targetType = selection as 'template' | 'project';
      } else {
        targetType = template ? 'template' : 'project';
      }

      if (targetType === 'template' && template) {
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
      } else if (targetType === 'project' && project) {
        console.log('');
        console.log(chalk.bold('Project Details:'));
        console.log(`  Name: ${project.name}`);
        console.log(`  Path: ${project.path}`);
        console.log(`  Type: ${project.type}`);
        console.log('');

        const confirm = await p.confirm({
          message: chalk.yellow('Are you sure you want to remove this project from the recent list?'),
          initialValue: false
        });

        if (handleCancel(confirm) || !confirm) {
          warning('Operation cancelled');
          return;
        }

        const removed = await removeRecentProject(project.id);
        if (removed) {
          success(`Project "${name}" removed from recent list`);
          console.log(chalk.gray('  (Note: The actual project files on disk were not deleted)'));
        } else {
          error('Failed to remove project');
          process.exit(1);
        }
      }

    } catch (err) {
      error(`Failed to remove: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
