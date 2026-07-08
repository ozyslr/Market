# Graph Report - src\components (2026-06-07)

## Corpus Check

- cluster-only mode — file stats not available

## Summary

- 293 nodes · 263 edges · 62 communities (31 shown, 31 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness

- Built from commit: `20cbc640`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)

- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]

## God Nodes (most connected - your core abstractions)

1. `Breadcrumb()` - 3 edges
2. `SEO()` - 3 edges
3. `SearchBar()` - 3 edges
4. `SortOption` - 3 edges
5. `ProductFormData` - 3 edges
6. `JsonLd()` - 3 edges
7. `organizationSchema()` - 3 edges
8. `websiteSchema()` - 3 edges
9. `breadcrumbSchema()` - 3 edges
10. `normCatName()` - 2 edges

## Surprising Connections (you probably didn't know these)

- `Breadcrumb()` --calls--> `breadcrumbSchema()` [EXTRACTED]
  common/Breadcrumb.tsx → seo/schemas.ts
- `SEO()` --calls--> `organizationSchema()` [EXTRACTED]
  common/SEO.tsx → seo/schemas.ts
- `SEO()` --calls--> `websiteSchema()` [EXTRACTED]
  common/SEO.tsx → seo/schemas.ts
- `ProductFormModalProps` --references--> `ProductFormData` [EXTRACTED]
  seller/ProductFormModal.tsx → seller/ProductForm.tsx

## Import Cycles

- None detected.

## Communities (62 total, 31 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.07
Nodes (19): AuthModalProps, getL3Items(), ICON_MAP, MegaMenu(), MegaMenuProps, normCatName(), CATEGORY_ICONS, containerVariants (+11 more)

### Community 1 - "Community 1"

Cohesion: 0.10
Nodes (18): ActiveFilters, FacetCounts, FilterPanelProps, PRICE_PRESETS, CATEGORY_LABELS, Props, FILTER_LABELS, FilterOption (+10 more)

### Community 2 - "Community 2"

Cohesion: 0.13
Nodes (12): Breadcrumb(), BreadcrumbItem, BreadcrumbProps, Helmet, LANGUAGES, SEO(), SEOProps, JsonLd() (+4 more)

### Community 3 - "Community 3"

Cohesion: 0.10
Nodes (9): ProductCardProps, Props, SOURCE_COLORS, SOURCE_ICONS, StripProps, DEFAULT_WIDTHS, SLIDES, ProductGalleryProps (+1 more)

### Community 4 - "Community 4"

Cohesion: 0.19
Nodes (9): CategorySelectProps, EMPTY_FORM, ProductForm(), ProductFormData, ProductFormField, ProductFormProps, QUICK_ADD_FIELDS, UploadFileState (+1 more)

### Community 5 - "Community 5"

Cohesion: 0.18
Nodes (7): EMPTY_ADDRESS, Props, DE_CITIES, MARKET_OPTIONS, MarketConfig, UK_CITIES, US_CITIES

### Community 6 - "Community 6"

Cohesion: 0.20
Nodes (5): Props, StatCardProps, STATUS_COLORS, STATUS_LABELS, TYPE_LABELS

### Community 7 - "Community 7"

Cohesion: 0.36
Nodes (6): CategoryListSkeleton(), ProductCardSkeleton(), ProductGridSkeleton(), SearchResultsSkeleton(), SkeletonProps, TableRowSkeleton()

### Community 8 - "Community 8"

Cohesion: 0.29
Nodes (7): getActiveIndex(), HistoryEntry, OrderTimeline(), OrderTimelineProps, STEP_ORDER, STEPS, TERMINAL_NEGATIVE

### Community 9 - "Community 9"

Cohesion: 0.29
Nodes (5): CATEGORY_LABELS, CompactRatingProps, Props, SellerRatingSummary(), SellerCardProps

### Community 10 - "Community 10"

Cohesion: 0.33
Nodes (3): CartGift, OrderSummaryProps, CARRIER_LABELS

### Community 12 - "Community 12"

Cohesion: 0.33
Nodes (4): CATEGORY_LABELS, Props, CATEGORY_LABELS, Props

### Community 13 - "Community 13"

Cohesion: 0.40
Nodes (3): VariantSelectorProps, VariantOption, VariantSwatchesProps

### Community 15 - "Community 15"

Cohesion: 0.50
Nodes (3): BankAccount, DEFAULT_ACCOUNTS, ManualPaymentProps

### Community 16 - "Community 16"

Cohesion: 0.50
Nodes (3): Option, OPTIONS, PaymentMethodSelectorProps

### Community 17 - "Community 17"

Cohesion: 0.50
Nodes (3): BOT_NAMES, CITIES, PRODUCTS

### Community 20 - "Community 20"

Cohesion: 0.50
Nodes (3): AddressFormState, CardKey, EMPTY_ADDRESS

### Community 21 - "Community 21"

Cohesion: 0.50
Nodes (3): Props, REASON_LABELS, STATUS_LABELS

## Knowledge Gaps

- **132 isolated node(s):** `QUICK_REPLIES`, `AdminRouteProps`, `ViewState`, `AddressSelectorProps`, `IyzicoPaymentProps` (+127 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **31 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **What connects `QUICK_REPLIES`, `AdminRouteProps`, `ViewState` to the rest of the system?**
  _132 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07258064516129033 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1341991341991342 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
