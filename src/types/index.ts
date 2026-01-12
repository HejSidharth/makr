export interface Template {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags: string[];
  createdAt: string;
  lastUsed?: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  templateIds: string[];
  createdAt: string;
}

export interface Config {
  templates: Template[];
  collections: Collection[];
  config: {
    defaultBranch: string;
    githubToken: string | null;
    clonePath: string;
  };
}

export interface AddOptions {
  name?: string;
  url?: string;
  description?: string;
  tags?: string;
}

export interface CloneOptions {
  dir?: string;
  branch?: string;
  fork?: boolean;
  keepGit?: boolean;
}

export interface ListOptions {
  filter?: string;
  collection?: string;
  json?: boolean;
}

export interface SearchOptions {
  collection?: string;
}

export interface CollectionCreateOptions {
  description?: string;
  tags?: string;
}

export interface CollectionListOptions {
  json?: boolean;
}

export interface CollectionScaffoldOptions {
  dir?: string;
  branch?: string;
  fork?: boolean;
  keepGit?: boolean;
}
