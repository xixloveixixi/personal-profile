# Daily Notion Calendar Design

## Background

The site needs a lightweight "daily thoughts" module for short personal notes. The content should be easy to publish frequently and should use Notion as the writing backend, not the Go/MySQL admin CRUD stack.

This design adds a public `Daily` page backed by a separate Notion database. It does not change the existing Notion blog database and does not migrate blog content.

## Goals

- Add a public `/daily` page with a calendar plus selected-day detail layout.
- Use a dedicated Notion Daily database as the only content source.
- Keep entries public by default, while supporting a Notion checkbox to hide individual entries.
- Support one entry per day in the first version.
- Render entry body content from the Notion page body.
- Keep the first version text-only: no images, comments, reactions, or tag filtering.

## Non-Goals

- Do not add Go backend handlers, GORM models, migrations, or MySQL tables.
- Do not build an admin CRUD UI for Daily entries.
- Do not reuse the existing blog Notion database.
- Do not add RSS, search, tag filtering, or archive pages in the first version.
- Do not change the Notion blog sync behavior.

## User Experience

The public navigation adds a `Daily` item pointing to `/daily`.

The `/daily` page uses a calendar plus detail layout:

- The calendar shows the current selected month.
- Dates with a published Daily entry are visually marked.
- The page defaults to the most recent published Daily entry.
- Selecting another marked date updates the detail panel.
- Selecting an empty date keeps the calendar interaction lightweight and shows an empty state for that day.
- The detail panel shows title, date, tags, and the rendered Notion page body.

The page should follow the current public site style: dark page background, white text, subtle translucent surfaces, and compact rounded corners consistent with the existing UI.

## Notion Database

Daily uses a dedicated Notion database configured by:

```env
NOTION_DAILY_DATABASE_ID=<daily database id>
```

`NOTION_TOKEN` is reused from the existing Notion integration.

Required properties:

| Property | Type | Purpose |
| --- | --- | --- |
| `标题` | Title | Entry title. |
| `日期` | Date | Calendar date and sorting key. |
| `标签` | Multi-select | Optional mood/topic badges. |
| `公开` | Checkbox | Only checked entries are shown publicly. |

The entry body lives in the Notion page body, not in a rich-text property. This keeps writing natural and avoids length constraints.

## Data Model

Frontend type:

```ts
export interface NotionDailyEntry {
  id: string
  title: string
  date?: string
  tags: string[]
  isPublic: boolean
}
```

Only entries with `isPublic === true` and a valid `date` should appear in the calendar.

If multiple public entries accidentally share the same date, the UI should keep one deterministic entry for that date. The first implementation can choose the newest Notion page returned after date-desc sorting, while the product rule remains "one entry per day".

## Architecture

`lib/notion.ts` should keep existing blog behavior intact and add Daily-specific read functions:

- `getPublishedDailyEntries()`: query the Daily database, map properties, filter public entries, sort by date descending.
- `getDailyEntryBlocks(pageId)`: retrieve the selected entry body blocks for rendering.

The Notion query helper should accept a database ID parameter instead of relying only on the blog `NOTION_DATABASE_ID`. Existing blog functions continue to use `NOTION_DATABASE_ID`; Daily functions use `NOTION_DAILY_DATABASE_ID`.

The `/daily` route should catch Notion errors and render an empty state rather than crashing the public page.

## Frontend Components

Add:

- `app/daily/page.tsx`: Server Component, fetches published Daily entries and passes them to the client component.
- `app/daily/DailyClient.tsx`: Client Component for month navigation, date selection, calendar grid, and detail state.

Reuse where practical:

- Existing Notion block rendering components for page body rendering.
- Existing layout/navigation conventions.

No new global store is needed. Calendar state can stay local to `DailyClient`.

## Error Handling

- Missing `NOTION_DAILY_DATABASE_ID`: show an empty Daily page state, not a runtime crash.
- Notion query failure: catch at the route boundary and show an empty state.
- Entry body block fetch failure: show title/date/tags and a short body unavailable state.
- Empty Daily database: show an empty state.

## Acceptance Criteria

- `/daily` renders without affecting `/blog`.
- Navigation includes `Daily`.
- A public Notion Daily entry appears on its date in the calendar.
- The page defaults to the most recent public entry.
- Clicking a marked date updates the detail panel.
- Entries with `公开=false` do not appear.
- Entry body is rendered from Notion page body content.
- Missing or failing Notion Daily configuration does not crash the page.
- `npm run build` passes.

## Open Implementation Notes

- Prefer Chinese Notion property names from this spec, with optional English fallbacks only if needed during implementation.
- Use date strings as local calendar days; avoid timezone conversions that can shift the selected date.
- Keep the first implementation scoped to a single month view and one entry per day.
