import { Template } from '../types/index.js';

export function searchTemplates(templates: Template[], query: string): Template[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(template => {
    return (
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  });
}

export function filterTemplatesByTag(templates: Template[], tag: string): Template[] {
  const lowerTag = tag.toLowerCase();
  return templates.filter(template =>
    template.tags.some(t => t.toLowerCase() === lowerTag)
  );
}

export function sortTemplatesByLastUsed(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    if (!a.lastUsed) return 1;
    if (!b.lastUsed) return -1;
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });
}

export function parseTags(tagsString: string): string[] {
  return tagsString
    .split(',')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag.length > 0);
}
