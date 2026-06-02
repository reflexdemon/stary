import {Component, OnInit, inject} from '@angular/core';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import {NgbCalendar, NgbDatepickerModule, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-astro-list',
    templateUrl: './astro-list.component.html',
    styleUrls: ['./astro-list.component.scss'],
    standalone: true,
    imports: [FormsModule, NgbDatepickerModule]
})
export class AstroListComponent implements OnInit {
  private astroService = inject(AstroServiceService);
  private calendar = inject(NgbCalendar);
  response: AstroResponse[];
  model: NgbDateStruct;
  date: {year: number, month: number};

  ngOnInit(): void {
    this.model =  this.calendar.getToday();
    this.viewList();
  }

  viewList(): void {
    this.response = this.astroService.getListWithTransisionsInGMT(this.model.month, this.model.year);
  }
}
