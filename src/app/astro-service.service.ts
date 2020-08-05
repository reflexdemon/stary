import { Injectable } from '@angular/core';
import * as IndianAstrology from 'indian-astrology'
import * as AstroCore from 'indian-astrology/dist/astro-core'
import { AstroResponse } from './astro.response';

@Injectable({
  providedIn: 'root'
})
export class AstroServiceService {
  //See https://github.com/Narendra-Kamath/indian-astrology
  rashiZodiac = [
    {rashiImg:'mesh.jpg', rashi: 'Mesha', zodiacSign: 'Aries', zodiacImg: 'aries.jpg' },
    {rashiImg:'vrishabh.jpg', rashi: 'Vrushaba', zodiacSign: 'Taurus', zodiacImg: 'taurus.jpg' },
    {rashiImg:'mithun.jpg', rashi: 'Mithuna', zodiacSign: 'Gemini', zodiacImg: 'gemini.jpg' },
    {rashiImg:'karaka.jpg', rashi: 'Kataka', zodiacSign: 'Cancer', zodiacImg: 'cancer.jpg' },
    {rashiImg:'simha.jpg', rashi: 'Simha', zodiacSign: 'Leo', zodiacImg: 'leo.jpg' },
    {rashiImg:'kanya.jpg', rashi: 'Kanya', zodiacSign: 'Virgo', zodiacImg: 'virgo.jpg' },
    {rashiImg:'tula.jpg', rashi: 'Tula', zodiacSign: 'Libra', zodiacImg: 'libra.jpg' },
    {rashiImg:'vrishchik.jpg', rashi: 'Vrushika', zodiacSign: 'Scorpio', zodiacImg: 'scorpio.jpg' },
    {rashiImg:'dhanu.jpg', rashi: 'Dhanu', zodiacSign: 'Sagittarius', zodiacImg: 'sagittarius.jpg' },
    {rashiImg:'makar.jpg', rashi: 'Makara', zodiacSign: 'Capricorn', zodiacImg: 'capricorn.jpg' },
    {rashiImg:'kumbh.jpg', rashi: 'Kumbha', zodiacSign: 'Aquarius', zodiacImg: '' },
    {rashiImg:'meen.jpg', rashi: 'Meena', zodiacSign: 'Pisces', zodiacImg: 'pisces.jpg' }
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
  getCountryListWithZones() {
    return IndianAstrology.getCountryListWithZones();
  }
  getOnlyCountryNameList() {
    return IndianAstrology.getOnlyCountryNameList();
  }
  getTodaysDetails(dayLightSaving): AstroResponse {
    return this.parse(IndianAstrology.getTodaysDetails(dayLightSaving));
  }
  getTodaysDetailsDefault(): AstroResponse {
    return this.parse(IndianAstrology.getTodaysDetails(this.isDSTOn()));
  }
  isDSTOn():boolean {
    let today = new Date();
    return today.getTimezoneOffset() < this.stdTimezoneOffset(today);
  }
  stdTimezoneOffset(date):number {
    var jan = new Date(date.getFullYear(), 0, 1);
    var jul = new Date(date.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  }
  //This should add te correct image
  parse(astro:AstroResponse):AstroResponse {
    let imgDetail = this.rashiZodiac.filter(item => item.rashi == astro.rashi );
    astro['rashiImg'] = `assets/img/sign/${imgDetail[0].rashiImg}`;
    astro['zodiacImg'] = `assets/img/sign/${imgDetail[0].zodiacImg}`;
    return astro;
  }
}
