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
  private today = new Date();
  private stripeByDate = new Map<string, boolean>();
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
    this.stripeByDate.clear();
    this.response = this.astroService.getListWithTransisionsInGMT(this.selectedMonth, this.selectedYear);
  }

  stripeClass(item: AstroResponse): string {
    if (!this.stripeByDate.has(item.birthDate)) {
      this.stripeByDate.set(item.birthDate, this.stripeByDate.size % 2 === 0);
    }
    return this.stripeByDate.get(item.birthDate) ? 'stripe-even' : 'stripe-odd';
  }

  prevMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.viewList();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.viewList();
  }

  formatDate(item: AstroResponse): string {
    const [d, m, y] = item.birthDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  isToday(item: AstroResponse): boolean {
    const todayStr = `${this.today.getDate()}-${this.today.getMonth() + 1}-${this.today.getFullYear()}`;
    return item.birthDate === todayStr;
  }
}
