# @findly.tech/shop-module-pwa

FINDLY-Integration für PlentyONE PWA-Shops. Das Modul registriert dünne Router-Composables für `useSearch`, `useSearchSuggestions` und `useProducts`. **Nur wenn** das Backend-Plugin aktiv ist (`enabled: true`), werden FINDLY-REST-Endpoints genutzt. Andernfalls delegiert das Modul **1:1 an die Theme-Composables** des Shops (`app/composables/…`) – kein eigener Plenty-Fallback-Pfad.

## Voraussetzungen

1. PlentyONE-Plugin **FINDLYPlentyOnePWABackend** installiert und konfiguriert
2. PlentyONE PWA mit `@plentymarkets/shop-core`
3. `.env` mit `CONFIG_ID` und `API_ENDPOINT`

## Installation

```bash
npm install @findly.tech/shop-module-pwa
```

Lokale Entwicklung (Monorepo / File-Link):

```bash
npm install file:../FINDLYPlentyOnePWAModule
```

## Nuxt-Konfiguration

In `nuxt.config.ts` **nach** `@plentymarkets/shop-core` eintragen:

```typescript
export default defineNuxtConfig({
  modules: [
    '@plentymarkets/shop-core',
    '@findly.tech/shop-module-pwa',
    // …weitere Module
  ],
  findly: {
    enabled: true,
  },
});
```

## Aktivierungslogik

| Bedingung | Verhalten |
|-----------|-----------|
| Kein `CONFIG_ID` in `.env` | Theme-Composables, kein `/rest/findly/settings` |
| `enabled: false` / Plugin fehlt / Netzwerkfehler | Theme-Composables (identisch zu Shop ohne FINDLY) |
| `enabled: true` | FINDLY-REST für Suche / Facet / Autocomplete |

Optional lädt das Client-Plugin `GET /rest/findly/settings` beim Start (nur mit `CONFIG_ID`), sofern die Daten nicht bereits per SSR (`useAsyncData`) vorliegen. Pro Sprache und Reload erfolgt höchstens **ein** Netzwerk-Request.

### Routing bei aktivem FINDLY

| Composable | Plenty-Standard | FINDLY |
|------------|-----------------|--------|
| `useSearch` | `getSearch` | `POST /rest/findly/search` |
| `useSearchSuggestions` | `getItemSearchAutocomplete` | `POST /rest/findly/search` (`autocomplete: true`) |
| `useProducts` | `getFacet` | `POST /rest/findly/facet` |

Bei `onlySearch: true` in den Plugin-Settings bleiben Kategorie/Filter auf Plenty (`getFacet`); Suche und Autocomplete nutzen FINDLY.

## Öffentliche API

### `useFindlyContext()`

```typescript
const {
  isActive,           // FINDLY aktiv für aktuelle Sprache
  isSearchEnabled,    // Suche über FINDLY
  isAutocompleteEnabled,
  isFacetEnabled,     // false bei onlySearch
  settings,           // Plugin-Settings (Anzeige-Flags, filterUi, …)
  ensureReady,        // Settings laden (wird von Composables automatisch aufgerufen)
} = useFindlyContext();
```

## Architektur (v0.2+)

Das Modul registriert **Router-Composables** mit Priority 100. Bei inaktivem FINDLY delegieren sie per explizitem Import an die Theme-Dateien unter `app/composables/…` (z. B. `~/composables/useProducts/useProducts`). Dadurch laufen Theme-Anpassungen und Plenty-Standard unverändert.

| Pfad | FINDLY inaktiv | FINDLY aktiv (`enabled: true`) |
|------|----------------|--------------------------------|
| Kategorie / Filter | Theme `useProducts` → `getFacet` | `POST /rest/findly/facet` |
| Suche | Theme `useSearch` | `POST /rest/findly/search` |
| Autocomplete | Theme `useSearchSuggestions` | FINDLY-Autocomplete |

`findly: { enabled: false }` in `nuxt.config.ts` deaktiviert das Modul vollständig (keine Router, kein Settings-Plugin).

## Fehlerbehandlung

Schlägt ein FINDLY-Request zur Laufzeit fehl, fällt das Modul für diesen einzelnen Request auf die Plenty-API zurück (Graceful Degradation).

## Lizenz

AGPL-3.0

## npm-Veröffentlichung

Siehe [docs/NPM_PUBLISHING.md](./docs/NPM_PUBLISHING.md).
