//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// FILE: apps/web/src/components/riseopedia/RiseopediaHub.tsx                                                 ////
//// Language: TSX                                                                                              ////
//// Public Riseopedia hub composed from existing admin, public, member, and UI primitive surface styles.         ////
//// ------------------------------------------Powered by Wooden Engine------------------------------------------ ////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* eslint-disable @next/next/no-img-element */
import type { JSX } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  ChefHat,
  Database,
  type LucideIcon,
} from "lucide-react";

import RiseopediaSectionCard from "@/components/riseopedia/RiseopediaSectionCard";
import { ButtonLink, IconWell } from "@/components/ui";
import type {
  RiseopediaAssetDoc,
  RiseopediaAssetListResult,
} from "@/lib/data/riseopedia-assets";
import type {
  RiseopediaAssetClassDoc,
  RiseopediaAssetClassMediaSample,
} from "@/lib/data/riseopedia-asset-classes";
import type {
  RiseopediaRecipeDoc,
  RiseopediaRecipeListResult,
} from "@/lib/data/riseopedia-recipes";
import type {
  RiseopediaSectionDoc,
  RiseopediaSectionMediaSample,
} from "@/lib/data/riseopedia-sections";

export type RiseopediaHubProps = {
  assets: RiseopediaAssetListResult;
  recipes: RiseopediaRecipeListResult;
  sections: RiseopediaSectionDoc[];
  assetClasses: RiseopediaAssetClassDoc[];
  sectionMediaSamples: RiseopediaSectionMediaSample[];
  assetClassMediaSamples: RiseopediaAssetClassMediaSample[];
};

type HubStat = {
  label: string;
  value: number;
};

type RiseopediaHubMedia = {
  url: string;
  width: number | null;
  height: number | null;
};

type HubFeature = {
  description: string;
  href: string;
  icon: LucideIcon;
  media: RiseopediaHubMedia | null;
  meta: string;
  title: string;
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function visibleSections(
  sections: RiseopediaSectionDoc[],
): RiseopediaSectionDoc[] {
  return sections.filter(
    (section) => section.publicVisible || section.showWhenEmpty,
  );
}

function buildSectionSampleLookup(
  samples: RiseopediaSectionMediaSample[],
): Map<string, RiseopediaSectionMediaSample> {
  return new Map(samples.map((sample) => [sample.sectionCode, sample]));
}

function buildAssetClassSampleLookup(
  samples: RiseopediaAssetClassMediaSample[],
): Map<string, RiseopediaAssetClassMediaSample> {
  return new Map(samples.map((sample) => [sample.assetClassCode, sample]));
}

function findAssetFeatureMedia(
  assets: RiseopediaAssetDoc[],
): RiseopediaHubMedia | null {
  const assetWithMedia = assets.find(
    (asset) => asset.iconMedia ?? asset.detailMedia,
  );
  return assetWithMedia?.iconMedia ?? assetWithMedia?.detailMedia ?? null;
}

function findRecipeFeatureMedia(
  recipes: RiseopediaRecipeDoc[],
): RiseopediaHubMedia | null {
  const recipeWithMedia = recipes.find(
    (recipe) => recipe.outputIconMedia !== null,
  );
  return recipeWithMedia?.outputIconMedia ?? null;
}

function HubIcon({ icon: Icon }: { icon: LucideIcon }): JSX.Element {
  return <Icon aria-hidden className="admin-control-icon" strokeWidth={1.8} />;
}

function RiseopediaMediaIcon({
  fallbackIcon,
  media,
}: {
  fallbackIcon: LucideIcon;
  media: RiseopediaHubMedia | null;
}): JSX.Element {
  if (media) {
    return (
      <img
        className="riseopedia-card-media__image"
        src={media.url}
        alt=""
        width={media.width ?? undefined}
        height={media.height ?? undefined}
        loading="lazy"
      />
    );
  }

  return <HubIcon icon={fallbackIcon} />;
}

function RiseopediaHubStat({ stat }: { stat: HubStat }): JSX.Element {
  return (
    <div className="member-stat-card">
      <div className="member-stat-card__label">{stat.label}</div>
      <div className="member-stat-card__value member-stat-card__value--accent">
        {formatNumber(stat.value)}
      </div>
    </div>
  );
}

function RiseopediaHubFeatureCard({
  feature,
}: {
  feature: HubFeature;
}): JSX.Element {
  return (
    <Link
      href={feature.href}
      className="admin-control-card riseopedia-control-card"
    >
      <IconWell
        size="lg"
        className="admin-control-card__icon riseopedia-card-media"
      >
        <RiseopediaMediaIcon
          fallbackIcon={feature.icon}
          media={feature.media}
        />
      </IconWell>

      <span className="admin-control-card__body">
        <span className="public-collection-card__meta">{feature.meta}</span>
        <span className="admin-control-card__title">{feature.title}</span>
        <span className="admin-control-card__description">
          {feature.description}
        </span>
      </span>

      <ArrowRight aria-hidden className="admin-control-card__arrow" />
    </Link>
  );
}

function RiseopediaAssetClassCard({
  assetClass,
  mediaSample,
}: {
  assetClass: RiseopediaAssetClassDoc;
  mediaSample: RiseopediaAssetClassMediaSample | null;
}): JSX.Element {
  return (
    <Link
      className="admin-control-card riseopedia-control-card"
      href={`/riseopedia/assets?class=${encodeURIComponent(assetClass.code)}`}
    >
      <IconWell
        size="md"
        className="admin-control-card__icon riseopedia-card-media"
      >
        <RiseopediaMediaIcon
          fallbackIcon={Boxes}
          media={mediaSample?.media ?? null}
        />
      </IconWell>
      <span className="admin-control-card__body">
        <span className="public-collection-card__meta">
          {formatNumber(assetClass.assetCount)} assets
        </span>
        <span className="admin-control-card__title">{assetClass.name}</span>
        {mediaSample ? (
          <span className="public-collection-card__meta riseopedia-card-media__caption">
            Sample: {mediaSample.assetName}
          </span>
        ) : null}
        {assetClass.description ? (
          <span className="admin-control-card__description">
            {assetClass.description}
          </span>
        ) : null}
      </span>
      <ArrowRight aria-hidden className="admin-control-card__arrow" />
    </Link>
  );
}

function RiseopediaAssetPreviewRow({
  asset,
}: {
  asset: RiseopediaAssetDoc;
}): JSX.Element {
  const media = asset.iconMedia ?? asset.detailMedia;

  return (
    <Link
      className="public-collection-card riseopedia-preview-row"
      href={`/riseopedia/assets/${asset.slug}`}
    >
      <span
        className="public-collection-card__icon riseopedia-preview-row__icon"
        aria-hidden
      >
        {media ? (
          <img
            className="riseopedia-result-card__image"
            src={media.url}
            alt=""
            width={media.width ?? undefined}
            height={media.height ?? undefined}
            loading="lazy"
          />
        ) : (
          <Database className="riseopedia-result-card__fallback-icon" />
        )}
      </span>
      <span className="public-collection-card__body">
        <span className="public-collection-card__title">{asset.name}</span>
        <span className="public-collection-card__meta">
          {asset.assetClassName}
        </span>
      </span>
      <ArrowRight className="public-collection-card__arrow" aria-hidden />
    </Link>
  );
}

function RiseopediaRecipePreviewRow({
  recipe,
}: {
  recipe: RiseopediaRecipeDoc;
}): JSX.Element {
  const media = recipe.outputIconMedia;
  const meta = recipe.outputAssetName
    ? `Crafts ${recipe.outputAssetName}`
    : (recipe.benchName ?? "Recipe");

  return (
    <Link
      className="public-collection-card riseopedia-preview-row"
      href={`/riseopedia/recipes/${recipe.slug}`}
    >
      <span
        className="public-collection-card__icon riseopedia-preview-row__icon"
        aria-hidden
      >
        {media ? (
          <img
            className="riseopedia-result-card__image"
            src={media.url}
            alt=""
            width={media.width ?? undefined}
            height={media.height ?? undefined}
            loading="lazy"
          />
        ) : (
          <ChefHat className="riseopedia-result-card__fallback-icon" />
        )}
      </span>
      <span className="public-collection-card__body">
        <span className="public-collection-card__title">{recipe.name}</span>
        <span className="public-collection-card__meta">{meta}</span>
      </span>
      <ArrowRight className="public-collection-card__arrow" aria-hidden />
    </Link>
  );
}

function RiseopediaPreviewPanel({
  children,
  href,
  title,
}: {
  children: JSX.Element;
  href: string;
  title: string;
}): JSX.Element {
  return (
    <section className="admin-control-section riseopedia-preview-panel">
      <div className="admin-control-section__header riseopedia-section-header">
        <div>
          <h2 className="admin-control-section__title">{title}</h2>
        </div>
        <ButtonLink href={href} size="sm" variant="neutral">
          View all
        </ButtonLink>
      </div>
      {children}
    </section>
  );
}

export default function RiseopediaHub({
  assets,
  recipes,
  sections,
  assetClasses,
  sectionMediaSamples,
  assetClassMediaSamples,
}: RiseopediaHubProps): JSX.Element {
  const publicSections = visibleSections(sections);
  const sectionSampleLookup = buildSectionSampleLookup(sectionMediaSamples);
  const assetClassSampleLookup = buildAssetClassSampleLookup(
    assetClassMediaSamples,
  );
  const stats: HubStat[] = [
    { label: "assets", value: assets.totalDocs },
    { label: "recipes", value: recipes.totalDocs },
    { label: "sections", value: publicSections.length },
    { label: "asset classes", value: assetClasses.length },
  ];
  const features: HubFeature[] = [
    {
      description:
        "Search and filter public assets by section and asset class, then open profile-driven detail pages.",
      href: "/riseopedia/assets",
      icon: Database,
      media: findAssetFeatureMedia(assets.rows),
      meta: `${formatNumber(assets.totalDocs)} public rows`,
      title: "Assets",
    },
    {
      description:
        "Browse crafting recipes with crafted item images, benches, output metadata, and component detail pages.",
      href: "/riseopedia/recipes",
      icon: ChefHat,
      media: findRecipeFeatureMedia(recipes.rows),
      meta: `${formatNumber(recipes.totalDocs)} public rows`,
      title: "Recipes",
    },
  ];

  return (
    <section className="public-collection-shell">
      <div className="card public-collection-page riseopedia-page">
        <header className="admin-control-hero riseopedia-hub-hero">
          <div className="admin-control-hero__content">
            <div className="public-collection-hero__eyebrow">
              Cornucopias knowledge base
            </div>
            <h1 className="admin-control-hero__title">Riseopedia</h1>
            <p className="admin-control-hero__description">
              A public index for game assets, crafting recipes, sections, and
              profile-controlled detail pages.
            </p>
          </div>
        </header>

        <section className="member-stat-grid member-stat-grid--four">
          {stats.map((stat) => (
            <RiseopediaHubStat stat={stat} key={stat.label} />
          ))}
        </section>

        <section className="admin-control-section">
          <div className="admin-control-section__header">
            <h2 className="admin-control-section__title">Browse Riseopedia</h2>
            <p className="admin-control-section__description">
              Start broad, filter down, then open details for profile-controlled
              data.
            </p>
          </div>
          <div className="admin-control-section__grid">
            {features.map((feature) => (
              <RiseopediaHubFeatureCard feature={feature} key={feature.href} />
            ))}
          </div>
        </section>

        <section className="admin-control-section">
          <div className="admin-control-section__header">
            <h2 className="admin-control-section__title">Sections</h2>
            <p className="admin-control-section__description">
              Open a section to browse its mixed asset and recipe collection.
            </p>
          </div>
          {publicSections.length > 0 ? (
            <div className="admin-control-section__grid riseopedia-section-grid">
              {publicSections.slice(0, 8).map((section) => (
                <RiseopediaSectionCard
                  mediaSample={sectionSampleLookup.get(section.code) ?? null}
                  section={section}
                  key={section.id}
                />
              ))}
            </div>
          ) : (
            <div className="public-empty-state">
              <h2 className="public-empty-state__title">
                No public sections found.
              </h2>
              <p className="public-empty-state__message">
                Sections will appear here when the public Riseopedia sections
                view has visible rows.
              </p>
            </div>
          )}
        </section>

        {assetClasses.length > 0 ? (
          <section className="admin-control-section">
            <div className="admin-control-section__header">
              <h2 className="admin-control-section__title">Asset classes</h2>
              <p className="admin-control-section__description">
                Jump directly into broad asset families and continue into
                matching detail pages.
              </p>
            </div>
            <div className="admin-control-section__grid riseopedia-class-grid">
              {assetClasses.slice(0, 12).map((assetClass) => (
                <RiseopediaAssetClassCard
                  assetClass={assetClass}
                  mediaSample={
                    assetClassSampleLookup.get(assetClass.code) ?? null
                  }
                  key={assetClass.id}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="riseopedia-preview-grid">
          <RiseopediaPreviewPanel
            href="/riseopedia/assets"
            title="Asset preview"
          >
            {assets.rows.length > 0 ? (
              <div className="riseopedia-preview-list">
                {assets.rows.slice(0, 6).map((asset) => (
                  <RiseopediaAssetPreviewRow asset={asset} key={asset.id} />
                ))}
              </div>
            ) : (
              <div className="public-empty-state">
                <h2 className="public-empty-state__title">
                  No assets to preview.
                </h2>
              </div>
            )}
          </RiseopediaPreviewPanel>

          <RiseopediaPreviewPanel
            href="/riseopedia/recipes"
            title="Recipe preview"
          >
            {recipes.rows.length > 0 ? (
              <div className="riseopedia-preview-list">
                {recipes.rows.slice(0, 6).map((recipe) => (
                  <RiseopediaRecipePreviewRow recipe={recipe} key={recipe.id} />
                ))}
              </div>
            ) : (
              <div className="public-empty-state">
                <h2 className="public-empty-state__title">
                  No recipes to preview.
                </h2>
              </div>
            )}
          </RiseopediaPreviewPanel>
        </section>
      </div>
    </section>
  );
}
