// FILE: apps/cms/src/globals/Nav.ts
import type { GlobalConfig, GlobalBeforeChangeHook } from 'payload';
import { cmsAdminOrPayloadAdmin } from '../access/isCmsAdmin';
import { iconColorField, iconKeyField } from '../fields/icon';

const idOf = (rel: any): string | undefined => {
  if (!rel) return undefined;
  if (typeof rel === 'object') return String(rel.id ?? rel);
  return String(rel);
};

async function validateNavItems(items: any[], payload: any) {
  if (!Array.isArray(items)) return;

  for (const catItem of items) {
    const catId = idOf(catItem?.category);
    if (!catId) continue;

    const cat = await payload.findByID({ collection: 'categories', id: String(catId), depth: 0 });
    if ((cat as any)?.navHidden) throw new Error(`Category ${(cat as any)?.slug || catId} is hidden from nav.`);

    const subArr = Array.isArray(catItem?.subcategories) ? catItem.subcategories : [];
    for (const subItem of subArr) {
      const subId = idOf(subItem?.subcategory);
      if (!subId) continue;

      const sub = await payload.findByID({ collection: 'subcategories', id: String(subId), depth: 0 });
      if ((sub as any)?.navHidden) throw new Error(`Subcategory ${(sub as any)?.slug || subId} is hidden from nav.`);

      const subCatId = idOf((sub as any)?.category);
      if (String(subCatId) !== String(catId)) {
        throw new Error(`Subcategory ${(sub as any)?.slug || subId} does not belong to the selected category`);
      }

      const pageArr = Array.isArray(subItem?.pages) ? subItem.pages : [];
      for (const pg of pageArr) {
        const pgId = idOf(pg?.page);
        if (!pgId) continue;

        const page = await payload.findByID({ collection: 'pages', id: String(pgId), depth: 0 });
        if ((page as any)?.navHidden) throw new Error(`Page ${(page as any)?.slug || pgId} is hidden from nav.`);

        const pageSubId = idOf((page as any)?.subcategory);
        if (String(pageSubId) !== String(subId)) {
          throw new Error(`Page ${(page as any)?.slug || pgId} does not belong to the selected subcategory`);
        }
      }
    }
  }
}

const validateBeforeChange: GlobalBeforeChangeHook = async ({ data, req }) => {
  const payload = req.payload;
  const items = Array.isArray(data?.items) ? data.items : [];

  for (const item of items) {
    const subs = Array.isArray(item?.subcategories) ? item.subcategories : [];
    if (subs.length > 4) throw new Error('Each category may include at most 4 subcategories.');
    for (const s of subs) {
      const pages = Array.isArray(s?.pages) ? s.pages : [];
      if (pages.length > 5) throw new Error('Each subcategory may include at most 5 pages.');
    }
  }

  await validateNavItems(items, payload);
  return data;
};

// Find the parent category id for a sub-row inside items[]
function findParentCategoryId(globalData: any, subRowId?: string): string | undefined {
  if (!subRowId) return undefined;
  const items: any[] = Array.isArray(globalData?.items) ? globalData.items : [];
  for (const it of items) {
    if (Array.isArray(it?.subcategories)) {
      if (it.subcategories.some((sc: any) => String(sc?.id) === String(subRowId))) {
        const cat = it?.category;
        if (!cat) return undefined;
        return typeof cat === 'object' ? String(cat.id ?? cat) : String(cat);
      }
    }
  }
  return undefined;
}

export const Nav: GlobalConfig = {
  slug: 'nav',
  access: {
    read: () => true,
    update: cmsAdminOrPayloadAdmin,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'Navigation Items',
      admin: {
        description: 'Order sets header menu order. Max 4 subcategories per category; 5 pages per subcategory.',
      },
      fields: [
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          filterOptions: { navHidden: { not_equals: true } },
        },

        iconKeyField('iconKeyOverride', 'Icon Override'),
        iconColorField('iconColorOverride', 'Icon Color Override'),

        {
          name: 'subcategories',
          type: 'array',
          label: 'Subcategories (max 4)',
          fields: [
            {
              name: 'subcategory',
              type: 'relationship',
              relationTo: 'subcategories',
              required: true,
              admin: { description: 'Picker is scoped by selected Category.' },
              filterOptions: ({ data, siblingData }) => {
                const rowId = (siblingData as any)?.id; // TS: siblingData is typed {}, cast for build
                const categoryId = findParentCategoryId(data, rowId);
                const base = { navHidden: { not_equals: true } } as any;
                return categoryId ? { and: [base, { category: { equals: categoryId } }] } : base;
              },
            },
            {
              name: 'pages',
              type: 'array',
              label: 'Pages (max 5)',
              fields: [
                {
                  name: 'page',
                  type: 'relationship',
                  relationTo: 'pages',
                  required: true,
                  admin: { description: 'Picker is scoped by selected Subcategory.' },
                  filterOptions: ({ siblingData }) => {
                    const subRel = (siblingData as any)?.subcategory;
                    const subId = typeof subRel === 'object' ? subRel?.id ?? subRel : subRel;
                    const base = { navHidden: { not_equals: true } } as any;
                    return subId ? { and: [base, { subcategory: { equals: subId } }] } : base;
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [validateBeforeChange],
  },
};
