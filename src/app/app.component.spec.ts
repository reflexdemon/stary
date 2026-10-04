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
