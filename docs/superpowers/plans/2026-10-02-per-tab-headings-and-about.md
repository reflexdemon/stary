# Per-Tab Headings and About-Page API Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single static "Displays the Birth Star" heading with a per-tab `<h1>` plus a one-line overview, and add a `vpv-panchangam` API section to the About page.

**Architecture:** Each entry in `AppComponent.links` gains `heading` and `overview` fields. The shell template resolves the active entry from the existing `route.fragment | async` and renders the heading only when the fragment matches a known link. No signals, no routing changes, no new files.

**Tech Stack:** Angular 21 (standalone components, `@if`/`@for` control flow, `async` pipe), SCSS, Jasmine + Karma (ChromeHeadless).

## Global Constraints

- Copy strings are **exact and final**. Do not reword, re-wrap, or "improve" them. They were reviewed and approved.
- The Astro component's spellings must be preserved: **Rashi**, **Nakshatra**, **Chandrashtama**, **Pancha(n)gam**, **Panchang**, **Drik Panchang**, **Kundali**, **Gowri Panchangam**, **Ashtakavarga**, **Vimshottari Dasha**, **WebAssembly**.
- **Do not rename `Kataka` to `Karka`.** The Cancer rashi label stays `Kataka` in all 7 of its locations. This is explicitly out of scope; see the spec's "Rashi naming: explicitly not changed" section.
- Do not touch `src/app/app-routing.module.ts`. Routes are unchanged.
- Do not add new dependencies or components.
- Test command is `npx ng test --watch=false --browsers=ChromeHeadless`. Plain `npm test` watches forever and never exits — do not use it for verification.

---

### Task 1: Add `heading` and `overview` metadata to nav links

**Files:**
- Modify: `src/app/app.component.ts:16-21`
- Test: `src/app/app.component.spec.ts`

**Interfaces:**
- Consumes: nothing. This is the first task.
- Produces:
  ```ts
  // AppComponent
  links: { title: string; fragment: string; heading: string; overview: string }[]
  pageFor(fragment: string): { title: string; fragment: string; heading: string; overview: string } | undefined
  ```
  Task 2 consumes both `pageFor()` and the `links` shape.

- [ ] **Step 1: Write the failing tests**

Replace the whole contents of `src/app/app.component.spec.ts` with:

```ts
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])]
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'stary'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('stary');
  });

  it('gives every nav link a non-empty heading and overview', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.links.length).toBe(4);
    for (const link of app.links) {
      expect(link.heading.length).toBeGreaterThan(0);
      expect(link.overview.length).toBeGreaterThan(0);
    }
  });

  it('pageFor returns the entry matching a known fragment', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.pageFor('timeline')?.title).toBe('Timeline');
    expect(app.pageFor('list')?.title).toBe('Month View');
    expect(app.pageFor('home')?.title).toBe('Find Birth Star');
    expect(app.pageFor('about')?.title).toBe('About');
  });

  it('pageFor returns undefined for an unknown fragment', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.pageFor('nope')).toBeUndefined();
    expect(app.pageFor('')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: FAIL. The three new specs fail with `pageFor is not a function` (TypeError), or `Cannot read properties of undefined (reading 'heading')` for the `links` shape spec. The two pre-existing specs still pass.

- [ ] **Step 3: Implement the metadata and the lookup**

In `src/app/app.component.ts`, replace the `links` array and add `pageFor()`:

```ts
  links = [
    {
      title: 'Timeline', fragment: 'timeline', heading: 'Timeline',
      overview: "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice."
    },
    {
      title: 'Month View', fragment: 'list', heading: 'Month View',
      overview: 'Browse a full month of Moon sign transits as either a list or a calendar, with every Rashi and Nakshatra change marked by date and time in IST.'
    },
    {
      title: 'Find Birth Star', fragment: 'home', heading: 'Find Birth Star',
      overview: 'Enter your date of birth, time and time zone to find your Nakshatra (birth star), Moon sign and its general characteristics.'
    },
    {
      title: 'About', fragment: 'about', heading: 'About',
      overview: 'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.'
    },
  ];

  route = inject(ActivatedRoute);

  pageFor(fragment: string) {
    return this.links.find(link => link.fragment === fragment);
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: `TOTAL: 19 SUCCESS` with zero FAILED. The baseline is 16 specs; this task adds 3, so the count must rise to exactly 19. Both pre-existing specs in this file are kept unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/app/app.component.ts src/app/app.component.spec.ts
git commit -m "Add heading and overview metadata to nav links"
```

---

### Task 2: Render the per-tab heading and overview in the shell

**Files:**
- Modify: `src/app/app.component.html:11`
- Modify: `src/app/app.component.scss` (currently empty)
- Test: `src/app/app.component.spec.ts`

**Interfaces:**
- Consumes: `AppComponent.pageFor(fragment: string)` and the `links` shape from Task 1.
- Produces: DOM contract — a `<h1>` and a `<p class="page-overview">` rendered inside `.container` whenever the current fragment matches a known link; neither element rendered otherwise.

- [ ] **Step 1: Write the failing tests**

Append to `src/app/app.component.spec.ts`. Add these two imports at the top of the file, alongside the existing ones:

```ts
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
```

`ActivatedRoute` is added to the existing `@angular/router` import line; `BehaviorSubject` becomes a new import from `rxjs`. The final import block must be:

```ts
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { AppComponent } from './app.component';
```

Then append this new `describe` block at the end of the file:

```ts
describe('AppComponent heading', () => {
  let fragment$: BehaviorSubject<string | null>;

  beforeEach(() => {
    fragment$ = new BehaviorSubject<string | null>('timeline');
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { fragment: fragment$.asObservable() } },
      ],
    });
  });

  it('renders the Timeline heading for the timeline fragment', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Timeline');
    expect(el.querySelector('p.page-overview')?.textContent?.trim()).toBe(
      "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice."
    );
  });

  it('swaps heading and overview when the fragment changes', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fragment$.next('about');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('About');
    expect(el.querySelector('p.page-overview')?.textContent?.trim()).toBe(
      'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.'
    );
  });

  it('renders no heading for an unknown fragment', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fragment$.next('does-not-exist');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h1')).toBeNull();
    expect(el.querySelector('p.page-overview')).toBeNull();
  });

  it('still renders all four nav tabs', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('ul.nav-tabs li').length).toBe(4);
  });
});
```

The `ActivatedRoute` stub is what makes these specs hermetic: it supplies the `fragment`
observable directly instead of navigating, so no route component is ever mounted and the
tests never load the Swiss Ephemeris WASM. `provideRouter([])` is still required so
`[routerLink]` and `<router-outlet>` have a `Router` to inject. This approach is
pre-validated — a spike confirmed the template renders cleanly under `detectChanges()` with
this provider setup.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: FAIL. The first spec fails with `expected 'Displays the Birth Star' to be 'Timeline'`. The second fails with `expected 'Displays the Birth Star' to be 'About'`. The third fails because `el.querySelector('h1')` is not null. The fourth passes already.

- [ ] **Step 3: Implement the template**

In `src/app/app.component.html`, replace line 11 (`  <h1>Displays the Birth Star</h1>`) with:

```html
  @if (route.fragment | async; as fragment) {
    @if (pageFor(fragment); as page) {
      <h1>{{ page.heading }}</h1>
      <p class="page-overview">{{ page.overview }}</p>
    }
  }
```

The nesting is deliberate. On an unmatched route `pageFor()` returns `undefined`, the `@if` body is skipped, and no heading renders — `PageNotFoundComponent` supplies its own `<h2>Page Not Found</h2>`.

- [ ] **Step 4: Add the overview style**

`src/app/app.component.scss` is currently empty. Write:

```scss
.page-overview {
  color: #6c757d;
  margin-bottom: 1rem;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: `TOTAL: 23 SUCCESS` with zero FAILED — the 19 from Task 1 plus these 4.

- [ ] **Step 6: Verify the production build compiles**

Run: `npm run build`

Expected: build succeeds. Angular's template type checker validates `page.heading` and `page.overview` against the inferred `links` element type. No errors about implicit `any` or unknown properties.

- [ ] **Step 7: Commit**

```bash
git add src/app/app.component.html src/app/app.component.scss src/app/app.component.spec.ts
git commit -m "Render per-tab heading and overview in the app shell"
```

---

### Task 3: About page copy corrections and the vpv-panchangam section

**Files:**
- Modify: `src/app/about/about.component.html`

**Interfaces:**
- Consumes: nothing. Static template, no logic.
- Produces: nothing consumed by other tasks. No test is added — see Step 1.

- [ ] **Step 1: Confirm no test is needed, and record the baseline**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: `TOTAL: 23 SUCCESS`. This is the baseline to compare against in Step 3. The existing `about.component.spec.ts` only asserts the component instantiates; adding assertions on static prose would be brittle, and the requirement is a copy-only change with no behaviour to regress.

- [ ] **Step 2: Rewrite `src/app/about/about.component.html`**

Replace the entire file with:

```html
<h4>Venkateswara Venkatraman Prasanna</h4>
<p>
  I am a passionate developer who loves to code and do some math for fun.
  This started out as a simple side project to learn Angular and to play around with the
  vpv-panchangam library.
</p>

<p>
  If you found it helpful, let me know through my Twitter handle
  <a href="https://twitter.com/reflexdemon">&#64;reflexdemon</a>
</p>
<p>
  The source code for this project is available in my GitHub repository.
  <a href="https://github.com/reflexdemon/stary">github.com/reflexdemon/stary</a>
</p>

<hr/>

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

Corrections applied, for review: `passonate` → `passionate`, `createion` → `creation`, "my twitter handle" → "my Twitter handle", "my github repo" → "my GitHub repository", and the stale "Angular 10" claim replaced with a version-free sentence (the project is on Angular 21).

The npm package name is `vpv-panchangam`. The name `vedic-panchanga` appears only in the dependency README's install snippet and does not resolve on npm.

- [ ] **Step 3: Verify nothing regressed**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: `TOTAL: 23 SUCCESS` — identical to the Step 1 baseline.

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/app/about/about.component.html
git commit -m "Correct About page copy and document the vpv-panchangam API"
```

---

### Task 4: Copy corrections in the Find Birth Star form

**Files:**
- Modify: `src/app/user-input/user-input.component.html:24`
- Modify: `src/app/user-input/user-input.component.html:51`

**Interfaces:**
- Consumes: nothing. Static template copy.
- Produces: nothing consumed by other tasks.

- [ ] **Step 1: Fix the daylight-saving label**

Replace line 24:

```html
  Day light Savings?
```

with:

```html
  Daylight saving time?
```

- [ ] **Step 2: Fix the result-card sentence**

Replace line 51:

```html
        Birth Star is  <strong>{{whatIsToday.nakshatra}}</strong> and Rashi is <strong>{{whatIsToday.rashi}}</strong>
```

with:

```html
        Nakshatra is <strong>{{whatIsToday.nakshatra}}</strong> and Moon sign is <strong>{{whatIsToday.rashi}}</strong>
```

This also removes a stray double space before the first `<strong>`.

- [ ] **Step 3: Verify nothing regressed**

Run: `npx ng test --watch=false --browsers=ChromeHeadless`

Expected: `TOTAL: 23 SUCCESS`.

Run: `npm run build`

Expected: build succeeds. The interpolated bindings are unchanged, so the template type checker is satisfied.

- [ ] **Step 4: Commit**

```bash
git add src/app/user-input/user-input.component.html
git commit -m "Fix copy in the Find Birth Star form"
```

---

## Final Verification

Run after all four tasks:

```bash
npx ng test --watch=false --browsers=ChromeHeadless
npm run build
```

Expected: `TOTAL: 23 SUCCESS`, zero FAILED, and a clean build.

Then confirm scope discipline:

```bash
git diff --stat 41156e9..HEAD
```

Expected modified files, and no others:

```
src/app/app.component.ts
src/app/app.component.html
src/app/app.component.scss
src/app/app.component.spec.ts
src/app/about/about.component.html
src/app/user-input/user-input.component.html
```

Confirm no `Kataka` references were touched:

```bash
grep -rn "Kataka" src/
```

Expected: 7 hits, unchanged from the pre-implementation count:

| File | Hits |
|---|---|
| `src/app/astro-service.service.ts` | 3 (lines 26, 33, 42) |
| `src/app/astro-list/astro-list.component.ts` | 1 (line 139) |
| `src/app/timeline-view/timeline-view.component.ts` | 1 (line 356) |
| `src/app/constants/predictions.ts` | 1 (line 5) |
| `src/app/astro-service.service.spec.ts` | 1 (line 69) |

If any count differs, an out-of-scope rename slipped in. Revert it before finishing.

## Manual Check (optional)

This is a template-and-copy change and does not require a browser pass. If a visual
confirmation is wanted, run `npm start` and visit each of `http://localhost:4200/timeline`,
`/list`, `/home`, `/about`, confirming each shows a distinct `<h1>` with one line of copy
beneath it, and that any unknown URL shows the 404 page with no site heading above it.