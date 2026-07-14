<!-- FILE: docs/content_templates.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Content Templates And Optional Series

## Purpose

This document defines the current Corn Mafia content-template model for member authoring.

Use it together with:

```text
docs/project_definition.md
docs/codebase_rules.md
docs/style_system.md
```

Templates configure content structure and presentation through the existing field-list, placement, destination, width, alignment, label, and renderer systems. Series is optional canonical content metadata, not a separate template type.

## 1. Initial member templates

The first member-authorable template set is:

```text
story_chronicle
	title: Story / Chronicle
	purpose: adventures, guild chronicles, roleplay, and memorable in-game events

tutorial
	title: Tutorial / How-To Guide
	purpose: structured step-by-step instructions and learning material

strategy_guide
	title: Strategy Guide
	purpose: tactics, optimization, progression planning, and recommendations

quick_tip
	title: Quick Tip
	purpose: concise advice, discoveries, warnings, and shortcuts
```

YouTube templates remain admin-only in this release. Automatic wiki content remains under Riseopedia/Mafiosopedia and must not receive a member Wiki Article template. Build/loadout and gallery templates remain out of scope until their dedicated tool or renderer families exist.

## 2. Optional series model

Templates use:

```text
allows_series = false
	series is unavailable

allows_series = true
	series is optional
```

There is no required-series mode and no Series Episode template.

Validation:

```text
allows_series = false + no series
	valid

allows_series = false + series input
	rejected

allows_series = true + no series
	valid standalone content

allows_series = true + selected series and positive part number
	valid series content

allows_series = true + selected series and missing/invalid part number
	rejected
```

Series and part number remain canonical fields on `web_priv.web_content`. They are never duplicated as editable template field values.

## 3. Destination model

The existing destinations remain the complete page-layout model:

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

The first four member templates intentionally use:

```text
Hero
Top
Main
Hidden
SEO
```

They do not require a Right destination.

Hero activates the canonical title/summary page header. Top contains configured canonical metadata and authored supporting facts. Main contains the authored body. Hidden stores non-visible helper values such as card thumbnails. SEO contains search/browser metadata.

Template-driven content Heroes use a fixed 32px inner padding and a fixed 140px editorial-media height, matching the approved compact Riseopedia header rhythm. When Hero media is present, it renders inside the shared Riseopedia-aligned bordered media well with its inset background and media shadow. The renderer scales the complete source image proportionally inside that well with `object-fit: contain`. Images may scale up or down without distortion; when the source aspect ratio differs from the available area, the remaining axis shows the media-well background rather than cropping the image. The same renderer is used by the live authoring preview.

Content destination panels use the shared 24px layout rhythm between Hero, Top, the Left/Main/Right body layout, Bottom, and series navigation. This keeps normal content pages aligned with the rest of the public app and Riseopedia without changing any panel padding.

The generic `page` template also contains optional Hero fields so existing and future normal pages render through the shared canonical page header.

## 4. Canonical system-backed fields

The following reusable field-list rows are read-only and resolve from canonical content metadata:

```text
system_author_username
system_published_at
system_updated_at
system_series_title
system_series_part_no
```

They use the normal template-field placement configuration for:

```text
destination
display order
full / half / third width
alignment
label visibility
label override
label style
label position
label separator
```

They do not accept values through `web_content_field_values` and do not render as editable inputs. The live preview and public renderer resolve them from the current content document.

Visible author output uses a safe Discord display name or username. Raw Discord IDs are not exposed as the public author label.

## 5. Reusable authored Top fields

The current configuration adds reusable authored fields for:

```text
top_estimated_read_minutes
top_difficulty_level
top_platform_type
top_prerequisites
top_story_setting
top_spoiler_warning
top_strategy_focus
top_applicable_version
```

These use existing field types and renderers. No new content kind, destination, renderer family, or schema is introduced.

Content Hero breadcrumbs are system-derived from the canonical category, subcategory, and content title. They are not template fields and do not accept authored values. The retired `hero_overline` field is removed from the field catalog, template placements, saved values, preview fixtures, and public rendering.

## 6. Template configurations

### Story / Chronicle

```text
Hero
	hero_media_id

Top
	system_author_username
	system_published_at
	system_updated_at
	system_series_title
	system_series_part_no
	top_story_setting
	top_spoiler_warning

Main
	main_body (required)

Hidden
	hidden_thumbnail_media_id

SEO
	seo_title
	seo_description
	seo_canonical_url
```

### Tutorial / How-To Guide

```text
Hero
	hero_media_id

Top
	system_author_username
	system_published_at
	system_updated_at
	system_series_title
	system_series_part_no
	top_estimated_read_minutes
	top_difficulty_level
	top_platform_type
	top_prerequisites

Main
	main_body (required)

Hidden
	hidden_thumbnail_media_id

SEO
	seo_title
	seo_description
	seo_canonical_url
```

### Strategy Guide

```text
Hero
	hero_media_id

Top
	system_author_username
	system_published_at
	system_updated_at
	system_series_title
	system_series_part_no
	top_difficulty_level
	top_platform_type
	top_strategy_focus
	top_applicable_version

Main
	main_body (required)

Hidden
	hidden_thumbnail_media_id

SEO
	seo_title
	seo_description
	seo_canonical_url
```

### Quick Tip

```text
Hero
	hero_media_id

Top
	system_author_username
	system_published_at
	system_series_title
	system_series_part_no

Main
	main_body (required)

Hidden
	hidden_thumbnail_media_id

SEO
	seo_title
	seo_description
	seo_canonical_url
```

## 7. Current maintenance

The optional-series and member-template migrations are already incorporated into the current database and bootstrap state. One-time `sql/template_authoring/*` files are not part of the active repository contract.

The content Hero breadcrumb/media refinement is applied as owner role `cm` with:

```text
scripts/20260714_content_hero_breadcrumbs_and_media.sql
```

That migration retires `hero_overline` through the existing template history and schema-version helpers. It creates no new table, field family, route, or synchronization path.

The Story, Strategy Guide, and Quick Tip templates remain without automatic category/subcategory mappings. Use the existing template-mapping admin surfaces to expose them only in approved member-authorable collections. The existing mappings attached to the Tutorial template remain unchanged.

## 8. Boundaries

Do not create:

```text
a Series Episode template
standalone Story Series or Tutorial Series templates
a member Wiki Article template
a second series relationship family
a new page-header table or renderer
a second YouTube allowlist system
new game_data transform rules
```

YouTube remains admin-only until a later deliberate migration and member-context allowlist validation pass.

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
