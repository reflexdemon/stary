import { Component, OnInit } from '@angular/core';
import {NgbDateStruct, NgbInputDatepickerConfig, NgbCalendar, NgbTimeStruct} from '@ng-bootstrap/ng-bootstrap';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import { DataStore } from '../data.store';
import { Observable } from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';

const USER_DATA_STORAGE:string = 'USER_INPUT'
@Component({
  selector: 'app-user-input',
  templateUrl: './user-input.component.html',
  styleUrls: ['./user-input.component.scss'],
  providers: [
    NgbInputDatepickerConfig
  ]
})
export class UserInputComponent implements OnInit {
  datePicker: NgbDateStruct;
  whatIsToday:AstroResponse;
  zones: any;
  today : Date;
  time = {hour: 13, minute: 30} as NgbTimeStruct;
  country: any;
  search: any;
  dst:boolean;
  storage: DataStore;
  offset:Number;
  constructor(private config: NgbInputDatepickerConfig,
              private calendar: NgbCalendar,
              private astroService: AstroServiceService) {

   }

  load():void {
    //Load value from browser cache
    if (sessionStorage.getItem(USER_DATA_STORAGE)) {
      this.storage = JSON.parse(sessionStorage.getItem(USER_DATA_STORAGE)) as DataStore;
    } else {
      this.storage = {} as DataStore;
    }
    if (this.storage.day
        && this.storage.month
        && this.storage.year) {
          //We have a datePicker
          this.datePicker = {
            day: this.storage.day,
            year: this.storage.year,
            month: this.storage.month
          } as NgbDateStruct;
    } else {
      this.datePicker = {
        day: this.today.getDate(),
        year: this.today.getFullYear(),
        month: this.today.getMonth() + 1
      } as NgbDateStruct;
    }
    if (this.storage.hour && this.storage.minute) {
      this.time = {hour: this.storage.hour,
                   minute: this.storage.minute} as NgbTimeStruct;
    } else {
      this.time = {
        hour: this.today.getHours(),
        minute: this.today.getMinutes()
      } as NgbTimeStruct;
    }
    if (this.storage.country) {
      this.offset = this.getOffset(this.storage.country);
    } else {
      this.offset = (this.today.getTimezoneOffset() / 60);
    }

    if (this.storage.dst != undefined) {
      this.dst = this.storage.dst;
    } else {
      this.dst = this.astroService.isDSTOn();
    }

  }
  ngOnInit(): void {
    // this.selectToday();
    this.zones = this.astroService.getCountryListWithZones();
    this.today = new Date();
    this.load();
    this.calculate();
  this.search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.astroService.getOnlyCountryNameList().filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );
    this.calculate();

  }
  getOffset(country:string):Number {
    return Number(this.zones[country]);
  }

  calculate() {
    this.whatIsToday = this.astroService.getByDateAndZone(
                                        this.datePicker.day,
                                        this.datePicker.month,
                                        this.datePicker.year,
                                        this.time.hour,
                                        this.time.minute,
                                        this.getOffset(this.country),
                                        this.dst
                                        );
    this.store();
  }
  store():void {
    let data:DataStore = {
        country: this.country,
        day: this.datePicker.day,
        dst: this.dst,
        hour: this.time.hour,
        minute: this.time.minute,
        month: this.datePicker.month,
        year: this.datePicker.year
      }
    sessionStorage.setItem(USER_DATA_STORAGE, JSON.stringify(data) );
  }
  selectToday() {
    this.datePicker = this.calendar.getToday();
  }

}
