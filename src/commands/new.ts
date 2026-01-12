import { Command } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import path from 'path';
import { NewProjectOptions } from '../types/index.js';
import {
  readConfig,
  getProjectTypes,
  getLanguages,
  getAllTemplates,
  getTemplateByName,
  addRecentProject,
  resolveProjectPath,
  normalizeGitHubUrl,
  validateGitHubUrl,
  updateLastUsed
} from '../lib/config.js';
import { cloneRepo, removeGitMetadata } from '../lib/git.js';
import { forkRepository, parseGitHubRepo } from '../lib/github.js';
import { success, error, handleCancel, info, warning } from '../lib/ui.js';

export function createNewCommand(): Command {
  const cmd = new Command('new')
    .description('Create a new project with smart organization')
    .option('-n, --name <name>', 'Project name')
    .option('-t, --type <type>', 'Project type (official, experiment, learning, playground)')
    .option('-l, --language <lang>', 'Programming language')
    .option('--template <name>', 'Use a saved template by name')
    .option('--url <url>', 'Use a GitHub URL as template');

  cmd.action(async (options: NewProjectOptions) => {
    try {
      console.log('');
      p.intro(chalk.cyan.bold('Create New Project'));

      const config = await readConfig();
      const projectTypes = await getProjectTypes();
      const languages = await getLanguages();
      const templates = await getAllTemplates();

      // 1. Project name
      let projectName = options.name;
      if (!projectName) {
        const nameInput = await p.text({
          message: 'Project name:',
          placeholder: 'my-awesome-project',
          validate: (value) => {
            if (!value || value.trim() === '') return 'Project name is required';
            if (!/^[\w-]+$/.test(value)) return 'Use only letters, numbers, underscores, and hyphens';
            return undefined;
          }
        });
        if (handleCancel(nameInput)) return;
        projectName = nameInput as string;
      }

      // 2. Project type
      let projectType = options.type;
      if (!projectType) {
        const typeSelect = await p.select({
          message: 'What kind of project is this?',
          options: projectTypes.map(pt => ({
            value: pt.name,
            label: pt.name.charAt(0).toUpperCase() + pt.name.slice(1),
            hint: pt.description
          }))
        });
        if (handleCancel(typeSelect)) return;
        projectType = typeSelect as string;
      }

      const selectedProjectType = projectTypes.find(pt => pt.name === projectType);
      if (!selectedProjectType) {
        error(`Unknown project type: ${projectType}`);
        process.exit(1);
      }

      // 3. Language/Stack
      let language = options.language;
      if (!language) {
        const langSelect = await p.select({
          message: 'Language/Stack:',
          options: languages.map(lang => ({
            value: lang,
            label: lang.charAt(0).toUpperCase() + lang.slice(1)
          }))
        });
        if (handleCancel(langSelect)) return;
        language = langSelect as string;
      }

      // Validate language
      if (!languages.includes(language.toLowerCase())) {
        language = language.toLowerCase();
      }

      // 4. Template selection
      let templateChoice: 'saved' | 'url' | 'empty' = 'empty';
      let templateUrl: string | undefined;
      let templateName: string | undefined;

      if (options.template) {
        templateChoice = 'saved';
        templateName = options.template;
      } else if (options.url) {
        templateChoice = 'url';
        templateUrl = options.url;
      } else {
        const templateSelect = await p.select({
          message: 'Use a GitHub template?',
          options: [
            { value: 'empty', label: 'No, create empty folder', hint: 'Start from scratch' },
            ...(templates.length > 0 ? [{ value: 'saved', label: 'Yes, from my saved templates', hint: `${templates.length} available` }] : []),
            { value: 'url', label: 'Yes, paste a GitHub URL', hint: 'Clone any public repo' }
          ]
        });
        if (handleCancel(templateSelect)) return;
        templateChoice = templateSelect as 'saved' | 'url' | 'empty';
      }

      // Handle saved template selection
      if (templateChoice === 'saved' && !templateName) {
        const templateSelectPrompt = await p.select({
          message: 'Select a template:',
          options: templates.map(t => ({
            value: t.name,
            label: t.name,
            hint: t.description || t.url
          }))
        });
        if (handleCancel(templateSelectPrompt)) return;
        templateName = templateSelectPrompt as string;
      }

      // Handle URL input
      if (templateChoice === 'url' && !templateUrl) {
        const urlInput = await p.text({
          message: 'GitHub URL:',
          placeholder: 'https://github.com/owner/repo',
          validate: (value) => {
            if (!value || value.trim() === '') return 'URL is required';
            if (!validateGitHubUrl(value)) return 'Invalid GitHub URL';
            return undefined;
          }
        });
        if (handleCancel(urlInput)) return;
        templateUrl = urlInput as string;
      }

      // Resolve template URL if using saved template
      if (templateChoice === 'saved' && templateName) {
        const template = await getTemplateByName(templateName);
        if (!template) {
          error(`Template "${templateName}" not found`);
          process.exit(1);
        }
        templateUrl = template.url;
      }

      // 5. Fork option (only for templates)
      let shouldFork = false;
      if (templateUrl) {
        const forkConfirm = await p.confirm({
          message: 'Fork to your GitHub account first?',
          initialValue: false
        });
        if (handleCancel(forkConfirm)) return;
        shouldFork = forkConfirm === true;
      }

      // Calculate target path
      const targetPath = resolveProjectPath(selectedProjectType, language, projectName);

      // Check if path exists
      try {
        await fs.access(targetPath);
        error(`Directory already exists: ${targetPath}`);
        process.exit(1);
      } catch {
        // Path doesn't exist, which is good
      }

      console.log('');
      info(`Creating project at: ${chalk.cyan(targetPath)}`);

      // Create the project
      if (templateUrl) {
        const baseUrl = normalizeGitHubUrl(templateUrl);
        let cloneUrl = baseUrl;

        // Fork if requested
        if (shouldFork) {
          if (!config.config.githubToken) {
            error('GitHub token is required to fork repositories. Run "makr init" to set one.');
            process.exit(1);
          }

          const repoRef = parseGitHubRepo(baseUrl);
          if (!repoRef) {
            error('Unable to parse GitHub repository URL');
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
            forkSpinner.fail(chalk.red('Failed to fork repository'));
            error(forkError instanceof Error ? forkError.message : 'Unknown error');
            process.exit(1);
          }
        }

        // Clone the template
        const cloneSpinner = ora({
          text: 'Cloning template...',
          color: 'cyan'
        }).start();

        try {
          // Ensure parent directory exists
          await fs.mkdir(path.dirname(targetPath), { recursive: true });
          await cloneRepo(cloneUrl, targetPath);
          
          // Remove .git but keep .gitignore
          await removeGitMetadata(targetPath);
          
          cloneSpinner.succeed(chalk.green('Template cloned'));
        } catch (cloneError) {
          cloneSpinner.fail(chalk.red('Failed to clone template'));
          error(cloneError instanceof Error ? cloneError.message : 'Unknown error');
          process.exit(1);
        }

        // Update template last used if it was a saved template
        if (templateName) {
          await updateLastUsed(templateName);
        }
      } else {
        // Create empty folder
        const createSpinner = ora({
          text: 'Creating project folder...',
          color: 'cyan'
        }).start();

        try {
          await fs.mkdir(targetPath, { recursive: true });
          
          // Create a basic .gitignore
          const gitignoreContent = `# Dependencies
node_modules/
__pycache__/
venv/
.venv/
target/

# Build outputs
dist/
build/
*.egg-info/

# IDE
.idea/
.vscode/
*.swp
*.swo

# Environment
.env
.env.local
*.local

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/
`;
          await fs.writeFile(path.join(targetPath, '.gitignore'), gitignoreContent, 'utf-8');
          
          createSpinner.succeed(chalk.green('Project folder created'));
        } catch (createError) {
          createSpinner.fail(chalk.red('Failed to create project folder'));
          error(createError instanceof Error ? createError.message : 'Unknown error');
          process.exit(1);
        }
      }

      // Track the project
      await addRecentProject({
        name: projectName,
        path: targetPath,
        type: projectType,
        language: language,
        templateUsed: templateName || (templateUrl ? 'url' : undefined)
      });

      // Final output
      console.log('');
      success(`Created project: ${chalk.bold(projectName)}`);
      console.log('');
      console.log(chalk.gray('  Location:'), targetPath);
      console.log(chalk.gray('  Type:'), selectedProjectType.name);
      console.log(chalk.gray('  Language:'), language);
      if (templateName) {
        console.log(chalk.gray('  Template:'), templateName);
      }
      console.log('');
      console.log(chalk.gray('  Get started:'));
      console.log(chalk.cyan(`    cd ${targetPath}`));
      console.log('');

      p.outro(chalk.green('Happy coding!'));
    } catch (err) {
      error(`Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

  return cmd;
}
