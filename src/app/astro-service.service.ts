import {Injectable} from '@angular/core';
import * as IndianAstrology from 'indian-astrology';
import * as AstroCore from 'indian-astrology/dist/astro-core';
import {AstroResponse} from './astro.response';

@Injectable({
  providedIn: 'root'
//  providedIn: 'any'
//  providedIn: ngModule
})
export class AstroServiceService {
  // See https://github.com/Narendra-Kamath/indian-astrology
  rashiZodiac = [
    {rashiImg: 'mesh.jpg', rashi: 'Mesha', zodiacSign: 'Aries', zodiacImg: 'aries.jpg', chandrashtama: 'Kanya'},
    {rashiImg: 'vrishabh.jpg', rashi: 'Vrushaba', zodiacSign: 'Taurus', zodiacImg: 'taurus.jpg', chandrashtama: 'Tula'},
    {
      rashiImg: 'mithun.jpg',
      rashi: 'Mithuna',
      zodiacSign: 'Gemini',
      zodiacImg: 'gemini.jpg',
      chandrashtama: 'Vrushika'
    },
    {rashiImg: 'karaka.jpg', rashi: 'Kataka', zodiacSign: 'Cancer', zodiacImg: 'cancer.jpg', chandrashtama: 'Dhanu'},
    {rashiImg: 'simha.jpg', rashi: 'Simha', zodiacSign: 'Leo', zodiacImg: 'leo.jpg', chandrashtama: 'Makara'},
    {rashiImg: 'kanya.jpg', rashi: 'Kanya', zodiacSign: 'Virgo', zodiacImg: 'virgo.jpg', chandrashtama: 'Kumbha'},
    {rashiImg: 'tula.jpg', rashi: 'Tula', zodiacSign: 'Libra', zodiacImg: 'libra.jpg', chandrashtama: 'Meena'},
    {
      rashiImg: 'vrishchik.jpg',
      rashi: 'Vrushika',
      zodiacSign: 'Scorpio',
      zodiacImg: 'scorpio.jpg',
      chandrashtama: 'Mesha'
    },
    {
      rashiImg: 'dhanu.jpg',
      rashi: 'Dhanu',
      zodiacSign: 'Sagittarius',
      zodiacImg: 'sagittarius.jpg',
      chandrashtama: 'Vrushaba'
    },
    {
      rashiImg: 'makar.jpg',
      rashi: 'Makara',
      zodiacSign: 'Capricorn',
      zodiacImg: 'capricorn.jpg',
      chandrashtama: 'Mithuna'
    },
    {rashiImg: 'kumbh.jpg', rashi: 'Kumbha', zodiacSign: 'Aquarius', zodiacImg: '', chandrashtama: 'Kataka'},
    {rashiImg: 'meen.jpg', rashi: 'Meena', zodiacSign: 'Pisces', zodiacImg: 'pisces.jpg', chandrashtama: 'Simha'}
  ];

  constructor() {
  }

  getByDate(day, month, year, hour, minute, timeZoneHour, timeZoneMinute, dayLightSaving): AstroResponse {
    return this.parse(IndianAstrology.getByDate(day, month, year, hour, minute, timeZoneHour, timeZoneMinute, dayLightSaving));
  }

  getByDateAndZone(day, month, year, hour24, minute, timeZone, dayLight): AstroResponse {
    const DST = dayLight || false;
    const inputLunarCalc = {
      birthDay: day,
      birthMonth: month,
      birthYear: year,
      birthHour: hour24,
      birthMinute: minute,
      birthZone: timeZone,
      DST,
    };
    return this.parse(AstroCore.calculate(inputLunarCalc));
  }

  getByDateOfIndia(day, month, year, hour, minute): AstroResponse {
    return this.parse(IndianAstrology.getByDateOfIndia(day, month, year, hour, minute));
  }

  getByDateWhereTimeUnknown(day, month, year, timeZoneHour, timeZoneMinute, dayLightSaving): AstroResponse {
    return this.parse(IndianAstrology.getByDateWhereTimeUnknown(day, month, year, timeZoneHour, timeZoneMinute, dayLightSaving));
  }

  getByDateWhereTimeUnknownOfIndia(day, month, year): AstroResponse {
    return this.parse(IndianAstrology.getByDateWhereTimeUnknownOfIndia(day, month, year));
  }

  getCountryListWithZones(): Map<string, string> {
    return IndianAstrology.getCountryListWithZones();
  }

  getOnlyCountryNameList(): string[] {
    return IndianAstrology.getOnlyCountryNameList();
  }

  getTodaysDetails(dayLightSaving): AstroResponse {
    return this.parse(IndianAstrology.getTodaysDetails(dayLightSaving));
  }

  getTodaysDetailsDefault(): AstroResponse {
    return this.parse(IndianAstrology.getTodaysDetails(this.isDSTOn()));
  }

  isDSTOn(): boolean {
    const today = new Date();
    return today.getTimezoneOffset() < this.stdTimezoneOffset(today);
  }

  stdTimezoneOffset(date): number {
    const jan = new Date(date.getFullYear(), 0, 1);
    const jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }

  // This should add te correct image
  parse(astro: AstroResponse): AstroResponse {
    const imgDetail = this.rashiZodiac.filter(item => item.rashi === astro.rashi);
    astro.rashiImg = `assets/img/sign/${imgDetail[0].rashiImg}`;
    astro.chandrashtama = imgDetail[0].chandrashtama;
    astro.zodiacImg = `assets/img/sign/${imgDetail[0].zodiacImg}`;
    const [h, m] = astro.birthTime!.split(':').map(Number);
    let total = h * 60 + m + 13;
    const daysToAdd = Math.floor(total / (24 * 60));
    total = total % (24 * 60);
    astro.birthTime = this.formatDigits(`${Math.floor(total / 60)}:${total % 60}`);
    if (daysToAdd > 0) {
      const [d, mo, y] = astro.birthDate!.split('-').map(Number);
      const newDate = new Date(y, mo - 1, d + daysToAdd);
      astro.birthDate = `${newDate.getDate()}-${newDate.getMonth() + 1}-${newDate.getFullYear()}`;
    }
    astro.birthTimeZone = 5.5;
    return astro;
  }

  formatDigits(timeString: string): string {
    return this.pad2(timeString.split(':')[0])
      + ':'
      + this.pad2(timeString.split(':')[1]);
  }

  pad2(number): string {
    return (Number(number) < 10 ? '0' : '') + number
  }

  getListWithTransisionsInIST(month: number, year: number): AstroResponse[] {
    const transitions: AstroResponse[] = [] as AstroResponse[];
    const days: number = this.getNumberOfDaysInAMonth(month, year);
    for (let d = 1; d <= days; d++) {
      for (let h = 0; h <= 23; h++) {
        for (let m = 0; m <= 59; m++) {
          const r: AstroResponse = this.getByDateOfIndia(d, month, year, h, m);
          if (transitions.length === 0) {
            transitions.push(r);
          } else {
            const prev: AstroResponse = transitions[transitions.length - 1];
            if (prev.nakshatra !== r.nakshatra || prev.rashi !== r.rashi) {
              transitions.push(r);
            }
          }
        }
      }
    }

    const filled: AstroResponse[] = [] as AstroResponse[];
    let lastForDay: AstroResponse | null = null;
    for (let d = 1; d <= days; d++) {
      const dayStr = `${d}-${month}-${year}`;
      const dayEntries = transitions.filter(e => e.birthDate === dayStr);
      if (dayEntries.length > 0) {
        filled.push(...dayEntries);
        lastForDay = dayEntries[dayEntries.length - 1];
      } else if (lastForDay) {
        filled.push({...lastForDay, birthDate: dayStr, birthTime: '00:00'});
      }
    }
    return filled;
  }

  getTransitionsInRange(startDate: Date, endDate: Date, stepMinutes: number = 30): AstroResponse[] {
    const result: AstroResponse[] = [];
    const current = new Date(startDate);
    let prev: AstroResponse | null = null;
    while (current <= endDate) {
      const r = this.getByDateOfIndia(
        current.getDate(), current.getMonth() + 1, current.getFullYear(),
        current.getHours(), current.getMinutes()
      );
      if (!prev || prev.rashi !== r.rashi || prev.nakshatra !== r.nakshatra) {
        r.birthTime = `${current.getHours()}:${current.getMinutes()}`;
        r.birthDate = `${current.getDate()}-${current.getMonth() + 1}-${current.getFullYear()}`;
        result.push(r);
      }
      prev = r;
      current.setMinutes(current.getMinutes() + stepMinutes);
    }
    return result;
  }

  getNumberOfDaysInAMonth(month: number, year: number): number {
    if ([1, 3, 5, 7, 8, 10, 12].includes(month)) {
      return 31;
    }
    if ([4, 6, 9, 11].includes(month)) {
      return 30;
    }
    if ((year % 4) === 0) {
      return 29;
    } else {
      return 28;
    }
  }
}
