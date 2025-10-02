// FILE: apps/cms/src/utils/svgSanitize.ts
// Language: TypeScript

import { readFile, writeFile } from "fs/promises";
import path from "path";
import sanitizeHtml from "sanitize-html";
import { MEDIA_ROOT } from "./mediaPath";

/**
 * Sanitize an SVG file on disk using a strict allowlist.
 * - Removes <script>, <foreignObject>, event handlers, data URLs, etc.
 * - Keeps common vector/gradient/filter elements & safe attributes.
 */
export async function sanitizeSVGIfNeeded(relPath: string) {
  if (!relPath.toLowerCase().endsWith(".svg")) return;

  const abs = path.join(MEDIA_ROOT, relPath);
  const raw = await readFile(abs, "utf8");

  const allowedTags = [
    "svg", "g", "defs", "symbol", "use",
    "path", "circle", "ellipse", "rect", "line", "polyline", "polygon",
    "text", "tspan",
    "clipPath", "mask",
    "linearGradient", "radialGradient", "stop",
    "pattern",
    "filter",
    "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite",
    "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap",
    "feDropShadow", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR",
    "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology",
    "feOffset", "feSpecularLighting", "feTile", "feTurbulence"
  ];

  // Common safe attributes for SVG elements
  const commonAttrs = [
    "id", "class", "style", "transform",
    "x", "y", "x1", "y1", "x2", "y2",
    "cx", "cy", "r", "rx", "ry",
    "d", "points",
    "width", "height", "viewBox", "preserveAspectRatio",
    "fill", "fill-opacity", "fill-rule",
    "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "stroke-dashoffset", "stroke-opacity",
    "opacity",
    "mask", "clip-path",
    "href", "xlink:href",
    "filter", "filterUnits", "primitiveUnits",
    "gradientUnits", "gradientTransform", "spreadMethod", "offset",
    "patternUnits", "patternContentUnits", "patternTransform",
    "in", "in2", "result", "stdDeviation", "operator", "k1", "k2", "k3", "k4",
    "values", "type", "kernelMatrix", "divisor", "bias", "targetX", "targetY",
    "edgeMode", "kernelUnitLength", "order", "scale", "xChannelSelector", "yChannelSelector",
    "surfaceScale", "specularConstant", "specularExponent", "diffuseConstant"
  ];

  const cleaned = sanitizeHtml(raw, {
    allowedTags,
    // Only strings here; include "data-*" wildcard as a string (typings accept it)
    allowedAttributes: {
      "*": [...commonAttrs, "data-*"],
    },
    allowedSchemes: ["http", "https"],
    allowedSchemesAppliedToAttributes: ["href", "xlink:href"],
    disallowedTagsMode: "discard",
    transformTags: {
      "*": (tagName, attribs) => {
        const safeAttribs: Record<string, string> = {};
        for (const [k, v] of Object.entries(attribs)) {
          if (/^on[A-Z]/i.test(k)) continue; // strip event handlers
          if (k === "style" && /url\s*\(/i.test(String(v))) continue; // block url() in styles
          safeAttribs[k] = String(v);
        }
        return { tagName, attribs: safeAttribs };
      },
    },
    exclusiveFilter: (frame) => frame.tag === "foreignObject",
    parser: {
      lowerCaseAttributeNames: false,
      lowerCaseTags: false,
      decodeEntities: true,
    },
  });

  await writeFile(abs, cleaned, "utf8");
}
