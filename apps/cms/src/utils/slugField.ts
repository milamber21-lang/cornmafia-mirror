// FILE: apps/cms/src/utils/slugField.ts
import type { Field, FieldHook } from 'payload';

export const toSlug = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);

export const generateSlugHook: FieldHook = ({ data, value }) => {
  if (typeof value === 'string' && value.trim().length > 0) return toSlug(value);
  const title = (data?.title as string) || (data?.name as string) || '';
  return title ? toSlug(title) : value;
};

export function slugField(required = true): Field {
  return {
    name: 'slug',
    type: 'text',
    required,
    unique: true,
    hooks: { beforeValidate: [generateSlugHook] },
    admin: { description: 'Lowercase URL slug (auto-generated from title; you can edit).' },
  };
}
