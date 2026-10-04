# Per-Tab Headings, Overviews, and About-Page API Section

Date: 2026-10-02

## Problem

`src/app/app.component.html` renders one static heading for every route:

```html
<h1>Displays the Birth Star</h1>
```

All four tabs therefore show "Displays the Birth Star", including Timeline, Month View and
About, where it is simply wrong. There is also no indication of what each tab contains, and
the About page does not mention the `vpv-panchangam` library that performs every calculation
the app displays.

## Goals

1. Give each tab its own `<h1>` plus a one-line overview of its content.
2. Spell-check the new copy and the existing About copy.
3. Add an overview of the `vpv-panchangam` API to the About page, linking the demo page,
   the GitHub repository and the npm package.

## Non-Goals

- No visual redesign. One small style rule for the overview line, nothing else.
- No routing changes. `app-routing.module.ts` is untouched.
- No new components, services or dependencies.
- No fix for unrelated data bugs found in passing (see Out of Scope).

## Approach

Extend the existing nav `links` array in `AppComponent` so each entry carries its own
`heading` and `overview`, and look up the active entry from the already-present
`route.fragment | async`.

### Alternatives considered

**Each page component renders its own `<h1>` and overview.** Better encapsulation, but it
duplicates markup and styling across five components, lets the nav label and heading drift
apart, and conflicts with the existing `<h2>` in `PageNotFoundComponent`.

**Put `heading` / `overview` in route `data`.** The most idiomatic Angular placement, since
metadata sits beside the route definition. Rejected: the `ActivatedRoute` injected into
`AppComponent` is the *root* route, so reading child route data requires `routerState`
traversal or router-event plumbing. It also forces `provideRouter([])` to become
`provideRouter(routes)` in the existing spec, for no user-visible gain.

**Chosen:** the `links` array. One source of truth means the nav label, heading and overview
cannot disagree, it reuses the async-pipe pattern already in `app.component.html`, and it
touches two files.

## Page copy

The heading is the tab name. Each overview line is one sentence, spell-checked, and verified
against what the corresponding component actually renders.

| Fragment | Heading | Overview |
|---|---|---|
| `timeline` | Timeline | Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice. |
| `list` | Month View | Browse a full month of Moon sign transits as either a list or a calendar, with every Rashi and Nakshatra change marked by date and time in IST. |
| `home` | Find Birth Star | Enter your date of birth, time and time zone to find your Nakshatra (birth star), Moon sign and its general characteristics. |
| `about` | About | What Stary is, who built it, and the vpv-panchangam API that powers every calculation. |

Accuracy notes:

- The Timeline overview states a 15-day window and a selectable time zone because
  `TimelineViewComponent` sets `totalDays = 15` and offers a 17-entry timezone dropdown.
- The Month View overview says IST because `getListWithTransisionsInIST()` is fixed to
  `Asia/Kolkata` and Chennai coordinates. The view has no time zone selector.
- The Find Birth Star overview matches the result card, which shows Rashi, Nakshatra and a
  prediction blurb.
- The wildcard route `**` renders no heading or overview. `PageNotFoundComponent` already
  owns its own `<h2>Page Not Found</h2>`, and a fallback heading would duplicate it.

## Changes

### `src/app/app.component.ts`

Add `heading` and `overview` to each `links` entry, and a lookup helper:

```ts
links = [
  { title: 'Timeline', fragment: 'timeline', heading: 'Timeline',
    overview: "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice." },
  { title: 'Month View', fragment: 'list', heading: 'Month View',
    overview: 'Browse a full month of Moon sign transits as either a list or a calendar, with every Rashi and Nakshatra change marked by date and time in IST.' },
  { title: 'Find Birth Star', fragment: 'home', heading: 'Find Birth Star',
    overview: 'Enter your date of birth, time and time zone to find your Nakshatra (birth star), Moon sign and its general characteristics.' },
  { title: 'About', fragment: 'about', heading: 'About',
    overview: 'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.' },
];

pageFor(fragment: string) {
  return this.links.find(l => l.fragment === fragment);
}
```

### `src/app/app.component.html`

Replace the static `<h1>` with a guarded block. Nesting inside `@if` means `pageFor()`
returns `undefined` on an unmatched route and nothing renders:

```html
@if (route.fragment | async; as fragment) {
  @if (pageFor(fragment); as page) {
    <h1>{{ page.heading }}</h1>
    <p class="page-overview">{{ page.overview }}</p>
  }
}
<router-outlet></router-outlet>
```

No signals and no router subscription: the existing `route.fragment | async` pattern is
reused. No `<h1>` fallback is provided, because a wrong heading is worse than none.

### `src/app/app.component.scss`

Currently empty. Add one rule so the overview reads as a subtitle:

```scss
.page-overview {
  color: #6c757d;
  margin-bottom: 1rem;
}
```

### `src/app/about/about.component.html`

Corrections to the existing text:

- `passonate` -> `passionate`
- `createion` -> `creation`
- "my twitter handle" -> "my Twitter handle"
- "my github repo" -> "my GitHub repository"
- Drop the stale "Angular 10" claim. The project is on Angular 21 (`package.json`), so the
  sentence changes from "This is just a simple creation to learn some Angular 10 and
  playaround." to "This started out as a simple side project to learn Angular and to play
  around with the `vpv-panchangam` library." The framework version is not stated, so the
  claim stays true as the project upgrades.

New section:

```html
<h4>Powered by vpv-panchangam</h4>
<p>
  Every calculation on this site comes from <strong>vpv-panchangam</strong>, an open-source
  Vedic Panchang and Kundali library for Node.js and browsers. Astronomical calculations use
  the Swiss Ephemeris compiled to WebAssembly, so no native build step is required.
</p>
<ul>
  <li>Full Drik Panchang &mdash; Tithi, Nakshatra, Yoga, Karana, Vara, Moon sign and Sun sign</li>
  <li>Auspicious and inauspicious timings, Gowri Panchangam and Planetary Hora</li>
  <li>Birth charts (D1&ndash;D60), Vimshottari Dasha and Ashtakavarga</li>
  <li>Output in English, Hindi and Tamil</li>
</ul>
<p>
  <a href="https://reflexdemon.github.io/vpv-panchangam/">Live demo</a> &middot;
  <a href="https://github.com/reflexdemon/vpv-panchangam">GitHub</a> &middot;
  <a href="https://www.npmjs.com/package/vpv-panchangam">npm</a>
</p>
```

The feature bullets come from the package's own README, not invented. The npm package is
named `vpv-panchangam`; the name `vedic-panchanga` appears only in that README's install
snippet and does not resolve, so the link uses the real name.

### Other components

| Location | Current | Fixed |
|---|---|---|
| `user-input.component.html` | `Day light Savings?` | `Daylight saving time?` |
| `user-input.component.html` | `Birth Star is X and Rashi is Y` | `Nakshatra is X and Moon sign is Y` |

### Rashi naming: explicitly not changed

The Cancer label reads `Kataka` while `vpv-panchangam` returns `Karka`. An earlier draft of
this spec proposed normalising the label to `Karka`. **That is dropped**, for three reasons.

It is not a spelling error. "Kataka" is a legitimate South-Indian transliteration of
कर्क, arguably more common in Tamil panchangam than "Karka". Changing it is a
normalisation decision, not a typo fix.

The blast radius is 8 locations across 5 files: `RASHI_ZODIAC` (both the Cancer label and
Aquarius's `chandrashtama` value), `RASHI_NAME_MAP`, the `RASHI_PREDICTIONS` key and its
copy, the `rashiColor()` maps in both `timeline-view.component.ts` and
`astro-list.component.ts`, and the assertion in `astro-service.service.spec.ts`.

Note that `Karka` legitimately appears twice in `astro-service.service.ts` — as the
`RASHI_NAME_MAP` key and in a doc comment. That is the vpv-panchangam library's own
Sanskrit name for Cancer, which the map translates *to* the display name `Kataka`. Those
two occurrences are correct and must not be "corrected" to `Kataka`.

Two of those are silent-failure hazards. Both `rashiColor()` maps end in
`colors[rashi] || '#f8f9fa'`, so a missed key does not throw -- Cancer would render
near-invisible light grey in the timeline and month view with no error in the console.

There is also no user-visible benefit: both spellings mean Cancer, and no user reads the raw
Sanskrit label and finds it wrong.

If this normalisation is wanted later, it belongs in its own change with regression tests
around the colour lookup.

## Testing

Extend `app.component.spec.ts`, which already has two passing tests that stay untouched:

- renders the Timeline heading and overview when the router starts at `/timeline`
- `pageFor()` returns the matching entry for a known fragment and `undefined` for an
  unknown one
- the existing `title === 'stary'` assertion is unchanged

No test asserts on About page prose; asserting on static copy is brittle, and the existing
`about.component.spec.ts` "should create" test already covers the component mounting.

## Verification

1. `npm run build` — catches template type errors, including the `pageFor()` return type.
2. `npm test` — headless Karma; confirms the new specs pass and nothing regressed.

No `ng serve` browser pass is required for a template-and-copy change. A visual check of all
four tabs is available on request.

## Out of Scope

Found while reading the code, not a spelling issue:

- `RASHI_ZODIAC[10].zodiacImg` is `''` for Aquarius, but `assets/img/sign/aquarius.jpg`
  exists. The empty string is falsy and handled downstream, so this is a missing value
  rather than a crash.
- The `vpv-panchangam` README's install snippet names the package `vedic-panchanga`, which
  does not resolve on npm. It lives in the dependency, so it is not fixable from this repo.