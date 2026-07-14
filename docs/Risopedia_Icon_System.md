<!-- FILE: docs/riseopedia_icon_template_production_guide.md -->
<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->

# Riseopedia Icon Template Production Guide

## 1. Purpose

This document is the production specification for creating new Riseopedia entity-type and class icons from the approved Corn Mafia icon-template families.

It defines:

- the visual language and non-negotiable design decisions;
- the approved palette and exact color roles;
- canvas, scale, safe-area, material, lighting, and glow rules;
- the seven icon families and their immutable template geometry;
- the chroma-key workflow for the temporary blue background;
- ready-to-use prompt definitions for creating new icons from an approved template;
- acceptance checks before an icon is added to the application.

It complements `docs/riseopedia_icon_visual_system.md`. When the two documents overlap, this production guide is the operational reference for template-driven generation.

---

## 2. Core decision: templates are masters, not inspiration

The earlier icon drift came from regenerating each icon as a new illustration. Image generation can preserve a broad visual direction, but it does not reliably preserve exact geometry: circular rings change, map-pin proportions change, page corners change, glow widths change, and gold/red balance changes.

For the constrained families, an approved template is a **master asset**. Once approved, its exterior geometry is frozen.

### 2.1 Hard-template families

These families have immutable outer geometry. A class icon may change only the interior semantic symbol or object.

| Family   | Immutable geometry                                              | Allowed variation                                     |
| -------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Recipe   | Page outline, folded corner, border layout, panel proportions   | Central recipe subject and tiny interior detail lines |
| Mechanic | Hexagonal node chassis, satellite nodes, central hex field      | Central mechanic symbol                               |
| Perk     | Circular segmented badge, ring segmentation, central disk       | Central perk symbol                                   |
| Quest    | Scroll rolls, panel proportions, side spine, trim layout        | Central quest symbol                                  |
| Location | Pin body, inner field, base ring, segment layout                | Inner mark only: Calido sun, `S1`, `S2`, `S3`         |
| POI      | Kiosk/terminal chassis, upper cap, pillars, base, display field | Central display content only                          |

### 2.2 Soft-template family

| Family | What is fixed                                                                                                              | What remains free                                                       |
| ------ | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Asset  | Canvas, camera angle, safe area, lighting, black-metal/red/gold material grammar, silhouette outline, chroma-key treatment | Physical item silhouette, proportions, category-specific object details |

**Asset rule:** the approved crate is a **rendering rig reference**, not an outer frame to place around every Asset. Assets must remain physical objects, not badges or kiosks.

### 2.3 Non-negotiable production rule

For a strict production set, do **not** regenerate the complete frame/ring/pin/scroll/page from scratch for every class.

Use the approved master as a source layer in an image editor or compositing workflow. Generate or draw only the central semantic object, then place it in the reserved content zone. Reference-based regeneration may be useful for exploration, but it is still an approximation and can drift.

---

## 3. Canonical deliverables and naming

### 3.1 Master and runtime sizes

| Property                       | Requirement                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| Master canvas                  | `1254 × 1254 px`                                            |
| Aspect ratio                   | `1:1`                                                       |
| Color mode                     | `RGBA`, sRGB, 8-bit per channel or higher                   |
| Working chroma-key background  | Exact `#005BFF`                                             |
| Final production background    | True alpha transparency outside the icon                    |
| Master export format           | PNG                                                         |
| Labels, titles, contact sheets | Forbidden                                                   |
| Final crop                     | No clipping of silhouette, contained glow, or metal outline |

The 1254 px master is authoritative. Derive smaller UI files from that master rather than creating separate artwork at smaller sizes.

### 3.2 Derived web outputs

| Output   |  Pixel size | Typical display size |
| -------- | ----------: | -------------------: |
| Micro    |   128 × 128 |         24–32 CSS px |
| Compact  |   256 × 256 |         32–48 CSS px |
| Standard |   512 × 512 |         48–80 CSS px |
| Large    |   768 × 768 |        80–128 CSS px |
| Master   | 1254 × 1254 |   Archive/source use |

Use `object-fit: contain`; never use `object-fit: cover` for an icon.

### 3.3 File names

Use the requested naming convention exactly.

| Asset kind                            | File name format                                     | Example                                    |
| ------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| Entity type image                     | `Type_<Name>.png`                                    | `Type_Assets.png`                          |
| Class image                           | `Class_<entity_name>_<Class_name>.png`               | `Class_Assets_Weapon.png`                  |
| Template master, working asset        | `Template_<Family>_<Variant>_v<version>_keyblue.png` | `Template_Location_PinRing_v1_keyblue.png` |
| Template master, transparent delivery | `Template_<Family>_<Variant>_v<version>.png`         | `Template_Location_PinRing_v1.png`         |

Use PascalCase words separated with underscores. Keep the entity names stable: `Assets`, `Recipe`, `Mechanic`, `Perk`, `POI`, `Quest`, `Location`.

---

## 4. Approved Corn Mafia palette

The icon family is restricted to the current Corn Mafia base palette plus neutral highlights.

| Visual role        | Hex       | CSS source                       | Approved use                                                                 |
| ------------------ | --------- | -------------------------------- | ---------------------------------------------------------------------------- |
| Brand red base     | `#CC262D` | `--brand-red`                    | Red metal accents, medium neon contour, controlled secondary glow            |
| Red neon emission  | `#FF0000` | `--brand-red-bright`             | Primary outer neon line and high-energy emission core                        |
| Red shadow / depth | `#A11E24` | `--brand-red-strong`             | Red recesses, dark energized seams, controlled transition from neon to metal |
| Brand gold         | `#CEA658` | `--brand-gold`                   | Premium trim, main semantic symbol, restrained gold frame details            |
| Bright gold        | `#FBBF24` | `--base-gold-400`                | Small emissive gold lines and readable functional detail                     |
| Gold hot highlight | `#FCD34D` | `--base-gold-300`                | Tiny high-intensity gold edge or specular accents only                       |
| Deep black         | `#000000` | `--brand-black` / `--base-black` | Deep cavities and interior voids that belong to the icon                     |
| Deep metal         | `#050506` | `--base-ink-950`                 | Main black-metal shell                                                       |
| Metal shadow       | `#0B0B0C` | `--base-ink-900`                 | Dark body planes and recessed panel edges                                    |
| Metal midtone      | `#17171A` | `--base-ink-800`                 | Readable metal planes and bevel transitions                                  |
| Metal edge         | `#2A2A2A` | `--base-ink-650`                 | Non-emissive edge separation                                                 |
| Controlled white   | `#FFFFFF` | `--brand-white`                  | Very small emission cores or isolated hot specular points only               |
| Chroma-key blue    | `#005BFF` | Working background               | Temporary removal background only; never reflected in the icon               |

### 4.1 Palette boundaries

Do not introduce these colors:

- cyan, teal, blue, purple, magenta, green, or pink accents;
- orange/bronze substitute golds outside the approved gold relationship;
- pale yellow broad fills;
- silver/white trim used as a second theme color;
- blue reflections, blue haze, or blue ambient lighting from the key background.

### 4.2 Color hierarchy

Every icon should read in this order:

1. black-metal physical or structural body;
2. red silhouette and energy routing;
3. gold semantic focus;
4. tiny white highlight only where it represents the hottest part of an emission.

Typical visual coverage targets inside the icon body:

| Visual layer         | Target coverage |
| -------------------- | --------------: |
| Black-metal          |          55–78% |
| Red contour/emission |          12–25% |
| Gold semantic detail |           6–18% |
| White hot points     |            0–3% |

### 4.3 Important truth about generated color

An image generator does not guarantee literal CSS hex values at every rendered pixel. It can output visually close shades, anti-aliasing blends, and lighting-derived variations even when exact hex codes are included in a prompt.

Therefore, every production candidate must pass a final color review. Where strict brand matching is required, use a final editing step to normalize the red/gold/black palette after generation. Do not assume that a prompt alone has produced a perfectly palette-locked image.

---

## 5. Chroma-key-ready blue-background standard

The blue background exists only to make later background removal reliable. It is not part of the final icon.

### 5.1 Required background behavior

- Background is one flat color: `#005BFF`.
- No gradient, texture, vignette, noise, haze, fog, particles, floor, wall, horizon, or studio light.
- No cast shadow on the blue.
- No blue reflection or blue rim lighting on the icon.
- The blue may never appear inside the icon, including holes, metal reflections, glass, or glow.

### 5.2 Edge-separation behavior

- Put a continuous dark/black separation outline around the outer silhouette.
- Keep red and gold light contained inside the dark outline wherever possible.
- Do not allow soft bloom to diffuse outward into the blue.
- Do not use a floating external red halo, external gold halo, smoky glow, or soft drop shadow.
- Any glow must end inside a hard dark silhouette edge, rather than blending with the background.

### 5.3 Why this matters

Red or gold glow that fades across blue produces blended edge pixels. When the blue is removed later, those blended pixels become blue/red or blue/gold halos. The black separation line prevents that contamination and creates a clean cutout.

### 5.4 Quality gate before removing the background

Before background removal, inspect the image at 200–400% zoom:

- Blue must be visibly flat across the whole background.
- No dark shadow should sit on the blue behind the icon.
- No red/gold bloom should extend beyond the black separation outline.
- The outer black contour must not be interrupted.
- No blue reflection should appear on metal bevels.

If any point fails, regenerate or repair before performing background removal.

### 5.5 Background removal process

1. Work from the `*_keyblue.png` master.
2. Select the `#005BFF` background by color range.
3. Remove only the blue background; do not erode the dark outline.
4. Check at 100%, 200%, and 400% against light, dark, warm, and cool test backgrounds.
5. Export the final PNG as RGBA with alpha `0` outside the icon.
6. Preserve the original blue-key master as a source file.

---

## 6. Global layout, scale, lighting, and material

### 6.1 Canvas zones at the 1254 px master size

| Zone                 |                                Pixel range | Rule                                                    |
| -------------------- | -----------------------------------------: | ------------------------------------------------------- |
| Outer crop guard     |                     0–48 px from each edge | Must remain clear. No icon, glow, or shadow detail.     |
| Key-blue buffer      |                    48–96 px from each edge | Flat `#005BFF` only.                                    |
| Primary safe area    |                                 96–1158 px | All visible silhouette geometry belongs here.           |
| Preferred icon field |                                140–1114 px | Main icon mass normally belongs here.                   |
| Optical center       | 627 px / 627 px, adjusted for visible mass | Center the icon by perceived weight, not only geometry. |

### 6.2 Family scale targets

| Family   | Preferred width | Preferred height | Core alignment rule                             |
| -------- | --------------: | ---------------: | ----------------------------------------------- |
| Asset    |          72–88% |           62–82% | Sit on a common visual baseline                 |
| Recipe   |          66–74% |           76–86% | Vertical center; folded corner remains readable |
| Mechanic |          72–80% |           72–80% | Straight-on, centered badge                     |
| Perk     |          76–84% |           76–84% | Straight-on, circular outer footprint           |
| POI      |          68–82% |           70–86% | Grounded base at shared baseline                |
| Quest    |          66–74% |           78–88% | Straight-on vertical scroll                     |
| Location |          62–72% |           72–84% | Pin tip aligns to center of ground ring         |

### 6.3 Camera rules

| Family   | Required camera                                                                             |
| -------- | ------------------------------------------------------------------------------------------- |
| Asset    | Front three-quarter item render; 5–15° top visibility; restrained side depth                |
| POI      | Near-front architectural/object render; small amount of top and right-side depth is allowed |
| Recipe   | Mostly front-facing; very shallow bevel depth only                                          |
| Mechanic | Fully straight-on; no rotation                                                              |
| Perk     | Fully straight-on; no rotation                                                              |
| Quest    | Mostly front-facing; scroll rolls provide shallow cylindrical depth                         |
| Location | Pin straight-on; base ring may have slight shallow elliptical depth                         |

### 6.4 Lighting rules

- Primary non-emissive key light: upper-left.
- Metal falloff: lower-right.
- Red and gold emissions can tint nearby metal, but must not create a new random lighting direction.
- No environment lighting, no blue ambient light, and no floor bounce.
- Avoid large white reflections; black-metal must remain black-metal.

### 6.5 Material rules

Black metal should have:

- a deep `#050506` or `#0B0B0C` base;
- restrained `#17171A` plane changes;
- subtle `#2A2A2A` non-emissive edge separators;
- small bevels and panel seams only where they clarify form;
- no dirt, heavy grunge, rust, stone, wood, cloth grain, or chrome-like mirror reflection.

---

## 7. Template catalogue

The template files below are the recommended logical master names. After approval, save the actual generated master images under these names and do not overwrite them silently.

| Family   | Master file                                  | Template purpose                                                   |
| -------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Asset    | `Template_Asset_RenderRig_v1_keyblue.png`    | Rendering and composition reference only; no mandatory outer frame |
| Recipe   | `Template_Recipe_Page_v1_keyblue.png`        | Fixed folded-page geometry with an empty content field             |
| Mechanic | `Template_Mechanic_HexNode_v1_keyblue.png`   | Fixed six-node hex chassis and empty center hex                    |
| Perk     | `Template_Perk_CircularBadge_v1_keyblue.png` | Fixed circular segmented progression ring and empty center disk    |
| POI      | `Template_POI_Terminal_v1_keyblue.png`       | Fixed kiosk chassis with protected display/content area            |
| Quest    | `Template_Quest_Scroll_v1_keyblue.png`       | Fixed scroll rolls and empty inner panel                           |
| Location | `Template_Location_PinRing_v1_keyblue.png`   | Fixed pin geometry and base ring with empty inner field            |

### 7.1 Recipe template

**Fixed:** folded top-right corner, outer red line, black-metal page body, gold inner trim, lower page geometry, perspective, and overall page proportion.

**Variable content zone:** the inner document field, centered around the vertical midpoint.

**Allowed class subjects:** bowl/consumable, crystal/resource, wrench/tool, and future recipe-class marks.

**Subject scale:** 38–52% of the page width; preserve at least 10% clear margin from the gold inner border.

**Never change:** page aspect ratio, fold shape, red line thickness, gold border placement, or outer crop.

### 7.2 Mechanic template

**Fixed:** central hex, six linked satellite nodes, outer node positions, symmetry, straight-on orientation, black-metal chassis, red routing, and gold inner hex trim.

**Variable content zone:** central hex field only.

**Allowed class subjects:** need droplet/plus, effect arrows, XP, and future mechanic glyphs.

**Subject scale:** 45–60% of the inner hex width. Use one central glyph group, not multiple unrelated symbols.

**Never change:** six-node arrangement, number of spokes, hex silhouette, or external node geometry.

### 7.3 Perk template

**Fixed:** circular segmented ring, ring segmentation count, segment gaps, outer radius, inner disk radius, red ring position, gold accent positions, and straight-on orientation.

**Variable content zone:** central disk only.

**Allowed class subjects:** ability chevrons + plus, craft gear/wrench + plus, infinity loop, and future perk symbols.

**Subject scale:** 48–62% of the inner disk diameter. The symbol must remain legible at 48 px.

**Never change:** circular badge silhouette, outer ring segmentation, outer/inner radii, or the red/gold balance. A Perk must never use a hexagonal, square, page, scroll, or terminal silhouette.

### 7.4 POI template

**Fixed:** upper cap, two vertical supports, right side module, base, steps, display frame, black-metal chassis, red contour channels, gold functional trim, camera angle, and lower visual baseline.

**Variable content zone:** the central display field only.

**Allowed class subjects:** activity display, landmark miniature, resource-site miniature, service mark, vendor mark, and future POI marks.

**Subject scale:** 48–68% of the central display width. For landmark/resource-site classes, show a simplified miniature or relief inside the display field; do not alter the chassis.

**Never change:** terminal silhouette, steps, support geometry, display field proportions, or lower base width.

**Design decision:** this creates a universal POI kiosk family. It trades some literal realism for strong system consistency. The semantic distinction comes from the central display content.

### 7.5 Quest template

**Fixed:** top and bottom scroll rolls, right-side spine, roll diameters, panel proportions, red contour routing, gold trim, and straight-on view.

**Variable content zone:** the central scroll panel.

**Allowed class subjects:** sword/main story, exclamation/side, gem/unique, repeat arrows/repeatable, and future quest symbols.

**Subject scale:** 42–58% of panel width and 36–50% of panel height.

**Never change:** roll silhouette, outer scroll width, scroll height, red line placements, or gold trim routing.

### 7.6 Location template

**Fixed:** pin silhouette, circular upper field, lower pin tip, outer red contour, black-metal body, gold trim anchors, ground-ring geometry, ground-ring segment count, perspective, and pin-tip alignment.

**Variable content zone:** only the upper circular pin field.

**Allowed class subjects:** Calido sun, `S1`, `S2`, `S3`, and future approved location codes.

**Subject scale:** 42–58% of the upper pin field diameter. For `S1` through `S3`, use the same compact block type treatment and baseline.

**Never change:** the pin shape or the ground ring. The four Location class icons must be the same pin and ring with only the internal mark changed.

### 7.7 Asset rendering rig

**Fixed:** the visual language rather than a frame:

- front three-quarter camera;
- 72–88% primary-object footprint;
- black separation outline;
- black-metal material family;
- red contour and embedded seam channels;
- restrained gold functional accents;
- controlled chroma-key background;
- no floor, cast shadow, or external halo.

**Variable:** the complete physical item silhouette.

**Typical class subjects:** ammunition, building item, building material, consumable, crafting bench, currency, outfit, quest item, resource, tool, vehicle, weapon, uncategorized.

**Never do:** place a literal crate, badge ring, page, scroll, terminal, or map pin around an Asset merely to make it match other families.

---

## 8. Type icons versus class icons

### 8.1 Type icon

A type icon represents the abstract family. It should use the same family template or rendering rig but a generic category-level symbol.

Examples:

| Type     | Type-icon concept                                        |
| -------- | -------------------------------------------------------- |
| Asset    | Generic black-metal crate / item container               |
| Recipe   | Empty or generic page with a restrained preparation mark |
| Mechanic | Hex-node chassis with neutral system core                |
| Perk     | Circular progression ring with neutral chevrons/plus     |
| POI      | Universal terminal chassis                               |
| Quest    | Scroll with neutral alert/path mark                      |
| Location | Pin + ring with neutral target field                     |

### 8.2 Class icon

A class icon uses the same template geometry as its type icon but changes only the approved semantic content zone.

Do not add text labels, captions, category names, or UI headings inside the image. The application provides the text label separately.

---

## 9. Prompt system

Use the prompt in three parts:

1. **Locked production block** — same for every icon;
2. **Family module** — identifies the correct template and immutable geometry;
3. **Subject module** — names the one allowed central change.

### 9.1 Locked production block

Use this exact block in all future icon generations:

```text
Create one individual high-resolution square game UI icon at 1254 × 1254 px.

Use the attached approved Corn Mafia template image as an immutable master. Preserve its outer silhouette, framing geometry, proportions, camera angle, crop, red-neon routing, gold trim placement, black-metal construction, and padding exactly. Do not redesign, simplify, rotate, resize, or reinterpret the template.

Use only this Corn Mafia palette:
- red base #CC262D
- red neon emission #FF0000
- red depth #A11E24
- brand gold #CEA658
- bright gold #FBBF24
- gold hot highlight #FCD34D
- deep black #000000
- deep metal #050506
- metal shadow #0B0B0C
- metal midtone #17171A
- metal edge #2A2A2A
- controlled white #FFFFFF only for tiny emission cores or specular points

The icon must remain predominantly black-metal. Red is the primary contour/emission color. Gold is reserved for semantic focus and small premium trim. Do not introduce blue, cyan, purple, green, pink, bronze, orange, or any unapproved accent color.

Use a perfectly flat, solid #005BFF background intended for clean chroma-key removal. The exact blue must appear only in the background: no gradients, texture, vignette, noise, shadows, reflections, haze, atmospheric fog, bloom spill, or blue lighting on the icon.

Keep every foreground edge crisp and cleanly separated from the blue. Use a thin continuous black/dark separation outline around the full icon silhouette. Keep all red neon, gold light, highlights, reflections, and shadows contained within the icon silhouette or terminated against that dark edge. Do not allow soft glow, semi-transparent bloom, or cast shadow to fade into the blue background.

No labels, title text, category names, watermark, collage, UI sheet, background panel, cast shadow, floor, or decorative scene.
```

### 9.2 Family module: Recipe

```text
Family: Recipe.
Use Template_Recipe_Page_v1_keyblue.png as the immutable master.
Do not change the folded page shape, page dimensions, inner gold border, red contour line, or page crop.
Change only the central page-content zone.
```

### 9.3 Family module: Mechanic

```text
Family: Mechanic.
Use Template_Mechanic_HexNode_v1_keyblue.png as the immutable master.
Do not change the hexagonal outer chassis, six satellite nodes, spokes, central hex field, symmetry, ring thickness, or crop.
Change only the central hex symbol.
```

### 9.4 Family module: Perk

```text
Family: Perk.
Use Template_Perk_CircularBadge_v1_keyblue.png as the immutable master.
Do not change the circular segmented outer ring, segment count, segment gaps, outer radius, inner disk, gold marker positions, red routing, or crop.
Change only the central disk symbol.
Never use a hexagonal, square, page, scroll, terminal, or map-pin outer silhouette for a Perk.
```

### 9.5 Family module: POI

```text
Family: POI.
Use Template_POI_Terminal_v1_keyblue.png as the immutable master.
Do not change the terminal chassis, top cap, pillars, side module, steps, base, screen frame, camera angle, or crop.
Change only the central display content.
```

### 9.6 Family module: Quest

```text
Family: Quest.
Use Template_Quest_Scroll_v1_keyblue.png as the immutable master.
Do not change the top roll, bottom roll, side spine, scroll dimensions, gold trim, red contour lines, or crop.
Change only the central panel symbol.
```

### 9.7 Family module: Location

```text
Family: Location.
Use Template_Location_PinRing_v1_keyblue.png as the immutable master.
Do not change the pin silhouette, the ground ring, ring segment layout, pin-tip position, red outer contour, gold trim anchors, scale, or crop.
Change only the symbol inside the upper circular pin field.
```

### 9.8 Family module: Asset

```text
Family: Asset.
Use Template_Asset_RenderRig_v1_keyblue.png as the rendering and composition reference only.
Do not copy the crate silhouette. Create the requested physical object as the icon silhouette.
Keep the same front three-quarter camera, safe-area scale, black separation outline, black-metal material, red contour channels, restrained gold functional accents, and no-floor presentation.
```

### 9.9 Subject module examples

Append exactly one subject instruction after the locked production block and the family module.

| Target                        | Subject module                                                                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Class_Perk_Ability.png`      | `Central symbol: two upward chevrons above one small plus. Use the approved circular Perk template; keep the symbol centered and gold-dominant.`                                         |
| `Class_Perk_Craft.png`        | `Central symbol: one gear with a diagonal wrench and a small plus. Keep the symbol readable at 48 px; do not change the circular Perk frame.`                                            |
| `Class_Perk_Infinity.png`     | `Central symbol: one horizontal infinity loop. Keep it centered and gold-dominant; do not change the circular Perk frame.`                                                               |
| `Class_Location_Calido.png`   | `Central symbol: a compact gold sun glyph inside the upper pin field. Do not alter the pin or ground ring.`                                                                              |
| `Class_Location_Solace1.png`  | `Central symbol: exact compact red-neon text S1 inside the upper pin field. Do not alter the pin or ground ring.`                                                                        |
| `Class_Quest_MainStory.png`   | `Central symbol: a vertical sword, centered in the scroll panel. Do not alter the scroll geometry.`                                                                                      |
| `Class_POI_Vendor.png`        | `Central display content: a simplified gold shopping-cart/vendor motif. Do not alter the terminal chassis.`                                                                              |
| `Class_Recipe_Consumable.png` | `Central page content: bowl and spoon preparation symbol. Keep it gold-dominant; do not alter the page geometry.`                                                                        |
| `Class_Assets_Weapon.png`     | `Physical subject: a compact futuristic rifle, shown in front three-quarter view, optically centered, with black-metal body, red edge emission, and restrained gold functional details.` |

---

## 10. Prompt safety checks before generation

Before sending a prompt, verify these items:

1. The correct master template is attached.
2. The prompt says the template is immutable.
3. The prompt names only one variable semantic zone.
4. The correct entity family is named.
5. The subject does not require a prohibited silhouette.
6. The exact palette block is included.
7. The exact blue chroma-key block is included.
8. `No labels`, `no sheet`, and `no background scene` are present.
9. The target file name has been decided before generation.
10. The result is requested as one individual icon, not a group.

---

## 11. Review and acceptance checklist

### 11.1 Geometry

- [ ] Correct family template was used.
- [ ] Outer silhouette matches the master.
- [ ] For hard-template families, only the central semantic area changed.
- [ ] Perk is circular, never hexagonal.
- [ ] Mechanic is hexagonal, never circular.
- [ ] Location pin and ground ring match the approved master.
- [ ] Recipe is a folded page.
- [ ] Quest is a scroll.
- [ ] POI uses the terminal chassis.
- [ ] Asset remains a free-standing physical object.

### 11.2 Palette and materials

- [ ] Black-metal dominates the body.
- [ ] Red uses the Corn Mafia red relationship, not pink/orange/magenta.
- [ ] Gold uses the Corn Mafia gold relationship, not bronze or arbitrary yellow.
- [ ] White is limited to tiny hot points.
- [ ] No cyan, blue, green, purple, or unrelated accent appears in the icon.
- [ ] No blue reflection appears in the metal.

### 11.3 Chroma-key quality

- [ ] Background is visually one flat `#005BFF` field.
- [ ] No cast shadow appears on the blue.
- [ ] No red/gold halo reaches the blue.
- [ ] Dark separation outline encloses the entire silhouette.
- [ ] The icon remains clean after blue removal.
- [ ] Final exported corners have alpha `0`.

### 11.4 Readability

- [ ] Icon remains readable at 48 px.
- [ ] Central subject is identifiable without labels.
- [ ] Interior detail is not noisy at overview-table size.
- [ ] Narrow and wide assets have comparable optical weight.
- [ ] No meaningful detail is clipped.

---

## 12. Versioning and change control

Once a master template is approved, do not silently regenerate it.

Use semantic versioning in the template file name:

| Change                                                                                                | Version action | Example  |
| ----------------------------------------------------------------------------------------------------- | -------------- | -------- |
| Correct a file export or alpha issue without visual geometry change                                   | Patch          | `v1.0.1` |
| Tune palette, glow thickness, or material treatment across the family                                 | Minor          | `v1.1.0` |
| Change outer silhouette, ring segmentation, pin shape, scroll construction, page fold, or POI chassis | Major          | `v2.0.0` |

When a major template changes, regenerate or recompose the entire affected family. Do not mix `v1` and `v2` icons in the same live overview table.

---

## 13. Recommended folder layout

```text
assets/
  riseopedia-icons/
    masters/
      Template_Asset_RenderRig_v1_keyblue.png
      Template_Recipe_Page_v1_keyblue.png
      Template_Mechanic_HexNode_v1_keyblue.png
      Template_Perk_CircularBadge_v1_keyblue.png
      Template_POI_Terminal_v1_keyblue.png
      Template_Quest_Scroll_v1_keyblue.png
      Template_Location_PinRing_v1_keyblue.png
    keyblue/
      Type_Assets_keyblue.png
      Class_Assets_Weapon_keyblue.png
      ...
    production/
      Type_Assets.png
      Class_Assets_Weapon.png
      ...
```

The `masters/` and `keyblue/` files are production sources. The `production/` directory contains the true-alpha runtime files.

---

## 14. Final production principles

1. **One family, one frozen template language.**
2. **Only the central semantic subject changes in hard-template families.**
3. **Assets share a rendering rig, not a visible frame.**
4. **Use only the approved Corn Mafia red, gold, black-metal, white, and key-blue system.**
5. **Contain all glow inside a dark silhouette edge for reliable key removal.**
6. **Do not treat prompt text as a guarantee of exact geometry or exact hexadecimal pixels. Verify and normalize before release.**
7. **No labels or sheets: every delivered icon is a single usable asset.**
8. **Preserve the master templates and build from them; do not repeatedly redraw them.**

<!-- WE[ 	 	 			 		 				 		 				 		  	   		  	 	 		 			   	      	   	 	 		 			  		  			 		 	  	 		 			  		  	 	]WE -->
