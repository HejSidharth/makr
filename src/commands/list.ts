import { Command } from 'commander';
import chalk from 'chalk';
import { ListOptions } from '../types/index.js';
import { getAllTemplates, getCollectionByName, getTemplatesByIds } from '../lib/config.js';
import { filterTemplatesByTag, sortTemplatesByLastUsed } from '../lib/templates.js';
import { displayTemplates, displayTemplatesJson, info, error, title } from '../lib/ui.js';

export function createListCommand(): Command {
  const cmd = new Command('list')
    .description('List all saved templates')
    .option('-f, --filter <tag>', 'Filter by tag')
    .option('-c, --collection <name>', 'Filter by collection')
    .option('--json', 'Output as JSON');

  cmd.action(async (options: ListOptions) => {
    try {
      const templates = await getAllTemplates();

      let filteredTemplates = templates;

      if (options.collection) {
        const collection = await getCollectionByName(options.collection);
        if (!collection) {
          error(`Collection "${options.collection}" not found. Use "makr collection list" to see collections.`);
          process.exit(1);
        }
        filteredTemplates = await getTemplatesByIds(collection.templateIds);
      }

      if (options.filter) {
        filteredTemplates = filterTemplatesByTag(filteredTemplates, options.filter);
      }

      if (options.collection && options.filter) {
        title(`Templates in ${options.collection} with tag: ${options.filter}`);
      } else if (options.collection) {
        title(`Templates in collection: ${options.collection}`);
      } else if (options.filter) {
        title(`Templates with tag: ${options.filter}`);
      } else {
        title('All Templates');
      }

      if (filteredTemplates.length === 0) {
        if (options.filter) {
          info(`No templates found with tag "${options.filter}"`);
        } else {
          info('No templates saved yet. Use "makr add" to add your first template.');
        }
        return;
      }

      const sortedTemplates = sortTemplatesByLastUsed(filteredTemplates);

      if (options.json) {
        displayTemplatesJson(sortedTemplates);
      } else {
        console.log(chalk.gray(`Found ${sortedTemplates.length} template(s)\n`));
        displayTemplates(sortedTemplates);
      }
    } catch (err) {
      error(`Failed to list templates: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
