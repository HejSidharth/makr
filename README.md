# makr

A smart project organizer for creating, organizing, and managing development projects with templates.

## Features

- ✨ Interactive project wizard (`makr new`)
- 🧭 Organize projects by type + language
- 🏷️ Tag-based template organization and filtering
- 🔍 Search templates by name, description, or tags
- 📦 Clone or fork templates with progress indicators
- 🧩 Template collections for curated stacks
- 🧼 Default clean clones (no `.git` history)
- 🕘 Recent projects tracking (`makr projects`)
- 💾 Persistent configuration storage
- 🔧 Flexible URL handling (supports GitHub tree/blob paths)

## Installation

```bash
npm install -g makr
```

Or run directly with npx:

```bash
npx makr
```

## Quick Start

### Initialize Configuration

```bash
makr init
```

This will guide you through setting up your default clone path and other preferences.

### Create a Project

```bash
makr new
```

This launches an interactive wizard that organizes projects by type and language.

### View Recent Projects

```bash
makr projects
```

### Add a Template

```bash
# Interactive mode
makr add

# Or with flags
makr add --name my-starter --url https://github.com/user/repo --tags typescript,react --description "Full-stack starter kit"

# Add from GitHub example directory
makr add --name nextjs-hello --url https://github.com/vercel/next.js/tree/canary/examples/hello-world --tags nextjs,react,example
```

### List Templates

```bash
# List all templates
makr list

# Filter by tag
makr list --filter typescript

# Output as JSON
makr list --json
```

### Clone a Template

```bash
# Clone with interactive confirmation (defaults to no .git)
makr clone my-starter

# Keep git history

makr clone my-starter --keep-git

# Fork privately before cloning

makr clone my-starter --fork

# Clone to specific directory
makr clone my-starter --dir ./my-project

# Clone specific branch
makr clone my-starter --branch develop
```

### Search Templates

```bash
# Search by name, description, or tags
makr search react

# Find templates with specific keywords
makr search fullstack
```

### Remove a Template

```bash
makr remove my-starter
```

### Create a Collection

```bash
# Create a collection
makr collection add web-stack --tags web,frontend

# Add templates to the collection
makr collection include web-stack react-starter
makr collection include web-stack nextjs-starter

# View collection details
makr collection show web-stack

# Scaffold (clone) all templates with confirmation
makr collection scaffold web-stack --dir ~/projects/web-stack
```

## Examples

### Setting Up a Workflow

```bash
# 1. Initialize your configuration
makr init

# 2. Add your favorite templates
makr add --name react-starter --url https://github.com/facebook/react --tags react,javascript,library

makr add --name nextjs-starter --url https://github.com/vercel/next.js/tree/canary/examples/hello-world --tags nextjs,react,ssr

makr add --name typescript-node --url https://github.com/microsoft/TypeScript-Node-Starter --tags typescript,node,backend

# 3. List all templates
makr list

# 4. Search for a specific template
makr search nextjs

# 5. Clone a template for a new project
makr clone nextjs-starter --dir ~/projects/my-new-app
```

### Using Tags Effectively

```bash
# Add templates with descriptive tags
makr add --name frontend-react --url https://github.com/user/frontend --tags frontend,react

makr add --name backend-node --url https://github.com/user/backend --tags backend,node

makr add --name fullstack-mern --url https://github.com/user/mern-starter --tags fullstack,mern

# Filter by tag
makr list --filter frontend
makr list --filter backend
makr list --filter fullstack
```

## Commands

### `makr init`

Initialize the makr configuration.

**Options:** None

**Example:**
```bash
$ makr init
┌─ Initialize makr ─────────────────────────────────┐

◆  Default clone path:
│  ~/projects

◆  Default branch:
│  main

◆  GitHub token (optional, for private repos):
│  ●•••

✓ Configuration saved successfully!
```

### `makr new`

Create a new project with the interactive wizard.

**Options:**
- `-n, --name <name>` - Project name
- `-t, --type <type>` - Project type (official, experiment, learning, playground)
- `-l, --language <lang>` - Programming language
- `--template <name>` - Use a saved template by name
- `--url <url>` - Use a GitHub URL as template

**Example:**
```bash
$ makr new
```

### `makr projects`

List and manage recent projects.

**Options:**
- `-t, --type <type>` - Filter by project type
- `-l, --language <lang>` - Filter by language
- `-n, --limit <number>` - Number of projects to show
- `--json` - Output as JSON

**Examples:**
```bash
$ makr projects
$ makr projects open my-awesome-app
$ makr projects clean
$ makr projects remove my-awesome-app
```

### `makr add [options]`

Add a new GitHub template.

**Options:**
- `-n, --name <name>` - Template name
- `-u, --url <url>` - GitHub repository URL
- `-d, --description <description>` - Template description
- `-t, --tags <tags>` - Comma-separated tags

**Examples:**
```bash
# Interactive mode with prompts
$ makr add

# With all flags
$ makr add --name nextjs-starter --url https://github.com/user/nextjs-starter --tags nextjs,typescript,react --description "A Next.js starter template"

# From GitHub example directory
$ makr add --name hello-world --url https://github.com/vercel/next.js/tree/canary/examples/hello-world
```

### `makr list [options]`

List all saved templates.

**Options:**
- `-f, --filter <tag>` - Filter by tag
- `-c, --collection <name>` - Filter by collection
- `--json` - Output as JSON

**Examples:**
```bash
# List all templates
$ makr list
┌─ All Templates ─────────────────────────────────┐
Found 3 template(s)
┌─────────────────┬───────────────────────┬───────────────┬──────────────────────┐
│ Name            │ URL                   │ Tags          │ Description          │
├─────────────────┼───────────────────────┼───────────────┼──────────────────────┤
│ react-starter   │ github.com/facebook... │ react, js     │ React library        │
└─────────────────┴───────────────────────┴───────────────┴──────────────────────┘

# Filter by tag
$ makr list --filter typescript

# Filter by collection
$ makr list --collection web-stack

# JSON output
$ makr list --json
```


### `makr clone <name> [options]`

Clone a template to your local machine.

**Arguments:**
- `<name>` - Template name to clone

**Options:**
- `-d, --dir <path>` - Target directory (default: ~/projects/<name>)
- `-b, --branch <branch>` - Specific branch to clone
- `--fork` - Fork the template before cloning (private by default, requires token)
- `--keep-git` - Keep git history in the cloned folder

**Examples:**
```bash
# Clone with defaults (no .git history)
$ makr clone nextjs-starter
✔ Template cloned to: ~/projects/nextjs-starter
✓ Ready to start coding!

# Keep git history
$ makr clone nextjs-starter --keep-git

# Fork privately before cloning
$ makr clone nextjs-starter --fork

# Clone to specific directory
$ makr clone nextjs-starter --dir ./my-new-project

# Clone specific branch
$ makr clone nextjs-starter --branch develop
```

### `makr remove <name>`

Remove a saved template.

**Arguments:**
- `<name>` - Template name to remove

**Example:**
```bash
$ makr remove old-template
✓ Template "old-template" removed successfully
```

### `makr collection`

Manage template collections for curated stacks.

**Subcommands:**
- `collection add <name>` - Create a collection
- `collection list` - List collections
- `collection show <name>` - Show collection details
- `collection include <collection> <template>` - Add template by name or ID
- `collection remove <collection> <template>` - Remove template from collection
- `collection delete <name>` - Delete a collection
- `collection scaffold <name>` - Clone all templates with confirmation (supports `--fork` and `--keep-git`)

**Examples:**
```bash
# Create a collection
$ makr collection add web-stack --tags web,frontend

# Add templates to a collection
$ makr collection include web-stack react-starter

# Show collection templates
$ makr collection show web-stack

# Scaffold all templates
$ makr collection scaffold web-stack --dir ~/projects/web-stack

# Scaffold with forks and keep git history
$ makr collection scaffold web-stack --fork --keep-git
```

### `makr search <query>`

Search templates by name, description, or tags.

**Arguments:**
- `<query>` - Search query

**Options:**
- `-c, --collection <name>` - Search within a collection

**Example:**
```bash
$ makr search react
┌─ Search Results: "react" ─────────────────────────────────┐
Found 2 template(s)
┌─────────────────┬──────────────────────┬────────────────┐
│ Name            │ Description          │ Tags           │
├─────────────────┼──────────────────────┼────────────────┤
│ react-starter   │ React library        │ react, js      │
│ nextjs-starter  │ Next.js starter      │ react, nextjs  │
└─────────────────┴──────────────────────┴────────────────┘
```

## Configuration

Templates, project types, and recent projects are stored in `~/.config/makr/config.json`. A GitHub token is required for `--fork` and can be set via `makr init`.

**Config Structure:**
```json
{
  "templates": [
    {
      "id": "unique-id",
      "name": "my-starter",
      "url": "https://github.com/user/repo",
      "description": "Template description",
      "tags": ["typescript", "react"],
      "createdAt": "2025-01-11T00:00:00.000Z",
      "lastUsed": "2025-01-11T00:00:00.000Z"
    }
  ],
  "collections": [
    {
      "id": "collection-id",
      "name": "web-stack",
      "description": "Frontend starter kit",
      "tags": ["web", "frontend"],
      "templateIds": ["unique-id"],
      "createdAt": "2025-01-11T00:00:00.000Z"
    }
  ],
  "projectTypes": [
    {
      "name": "official",
      "path": "~/projects",
      "description": "Production-ready projects"
    }
  ],
  "languages": ["typescript", "python", "rust"],
  "recentProjects": [
    {
      "id": "recent-id",
      "name": "my-awesome-app",
      "path": "~/experiments/typescript/my-awesome-app",
      "type": "experiment",
      "language": "typescript",
      "createdAt": "2025-01-11T00:00:00.000Z"
    }
  ],
  "config": {
    "defaultBranch": "main",
    "githubToken": null,
    "clonePath": "~/projects"
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Link for local testing
npm link
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
