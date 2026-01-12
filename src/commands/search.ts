import { Command } from 'commander';
import { SearchOptions } from '../types/index.js';
import { getAllTemplates, getCollectionByName, getTemplatesByIds } from '../lib/config.js';
import { searchTemplates } from '../lib/templates.js';
import { displaySearchResults, error } from '../lib/ui.js';

export function createSearchCommand(): Command {
  const cmd = new Command('search')
    .description('Search templates by name, description, or tags')
    .argument('<query>', 'Search query')
    .option('-c, --collection <name>', 'Search within a collection');

  cmd.action(async (query: string, options: SearchOptions) => {
    try {
      let templates = await getAllTemplates();

      if (options.collection) {
        const collection = await getCollectionByName(options.collection);
        if (!collection) {
          error(`Collection "${options.collection}" not found. Use "makr collection list" to see collections.`);
          process.exit(1);
        }
        templates = await getTemplatesByIds(collection.templateIds);
      }

      const results = searchTemplates(templates, query);

      displaySearchResults(results, query);
    } catch (err) {
      error(`Failed to search templates: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
