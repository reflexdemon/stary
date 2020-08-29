import {Component, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import {NgbCalendar, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-astro-list',
  templateUrl: './astro-list.component.html',
  styleUrls: ['./astro-list.component.scss']
})
export class AstroListComponent implements OnInit, OnChanges {
  response: AstroResponse[];
  model: NgbDateStruct;
  date: {year: number, month: number};
  constructor(private astroService: AstroServiceService, private calendar: NgbCalendar) { }

  ngOnInit(): void {
    this.calendar.getToday();
    this.viewList();
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.viewList();
  }

  viewList(): void {
    this.response = this.astroService.getListWithTransisionsInGMT(this.date.month, this.date.year);
  }


}
