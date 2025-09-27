// FILE: apps/cms/src/fields/icon.ts
import type { Field } from 'payload';

/**
 * BREAKING (fixed for build):
 *  - iconKeyField: relationship to 'icons' (unchanged from previous step)
 *  - iconColorField: now a relationship to 'themeTokens' (collection), not a dynamic select.
 */

export const iconKeyField = (name = 'icon', label = 'Icon'): Field => ({
  name,
  label,
  type: 'relationship',
  relationTo: 'icons',
  required: false,
  filterOptions: { enabled: { equals: true } },
});

export const iconColorField = (name = 'iconColor', label = 'Icon Color'): Field => ({
  name,
  label,
  type: 'relationship',
  relationTo: 'themeTokens',
  required: false,
  filterOptions: { enabled: { equals: true } },
});
