# ADR-005: Three-Section Navigation Redesign

## Status

Accepted

## Context

The app had four bottom navigation tabs: Inicio (dashboard with recent events), Nuevo (event creation form), Tratamientos, and Historial (event search/filters). This layout had several issues:

- The "Nuevo" tab was a dedicated page for a single action (creating an event), wasting prime navigation real estate.
- Event browsing and event history were split across two different sections (Inicio showed recent events; Historial had filters).
- Users had to switch tabs frequently to create, browse, and filter events.

## Decision

Restructure the navigation from 4 tabs to 3:

1. **Inicio** — Dashboard with FamilySummary and ExpenseSummary (no event list).
2. **Eventos** — Unified event list combining browse + create + filter in one page. Filters are collapsed by default. Event creation is an inline button at the bottom.
3. **Tratamientos** — Unchanged.

Additionally:
- Event cards on the Eventos page support **swipe-to-reveal** actions (Archive, Duplicate) using pure CSS + React touch events (no gesture library).
- The event detail page no longer contains Copy/Archive actions — those are only accessible via swipe on the event list.
- Reembolso info is merged into the event detail card alongside doctor/place/cost.
- AppInfo now displays automerge document size.

## Consequences

- Users access all event-related workflows from a single tab.
- The home page becomes a clean summary dashboard without redundant event lists.
- Archive/duplicate actions are discoverable via swipe or right-click context menu.
- The detail page is simplified, focusing on viewing and editing event data.
- Swipe gesture support uses zero external dependencies (pure React touch events).
