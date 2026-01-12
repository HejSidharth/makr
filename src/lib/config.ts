import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Collection, Config, ProjectType, RecentProject, Template } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'makr');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Default project types with by-type-then-language organization
const DEFAULT_PROJECT_TYPES: ProjectType[] = [
  { name: 'official', path: path.join(os.homedir(), 'projects'), description: 'Production-ready projects' },
  { name: 'experiment', path: path.join(os.homedir(), 'experiments'), description: 'Quick tests and experiments' },
  { name: 'learning', path: path.join(os.homedir(), 'learning'), description: 'Tutorials and courses' },
  { name: 'playground', path: path.join(os.homedir(), 'playground'), description: 'Sandbox and scratch work' }
];

// Default supported languages
const DEFAULT_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'java',
  'ruby',
  'other'
];

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfig(): Promise<Config> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Config;
    
    // Migration: ensure new fields exist
    let needsWrite = false;
    
    if (!parsed.collections) {
      parsed.collections = [];
      needsWrite = true;
    }
    if (!parsed.projectTypes) {
      parsed.projectTypes = DEFAULT_PROJECT_TYPES;
      needsWrite = true;
    }
    if (!parsed.languages) {
      parsed.languages = DEFAULT_LANGUAGES;
      needsWrite = true;
    }
    if (!parsed.recentProjects) {
      parsed.recentProjects = [];
      needsWrite = true;
    }
    
    if (needsWrite) {
      await writeConfig(parsed);
    }
    
    return parsed;
  } catch (error) {
    const defaultConfig: Config = {
      templates: [],
      collections: [],
      projectTypes: DEFAULT_PROJECT_TYPES,
      languages: DEFAULT_LANGUAGES,
      recentProjects: [],
      config: {
        defaultBranch: 'main',
        githubToken: null,
        clonePath: path.join(os.homedir(), 'projects')
      }
    };
    await writeConfig(defaultConfig);
    return defaultConfig;
  }
}

export async function writeConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Template operations
export async function addTemplate(template: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
  const config = await readConfig();
  const newTemplate: Template = {
    ...template,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  config.templates.push(newTemplate);
  await writeConfig(config);
  return newTemplate;
}

export async function getTemplateByName(name: string): Promise<Template | undefined> {
  const config = await readConfig();
  return config.templates.find(t => t.name === name);
}

export async function getAllTemplates(): Promise<Template[]> {
  const config = await readConfig();
  return config.templates;
}

export async function getTemplateById(id: string): Promise<Template | undefined> {
  const config = await readConfig();
  return config.templates.find(t => t.id === id);
}

export async function findTemplatesByIdentifier(identifier: string): Promise<Template[]> {
  const config = await readConfig();
  return config.templates.filter(template =>
    template.id === identifier || template.name === identifier
  );
}

export async function getTemplatesByIds(ids: string[]): Promise<Template[]> {
  const config = await readConfig();
  return config.templates.filter(template => ids.includes(template.id));
}

export async function removeTemplate(name: string): Promise<boolean> {
  const config = await readConfig();
  const index = config.templates.findIndex(t => t.name === name);
  if (index === -1) return false;
  const [removed] = config.templates.splice(index, 1);
  config.collections = config.collections.map(collection => ({
    ...collection,
    templateIds: collection.templateIds.filter(id => id !== removed.id)
  }));
  await writeConfig(config);
  return true;
}

export async function updateLastUsed(name: string): Promise<void> {
  const config = await readConfig();
  const template = config.templates.find(t => t.name === name);
  if (template) {
    template.lastUsed = new Date().toISOString();
    await writeConfig(config);
  }
}

// Collection operations
export async function addCollection(collection: Omit<Collection, 'id' | 'createdAt' | 'templateIds'>): Promise<Collection> {
  const config = await readConfig();
  const existing = config.collections.find(c => c.name === collection.name);
  if (existing) {
    throw new Error(`Collection "${collection.name}" already exists`);
  }
  const newCollection: Collection = {
    ...collection,
    id: generateId(),
    templateIds: [],
    createdAt: new Date().toISOString()
  };
  config.collections.push(newCollection);
  await writeConfig(config);
  return newCollection;
}

export async function getCollectionByName(name: string): Promise<Collection | undefined> {
  const config = await readConfig();
  return config.collections.find(collection => collection.name === name);
}

export async function getAllCollections(): Promise<Collection[]> {
  const config = await readConfig();
  return config.collections;
}

export async function removeCollection(name: string): Promise<boolean> {
  const config = await readConfig();
  const index = config.collections.findIndex(collection => collection.name === name);
  if (index === -1) return false;
  config.collections.splice(index, 1);
  await writeConfig(config);
  return true;
}

export async function addTemplateToCollection(collectionName: string, templateId: string): Promise<Collection> {
  const config = await readConfig();
  const collection = config.collections.find(item => item.name === collectionName);
  if (!collection) {
    throw new Error(`Collection "${collectionName}" not found`);
  }
  if (!collection.templateIds.includes(templateId)) {
    collection.templateIds.push(templateId);
  }
  await writeConfig(config);
  return collection;
}

export async function removeTemplateFromCollection(collectionName: string, templateId: string): Promise<Collection> {
  const config = await readConfig();
  const collection = config.collections.find(item => item.name === collectionName);
  if (!collection) {
    throw new Error(`Collection "${collectionName}" not found`);
  }
  collection.templateIds = collection.templateIds.filter(id => id !== templateId);
  await writeConfig(config);
  return collection;
}

// Project type operations
export async function getProjectTypes(): Promise<ProjectType[]> {
  const config = await readConfig();
  return config.projectTypes;
}

export async function getProjectTypeByName(name: string): Promise<ProjectType | undefined> {
  const config = await readConfig();
  return config.projectTypes.find(pt => pt.name === name);
}

export async function addProjectType(projectType: ProjectType): Promise<ProjectType> {
  const config = await readConfig();
  const existing = config.projectTypes.find(pt => pt.name === projectType.name);
  if (existing) {
    throw new Error(`Project type "${projectType.name}" already exists`);
  }
  config.projectTypes.push(projectType);
  await writeConfig(config);
  return projectType;
}

// Language operations
export async function getLanguages(): Promise<string[]> {
  const config = await readConfig();
  return config.languages;
}

export async function addLanguage(language: string): Promise<void> {
  const config = await readConfig();
  const normalized = language.toLowerCase();
  if (!config.languages.includes(normalized)) {
    config.languages.push(normalized);
    await writeConfig(config);
  }
}

// Recent projects operations
export async function addRecentProject(project: Omit<RecentProject, 'id' | 'createdAt'>): Promise<RecentProject> {
  const config = await readConfig();
  const newProject: RecentProject = {
    ...project,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  config.recentProjects.unshift(newProject); // Add to beginning (most recent first)
  
  // Keep only last 50 projects
  if (config.recentProjects.length > 50) {
    config.recentProjects = config.recentProjects.slice(0, 50);
  }
  
  await writeConfig(config);
  return newProject;
}

export async function getRecentProjects(options?: { type?: string; language?: string; limit?: number }): Promise<RecentProject[]> {
  const config = await readConfig();
  let projects = config.recentProjects;
  
  if (options?.type) {
    projects = projects.filter(p => p.type === options.type);
  }
  if (options?.language) {
    projects = projects.filter(p => p.language === options.language);
  }
  if (options?.limit) {
    projects = projects.slice(0, options.limit);
  }
  
  return projects;
}

export async function removeRecentProject(id: string): Promise<boolean> {
  const config = await readConfig();
  const index = config.recentProjects.findIndex(p => p.id === id);
  if (index === -1) return false;
  config.recentProjects.splice(index, 1);
  await writeConfig(config);
  return true;
}

// Path generation helpers
export function resolveProjectPath(projectType: ProjectType, language: string, projectName: string): string {
  // Structure: <base>/<language>/<project-name>
  return path.join(projectType.path, language, projectName);
}

export function expandTilde(filepath: string): string {
  if (filepath.startsWith('~')) {
    return path.join(os.homedir(), filepath.slice(1));
  }
  return filepath;
}

// Validation helpers
export function validateGitHubUrl(url: string): boolean {
  const githubUrlPattern = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+(\/.*)?$/;
  const githubSshPattern = /^git@github\.com:[\w-]+\/[\w.-]+\.git$/;
  return githubUrlPattern.test(url) || githubSshPattern.test(url);
}

export function normalizeGitHubUrl(url: string): string {
  if (url.startsWith('git@')) {
    const match = url.match(/git@github\.com:([\w-]+)\/([\w.-]+)\.git$/);
    if (match) {
      return `https://github.com/${match[1]}/${match[2]}`;
    }
  }
  // Remove /tree/, /blob/, and any other paths, keeping only the base repo URL
  const match = url.match(/^(https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+)/);
  return match ? match[1] : url.replace(/\/$/, '');
}
