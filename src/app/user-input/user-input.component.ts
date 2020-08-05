import { Component, OnInit } from '@angular/core';
import {NgbDateStruct, NgbInputDatepickerConfig, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import { Observable } from 'rxjs';
import {debounceTime, distinctUntilChanged, map} from 'rxjs/operators';

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
  time = {hour: 13, minute: 30};
  country: any;
  search: any;

  constructor(private config: NgbInputDatepickerConfig,
              private calendar: NgbCalendar,
              private astroService: AstroServiceService) {

   }

  ngOnInit(): void {
    // this.selectToday();
    this.zones = this.astroService.getCountryListWithZones();
    this.today = new Date();
    this.whatIsToday = this.astroService.getByDateAndZone(
                                        this.today.getDate(),
                                        this.today.getMonth() + 1,
                                        this.today.getFullYear(),
                                        this.today.getHours(),
                                        this.today.getMinutes(),
                                        (this.today.getTimezoneOffset() / 60) * (-1),
                                        this.astroService.isDSTOn()
                                        );
  this.search = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      map(term => term.length < 2 ? []
        : this.astroService.getOnlyCountryNameList().filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1).slice(0, 10))
    );
    this.selectToday();
  }

  calculate() {
this.whatIsToday = this.astroService.getByDateAndZone(
                                        this.datePicker.day,
                                        this.datePicker.month,
                                        this.datePicker.year,
                                        this.time.hour,
                                        this.time.minute,
                                        Number(this.zones[this.country]),
                                        this.astroService.isDSTOn()
                                        );
  }
  selectToday() {
    this.datePicker = this.calendar.getToday();
  }

}
