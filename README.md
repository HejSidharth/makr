# gtempl

A modern CLI for managing GitHub project templates with a beautiful, interactive interface.

## Features

- Beautiful interactive prompts with modern UI
- Hybrid interface (interactive + command flags)
- Tag-based organization and filtering
- Search templates by name, description, or tags
- Clone templates with progress indicators
- Template collections for curated stacks
- Default clean clones (no `.git` history)
- Color-coded output and table views
- Persistent configuration storage
- Flexible URL handling (supports GitHub tree/blob paths)

## Installation

```bash
npm install -g gtempl
```

Or run directly with npx:

```bash
npx gtempl
```

## Quick Start

### Initialize Configuration

```bash
gtempl init
```

This will guide you through setting up your default clone path and other preferences.

### Add a Template

```bash
# Interactive mode
gtempl add

# Or with flags
gtempl add --name my-starter --url https://github.com/user/repo --tags typescript,react --description "Full-stack starter kit"

# Add from GitHub example directory
gtempl add --name nextjs-hello --url https://github.com/vercel/next.js/tree/canary/examples/hello-world --tags nextjs,react,example
```

### List Templates

```bash
# List all templates
gtempl list

# Filter by tag
gtempl list --filter typescript

# Output as JSON
gtempl list --json
```

### Clone a Template

```bash
# Clone with interactive confirmation (defaults to no .git)
gtempl clone my-starter

# Keep git history

gtempl clone my-starter --keep-git

# Fork privately before cloning

gtempl clone my-starter --fork

# Clone to specific directory
gtempl clone my-starter --dir ./my-project

# Clone specific branch
gtempl clone my-starter --branch develop
```

### Search Templates

```bash
# Search by name, description, or tags
gtempl search react

# Find templates with specific keywords
gtempl search fullstack
```

### Remove a Template

```bash
gtempl remove my-starter
```

### Create a Collection

```bash
# Create a collection
gtempl collection add web-stack --tags web,frontend

# Add templates to the collection
gtempl collection include web-stack react-starter
gtempl collection include web-stack nextjs-starter

# View collection details
gtempl collection show web-stack

# Scaffold (clone) all templates with confirmation
gtempl collection scaffold web-stack --dir ~/projects/web-stack
```

## Examples

### Setting Up a Workflow

```bash
# 1. Initialize your configuration
gtempl init

# 2. Add your favorite templates
gtempl add --name react-starter --url https://github.com/facebook/react --tags react,javascript,library

gtempl add --name nextjs-starter --url https://github.com/vercel/next.js/tree/canary/examples/hello-world --tags nextjs,react,ssr

gtempl add --name typescript-node --url https://github.com/microsoft/TypeScript-Node-Starter --tags typescript,node,backend

# 3. List all templates
gtempl list

# 4. Search for a specific template
gtempl search nextjs

# 5. Clone a template for a new project
gtempl clone nextjs-starter --dir ~/projects/my-new-app
```

### Using Tags Effectively

```bash
# Add templates with descriptive tags
gtempl add --name frontend-react --url https://github.com/user/frontend --tags frontend,react

gtempl add --name backend-node --url https://github.com/user/backend --tags backend,node

gtempl add --name fullstack-mern --url https://github.com/user/mern-starter --tags fullstack,mern

# Filter by tag
gtempl list --filter frontend
gtempl list --filter backend
gtempl list --filter fullstack
```

## Commands

### `gtempl init`

Initialize the gtempl configuration.

**Options:** None

**Example:**
```bash
$ gtempl init
┌─ Initialize gtempl ─────────────────────────────────┐

◆  Default clone path:
│  ~/projects

◆  Default branch:
│  main

◆  GitHub token (optional, for private repos):
│  ●•••

✓ Configuration saved successfully!
```

### `gtempl add [options]`

Add a new GitHub template.

**Options:**
- `-n, --name <name>` - Template name
- `-u, --url <url>` - GitHub repository URL
- `-d, --description <description>` - Template description
- `-t, --tags <tags>` - Comma-separated tags

**Examples:**
```bash
# Interactive mode with prompts
$ gtempl add

# With all flags
$ gtempl add --name nextjs-starter --url https://github.com/user/nextjs-starter --tags nextjs,typescript,react --description "A Next.js starter template"

# From GitHub example directory
$ gtempl add --name hello-world --url https://github.com/vercel/next.js/tree/canary/examples/hello-world
```

### `gtempl list [options]`

List all saved templates.

**Options:**
- `-f, --filter <tag>` - Filter by tag
- `-c, --collection <name>` - Filter by collection
- `--json` - Output as JSON

**Examples:**
```bash
# List all templates
$ gtempl list
┌─ All Templates ─────────────────────────────────┐
Found 3 template(s)
┌─────────────────┬───────────────────────┬───────────────┬──────────────────────┐
│ Name            │ URL                   │ Tags          │ Description          │
├─────────────────┼───────────────────────┼───────────────┼──────────────────────┤
│ react-starter   │ github.com/facebook... │ react, js     │ React library        │
└─────────────────┴───────────────────────┴───────────────┴──────────────────────┘

# Filter by tag
$ gtempl list --filter typescript

# Filter by collection
$ gtempl list --collection web-stack

# JSON output
$ gtempl list --json
```


### `gtempl clone <name> [options]`

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
$ gtempl clone nextjs-starter
✔ Template cloned to: ~/projects/nextjs-starter
✓ Ready to start coding!

# Keep git history
$ gtempl clone nextjs-starter --keep-git

# Fork privately before cloning
$ gtempl clone nextjs-starter --fork

# Clone to specific directory
$ gtempl clone nextjs-starter --dir ./my-new-project

# Clone specific branch
$ gtempl clone nextjs-starter --branch develop
```

### `gtempl remove <name>`

Remove a saved template.

**Arguments:**
- `<name>` - Template name to remove

**Example:**
```bash
$ gtempl remove old-template
✓ Template "old-template" removed successfully
```

### `gtempl collection`

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
$ gtempl collection add web-stack --tags web,frontend

# Add templates to a collection
$ gtempl collection include web-stack react-starter

# Show collection templates
$ gtempl collection show web-stack

# Scaffold all templates
$ gtempl collection scaffold web-stack --dir ~/projects/web-stack

# Scaffold with forks and keep git history
$ gtempl collection scaffold web-stack --fork --keep-git
```

### `gtempl search <query>`

Search templates by name, description, or tags.

**Arguments:**
- `<query>` - Search query

**Options:**
- `-c, --collection <name>` - Search within a collection

**Example:**
```bash
$ gtempl search react
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

Templates and settings are stored in `~/.config/gtempl/config.json`. A GitHub token is required for `--fork` and can be set via `gtempl init`.

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
