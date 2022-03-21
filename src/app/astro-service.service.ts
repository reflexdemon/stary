import { Injectable } from '@angular/core';
import * as IndianAstrology from 'indian-astrology';
import * as AstroCore from 'indian-astrology/dist/astro-core';
import { AstroResponse } from './astro.response';

@Injectable({
  providedIn: 'root'
})
export class AstroServiceService {
  // See https://github.com/Narendra-Kamath/indian-astrology
  rashiZodiac = [
    {rashiImg: 'mesh.jpg', rashi: 'Mesha', zodiacSign: 'Aries', zodiacImg: 'aries.jpg' },
    {rashiImg: 'vrishabh.jpg', rashi: 'Vrushaba', zodiacSign: 'Taurus', zodiacImg: 'taurus.jpg' },
    {rashiImg: 'mithun.jpg', rashi: 'Mithuna', zodiacSign: 'Gemini', zodiacImg: 'gemini.jpg' },
    {rashiImg: 'karaka.jpg', rashi: 'Kataka', zodiacSign: 'Cancer', zodiacImg: 'cancer.jpg' },
    {rashiImg: 'simha.jpg', rashi: 'Simha', zodiacSign: 'Leo', zodiacImg: 'leo.jpg' },
    {rashiImg: 'kanya.jpg', rashi: 'Kanya', zodiacSign: 'Virgo', zodiacImg: 'virgo.jpg' },
    {rashiImg: 'tula.jpg', rashi: 'Tula', zodiacSign: 'Libra', zodiacImg: 'libra.jpg' },
    {rashiImg: 'vrishchik.jpg', rashi: 'Vrushika', zodiacSign: 'Scorpio', zodiacImg: 'scorpio.jpg' },
    {rashiImg: 'dhanu.jpg', rashi: 'Dhanu', zodiacSign: 'Sagittarius', zodiacImg: 'sagittarius.jpg' },
    {rashiImg: 'makar.jpg', rashi: 'Makara', zodiacSign: 'Capricorn', zodiacImg: 'capricorn.jpg' },
    {rashiImg: 'kumbh.jpg', rashi: 'Kumbha', zodiacSign: 'Aquarius', zodiacImg: '' },
    {rashiImg: 'meen.jpg', rashi: 'Meena', zodiacSign: 'Pisces', zodiacImg: 'pisces.jpg' }
  ];
  constructor() { }

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
    const imgDetail = this.rashiZodiac.filter(item => item.rashi === astro.rashi );
    astro.rashiImg = `assets/img/sign/${imgDetail[0].rashiImg}`;
    astro.zodiacImg = `assets/img/sign/${imgDetail[0].zodiacImg}`;
    astro.birthTime = this.formatDigits(astro.birthTime);
    return astro;
  }
  formatDigits(timeString: string): string {
    return this.pad2(timeString.split(':')[0])
              + ':'
              + this.pad2(timeString.split(':')[1]);
  }

  pad2(number) : string{
     return (Number(number) < 10 ? '0' : '') + number
  }

  getListWithTransisionsInGMT(month: number, year: number): AstroResponse[] {
    const response: AstroResponse[] = [] as AstroResponse[];
    const days: number = this.getNumberOfDaysInAMonth(month, year);
    for (let d = 1; d <= days; d++ ) {
      for (let h = 0; h <= 23; h++ ) {
        for (let m = 0; m <= 59; m++ ) {
          const r: AstroResponse =  this.getByDateAndZone(
                                        d, month, year, h,
                                        m, 0, true);
          if (response.length === 0) {
            response.push(r);
          } else {
            const prev: AstroResponse = response[response.length - 1];
            if (prev.nakshatra !== r.nakshatra || prev.rashi !== r.rashi) {
              response.push(r);
            }
          }
        }
      }
    }

    return response;
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
