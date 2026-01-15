#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { createAddCommand } from './commands/add.js';
import { createListCommand } from './commands/list.js';
import { createCloneCommand } from './commands/clone.js';
import { createRemoveCommand } from './commands/remove.js';
import { createSearchCommand } from './commands/search.js';
import { createInitCommand } from './commands/init.js';
import { createCollectionCommand } from './commands/collection.js';
import { createNewCommand } from './commands/new.js';
import { createProjectsCommand } from './commands/projects.js';
import { createOpenCommand } from './commands/open.js';

const program = new Command();

program
  .name('makr')
  .description('Smart project organizer - create, organize, and manage development projects')
  .version('2.0.0');

program.addCommand(createInitCommand());
program.addCommand(createAddCommand());
program.addCommand(createListCommand());
program.addCommand(createCloneCommand());
program.addCommand(createRemoveCommand());
program.addCommand(createSearchCommand());
program.addCommand(createCollectionCommand());
program.addCommand(createNewCommand());
program.addCommand(createProjectsCommand());
program.addCommand(createOpenCommand());

program.on('command:*', (operands) => {
  console.error(chalk.red(`error: unknown command '${operands[0]}'`));
  console.log('');
  console.log(chalk.gray('Run "makr --help" for available commands'));
  process.exit(1);
});

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
