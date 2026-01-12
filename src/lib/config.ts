import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { Collection, Config, Template } from '../types/index.js';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'gtempl');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readConfig(): Promise<Config> {
  try {
    await ensureConfigDir();
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data) as Config;
    if (!parsed.collections) {
      parsed.collections = [];
      await writeConfig(parsed);
    }
    return parsed;
  } catch (error) {
    const defaultConfig: Config = {
      templates: [],
      collections: [],
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
