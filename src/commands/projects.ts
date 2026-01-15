import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { promises as fs } from 'fs';
import { ProjectsListOptions, RecentProject } from '../types/index.js';
import { getRecentProjects, removeRecentProject } from '../lib/config.js';
import { success, error, info, warning } from '../lib/ui.js';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function displayProjects(projects: RecentProject[]): void {
  if (projects.length === 0) {
    info('No recent projects found');
    console.log(chalk.gray('  Create a project with: makr new'));
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('Type'),
      chalk.cyan.bold('Language'),
      chalk.cyan.bold('Path'),
      chalk.cyan.bold('Created')
    ],
    colWidths: [22, 12, 12, 40, 14],
    wordWrap: true,
    wrapOnWordBoundary: false
  });

  projects.forEach(project => {
    table.push([
      chalk.bold(project.name),
      chalk.yellow(project.type),
      chalk.magenta(project.language),
      chalk.gray(project.path),
      formatDate(project.createdAt)
    ]);
  });

  console.log(table.toString());
}

function displayProjectsJson(projects: RecentProject[]): void {
  console.log(JSON.stringify(projects, null, 2));
}

export function createProjectsCommand(): Command {
  const cmd = new Command('projects')
    .description('List and manage recent projects')
    .alias('view')
    .option('-t, --type <type>', 'Filter by project type')
    .option('-l, --language <lang>', 'Filter by language')
    .option('-n, --limit <number>', 'Number of projects to show', '10')
    .option('--json', 'Output as JSON');

  cmd.action(async (options: ProjectsListOptions) => {
    try {
      const limit = options.limit ? parseInt(String(options.limit), 10) : 10;
      
      const projects = await getRecentProjects({
        type: options.type,
        language: options.language,
        limit: limit
      });

      if (options.json) {
        displayProjectsJson(projects);
      } else {
        console.log('');
        console.log(chalk.cyan.bold('Recent Projects'));
        console.log('');
        displayProjects(projects);
        
        if (projects.length > 0) {
          console.log('');
          console.log(chalk.gray(`Showing ${projects.length} project${projects.length > 1 ? 's' : ''}`));
        }
      }
    } catch (err) {
      error(`Failed to list projects: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  // Subcommand: open
  const openCmd = new Command('open')
    .description('Open a recent project (show path for cd)')
    .argument('<name>', 'Project name to open')
    .action(async (name: string) => {
      try {
        const projects = await getRecentProjects();
        const project = projects.find(p => p.name === name);

        if (!project) {
          error(`Project "${name}" not found in recent projects`);
          console.log(chalk.gray('  Use "makr projects" to see available projects'));
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
        console.log(chalk.gray('  Path:'), project.path);
        console.log('');
        console.log(chalk.gray('  Navigate with:'));
        console.log(chalk.cyan(`    cd ${project.path}`));
        console.log('');
      } catch (err) {
        error(`Failed to open project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Subcommand: clean
  const cleanCmd = new Command('clean')
    .description('Remove projects that no longer exist from the list')
    .action(async () => {
      try {
        const projects = await getRecentProjects();
        let removed = 0;

        for (const project of projects) {
          try {
            await fs.access(project.path);
          } catch {
            await removeRecentProject(project.id);
            removed++;
            info(`Removed: ${project.name} (path not found)`);
          }
        }

        if (removed === 0) {
          success('All project paths are valid');
        } else {
          console.log('');
          success(`Cleaned ${removed} stale project${removed > 1 ? 's' : ''}`);
        }
      } catch (err) {
        error(`Failed to clean projects: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  // Subcommand: remove
  const removeCmd = new Command('remove')
    .description('Remove a project from the recent list (does not delete files)')
    .argument('<name>', 'Project name to remove')
    .action(async (name: string) => {
      try {
        const projects = await getRecentProjects();
        const project = projects.find(p => p.name === name);

        if (!project) {
          error(`Project "${name}" not found in recent projects`);
          process.exit(1);
        }

        await removeRecentProject(project.id);
        success(`Removed "${name}" from recent projects`);
        console.log(chalk.gray('  Note: Project files were not deleted'));
      } catch (err) {
        error(`Failed to remove project: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd.addCommand(openCmd);
  cmd.addCommand(cleanCmd);
  cmd.addCommand(removeCmd);

  return cmd;
}
