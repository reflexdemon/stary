import {Component, OnInit, inject} from '@angular/core';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';
import { FormsModule } from '@angular/forms';

interface CalendarCell {
  day: number | null;
  entries: AstroResponse[];
  isToday: boolean;
}

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
  private pressTimer: any = null;
  pressedEntry: AstroResponse | null = null;
  response: AstroResponse[];
  selectedMonth: number;
  selectedYear: number;
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendar: CalendarCell[][] = [];
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
    this.buildCalendar();
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

  onTouchStart(entry: AstroResponse): void {
    this.pressTimer = setTimeout(() => {
      this.pressedEntry = entry;
    }, 500);
  }

  onTouchEnd(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.pressedEntry = null;
  }

  formatDate(dateStr: string): string {
    const [d, m, y] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  rashiColor(rashi: string): string {
    const colors: Record<string, string> = {
      Mesha: '#FFD6D6', Vrushaba: '#D6F5D6', Mithuna: '#FFF5CC',
      Kataka: '#D6E8FF', Simha: '#FFE0CC', Kanya: '#E8D6FF',
      Tula: '#CCFFF5', Vrushika: '#FFD6EB', Dhanu: '#FFECD6',
      Makara: '#D6F0E0', Kumbha: '#EBD6FF', Meena: '#D6F0FF'
    };
    return colors[rashi] || '#f8f9fa';
  }

  to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  private buildCalendar(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const firstDay = new Date(this.selectedYear, this.selectedMonth - 1, 1).getDay();

    const byDate = new Map<string, AstroResponse[]>();
    for (const item of this.response || []) {
      const key = item.birthDate;
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(item);
    }

    const todayStr = `${this.today.getDate()}-${this.today.getMonth() + 1}-${this.today.getFullYear()}`;
    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, entries: [], isToday: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${d}-${this.selectedMonth}-${this.selectedYear}`;
      cells.push({
        day: d,
        entries: byDate.get(dateStr) || [],
        isToday: dateStr === todayStr
      });
    }

    this.calendar = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.calendar.push(cells.slice(i, i + 7));
    }
  }
}
