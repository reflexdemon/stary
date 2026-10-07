import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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
    expect(el.querySelector('.container h1')?.textContent?.trim()).toBe('Timeline');
    expect(el.querySelector('.container p.page-overview')?.textContent?.trim()).toBe(
      "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice."
    );
  });

  it('swaps heading and overview when the fragment changes', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    fragment$.next('about');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container h1')?.textContent?.trim()).toBe('About');
    expect(el.querySelector('.container p.page-overview')?.textContent?.trim()).toBe(
      'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.'
    );
  });

  it('renders no heading for an unknown fragment', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fragment$.next('does-not-exist');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.container h1')).toBeNull();
    expect(el.querySelector('.container p.page-overview')).toBeNull();
    // PageNotFoundComponent supplies its own <h2>Page Not Found</h2>. The shell must never
    // add a heading of its own for an unmatched route, or the two would both render.
    expect(el.querySelector('.container h2')).toBeNull();
  });

  it('still renders all four nav tabs', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.container ul.nav-tabs li').length).toBe(4);
  });
});
