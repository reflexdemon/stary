import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { AppComponent } from './app.component';

@Component({ template: '', standalone: true })
class BlankComponent {}

const testRoutes: Routes = [
  { path: 'timeline', component: BlankComponent },
  { path: 'list', component: BlankComponent },
  { path: 'home', component: BlankComponent },
  { path: 'about', component: BlankComponent },
  { path: '', redirectTo: '/timeline', pathMatch: 'full' },
  { path: '**', component: BlankComponent },
];

async function renderAt(url: string) {
  const router = TestBed.inject(Router);
  const fixture = TestBed.createComponent(AppComponent);
  fixture.detectChanges();
  await router.navigateByUrl(url);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(testRoutes)],
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

describe('AppComponent heading', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter(testRoutes)],
    });
  });

  it('renders the Timeline heading and overview at /timeline', async () => {
    const fixture = await renderAt('/timeline');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container h1')?.textContent?.trim()).toBe('Timeline');
    expect(el.querySelector('.container p.page-overview')?.textContent?.trim()).toBe(
      "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice."
    );
  });

  it('swaps heading and overview when the route changes', async () => {
    const fixture = await renderAt('/timeline');
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/about');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container h1')?.textContent?.trim()).toBe('About');
    expect(el.querySelector('.container p.page-overview')?.textContent?.trim()).toBe(
      'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.'
    );
  });

  it('marks the active nav tab from the current route', async () => {
    const fixture = await renderAt('/about');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container ul.nav-tabs a.nav-link.active')?.textContent?.trim()).toBe('About');
  });

  it('renders no heading for an unknown route', async () => {
    const fixture = await renderAt('/does-not-exist');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container h1')).toBeNull();
    expect(el.querySelector('.container p.page-overview')).toBeNull();
    // PageNotFoundComponent supplies its own <h2>Page Not Found</h2>. The shell must never
    // add a heading of its own for an unmatched route, or the two would both render.
    expect(el.querySelector('.container h2')).toBeNull();
  });

  it('still renders all four nav tabs', async () => {
    const fixture = await renderAt('/timeline');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.container ul.nav-tabs li').length).toBe(4);
  });
});
