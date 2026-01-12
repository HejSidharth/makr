import chalk from 'chalk';
import Table from 'cli-table3';
import { Collection, Template } from '../types/index.js';
import { isCancel } from '@clack/prompts';

export function success(message: string): void {
  console.log(chalk.green('✓'), message);
}

export function error(message: string): void {
  console.error(chalk.red('✗'), message);
}

export function warning(message: string): void {
  console.warn(chalk.yellow('⚠'), message);
}

export function info(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}

export function title(message: string): void {
  console.log('');
  console.log(chalk.cyan.bold(`┌─ ${message} ─────────────────────────────────┐`));
  console.log('');
}

export function displayTemplates(templates: Template[]): void {
  if (templates.length === 0) {
    info('No templates found');
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('URL'),
      chalk.cyan.bold('Tags'),
      chalk.cyan.bold('Description')
    ],
    colWidths: [25, 45, 15, 30],
    wordWrap: true,
    wrapOnWordBoundary: false
  });

  templates.forEach(template => {
    const tags = template.tags.length > 0 ? template.tags.join(', ') : '-';
    const description = template.description || '-';
    table.push([
      chalk.bold(template.name),
      chalk.gray(template.url),
      chalk.yellow(tags),
      description
    ]);
  });

  console.log(table.toString());
}

export function displayTemplatesJson(templates: Template[]): void {
  console.log(JSON.stringify(templates, null, 2));
}

export function displayCollections(collections: Collection[]): void {
  if (collections.length === 0) {
    info('No collections found');
    return;
  }

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('Templates'),
      chalk.cyan.bold('Tags'),
      chalk.cyan.bold('Description')
    ],
    colWidths: [22, 12, 20, 35],
    wordWrap: true,
    wrapOnWordBoundary: false
  });

  collections.forEach(collection => {
    const tags = collection.tags.length > 0 ? collection.tags.join(', ') : '-';
    const description = collection.description || '-';
    table.push([
      chalk.bold(collection.name),
      chalk.yellow(collection.templateIds.length.toString()),
      chalk.cyan(tags),
      description
    ]);
  });

  console.log(table.toString());
}

export function displayCollectionsJson(collections: Collection[]): void {
  console.log(JSON.stringify(collections, null, 2));
}

export function displaySearchResults(templates: Template[], query: string): void {
  if (templates.length === 0) {
    info(`No templates found matching "${query}"`);
    return;
  }

  title(`Search Results: "${query}"`);
  console.log(chalk.gray(`Found ${templates.length} template(s)\n`));

  const table = new Table({
    head: [
      chalk.cyan.bold('Name'),
      chalk.cyan.bold('Description'),
      chalk.cyan.bold('Tags')
    ],
    colWidths: [25, 40, 20]
  });

  templates.forEach(template => {
    const tags = template.tags.length > 0 ? template.tags.join(', ') : '-';
    const description = template.description || '-';
    table.push([
      chalk.bold(template.name),
      description,
      chalk.yellow(tags)
    ]);
  });

  console.log(table.toString());
}

export function handleCancel(value: unknown): boolean {
  if (isCancel(value)) {
    warning('Operation cancelled');
    return true;
  }
  return false;
}

export function formatTags(tags: string[]): string {
  return tags.map(tag => chalk.yellow(`#${tag}`)).join(' ');
}

export function displayTemplateDetails(template: Template): void {
  console.log('');
  console.log(chalk.bold.cyan(template.name));
  console.log(chalk.gray('─'.repeat(template.name.length)));
  console.log(chalk.gray('ID:'), template.id);
  console.log(chalk.gray('URL:'), template.url);
  console.log(chalk.gray('Description:'), template.description || 'No description');
  console.log(chalk.gray('Tags:'), formatTags(template.tags));
  console.log(chalk.gray('Created:'), new Date(template.createdAt).toLocaleDateString());
  if (template.lastUsed) {
    console.log(chalk.gray('Last used:'), new Date(template.lastUsed).toLocaleString());
  }
  console.log('');
}

export function displayCollectionDetails(collection: Collection): void {
  console.log('');
  console.log(chalk.bold.cyan(collection.name));
  console.log(chalk.gray('─'.repeat(collection.name.length)));
  console.log(chalk.gray('ID:'), collection.id);
  console.log(chalk.gray('Description:'), collection.description || 'No description');
  console.log(chalk.gray('Tags:'), formatTags(collection.tags));
  console.log(chalk.gray('Templates:'), chalk.yellow(collection.templateIds.length.toString()));
  console.log(chalk.gray('Created:'), new Date(collection.createdAt).toLocaleDateString());
  console.log('');
}
