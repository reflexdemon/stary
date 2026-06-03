import {Component, OnInit, inject} from '@angular/core';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-astro-list',
    templateUrl: './astro-list.component.html',
    styleUrls: ['./astro-list.component.scss'],
    standalone: true,
    imports: [FormsModule]
})
export class AstroListComponent implements OnInit {
  private astroService = inject(AstroServiceService);
  response: AstroResponse[];
  selectedMonth: number;
  selectedYear: number;
  months = [
    {value: 1, label: 'January'}, {value: 2, label: 'February'}, {value: 3, label: 'March'},
    {value: 4, label: 'April'}, {value: 5, label: 'May'}, {value: 6, label: 'June'},
    {value: 7, label: 'July'}, {value: 8, label: 'August'}, {value: 9, label: 'September'},
    {value: 10, label: 'October'}, {value: 11, label: 'November'}, {value: 12, label: 'December'}
  ];
  years: number[] = [];

  ngOnInit(): void {
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    const currentYear = today.getFullYear();
    for (let y = currentYear - 50; y <= currentYear + 50; y++) {
      this.years.push(y);
    }
    this.viewList();
  }

  viewList(): void {
    this.response = this.astroService.getListWithTransisionsInGMT(this.selectedMonth, this.selectedYear);
  }
}
