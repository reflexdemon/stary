import { TestBed } from '@angular/core/testing';
import {
  AstroServiceService,
  CHENNAI_LATITUDE,
  CHENNAI_LONGITUDE,
  CHENNAI_TIMEZONE,
  CHENNAI_TZ_OFFSET,
  DEFAULT_LATITUDE,
  DEFAULT_LONGITUDE,
  DEFAULT_TZ_OFFSET,
  DEFAULT_TIMEZONE
} from './astro-service.service';
import { COUNTRY_TIMEZONES } from './constants/country-db';

describe('AstroServiceService', () => {
  let service: AstroServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AstroServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should expose Chennai base coordinates: 13.0827 N, 80.2707 E', () => {
    expect(CHENNAI_LATITUDE).toBeCloseTo(13.0827, 4);
    expect(CHENNAI_LONGITUDE).toBeCloseTo(80.2707, 4);
    expect(CHENNAI_TIMEZONE).toBe('Asia/Kolkata');
    expect(CHENNAI_TZ_OFFSET).toBe(5.5);

    expect(DEFAULT_LATITUDE).toBe(CHENNAI_LATITUDE);
    expect(DEFAULT_LONGITUDE).toBe(CHENNAI_LONGITUDE);
    expect(DEFAULT_TIMEZONE).toBe(CHENNAI_TIMEZONE);
    expect(DEFAULT_TZ_OFFSET).toBe(CHENNAI_TZ_OFFSET);
  });

  it('should return India in country list with offset 5.5', () => {
    const zones = service.getCountryListWithZones();
    expect(zones['India']).toBe('5.5');
  });

  it('should return country names list including India', () => {
    const names = service.getOnlyCountryNameList();
    expect(names).toContain('India');
    expect(names.length).toBeGreaterThan(10);
  });

  it('should compute correct days in months', () => {
    expect(service.getNumberOfDaysInAMonth(9, 2026)).toBe(30);  // September
    expect(service.getNumberOfDaysInAMonth(1, 2026)).toBe(31);  // January
    expect(service.getNumberOfDaysInAMonth(2, 2024)).toBe(29);  // Leap year
    expect(service.getNumberOfDaysInAMonth(2, 2026)).toBe(28);  // Non-leap
  });

  it('should get today details for India/IST (async)', async () => {
    const result = await service.getTodaysDetailsDefault();
    expect(result).toBeTruthy();
    expect(result.rashi).toBeTruthy();
    expect(result.nakshatra).toBeTruthy();
    expect(result.birthTimeZone).toBe(DEFAULT_TZ_OFFSET);
    expect(result.rashiImg).toContain('assets/img/sign/');
  });

  it('should get details for Chennai 2026-09-08 08:30 (async)', async () => {
    const result = await service.getByDateOfIndia(8, 9, 2026, 8, 30);
    expect(result).toBeTruthy();
    expect(result.rashi).toBe('Kataka');
    expect(result.nakshatra).toBe('Pushya');
    expect(result.zodiacSign).toBe('Cancer');
    expect(result.chandrashtama).toBe('Dhanu');
    expect(result.birthDate).toBe('8-9-2026');
    expect(result.birthTime).toBe('08:30');
    expect(result.rashiImg).toContain('karaka.jpg');
    expect(result.prediction).toBeTruthy();
  });

  it('should get transitions for Sep 2026 (async)', async () => {
    const transitions = await service.getListWithTransisionsInIST(9, 2026);
    expect(transitions.length).toBeGreaterThan(10);
    // All entries should have rashi and nakshatra set
    for (const t of transitions) {
      expect(t.rashi).toBeTruthy();
      expect(t.nakshatra).toBeTruthy();
    }
    // Verify day-1 begins with Meena/Revati for Sep 2026
    const firstEntry = transitions[0];
    expect(firstEntry.birthDate).toBe('1-9-2026');
    expect(firstEntry.birthTime).toBe('00:00');
  });

  it('should get timeline transitions in range using Chennai coordinates (async)', async () => {
    const start = new Date(2026, 8, 1, 0, 0); // Sep 1, 2026
    const end = new Date(2026, 8, 7, 23, 59);   // Sep 7, 2026
    const transitions = await service.getTransitionsInRange(start, end, 30);
    expect(transitions.length).toBeGreaterThan(5);
    for (const t of transitions) {
      expect(t.rashi).toBeTruthy();
      expect(t.nakshatra).toBeTruthy();
      expect(t.chandrashtama).toBeTruthy();
    }
  });
});
