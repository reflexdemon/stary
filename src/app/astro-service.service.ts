import {Injectable} from '@angular/core';
import {computeDetailedPanchang, computeChart} from 'vpv-panchangam';
import {AstroResponse} from './astro.response';
import {RASHI_PREDICTIONS} from './constants/predictions';
import {COUNTRY_TIMEZONES} from './constants/country-db';

// ─── Chennai, Tamil Nadu, India Base Coordinates ────────────────────────────
// Latitude: 13.0827° N (North)
// Longitude: 80.2707° E (East)
export const CHENNAI_LATITUDE = 13.0827;
export const CHENNAI_LONGITUDE = 80.2707;
export const CHENNAI_TIMEZONE = 'Asia/Kolkata';
export const CHENNAI_TZ_OFFSET = 5.5;  // hours east of UTC (IST)

export const DEFAULT_LATITUDE = CHENNAI_LATITUDE;
export const DEFAULT_LONGITUDE = CHENNAI_LONGITUDE;
export const DEFAULT_TIMEZONE = CHENNAI_TIMEZONE;
export const DEFAULT_TZ_OFFSET = CHENNAI_TZ_OFFSET;

// ─── Rashi metadata ──────────────────────────────────────────────────────────
// sign_id from vpv-panchangam is 1-based; index is sign_id - 1.
const RASHI_ZODIAC = [
  {rashiImg: 'mesh.jpg',      rashi: 'Mesha',   zodiacSign: 'Aries',       zodiacImg: 'aries.jpg',       chandrashtama: 'Kanya'},
  {rashiImg: 'vrishabh.jpg',  rashi: 'Vrushaba', zodiacSign: 'Taurus',      zodiacImg: 'taurus.jpg',      chandrashtama: 'Tula'},
  {rashiImg: 'mithun.jpg',    rashi: 'Mithuna',  zodiacSign: 'Gemini',      zodiacImg: 'gemini.jpg',      chandrashtama: 'Vrushika'},
  {rashiImg: 'karaka.jpg',    rashi: 'Kataka',   zodiacSign: 'Cancer',      zodiacImg: 'cancer.jpg',      chandrashtama: 'Dhanu'},
  {rashiImg: 'simha.jpg',     rashi: 'Simha',    zodiacSign: 'Leo',         zodiacImg: 'leo.jpg',         chandrashtama: 'Makara'},
  {rashiImg: 'kanya.jpg',     rashi: 'Kanya',    zodiacSign: 'Virgo',       zodiacImg: 'virgo.jpg',       chandrashtama: 'Kumbha'},
  {rashiImg: 'tula.jpg',      rashi: 'Tula',     zodiacSign: 'Libra',       zodiacImg: 'libra.jpg',       chandrashtama: 'Meena'},
  {rashiImg: 'vrishchik.jpg', rashi: 'Vrushika', zodiacSign: 'Scorpio',     zodiacImg: 'scorpio.jpg',     chandrashtama: 'Mesha'},
  {rashiImg: 'dhanu.jpg',     rashi: 'Dhanu',    zodiacSign: 'Sagittarius', zodiacImg: 'sagittarius.jpg', chandrashtama: 'Vrushaba'},
  {rashiImg: 'makar.jpg',     rashi: 'Makara',   zodiacSign: 'Capricorn',   zodiacImg: 'capricorn.jpg',   chandrashtama: 'Mithuna'},
  {rashiImg: 'kumbh.jpg',     rashi: 'Kumbha',   zodiacSign: 'Aquarius',    zodiacImg: '',                chandrashtama: 'Kataka'},
  {rashiImg: 'meen.jpg',      rashi: 'Meena',    zodiacSign: 'Pisces',      zodiacImg: 'pisces.jpg',      chandrashtama: 'Simha'},
];

// vpv-panchangam uses full Sanskrit names; map back to legacy rashi names
const RASHI_NAME_MAP: Record<string, string> = {
  Mesha:     'Mesha',
  Vrishabha: 'Vrushaba',
  Mithuna:   'Mithuna',
  Karka:     'Kataka',
  Simha:     'Simha',
  Kanya:     'Kanya',
  Tula:      'Tula',
  Vrishchika:'Vrushika',
  Dhanu:     'Dhanu',
  Makara:    'Makara',
  Kumbha:    'Kumbha',
  Meena:     'Meena',
};

// Abbreviation for dasha lords
const LORD_ABBREV: Record<string, string> = {
  Saturn: 'Sat', Jupiter: 'Jup', Mercury: 'Mer', Venus: 'Ven',
  Sun: 'Sun',   Moon: 'Mon',    Mars: 'Mar',    Rahu: 'Rah', Ketu: 'Ket',
};

@Injectable({
  providedIn: 'root'
})
export class AstroServiceService {
  // Keep rashiZodiac as a public property for any template access
  rashiZodiac = RASHI_ZODIAC;

  constructor() {}

  // ── Private helpers ────────────────────────────────────────────────────────

  private pad2(n: number): string {
    return (n < 10 ? '0' : '') + n;
  }

  private abbrev(lord: string | undefined): string {
    if (!lord) { return ''; }
    return LORD_ABBREV[lord] ?? lord.slice(0, 3);
  }

  /** Map vpv-panchangam sign_id (1-based) to RASHI_ZODIAC metadata. */
  private metaBySignId(signId: number) {
    return RASHI_ZODIAC[signId - 1] ?? RASHI_ZODIAC[0];
  }

  /** Map vpv-panchangam rashi name (e.g. "Karka") to RASHI_ZODIAC metadata. */
  private metaByRashiName(name: string) {
    const mapped = RASHI_NAME_MAP[name] ?? name;
    return RASHI_ZODIAC.find(r => r.rashi === mapped) ?? RASHI_ZODIAC[0];
  }

  /** Build AstroResponse from a computeChart result. */
  private async chartToAstroResponse(
    day: number, month: number, year: number, hour: number, minute: number,
    lat: number, lon: number, timezone: string
  ): Promise<AstroResponse> {
    const dateStr = `${year}-${this.pad2(month)}-${this.pad2(day)}`;
    const timeStr = `${this.pad2(hour)}:${this.pad2(minute)}`;

    const chart = await computeChart(
      { date: dateStr, time: timeStr, latitude: lat, longitude: lon, timezone },
      'en'
    );

    const moon = chart.planets_data.find(p => p.name === 'Moon')!;
    const meta = this.metaBySignId(moon.sign_id);

    // Current dasha: top-level Mahadasha lord / first Antardasha lord
    const mahaLord = this.abbrev(chart.dasha[0]?.lord);
    const antarLord = this.abbrev(chart.dasha_antar[0]?.antardashas?.[0]?.lord);
    const currentDasha = antarLord ? `${mahaLord}/${antarLord}` : mahaLord;

    // Birth dasha: same (chart is always computed at birth moment)
    const birthDasha = currentDasha;

    return {
      rashi:        meta.rashi,
      chandrashtama: meta.chandrashtama,
      zodiacSign:   meta.zodiacSign,
      moonAngle:    moon.dms,
      nakshatra:    moon.nakshatra,
      birthDasha,
      birthDate:    `${day}-${month}-${year}`,
      birthTime:    timeStr,
      dayOfWeek:    ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][
                      new Date(year, month - 1, day).getDay()
                    ],
      birthTimeZone: DEFAULT_TZ_OFFSET,
      currentDasha,
      prediction:   RASHI_PREDICTIONS[meta.rashi] ?? '',
      rashiImg:     `assets/img/sign/${meta.rashiImg}`,
      zodiacImg:    meta.zodiacImg ? `assets/img/sign/${meta.zodiacImg}` : '',
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Calculate by explicit date/time and timezone offset (hours east of UTC).
   * Latitude/Longitude are Chennai defaults; timezone is resolved from offset.
   */
  async getByDate(
    day: number, month: number, year: number,
    hour: number, minute: number,
    timeZoneHour: number, timeZoneMinute: number,
    _dayLightSaving: boolean
  ): Promise<AstroResponse> {
    const offsetHours = timeZoneHour + timeZoneMinute / 60;
    const ianaTimezone = this.offsetToIana(offsetHours);
    return this.chartToAstroResponse(day, month, year, hour, minute,
      DEFAULT_LATITUDE, DEFAULT_LONGITUDE, ianaTimezone);
  }

  /**
   * Calculate by date/time and decimal timezone offset (e.g. 5.5 for IST).
   */
  async getByDateAndZone(
    day: number, month: number, year: number,
    hour24: number, minute: number,
    timeZone: number,
    _dayLight?: boolean
  ): Promise<AstroResponse> {
    const ianaTimezone = this.offsetToIana(timeZone);
    return this.chartToAstroResponse(day, month, year, hour24, minute,
      DEFAULT_LATITUDE, DEFAULT_LONGITUDE, ianaTimezone);
  }

  /**
   * Calculate assuming India Standard Time (IST, +5:30) and Chennai coords.
   * Primary workhorse for the monthly list and timeline views.
   */
  async getByDateOfIndia(
    day: number, month: number, year: number,
    hour: number, minute: number
  ): Promise<AstroResponse> {
    return this.chartToAstroResponse(day, month, year, hour, minute,
      DEFAULT_LATITUDE, DEFAULT_LONGITUDE, DEFAULT_TIMEZONE);
  }

  /**
   * Calculate for today using the system timezone, mapped to a reasonable IANA zone.
   */
  async getTodaysDetails(_dayLightSaving?: boolean): Promise<AstroResponse> {
    const today = new Date();
    const offsetMin = -today.getTimezoneOffset();
    const ianaTimezone = this.offsetToIana(offsetMin / 60);
    return this.chartToAstroResponse(
      today.getDate(), today.getMonth() + 1, today.getFullYear(),
      today.getHours(), today.getMinutes(),
      DEFAULT_LATITUDE, DEFAULT_LONGITUDE, ianaTimezone
    );
  }

  /** Calculate for today using IST/Chennai defaults. */
  async getTodaysDetailsDefault(): Promise<AstroResponse> {
    const today = new Date();
    return this.getByDateOfIndia(
      today.getDate(), today.getMonth() + 1, today.getFullYear(),
      today.getHours(), today.getMinutes()
    );
  }

  // ── Country / timezone helpers ─────────────────────────────────────────────

  getCountryListWithZones(): Record<string, string> {
    return COUNTRY_TIMEZONES;
  }

  getOnlyCountryNameList(): string[] {
    return Object.keys(COUNTRY_TIMEZONES);
  }

  // ── DST helpers ────────────────────────────────────────────────────────────

  isDSTOn(): boolean {
    const today = new Date();
    return today.getTimezoneOffset() < this.stdTimezoneOffset(today);
  }

  stdTimezoneOffset(date: Date): number {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }

  // ── Monthly transition list ────────────────────────────────────────────────

  /**
   * Return all Rashi/Nakshatra transitions within a given month in IST,
   * computed using Chennai base coordinates:
   *   Latitude: 13.0827° N (North)
   *   Longitude: 80.2707° E (East)
   */
  async getListWithTransisionsInIST(month: number, year: number): Promise<AstroResponse[]> {
    const days = this.getNumberOfDaysInAMonth(month, year);
    const result: AstroResponse[] = [];

    // Track last seen state to deduplicate adjacent identical entries
    let lastRashi = '';
    let lastNakshatra = '';

    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${this.pad2(month)}-${this.pad2(d)}`;
      const panchang = await computeDetailedPanchang(
        dateStr, CHENNAI_LATITUDE, CHENNAI_LONGITUDE, CHENNAI_TIMEZONE, 'en'
      );

      // Entry at day start 00:00 IST → pull chart at 00:00 IST using Chennai coordinates
      const dayStartEntry = await this.getByDateOfIndia(d, month, year, 0, 0);
      if (dayStartEntry.rashi !== lastRashi || dayStartEntry.nakshatra !== lastNakshatra) {
        result.push(dayStartEntry);
        lastRashi = dayStartEntry.rashi!;
        lastNakshatra = dayStartEntry.nakshatra!;
      }

      // Collect intra-day transitions from both nakshatra_sequence and moonsign_sequence
      const rawTransitions: { ends_at: string }[] = [
        ...(panchang.panchang?.nakshatra_sequence ?? []),
        ...(panchang.rashi_nakshatra?.moonsign_sequence ?? []),
      ];

      const uniqueTimes = Array.from(new Set(rawTransitions.map(t => t.ends_at)))
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      for (const endsAt of uniqueTimes) {
        const endUtc = new Date(endsAt);
        // Convert to IST using Chennai TZ offset (+5:30)
        const istMs = endUtc.getTime() + CHENNAI_TZ_OFFSET * 3600 * 1000;
        const istDate = new Date(istMs);
        const istDay   = istDate.getUTCDate();
        const istMonth = istDate.getUTCMonth() + 1;
        const istHour  = istDate.getUTCHours();
        const istMin   = istDate.getUTCMinutes();

        // Only emit for transitions happening during this calendar day in IST
        // and not right at midnight (those are captured by the next day's start)
        if (istDay === d && istMonth === month && !(istHour === 0 && istMin === 0)) {
          let nextMin = istMin + 1;
          let nextHour = istHour;
          if (nextMin >= 60) { nextMin = 0; nextHour++; }
          if (nextHour < 24) {
            const transEntry = await this.getByDateOfIndia(d, month, year, nextHour, nextMin);
            transEntry.birthTime = `${this.pad2(istHour)}:${this.pad2(istMin)}`;
            if (transEntry.rashi !== lastRashi || transEntry.nakshatra !== lastNakshatra) {
              result.push(transEntry);
              lastRashi = transEntry.rashi!;
              lastNakshatra = transEntry.nakshatra!;
            }
          }
        }
      }
    }

    return result;
  }

  // ── Range transitions (for timeline view) ─────────────────────────────────

  /**
   * Return Rashi/Nakshatra transitions within [startDate, endDate] for Timeline View,
   * computed using Chennai base coordinates:
   *   Latitude: 13.0827° N (North)
   *   Longitude: 80.2707° E (East)
   */
  async getTransitionsInRange(
    startDate: Date, endDate: Date,
    _stepMinutes: number = 30
  ): Promise<AstroResponse[]> {
    const result: AstroResponse[] = [];
    let lastRashi = '';
    let lastNakshatra = '';

    // Iterate day by day using Chennai base coordinates
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (cur <= end) {
      const d = cur.getDate();
      const m = cur.getMonth() + 1;
      const y = cur.getFullYear();
      const dateStr = `${y}-${this.pad2(m)}-${this.pad2(d)}`;

      const panchang = await computeDetailedPanchang(
        dateStr, CHENNAI_LATITUDE, CHENNAI_LONGITUDE, CHENNAI_TIMEZONE, 'en'
      );

      // Start of day entry using Chennai coordinates
      const h0 = (cur.getTime() === startDate.getTime()) ? startDate.getHours() : 0;
      const min0 = (cur.getTime() === startDate.getTime()) ? startDate.getMinutes() : 0;
      const dayStartEntry = await this.getByDateOfIndia(d, m, y, h0, min0);
      dayStartEntry.birthTime = `${dayStartEntry.birthTime}`;
      if (!result.length || dayStartEntry.rashi !== lastRashi || dayStartEntry.nakshatra !== lastNakshatra) {
        result.push(dayStartEntry);
        lastRashi = dayStartEntry.rashi!;
        lastNakshatra = dayStartEntry.nakshatra!;
      }

      // Collect intra-day transitions from both nakshatra_sequence and moonsign_sequence
      const rawTransitions: { ends_at: string }[] = [
        ...(panchang.panchang?.nakshatra_sequence ?? []),
        ...(panchang.rashi_nakshatra?.moonsign_sequence ?? []),
      ];

      const uniqueTimes = Array.from(new Set(rawTransitions.map(t => t.ends_at)))
        .filter(Boolean)
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      for (const endsAt of uniqueTimes) {
        const endUtc = new Date(endsAt);
        const istMs = endUtc.getTime() + CHENNAI_TZ_OFFSET * 3600 * 1000;
        const istDate = new Date(istMs);
        const istDay   = istDate.getUTCDate();
        const istMonth = istDate.getUTCMonth() + 1;
        const istHour  = istDate.getUTCHours();
        const istMin   = istDate.getUTCMinutes();

        if (istDay === d && istMonth === m) {
          // Check it's within [startDate, endDate]
          const transMs = endUtc.getTime() + CHENNAI_TZ_OFFSET * 3600 * 1000;
          const startMs = startDate.getTime() + CHENNAI_TZ_OFFSET * 3600 * 1000;
          const endMs   = endDate.getTime()   + CHENNAI_TZ_OFFSET * 3600 * 1000;
          if (transMs >= startMs && transMs <= endMs) {
            let nextMin = istMin + 1;
            let nextHour = istHour;
            if (nextMin >= 60) { nextMin = 0; nextHour++; }
            if (nextHour < 24) {
              const transEntry = await this.getByDateOfIndia(d, m, y, nextHour, nextMin);
              transEntry.birthTime = `${this.pad2(istHour)}:${this.pad2(istMin)}`;
              transEntry.birthDate = `${d}-${m}-${y}`;
              if (transEntry.rashi !== lastRashi || transEntry.nakshatra !== lastNakshatra) {
                result.push(transEntry);
                lastRashi = transEntry.rashi!;
                lastNakshatra = transEntry.nakshatra!;
              }
            }
          }
        }
      }

      cur.setDate(cur.getDate() + 1);
    }

    return result;
  }

  // ── Formatting helpers ─────────────────────────────────────────────────────

  formatDigits(timeString: string): string {
    return this.pad2(Number(timeString.split(':')[0]))
      + ':' + this.pad2(Number(timeString.split(':')[1]));
  }

  getNumberOfDaysInAMonth(month: number, year: number): number {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) { return 31; }
    if ([4, 6, 9, 11].includes(month))             { return 30; }
    return (year % 4 === 0) ? 29 : 28;
  }

  // ── Internal: best-effort UTC offset → IANA timezone mapping ──────────────

  private offsetToIana(offsetHours: number): string {
    const map: Record<number, string> = {
      5.5:   'Asia/Kolkata',
      5.75:  'Asia/Kathmandu',
      6:     'Asia/Dhaka',
      6.5:   'Asia/Yangon',
      7:     'Asia/Bangkok',
      8:     'Asia/Singapore',
      9:     'Asia/Tokyo',
      9.5:   'Australia/Darwin',
      10:    'Australia/Sydney',
      12:    'Pacific/Auckland',
      4:     'Asia/Dubai',
      3.5:   'Asia/Tehran',
      3:     'Asia/Riyadh',
      2:     'Africa/Cairo',
      1:     'Europe/Paris',
      0:     'UTC',
      '-1':  'Atlantic/Azores',
      '-3':  'America/Sao_Paulo',
      '-3.5':'America/St_Johns',
      '-4':  'America/Halifax',
      '-5':  'America/New_York',
      '-6':  'America/Chicago',
      '-7':  'America/Denver',
      '-8':  'America/Los_Angeles',
      '-9':  'America/Anchorage',
      '-10': 'Pacific/Honolulu',
    };
    return map[offsetHours] ?? map[-offsetHours ? -offsetHours : 0] ?? 'UTC';
  }
}
