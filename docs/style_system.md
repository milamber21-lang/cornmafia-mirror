<!-- FILE: docs/style_system.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Corn Mafia Style System

## Purpose

This document defines the Corn Mafia styling ownership model, CSS layer model, token/theme model, brand implementation rules, UI primitive rules, and inline style exception registry.

Use this file for CSS/style cleanup passes, visual system work, brand implementation, and UI primitive normalization.

For architecture and DB boundaries, use `docs/project_definition.md`.
For TypeScript, route, helper, SQL, and generation rules, use `docs/codebase_rules.md`.

---

## 1. Core ownership rule

TypeScript and TSX own structure, state, data, and composition.

CSS owns visual styling.

Reusable styled UI belongs in `components/ui`.

Domain components compose UI primitives and apply semantic class names.

Inline style is forbidden except for audited computed-value exceptions listed in this document.

---

## 2. TS and TSX ownership

TS and TSX files may own:

- component structure
- data loading
- state
- event handlers
- validation
- conditional rendering
- composition
- semantic class names
- component props
- variant, tone, size, density, and layout props
- safe mapping from semantic props to class names
- accessibility attributes
- aria attributes
- data attributes used by CSS

Preferred:

```tsx
<Surface tone="default" density="comfortable">
  <AdminTableToolbar search={search} onSearchChange={setSearch} />
</Surface>
```

Allowed:

```tsx
<div className="admin-content-shell" data-state={open ? "open" : "closed"}>
```

Avoid:

```tsx
<div style={{ padding: 16, border: "1px solid var(--color-border)" }}>
```

Avoid utility-heavy final-state class strings:

```tsx
<div className="rounded-2xl border border-[var(--color-border)] bg-black/20 p-4">
```

---

## 3. CSS ownership

CSS files own:

- colors
- backgrounds
- surfaces
- borders
- border radius
- shadows
- spacing
- padding
- margin
- gaps
- layout behavior
- display behavior
- grid and flex rules
- widths and heights
- max widths and min widths
- typography
- font size
- font weight
- line height
- opacity
- transitions
- transforms when not computed by runtime state
- z-indexes
- object-fit
- visual overflow behavior
- responsive visual behavior
- focus rings
- hover states
- active states
- disabled states
- reduced-motion styling

Preferred:

```css
.admin-content-shell {
  display: grid;
  gap: var(--space-6);
}
```

---

## 4. UI primitive ownership

`components/ui` owns reusable visual primitives.

A UI primitive may own:

- semantic prop interface
- safe class name selection
- shared accessibility structure
- repeated layout structure
- repeated visual shell structure
- reusable tone and variant mapping
- common empty, loading, error, and success surfaces

A UI primitive should not hardcode visual values in TSX.

Preferred:

```tsx
<Button variant="primary" size="sm">
  Save
</Button>
```

The visual details belong in CSS:

```css
.ui-button {
  border-radius: var(--radius-control);
}

.ui-button--primary {
  background: var(--color-action);
}
```

Shared buttons use semantic variants across every app context:

```text
primary   = create, save, confirm, insert, upload, or select
secondary = edit, manage, back, close, retry, or ordinary navigation
quiet     = low-emphasis toolbar and inline actions
danger    = delete, remove, hide, or destructive confirmation
success   = explicit enabled, visible, active-success, or completed state
```

Rules:

- do not use color names as button variants
- `Button` and `ButtonLink` must render the same visual system
- loading must preserve the original label width and expose `aria-busy`
- loading buttons and button links must block repeated interaction
- destructive actions must use `danger`
- green/success styling must not be used as the default create/save treatment
- domain components must not recreate button backgrounds, borders, shadows, or hover treatment

---

## 5. Domain component ownership

Domain components may own:

- business-specific rendering
- row data
- route-specific actions
- field lists
- labels
- domain words
- which primitive is used
- semantic class names when a domain section needs a CSS hook

Domain components should not manually restyle common cards, tables, buttons, banners, panels, forms, or media previews.

Preferred:

```tsx
<AdminTableShell>
  <AdminTableToolbar
    title="Content"
    search={search}
    onSearchChange={setSearch}
  />
  <ContentRows rows={rows} />
</AdminTableShell>
```

Avoid:

```tsx
<section className="rounded-2xl border border-[var(--color-border)] bg-[color-mix(in_oklab,var(--color-surface)_80%,transparent)] p-5">
```

---

## 6. CSS file ownership

The current CSS architecture is layered through `apps/web/src/app/globals.css`.

### 6.1 `apps/web/src/app/globals.css`

Owns:

- imports for CSS layers
- global app bootstrap only
- unavoidable Next/app global setup

It should not become the dumping ground for every style.

Current import order should remain intentional:

```text
base-colors.css
themes.css
tokens.css
base.css
layout.css
ui.css
chrome.css
admin.css
forms.css
tables.css
media.css
content-prose.css
editor.css
member.css
public.css
```

### 6.2 `apps/web/src/styles/base-colors.css`

Owns raw brand/base palette values.

Allowed here:

- raw brand colors
- raw official palette colors
- raw base black/white/red definitions
- root color aliases that seed theme files

Raw color values should be concentrated here unless a one-off technical reason exists.

### 6.3 `apps/web/src/styles/themes.css`

Owns theme role mapping and theme variants.

This includes:

- dark theme roles
- light or alternate theme roles if added later
- semantic color role mapping
- surface role mapping
- action role mapping
- text role mapping

### 6.4 `apps/web/src/styles/tokens.css`

Owns non-color and cross-system design tokens.

This includes:

- spacing scale
- radius scale
- shadow scale
- z-index scale
- typography scale
- transition scale
- reusable non-color derived tokens

### 6.5 `apps/web/src/styles/base.css`

Owns:

- reset
- html/body baseline
- global link baseline
- global image baseline
- global button/input reset where appropriate
- default focus ring behavior

### 6.6 `apps/web/src/styles/layout.css`

Owns generic layout:

- `.main`
- `.container`
- `.card`
- page shells
- layout grids
- reusable surface layout classes
- general section spacing

### 6.7 `apps/web/src/styles/ui.css`

Owns reusable UI primitive visuals:

- buttons
- badges
- banners
- inputs
- panels
- surfaces
- separators
- pagination
- primitive loading/error/empty states

### 6.8 `apps/web/src/styles/chrome.css`

Owns site chrome:

- header
- navigation
- public menu
- footer
- footer explore areas
- global top/bottom app shells

### 6.9 `apps/web/src/styles/admin.css`

Owns admin surface classes:

- admin page headers
- admin page shells
- admin dashboards
- admin cards
- admin toolbars
- admin action rows
- admin metadata rows
- admin empty states when not table-specific
- navigation designer static visuals

### 6.10 `apps/web/src/styles/forms.css`

Owns form and panel form styling:

- form rows
- labels
- help text
- field errors
- input groups
- panel form spacing
- submit bars
- metadata loading/error blocks
- validation layout

### 6.11 `apps/web/src/styles/tables.css`

Owns table styling:

- table wrappers
- admin table shells
- column width classes
- action cell classes
- loading rows
- empty rows
- table toolbar layout
- responsive table behavior

### 6.12 `apps/web/src/styles/media.css`

Owns media and file visuals:

- media preview frames
- image frames
- file tiles
- upload dropzones
- icon wells
- SVG icon wrappers
- avatar frames
- thumbnail grids

### 6.13 `apps/web/src/styles/content-prose.css`

Owns the semantic Rich Text typography shared by authoring and rendered content:

- headings and paragraph rhythm
- lists and quotations
- links and inline/block code
- separators
- main-content prose treatment
- compact sidebar prose treatment
- editorial image presentation shared by editor and renderer

This file must not contain editor selection handles, resize controls, toolbars, or other authoring-only chrome.

### 6.14 `apps/web/src/styles/editor.css`

Owns editor visuals:

- rich text content
- editor shell
- editor canvas
- image wrappers
- image resize handles
- drag ghosts
- drop indicators
- editor toolbar
- editor popups when editor-specific

Editor runtime geometry may remain an inline-style exception when documented.

### 6.15 `apps/web/src/styles/member.css`

Owns member surfaces:

- member profile cards
- member dashboard sections
- member access summaries
- member content authoring cards
- member media cards
- member series cards

### 6.16 `apps/web/src/styles/public.css`

Owns public surfaces:

- public landing placeholders
- public collection grids
- public content cards
- public category/subcategory cards
- public series surfaces
- public unavailable states
- public empty states

---

## 7. Shared material foundation and reusable UI primitives

The shared material foundation promotes the proven Riseopedia visual grammar without making generic surfaces depend on `riseopedia-*` selectors.

Current shared material tokens include:

```text
--radius-compact
--radius-control
--radius-module
--radius-structure
--shadow-structure
--shadow-module
--shadow-interactive
--shadow-interactive-hover
--shadow-inset
--shadow-icon-well
--shadow-media-inset
--measure-compact
--measure-summary
--measure-readable
```

Existing Riseopedia shadow token names remain compatibility aliases over the generic material tokens. New public, member, admin, and content surfaces should use the generic names.

### Implemented shared surface primitives

The shared surface family is exported from:

```text
apps/web/src/components/ui/basic-elements/Surface.tsx
apps/web/src/components/ui/index.ts
```

Implemented primitives:

- `SurfaceCard`
- `SurfacePanel`
- `PageHero`
- `SectionHeader`
- `IconWell`
- `MediaWell`
- `StatusPill`
- `SurfaceMetaRow`
- `SurfaceState`

`SurfaceCard` and `SurfacePanel` support opt-in material depth:

```text
plain
module
structure
inset
```

The default is `plain` so existing consumers do not change appearance until they are migrated intentionally.

`PageHero` supports optional breadcrumbs, eyebrow, icon, summary, body, metadata, actions, and media slots. Optional slot wrappers are rendered only when a slot value exists. This allows page headers to collapse cleanly when images, metadata, or actions are absent.

`SurfaceMetaRow` removes empty metadata entries before rendering and preserves valid values such as `0`.

`SurfaceState` provides shared empty, loading, error, success, and informational state structure with default accessibility semantics.

### Shared browse grammar and application icon visuals

Browse, directory, series, and profile overview pages use a dedicated shared grammar instead of forcing the media-oriented `PageHero` into every overview surface.

Implemented shared browse primitives:

```text
apps/web/src/components/ui/browse/BrowsePageHeader.tsx
apps/web/src/components/ui/browse/BrowseSurfaces.tsx
apps/web/src/components/ui/browse/BrowseResultCard.tsx
apps/web/src/components/ui/IconVisual.tsx
```

Responsibilities:

- `BrowsePageHeader` owns breadcrumbs or an eyebrow, the page title, an optional description, and right-aligned count/actions
- an absent description creates no description element, while the fixed browse-header rhythm still reserves the same two-line description row so overview headers remain equal in height
- `BrowseFilterPanel` is the separate inset control surface between the header and results
- `BrowseResultsPanel` owns result cards, empty states, and pagination
- `BrowsePanelHeader` provides the matching title/description/action anatomy inside results modules
- `BrowseResultCard` provides common visual, metadata, title, summary, detail, and destination-affordance slots
- optional card slots create no wrapper when their value is absent

Application icon responsibilities remain deliberately split:

```text
IconRender
= resolves the application icon source, color, fallback, media route, and accessibility

IconVisual
= global Riseopedia-derived square material shell around IconRender

RiseopediaEntityVisual
= game entity media, fallback imagery, fit modes, and rarity-aware visuals

Editorial media
= normal page images and diagrams without an icon well
```

`PublicTaxonomyIcon` is a temporary compatibility wrapper over `IconVisual`. New general-purpose app icon consumers should use `IconVisual` directly. Riseopedia overview headers and browse panels consume the promoted shared browse primitives while entity-specific media remains under the Riseopedia component family.

### Editorial image presentation

Editorial images are separate from application icon wells and Riseopedia entity visuals.

Current rules:

- Rich Text images are borderless by default
- the selected-image toolbar provides an explicit `Border` toggle
- image presentation is stored in Rich Text JSON as `frameStyle = none | border`
- older images without `frameStyle` normalize to `none`
- editor and public renderer use the same `has-border` semantic class and the same static CSS
- editor selection outlines, resize handles, move handles, and link badges are editor-only controls and do not change the published frame choice
- standalone template image fields are borderless by default
- non-image file links keep their normal interactive file-card treatment
- `IconVisual` remains restricted to application icons
- `RiseopediaEntityVisual` remains responsible for game/entity media

The frame choice is serialized inside the existing Rich Text JSON. It does not require a new SQL column or object family.

Current public/member overview migrations:

```text
category overview
subcategory/collection overview
public series overview
member profile overview
```

These surfaces now use the same fixed `BrowsePageHeader` geometry as Riseopedia/Mafiosopedia: one breadcrumb row, one title/action row, and a two-line description row. Category and subcategory descriptions remain absent when the current DB contract does not provide them; no filler copy or empty description element is rendered, but the shared structural row is intentionally retained so every overview header has the same height.

Category, collection, and series controls use a separate `BrowseFilterPanel` before a `BrowseResultsPanel`. Series defaults to semantic series-part order and also provides reverse order, newest, oldest, and title sorting. Public category, collection, and series cards consume the shared browse-card geometry and global application icon visual. Profile workspace application actions also use `IconVisual`; the member avatar remains identity media and is not placed inside an application icon well.

### Destination-driven content use

The existing template destinations remain the content layout system:

```text
Hero
Top
Left
Main
Right
Bottom
Hidden
SEO
```

Shared primitives do not introduce a second page-type or header-type model.

Rules:

- a template with one or more configured Hero fields renders the shared `PageHero` and the canonical content title
- the canonical summary renders in Hero only when it contains non-empty text
- content Hero breadcrumbs are system-derived from category, subcategory, and current title; `hero_overline` is retired and never renders
- a template without Hero fields renders no page header, header spacing, or placeholder shell
- empty optional Hero modules render no wrapper, border, column, or reserved space
- Hero media creates the media column only after the referenced media resolves to a safe renderable URL
- content Hero geometry mirrors Riseopedia overview headers: `11.5rem` minimum height below `48rem`, `12.5rem` at and above `48rem`, and explicit breadcrumb/title/two-line-summary rows
- the summary row reserves two `1.5rem` lines even for a one-line or absent summary; exceptional breadcrumb/title wrapping may still grow the panel rather than clip content
- on wide layouts Hero media is absolutely positioned in the existing second grid area, uses block-only negative margins two pixels smaller than the Hero padding, keeps the normal horizontal inset, and must not contribute additional height to the Hero grid track
- every Hero media wrapper, including the inner media frame, participates in the definite-height chain so the image scales fully inside the unchanged panel; the image preserves its intrinsic aspect ratio and places the visible border/radius/shadow on the rendered image box so the frame hugs the image
- below the side-by-side breakpoint Hero media returns to normal flow and may increase the page section height rather than overlap copy
- Top and Bottom render as independent full-width shared module panels only when populated
- Left, Main, and Right render as independent regions selected from the populated destination combination
- a missing Left or Right destination creates no region, grid track, minimum width, or reserved gap
- Main always receives the complete remaining flexible width after the populated side destinations are assigned
- a full-width Main field may use the complete Main destination width; the renderer must not impose a generic readable-measure cap on the destination itself
- explicit `half` and `third` template field widths remain respected inside the width available to their destination
- the narrow-screen content order is Main, Left, Right; desktop CSS places Left and Right around Main when present
- Bottom remains outside Main and spans the full content width
- Hidden and SEO never create visible surfaces
- public field values must be both present and safely renderable before their visual field cell is created
- admin preview may retain explicit diagnostics for unresolved media and invalid YouTube values without exposing those warnings publicly
- renderer-specific featured content may be promoted to a full-width module without replacing the shared destination shell

Implemented content renderer files:

```text
apps/web/src/components/renderers/content/ContentPageHero.tsx
apps/web/src/components/renderers/content/ContentDestinationPanel.tsx
apps/web/src/components/renderers/content/ContentRenderShell.tsx
apps/web/src/components/renderers/content/ContentFieldGroup.tsx
apps/web/src/components/renderers/content/field-utils.ts
```

### Normal content material and published fields

Normal destination surfaces use role-specific material depth without changing their established density or padding:

```text
Hero   = shared structural page hero
Top    = full-width module material
Main   = structural reading material
Left   = inset supporting material
Right  = inset supporting material
Bottom = full-width closing module material
```

Rules:

- existing destination panel padding, page-shell padding, grid gaps, and destination widths remain unchanged
- material differentiation comes from background layers, borders, inset highlights, and shadows rather than nested cards
- Main remains one reading surface and does not wrap every Rich Text section in another panel
- Hero fields remain modular; absent media, summaries, labels, and values create no visual wrapper
- field frames expose semantic presentation classes for prose, media, embeds, facts, status values, and links
- field frames also expose destination and label-mode classes so published fields can be styled consistently without changing template data
- title labels act as local section headings; ordinary labels remain secondary to their values
- option and boolean values keep compact status treatment; ordinary text, dates, and numbers remain content facts rather than disabled-form visuals
- URL fields use the shared public link treatment and preserve visible keyboard focus
- `content-prose.css` owns the final heading, paragraph, list, quotation, code, separator, and link treatment for Main, default, and sidebar prose
- the same prose classes remain active in the editor and live preview, so material and typography changes are visible before save
- editorial media remains borderless unless its explicit saved frame choice requests a border

### Authoring and renderer parity

Admin and member content authoring use the same semantic prose rules, destination geometry, render model, and `ContentRenderer` as saved public/admin rendering.

Rules:

- `tokens.css` owns the shared page width, destination padding, layout gap, and sidebar-width geometry used by both renderer and editor
- the Rich Text editor derives its canvas width from the current destination combination: Hero/Top/Bottom, Main-only, Main with Left, Main with Right, Main with both sidebars, Left, or Right
- template field width codes `full`, `half`, and `third` constrain the editor canvas exactly as they constrain rendered fields
- `content-prose.css` owns semantic Rich Text typography shared by editable and rendered content
- editor-only toolbars, selection outlines, resize handles, drag indicators, and popups remain in `editor.css`
- admin and member authoring build an in-memory `ContentRenderModel` from the current unsaved title, summary, template, series, field values, option labels, and media selections
- guarded preview endpoints render that model through the real `ContentRenderer`; no preview-only renderer or saved draft is required
- authoring provides Fields, Preview, Split, and full-screen preview modes with desktop and mobile viewport choices
- preview links, buttons, and forms are inert so authoring preview cannot navigate or submit nested actions
- admin preview keeps admin media scope and admin/editor guards
- member preview keeps member actor ownership, member-authorable collection metadata, app media scope, rate limiting, and same-origin protection
- empty destinations, optional values, invalid references, image framing, Hero presence, sidebars, and Bottom placement therefore follow the same renderer rules before and after save

Implemented parity files:

```text
apps/web/src/components/authoring/ContentAuthoringWorkspace.tsx
apps/web/src/components/authoring/ContentLivePreview.tsx
apps/web/src/lib/helpers/content-preview.ts
apps/web/src/lib/server/content-preview-render.tsx
apps/web/src/app/api/admin/web/content/preview/route.ts
apps/web/src/app/api/me/content/preview/route.ts
apps/web/src/styles/content-prose.css
```

### Public category and collection surfaces

The public taxonomy routes use the shared material grammar without importing Riseopedia-specific selectors:

```text
/<category>
/<category>/<subcategory>
```

Rules:

- category and collection overviews use the shared `BrowsePageHeader` geometry
- category and subcategory icon/color metadata comes from the existing DB-resolved public contracts
- collection directory cards and content cards use shared material tokens for structure, icon wells, interaction, and focus
- category pages emphasize collection discovery and show a limited recent-content section
- collection hubs preserve search, content-kind/template filters, sorting, pagination, Create, and Manage behavior
- missing dates, summaries, icons, or other optional metadata render no placeholder separators or empty wrappers
- public route access remains actor-aware and DB-resolved through the existing `web_api.web_content_public_list_category` and `web_api.web_content_public_list_subcategory` functions

Implemented public files:

```text
apps/web/src/components/public/PublicCategoryHub.tsx
apps/web/src/components/public/PublicCollectionHub.tsx
apps/web/src/components/public/PublicContentCard.tsx
apps/web/src/components/public/PublicTaxonomyIcon.tsx
```

### Member profile and workspace surfaces

The `/me` profile route uses the shared material grammar while preserving member-specific APIs, ownership, validation, and mutation behavior.

Rules:

- the member identity uses the shared `BrowsePageHeader` geometry with compact avatar/status/action composition
- Edit Profile is an identity action and does not appear as a fourth workspace destination card
- member Content, Media, and Series destinations use shared material cards and icon wells
- the account overview uses compact definition rows instead of equally weighted statistic cards
- optional profile notes render only when a non-empty value exists
- guild roles use compact role rows inside a shared module panel instead of large independent cards
- Discord role colors remain a documented runtime CSS custom-property exception
- loading, empty, and error states use `SurfaceState`
- the profile editor reuses the shared `Panel` chrome but keeps the member-specific `/api/me` contract and theme-loading behavior
- failed profile saves do not call `onSaved` and do not close the panel

Implemented member profile files:

```text
apps/web/src/components/me/MeTable.tsx
apps/web/src/components/me/MePanel.tsx
apps/web/src/components/login/RolesPanel.tsx
```

### Remaining public series, internal-page, and footer surfaces

The public series and internal-page routes use the same shared material grammar as category, collection, content, and member surfaces.

Rules:

- `/series/<slug>` uses `BrowsePageHeader`, shared browse panels/cards, `SurfaceMetaRow`, `SurfaceState`, and the shared application icon visual
- series descriptions, collection metadata, part numbers, dates, summaries, and episode grids render only when their values exist
- series episodes are an ordered set of full-card links with the same material interaction and focus treatment as public discovery cards
- previous/current/next series navigation remains a separate content-footer module and uses shared module/interactive material tokens
- homepage, privacy, terms, and unavailable routes remain DB-backed internal content pages rendered through the normal destination system
- internal routes receive semantic route wrapper classes only for public-page context and reading-width refinement; they do not force Hero or any other destination
- privacy and terms may use a narrower route shell, while their Main destination still consumes all width available inside that shell
- public rich-text typography may refine headings, lists, quotations, links, code, images, and separators without imposing a generic max-width on Main
- the footer Explore markup, grouping, ordering, density, and DB-driven navigation model remain unchanged
- footer work is visual only: surfaces, border depth, contrast, focus, hover, motion, and theme behavior
- footer Explore continues to read the existing `footer_main` navigation slot and does not introduce a new navigation or SQL contract

Implemented public files:

```text
apps/web/src/components/public/PublicSeriesPage.tsx
apps/web/src/components/public/PublicInternalContentPageRoute.tsx
apps/web/src/styles/public.css
apps/web/src/styles/chrome.css
```

### Remaining normalization targets

The following primitives may still be normalized as their real consumers are migrated:

#### Admin primitives

- `AdminPageHeader`
- `AdminTableShell`
- `AdminTableToolbar`
- `AdminTableSearch`
- `AdminTableActions`
- `AdminTableColGroup`
- `AdminEmptyRow`
- `AdminLoadingRow`
- `AdminSectionHeader`

#### Feedback and form primitives

- `ToneBanner`
- `ErrorBanner`
- `InlineMeta`
- `FormRow`
- `FieldLabel`
- `FieldHelp`
- `PanelFooter`
- `SubmitBar`

#### Dialog and picker primitives

- `DialogSurface`
- `ModalBackdrop`
- `PopupSurface`
- `PickerDialog`
- `ConfirmDialog`

#### Dashboard and content primitives

- `DashboardCard`
- `StatCard`
- `FeatureTile`
- `CollectionGrid`
- `PublicCard`
- `MemberCard`

---

## 8. Class naming model

Use semantic class names.

Preferred families:

```text
ui-*
surface-*
layout-*
chrome-*
admin-*
member-*
public-*
editor-*
media-*
form-*
table-*
```

Examples:

```text
admin-page-header
admin-table-toolbar
media-preview-frame
editor-image-resize-handle
form-field-error
surface-card
```

Avoid class names that encode one-off values:

```text
big-red-box
margin-16-card
random-card-style
```

Prefer semantic CSS:

```tsx
className = "surface-card surface-card--muted";
```

---

## 9. Variant and tone model

Visual variants should be represented through semantic props and mapped to classes.

Preferred props:

```text
tone:
- default
- muted
- subtle
- success
- warning
- danger
- info

size:
- xs
- sm
- md
- lg

density:
- compact
- comfortable
- spacious

variant:
- solid
- soft
- outline
- ghost
```

Preferred TSX:

```tsx
<AlertBanner tone="danger">Save failed.</AlertBanner>
```

Preferred class output:

```text
ui-alert-banner ui-alert-banner--danger
```

CSS owns the visual result.

---

## 10. Brand implementation rules

The Corn Mafia brand baseline uses:

- red
- black
- white
- dark surfaces
- restrained secondary colors
- bold but readable contrast
- dark, vintage, slightly mysterious visual mood
- fedora/corn logo identity when official logo use is appropriate

The brand book defines official primary colors:

```text
brand red:   RGB 204 38 45, web #cc262d
brand black: RGB 0 0 0, web #000000
brand white: RGB 255 255 255, web #ffffff
```

Secondary/accent colors may be used sparingly:

```text
accent red:   RGB 255 0 0, web #ff0000
accent green: RGB 9 66 1, web #094201
accent gold:  RGB 206 166 88, web #cea658
```

Implementation rules:

- raw brand colors belong in `base-colors.css`
- theme role mapping belongs in `themes.css`
- reusable spacing/radius/typography/motion tokens belong in `tokens.css`
- TS/TSX must not scatter brand colors
- domain CSS outside `base-colors.css` and `themes.css` should use semantic CSS variables
- database-selectable colors should exist in `web_theme_colors`
- runtime DB/platform colors should enter TSX through CSS custom properties when practical

Typography:

- Copperplate is the primary guild name/logotype font in brand materials
- Arial is the secondary general graphic font in the brand book
- web implementation may use available licensed/self-hosted/system font stacks, but must not ship font files unless they are legally approved project assets
- do not expose private font files in generated artifacts

Logo rules:

- official logo/name assets should not be altered in uncontrolled ways
- on dark backgrounds, the logo needs enough separation for the black outer ring to remain visible
- use CSS/tokenized glow or approved artwork when the logo is placed on dark surfaces
- do not invent unofficial logo variants in app code

Imagery direction:

- dark/vintage mood
- high contrast
- restrained color palette
- single pops of red, black, dark blue, green, or gold where appropriate
- avoid bright generic SaaS styling unless intentionally required for usability

---

## 11. Hardcoded token rule

Hardcoded visual tokens are forbidden in TS and TSX.

Do not hardcode:

- hex colors
- raw RGB/RGBA colors
- named colors used visually
- font family names
- raw pixel spacing
- raw border values
- raw shadow values
- raw radius values
- raw z-index values
- arbitrary opacity values
- repeated utility colors such as `bg-black/20` or `text-white/70`

Preferred:

```tsx
<AlertBanner tone="danger">Delete failed.</AlertBanner>
```

Preferred with runtime DB color:

```tsx
<span
  className="media-icon-render"
  style={
    {
      "--runtime-color": iconColor,
    } as React.CSSProperties
  }
/>
```

CSS owns the visual use:

```css
.media-icon-render {
  color: var(--runtime-color, var(--color-text));
}
```

---

## 12. Database theme color ownership

Database theme colors belong to the runtime/admin-selectable palette.

A color should exist in `web_theme_colors` when:

- admins can choose it for icons
- admins can choose it for content visuals
- admins can choose it for theme configuration
- it is exposed in a UI color picker
- it is stored by key/id in database content or settings

A color should stay CSS-only when:

- it is a derived hover color
- it is a derived soft background
- it is a shadow value
- it is a border mix
- it is only an implementation detail of a component
- it is not meaningful for admins to select directly

Examples of good DB theme color rows:

```text
background
surface
surface-muted
card
muted
muted-bg
border
border-strong
text
text-muted
brand-red
brand-red-strong
brand-black
brand-white
brand-green
brand-gold
accent
danger
success
warning
info
overlay
focus
icon-original
```

Examples of CSS-only derived tokens:

```text
--color-danger-soft
--color-success-soft
--surface-card-muted
--surface-overlay-soft
--shadow-panel
--control-bg-hover
```

---

## 13. Inline style rule

Inline style is forbidden by default.

Do not use:

```tsx
<div style={{ padding: 12 }} />
```

Do not use:

```tsx
<span style={{ color: "#fff" }} />
```

Do not use:

```tsx
<img style={{ objectFit: "cover", borderRadius: 12 }} />
```

Move those to CSS classes or UI primitives.

---

## 14. Allowed inline style exception families

Inline style may remain only when the value is genuinely computed at runtime and not practical as a class.

Prefer CSS custom property assignment when practical.

### Runtime geometry

Allowed when a component calculates placement, coordinates, transforms, dimensions, or measured layout at runtime.

Examples:

- drag/drop coordinates
- resize handles
- editor selection popup position
- measured container dimensions
- menu panel positioning
- map/editor measurements

Preferred shape:

```tsx
style={{
	"--runtime-left": `${left}px`,
	"--runtime-top": `${top}px`,
} as React.CSSProperties}
```

### Runtime percentages

Allowed when the value is derived from live data.

Examples:

- progress bar width
- upload progress
- completion percentage
- distribution bars

Preferred shape:

```tsx
style={{
	"--progress-value": `${percent}%`,
} as React.CSSProperties}
```

### Runtime colors from database, platform data, theme data, or sanitized content

Allowed when color is user/admin/DB/platform-defined and cannot be represented by a fixed class.

Examples:

- theme color swatches
- Discord role colors
- icon preview color
- sanitized stored rich text color when explicitly allowed
- media or SVG runtime color override

Preferred shape:

```tsx
style={{
	"--runtime-color": color,
} as React.CSSProperties}
```

### Stored rich text formatting

Allowed only where sanitized, stored content includes user-authored formatting that must be rendered faithfully.

This remains a security-sensitive exception family. It must stay constrained by renderer and sanitizer rules, and it must not become an arbitrary style injection surface.

### Third-party library requirements

Allowed when a third-party component, map library, editor library, or drag/drop library requires runtime style props.

The exception must document:

- library name
- file path
- exact reason
- future cleanup option

---

## 15. Exception registry format

Every remaining inline style after cleanup must be listed here.

Use this format:

```text
## File: apps/web/src/path/to/file.tsx

### Exception: short name

Status: Allowed / Temporary / Review

Inline style family:
- style={{ ... }}

Reason:
- Explain why static CSS cannot own this value.

Why static CSS cannot replace it:
- Explain what runtime information CSS does not know.

Future cleanup option:
- Explain whether this can become a CSS custom property, UI primitive prop, or library wrapper later.

Risk: Low / Medium / High
```

---

## 16. Current inline style exceptions

## File: apps/web/src/components/MenuClient.tsx

### Exception: menu panel runtime layout

Status: Allowed

Inline style family:

- CSS custom property assignment for measured menu panel left offset
- CSS custom property assignment for measured menu panel width
- CSS custom property assignment for menu grid column template

Reason:

The menu panel aligns to the active trigger and adapts to the number of available columns at runtime. The exact left offset and panel width depend on measured DOM geometry and current menu data.

Why static CSS cannot replace it:

CSS does not know the active trigger measurement or column count produced by the current menu model.

Future cleanup option:

Keep the CSS custom property assignment. Ensure all menu visuals remain in `chrome.css`.

Risk: Low

---

## File: apps/web/src/components/ui/Panel.tsx

### Exception: panel constrained content width

Status: Allowed

Inline style family:

- CSS custom property assignment for `contentMaxWidthPx`

Reason:

The shared panel primitive accepts a runtime maximum content width for callers that need a constrained editing canvas inside a fixed panel shell.

Why static CSS cannot replace it:

The value is a component prop and may vary by caller.

Future cleanup option:

Prefer preset CSS classes for common panel widths. Keep the CSS custom property only for true caller-provided dynamic widths.

Risk: Low

---

## File: apps/web/src/app/login/LoginClient.tsx

### Exception: Discord role color in login role summary

Status: Allowed

Inline style family:

- CSS custom property assignment for Discord role color

Reason:

Discord role colors are platform/runtime data.

Why static CSS cannot replace it:

The color is not known at build time and can change in Discord-backed role data.

Future cleanup option:

Keep CSS custom property assignment. Confirm the value is normalized before rendering and that CSS owns the visual application.

Risk: Low

---

## File: apps/web/src/components/login/RolesPanel.tsx

### Exception: Discord role color in member roles panel

Status: Allowed

Inline style family:

- CSS custom property assignment for Discord role swatch color

Reason:

Discord role colors are platform/runtime data.

Why static CSS cannot replace it:

The color is not known at build time and can change in Discord-backed role data.

Future cleanup option:

Keep CSS custom property assignment. Confirm the value is normalized before rendering and that CSS owns the visual application.

Risk: Low

---

## File: apps/web/src/components/ui/IconRender.tsx

### Exception: runtime icon color

Status: Allowed

Inline style family:

- CSS custom property assignment for icon color

Reason:

Icon color may come from DB theme/admin configuration or platform icon rendering data.

Why static CSS cannot replace it:

The color is runtime data.

Future cleanup option:

Keep CSS custom property assignment. Ensure CSS owns the rendered color rule.

Risk: Low

---

## File: apps/web/src/components/ui/basic-elements/SvgInline.tsx

### Exception: SVG inline runtime dimensions and color

Status: Allowed

Inline style family:

- CSS custom property assignment for SVG width
- CSS custom property assignment for SVG height
- CSS custom property assignment for SVG color

Reason:

The component bridges sanitized inline SVG rendering with fallback image rendering. Dimensions and color are derived from props, variant defaults, or caller-provided theme/color data.

Why static CSS cannot replace it:

The dimensions and color are runtime inputs and may vary by caller or SVG variant.

Future cleanup option:

Keep only CSS custom property assignments in TSX. Ensure all fallback image and SVG wrapper visuals remain in `media.css`.

Risk: Low

---

## File: apps/web/src/components/ui/basic-elements/FilePreview.tsx

### Exception: media preview dimensions

Status: Allowed

Inline style family:

- CSS custom property assignment for preview width
- CSS custom property assignment for image height

Reason:

Preview dimensions vary by caller and should remain parameterized.

Why static CSS cannot replace it:

The values are runtime props.

Future cleanup option:

Keep the CSS custom property assignment. Ensure all actual visual behavior stays in `media.css`.

Risk: Low

---

## File: apps/web/src/components/ui/basic-elements/ReadOnlyTextarea.tsx

### Exception: read-only textarea row count

Status: Allowed

Inline style family:

- CSS custom property assignment for row count

Reason:

The read-only textarea primitive accepts a runtime `rows` prop and exposes it to CSS as a custom property.

Why static CSS cannot replace it:

The number of rows is caller-controlled and may vary by surface.

Future cleanup option:

Keep the CSS custom property assignment. CSS should continue to own the actual block sizing behavior.

Risk: Low

---

## File: apps/web/src/components/ui/basic-elements/Pill.tsx

### Exception: runtime pill color and swatch color

Status: Review

Inline style family:

- CSS custom property assignment for pill color
- CSS custom property assignment for pill swatch background

Reason:

The shared pill primitive supports runtime colors from semantic token aliases, icon/theme data, and caller-provided display values.

Why review is needed:

This is a reusable UI primitive with a broad `color` prop. It is acceptable when values come from DB/theme/platform data or known CSS variables, but it should not become a path for arbitrary hardcoded visual colors in app/domain components.

Future cleanup option:

Prefer semantic tone/variant classes for common badge colors. Keep CSS custom property assignment only for DB/theme/runtime color use cases.

Risk: Medium

---

## File: apps/web/src/components/editors/richtext/RichTextEditor.tsx

### Exception: rich-text fullscreen content max width

Status: Temporary

Inline style family:

- CSS custom property assignment for fullscreen editor content max width

Reason:

Fullscreen rich-text editing currently passes a fixed editor canvas maximum width through TSX when fullscreen mode is active.

Why it violates the final style rule:

The value is a static constant, not a true runtime measurement. CSS can own the default fullscreen editor max width.

Future cleanup option:

Move the static max-width value to `editor.css` or a token. Keep a CSS custom property only if future callers need a runtime editor width override.

Risk: Low

---

## File: apps/web/src/components/editors/richtext/nodes/LinkPickerPopup.tsx

### Exception: editor selection popup position

Status: Allowed

Inline style family:

- popup top/left position
- popup transform/placement values
- optional caller-provided popup style passthrough

Reason:

The popup is positioned from the current editor selection anchor and viewport constraints.

Why static CSS cannot replace it:

The coordinates are computed from live selection geometry.

Future cleanup option:

Move static popup visuals to `editor.css`; keep only CSS variables or style values for computed top/left placement.

Risk: Low

---

## File: apps/web/src/components/editors/richtext/nodes/ImageNodeView.tsx

### Exception: editor image resize and drag geometry

Status: Allowed

Inline style family:

- selected image dimensions
- drop guide coordinates
- drop preview coordinates
- drop preview dimensions

Reason:

Image nodes can be resized and moved by the editor runtime. Drag/drop guides and preview boxes are computed from pointer state and editor geometry.

Why static CSS cannot replace it:

Dimensions and transform values are content/runtime state.

Future cleanup option:

Keep runtime geometry as CSS custom properties. Ensure static image-node visuals remain in `editor.css`.

Risk: Medium

---

## File: apps/web/src/components/editors/richtext/nodes/image-node-helpers.ts

### Exception: editor move preview box geometry helper

Status: Allowed

Inline style family:

- helper-returned CSS properties for move preview box geometry

Reason:

The helper computes preview box placement from current drag target geometry, root bounds, and image dimensions.

Why static CSS cannot replace it:

The preview box coordinates and dimensions are derived from live drag/drop calculations.

Future cleanup option:

Prefer returning CSS custom property maps instead of direct geometry properties if the surrounding editor CSS can consume them cleanly.

Risk: Medium

---

## File: apps/web/src/components/admin/web/navigation-designer/NavigationDesignerTree.tsx

### Exception: navigation designer drag/drop geometry

Status: Allowed

Inline style family:

- sortable transform
- sortable transition
- dragging opacity/z-index/will-change state
- subcategory bubble minimum height custom property

Reason:

The designer uses interactive drag/drop tree behavior through `@dnd-kit/sortable`. Sortable transforms and transitions are runtime library output.

Why static CSS cannot replace it:

Position, transform, dragging state, and nested tree geometry are runtime-derived.

Future cleanup option:

Move static tree visuals to `admin.css`; keep only library/runtime geometry and CSS custom properties for depth, position, transform, and computed dimensions.

Risk: Medium

---

## File: apps/web/src/components/renderers/richtext/RichTextRenderer.tsx

### Exception: rendered rich-text layout and stored media dimensions

Status: Review

Inline style family:

- CSS custom property assignment for rendered image width
- CSS custom property assignment for rendered image height
- CSS custom property assignment for rendered block indentation

Reason:

Stored rich-text content may include user-authored or editor-authored layout metadata, such as image dimensions and block indentation. The renderer must preserve safe stored formatting while applying hardened URL/media rules.

Why review is needed:

This is content rendering, not normal component styling. It should stay aligned with sanitizer behavior and should be reviewed during security audit to ensure stored content cannot become arbitrary style injection.

Future cleanup option:

Keep sanitizer-approved formatting only. Prefer class-based rendering for known editor marks where possible, and keep CSS custom properties only for stored numeric dimensions/indentation.

Risk: Medium

---

## File: apps/web/src/app/admin/web/content/[id]/show/page.tsx

### Exception: admin preview distribution progress percentage

Status: Allowed

Inline style family:

- CSS custom property assignment for distribution/progress percentage

Reason:

The preview distribution bar width is derived from current content render metrics.

Why static CSS cannot replace it:

The percentage is data-dependent and changes per rendered metric.

Future cleanup option:

Keep CSS custom property assignment. Ensure all progress bar visuals remain in `admin.css` or a shared progress primitive.

Risk: Low

---

## 17. Temporary cleanup queue

Reduce these exception families in later passes:

```text
RichTextEditor static fullscreen max width moved to editor.css or tokens
Pill broad color prop narrowed toward semantic variants plus runtime DB/theme exceptions
RichTextRenderer stored formatting reviewed during security audit
ImageNodeView and image-node-helpers geometry kept runtime-only, static styles kept in editor.css
NavigationDesignerTree static drag/drop visuals kept in admin.css, runtime library styles left documented
```

---

## 18. Definition of style-clean

The codebase is style-clean when:

- TS/TSX contains no static visual inline styles
- remaining inline styles are documented exceptions
- domain components compose primitives instead of hand-styling repeated UI
- `components/ui` exposes semantic visual props
- CSS files own visual definitions
- raw brand/base colors are centralized in `base-colors.css`
- theme roles are centralized in `themes.css`
- non-color design tokens are centralized in `tokens.css`
- admin/member/public/editor/media CSS ownership is clear
- repeated card/table/panel/form/media patterns are unified
- runtime colors enter components through CSS custom properties
- every runtime color exception is listed here
- build passes
- lint passes
- visual smoke test passes

## Member workspace browse surfaces

Member profile and authoring-management pages use the shared browse grammar rather than a separate dashboard visual system.

Required structure:

```text
BrowsePageHeader
BrowseFilterPanel when filters exist
BrowseResultsPanel
shared browse/management cards
shared pagination and state surfaces
```

Rules:

- the profile header does not repeat the global-menu avatar
- member status lives on the title row opposite the profile nickname
- Edit profile and member management actions live in the reserved second header row
- the profile workspace links use `BrowseResultCard` directly
- My Content, per-collection content, My Media, and My Series use `BrowsePageHeader`, `BrowseFilterPanel`, and `BrowseResultsPanel`
- member management headers keep the manageable-item counter on the title row, omit explanatory copy, and place action buttons on the second row
- member filter bars use the same single-row control/search geometry as the public browse system
- management cards use the global browse-card geometry with separate member-safe action controls
- media-management cards may use editorial thumbnails instead of `IconVisual`
- member APIs, ownership checks, panels, and mutation contracts remain member-specific
- empty results use shared state surfaces rather than dashed member-only boxes
- shared cards and button links must not inherit content-link underlines

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
