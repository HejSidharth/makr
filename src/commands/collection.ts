import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import ora from 'ora';
import path from 'path';
import {
  addCollection,
  addTemplateToCollection,
  findTemplatesByIdentifier,
  getAllCollections,
  getCollectionByName,
  getTemplatesByIds,
  normalizeGitHubUrl,
  readConfig,
  removeCollection,
  removeTemplateFromCollection,
  updateLastUsed
} from '../lib/config.js';
import { cloneRepo, removeGitMetadata } from '../lib/git.js';
import { forkRepository, parseGitHubRepo } from '../lib/github.js';
import { parseTags } from '../lib/templates.js';
import {
  displayCollectionDetails,
  displayCollections,
  displayCollectionsJson,
  displayTemplates,
  error,
  handleCancel,
  info,
  success,
  title,
  warning
} from '../lib/ui.js';
import { CollectionCreateOptions, CollectionListOptions, CollectionScaffoldOptions } from '../types/index.js';

export function createCollectionCommand(): Command {
  const cmd = new Command('collection').description('Manage template collections');

  cmd
    .command('add')
    .description('Create a new collection')
    .argument('<name>', 'Collection name')
    .option('-d, --description <description>', 'Collection description')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (name: string, options: CollectionCreateOptions) => {
      try {
        title('Create Collection');

        const group = p.group({
          description: () => {
            if (options.description) return Promise.resolve(options.description);
            return p.text({
              message: 'Description (optional):',
              placeholder: 'Full-stack starters'
            });
          },
          tags: () => {
            if (options.tags) return Promise.resolve(options.tags);
            return p.text({
              message: 'Tags (comma-separated, optional):',
              placeholder: 'web,fullstack'
            });
          }
        });

        const result = await group;

        if (handleCancel(result)) return;

        const tags = parseTags(result.tags || '');

        const created = await addCollection({
          name,
          description: result.description || undefined,
          tags
        });

        success(`Collection "${created.name}" created successfully!`);
        displayCollectionDetails(created);
      } catch (err) {
        error(`Failed to create collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('list')
    .description('List all collections')
    .option('--json', 'Output as JSON')
    .action(async (options: CollectionListOptions) => {
      try {
        const collections = await getAllCollections();
        title('Collections');

        if (options.json) {
          displayCollectionsJson(collections);
          return;
        }

        displayCollections(collections);
      } catch (err) {
        error(`Failed to list collections: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('show')
    .description('Show a collection and its templates')
    .argument('<name>', 'Collection name')
    .action(async (name: string) => {
      try {
        const collection = await getCollectionByName(name);
        if (!collection) {
          error(`Collection "${name}" not found. Use "gtempl collection list" to see collections.`);
          process.exit(1);
        }

        displayCollectionDetails(collection);

        const templates = await getTemplatesByIds(collection.templateIds);
        displayTemplates(templates);
      } catch (err) {
        error(`Failed to show collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('include')
    .description('Add a template to a collection')
    .argument('<collection>', 'Collection name')
    .argument('<template>', 'Template name or ID')
    .action(async (collectionName: string, templateIdentifier: string) => {
      try {
        const collection = await getCollectionByName(collectionName);
        if (!collection) {
          error(`Collection "${collectionName}" not found. Use "gtempl collection list" to see collections.`);
          process.exit(1);
        }

        const matches = await findTemplatesByIdentifier(templateIdentifier);
        if (matches.length === 0) {
          error(`Template "${templateIdentifier}" not found. Use "gtempl list" to see templates.`);
          process.exit(1);
        }
        if (matches.length > 1) {
          error(`Multiple templates match "${templateIdentifier}". Use template ID instead.`);
          matches.forEach(template => {
            console.log(chalk.gray(`  ${template.name} (${template.id})`));
          });
          process.exit(1);
        }

        const template = matches[0];
        await addTemplateToCollection(collectionName, template.id);
        success(`Added "${template.name}" to collection "${collectionName}"`);
      } catch (err) {
        error(`Failed to add template to collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('remove')
    .description('Remove a template from a collection')
    .argument('<collection>', 'Collection name')
    .argument('<template>', 'Template name or ID')
    .action(async (collectionName: string, templateIdentifier: string) => {
      try {
        const collection = await getCollectionByName(collectionName);
        if (!collection) {
          error(`Collection "${collectionName}" not found. Use "gtempl collection list" to see collections.`);
          process.exit(1);
        }

        const matches = await findTemplatesByIdentifier(templateIdentifier);
        if (matches.length === 0) {
          error(`Template "${templateIdentifier}" not found. Use "gtempl list" to see templates.`);
          process.exit(1);
        }
        if (matches.length > 1) {
          error(`Multiple templates match "${templateIdentifier}". Use template ID instead.`);
          matches.forEach(template => {
            console.log(chalk.gray(`  ${template.name} (${template.id})`));
          });
          process.exit(1);
        }

        const template = matches[0];
        await removeTemplateFromCollection(collectionName, template.id);
        success(`Removed "${template.name}" from collection "${collectionName}"`);
      } catch (err) {
        error(`Failed to remove template from collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('delete')
    .description('Delete a collection')
    .argument('<name>', 'Collection name')
    .action(async (name: string) => {
      try {
        const collection = await getCollectionByName(name);
        if (!collection) {
          error(`Collection "${name}" not found. Use "gtempl collection list" to see collections.`);
          process.exit(1);
        }

        displayCollectionDetails(collection);

        const confirm = await p.confirm({
          message: chalk.yellow('Delete this collection?'),
          initialValue: false
        });

        if (handleCancel(confirm) || !confirm) return;

        const removed = await removeCollection(name);
        if (removed) {
          success(`Collection "${name}" deleted successfully`);
        } else {
          error('Failed to delete collection');
          process.exit(1);
        }
      } catch (err) {
        error(`Failed to delete collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  cmd
    .command('scaffold')
    .description('Clone all templates in a collection')
    .argument('<name>', 'Collection name')
    .option('-d, --dir <path>', 'Base directory for clones')
    .option('-b, --branch <branch>', 'Specific branch to clone')
    .option('--fork', 'Fork each template before cloning (private by default)')
    .option('--keep-git', 'Keep git history in cloned folders')
    .action(async (name: string, options: CollectionScaffoldOptions, command: Command) => {
      try {
        const collection = await getCollectionByName(name);
        if (!collection) {
          error(`Collection "${name}" not found. Use "gtempl collection list" to see collections.`);
          process.exit(1);
        }

        const templates = await getTemplatesByIds(collection.templateIds);
        if (templates.length === 0) {
          info(`Collection "${name}" has no templates yet.`);
          return;
        }

        displayCollectionDetails(collection);
        displayTemplates(templates);

        const config = await readConfig();
        const baseDir = options.dir
          ? path.resolve(options.dir)
          : path.join(config.config.clonePath, collection.name);

        await fs.mkdir(baseDir, { recursive: true });

        const forkSource = command.getOptionValueSource('fork');
        const keepGitSource = command.getOptionValueSource('keepGit');

        for (const template of templates) {
          const confirm = await p.confirm({
            message: `Clone "${template.name}"?`,
            initialValue: true
          });

          if (handleCancel(confirm)) {
            warning('Scaffolding cancelled');
            return;
          }

          if (!confirm) {
            info(`Skipped ${template.name}`);
            continue;
          }

          let shouldFork = options.fork ?? false;
          let keepGit = options.keepGit ?? false;

          if (forkSource !== 'cli') {
            const forkAnswer = await p.confirm({
              message: `Fork "${template.name}" before cloning?`,
              initialValue: false
            });
            if (handleCancel(forkAnswer)) {
              warning('Scaffolding cancelled');
              return;
            }
            shouldFork = forkAnswer === true;
          }

          if (keepGitSource !== 'cli') {
            const keepGitAnswer = await p.confirm({
              message: `Keep git history for "${template.name}"?`,
              initialValue: false
            });
            if (handleCancel(keepGitAnswer)) {
              warning('Scaffolding cancelled');
              return;
            }
            keepGit = keepGitAnswer === true;
          }

          const baseUrl = normalizeGitHubUrl(template.url);
          const repoRef = parseGitHubRepo(baseUrl);
          if (!repoRef) {
            error(`Unable to parse GitHub repository for ${template.name}`);
            process.exit(1);
          }

          let cloneUrl = baseUrl;

          if (shouldFork) {
            if (!config.config.githubToken) {
              error('GitHub token is required to fork repositories. Run "gtempl init" to set one.');
              process.exit(1);
            }

            const forkSpinner = ora({
              text: `Forking ${repoRef.owner}/${repoRef.repo}...`,
              color: 'cyan'
            }).start();

            try {
              const fork = await forkRepository(config.config.githubToken, repoRef.owner, repoRef.repo);
              cloneUrl = fork.cloneUrl;
              forkSpinner.succeed(chalk.green(`Fork ready: ${fork.owner}/${fork.repo}`));
            } catch (forkError) {
              forkSpinner.fail(chalk.red(`Failed to fork ${template.name}`));
              error(forkError instanceof Error ? forkError.message : 'Unknown error');
              process.exit(1);
            }
          }

          const targetDir = path.join(baseDir, template.name);
          const spinner = ora({
            text: options.branch ? `Cloning ${template.name} (${options.branch})...` : `Cloning ${template.name}...`,
            color: 'cyan'
          }).start();

          try {
            await cloneRepo(cloneUrl, targetDir, options.branch);

            if (!keepGit) {
              await removeGitMetadata(targetDir);
              warning(`Removed .git history for ${template.name}`);
            }

            spinner.succeed(chalk.green(`Cloned to ${targetDir}`));
            await updateLastUsed(template.name);
          } catch (cloneError) {
            spinner.fail(chalk.red(`Failed to clone ${template.name}`));
            error(cloneError instanceof Error ? cloneError.message : 'Unknown error');
            process.exit(1);
          }
        }

        success(`Collection "${collection.name}" scaffolded successfully!`);
      } catch (err) {
        error(`Failed to scaffold collection: ${err instanceof Error ? err.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  return cmd;
}
