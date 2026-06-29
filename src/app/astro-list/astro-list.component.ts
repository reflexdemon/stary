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
  viewMode: 'calendar' | 'list' = (localStorage.getItem('astroViewMode') as 'calendar' | 'list') || 'list';
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
    this.loadCurrentView();
  }

  viewList(): void {
    this.viewMode = 'list';
    localStorage.setItem('astroViewMode', 'list');
    this.response = this.astroService.getListWithTransisionsInIST(this.selectedMonth, this.selectedYear);
  }

  viewCalendar(): void {
    this.viewMode = 'calendar';
    localStorage.setItem('astroViewMode', 'calendar');
    this.response = this.astroService.getListWithTransisionsInIST(this.selectedMonth, this.selectedYear);
    this.buildCalendar();
  }

  prevMonth(): void {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.loadCurrentView();
  }

  nextMonth(): void {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.loadCurrentView();
  }

  private loadCurrentView(): void {
    if (this.viewMode === 'calendar') {
      this.viewCalendar();
    } else {
      this.viewList();
    }
  }

  onTouchStart(entry: AstroResponse): void {
    this.pressTimer = setTimeout(() => {
      this.pressedEntry = entry;
    }, 500);
  }

  onClick(entry: AstroResponse): void {
    // Need to show and hide the menu in 5 seconds
    this.pressedEntry = entry;
    this.pressTimer = setTimeout(() => {
      this.pressedEntry = null;
    }, 5000);
  }

  onTouchEnd(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
    this.pressedEntry = null;
  }

  isCurrentDate(dateStr: string): boolean {
    const t = this.today;
    const [d, m, y] = dateStr.split('-').map(Number);
    return d === t.getDate() && m === t.getMonth() + 1 && y === t.getFullYear();
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

  private localDateStr(entry: AstroResponse): string {
    const local = this.istDateToLocal(entry.birthDate!, entry.birthTime!);
    return `${local.getDate()}-${local.getMonth() + 1}-${local.getFullYear()}`;
  }

  private istDateToLocal(dateStr: string, timeStr: string): Date {
    const [d, m, y] = dateStr.split('-').map(Number);
    const [h, min] = timeStr.split(':').map(Number);
    const utcMs = Date.UTC(y, m - 1, d, h, min);
    return new Date(utcMs - 5.5 * 3600 * 1000);
  }

  private isIstBrowser(): boolean {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata';
    } catch {
      return false;
    }
  }

  entryTimeDisplay(entry: AstroResponse): string {
    const istTime = this.to12h(entry.birthTime!);
    if (this.isIstBrowser()) {
      return istTime;
    }
    const local = this.istDateToLocal(entry.birthDate!, entry.birthTime!);
    const localTime = local.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const [ld, lm, ly] = entry.birthDate!.split('-').map(Number);
    const istDate = new Date(ly, lm - 1, ld);
    const istLabel = `${istTime} IST`;
    if (local.toDateString() !== istDate.toDateString()) {
      const istDateLabel = istDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${localTime} (${istTime} IST ${istDateLabel})`;
    }
    return `${localTime} (${istLabel})`;
  }

  to12h(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  get groupedEntries(): { date: string; entries: AstroResponse[] }[] {
    const map = new Map<string, AstroResponse[]>();
    for (const item of this.response || []) {
      const key = this.localDateStr(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        const [da, ma, ya] = a.split('-').map(Number);
        const [db, mb, yb] = b.split('-').map(Number);
        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
      })
      .map(([date, entries]) => ({ date, entries }));
  }

  private buildCalendar(): void {
    const daysInMonth = new Date(this.selectedYear, this.selectedMonth, 0).getDate();
    const firstDay = new Date(this.selectedYear, this.selectedMonth - 1, 1).getDay();

    const byDate = new Map<string, AstroResponse[]>();
    for (const item of this.response || []) {
      const key = this.localDateStr(item);
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
