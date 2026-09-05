import {Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import { NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';

interface RawPoint {
  ms: number;
  rashi: string;
  nakshatra: string;
  chandrashtama: string;
  rashiImg: string;
}

interface RowSegment {
  startMs: number;
  endMs: number;
  value: string;
  img?: string;
  label: string;
}

@Component({
    selector: 'app-timeline-view',
    templateUrl: './timeline-view.component.html',
    styleUrls: ['./timeline-view.component.scss'],
    standalone: true,
    imports: [NgStyle, FormsModule]
})
export class TimelineViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private astroService = inject(AstroServiceService);

  @ViewChild('timelineBody') timelineBody!: ElementRef;

  baseDate: Date = new Date();
  rangeStartMs = 0;
  rangeEndMs = 0;
  rangeMs = 0;

  timezones = [
    { label: 'IST - India Standard Time (UTC+5:30)', offset: 5.5 },
    { label: 'Local Browser Time', offset: -(new Date().getTimezoneOffset() / 60) },
    { label: 'UTC - Universal Time (UTC+0:00)', offset: 0 },
    { label: 'USA Pacific (UTC-8:00)', offset: -8 },
    { label: 'USA Mountain (UTC-7:00)', offset: -7 },
    { label: 'USA Central (UTC-6:00)', offset: -6 },
    { label: 'USA Eastern (UTC-5:00)', offset: -5 },
    { label: 'UK / GMT (UTC+0:00)', offset: 0 },
    { label: 'Central Europe / CET (UTC+1:00)', offset: 1 },
    { label: 'Gulf / Dubai / GST (UTC+4:00)', offset: 4 },
    { label: 'Pakistan / PST (UTC+5:00)', offset: 5 },
    { label: 'Nepal / NPT (UTC+5:45)', offset: 5.75 },
    { label: 'Bangladesh / BST (UTC+6:00)', offset: 6 },
    { label: 'Thailand / ICT (UTC+7:00)', offset: 7 },
    { label: 'Singapore / SGT (UTC+8:00)', offset: 8 },
    { label: 'Japan / JST (UTC+9:00)', offset: 9 },
    { label: 'Australia East / AEST (UTC+10:00)', offset: 10 },
    { label: 'New Zealand / NZST (UTC+12:00)', offset: 12 },
  ];

  selectedTzOffset: number = 5.5;

  rashiSegments: RowSegment[] = [];
  nakSegments: RowSegment[] = [];
  chaSegments: RowSegment[] = [];
  tickMarks: { ms: number; label: string }[] = [];

  dayHeaders: { date: Date; isToday: boolean }[] = [];
  totalDays = 15;

  nowMs = Date.now();

  private isDragging = false;
  private startX = 0;
  private scrollLeft = 0;
  private nowTimer: number | null = null;

  activeTooltip: {
    label: string;
    startStr: string;
    endStr: string;
    tzCode: string;
    left: number;
    top: number;
  } | null = null;

  private tooltipTimer: any = null;

  ngOnInit(): void {
    const savedTz = localStorage.getItem('astroTimelineTz');
    if (savedTz !== null) {
      this.selectedTzOffset = Number(savedTz);
    } else {
      this.selectedTzOffset = 5.5;
    }
    this.baseDate.setHours(0, 0, 0, 0);
    this.baseDate.setDate(this.baseDate.getDate() - 7);
    this.loadTimeline();
    this.nowTimer = window.setInterval(() => {
      this.nowMs = Date.now();
      this.scrollToNow();
    }, 30000);
  }

  ngAfterViewInit(): void {
    this.scrollToDay(7);
  }

  ngOnDestroy(): void {
    if (this.nowTimer !== null) clearInterval(this.nowTimer);
    if (this.tooltipTimer !== null) clearTimeout(this.tooltipTimer);
  }

  get nowPercent(): number {
    if (this.rangeMs === 0) return 50;
    return ((this.nowMs - this.rangeStartMs) / this.rangeMs) * 100;
  }

  onTzChange(): void {
    this.selectedTzOffset = Number(this.selectedTzOffset);
    localStorage.setItem('astroTimelineTz', this.selectedTzOffset.toString());
    this.loadTimeline();
  }

  showTooltip(event: MouseEvent | TouchEvent, seg: RowSegment): void {
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const container = this.timelineBody?.nativeElement;
    const containerRect = container ? container.getBoundingClientRect() : rect;

    const startStr = this.formatMsToTzTime(seg.startMs);
    const endStr = this.formatMsToTzTime(seg.endMs);
    const tzCode = this.getTzCode();

    const left = Math.max(10, Math.min(rect.left - containerRect.left + (rect.width / 2) + (container ? container.scrollLeft : 0), (container ? container.scrollWidth : 800) - 150));
    const top = rect.top - containerRect.top - 45;

    this.activeTooltip = {
      label: seg.label,
      startStr,
      endStr,
      tzCode,
      left,
      top: top < 0 ? rect.bottom - containerRect.top + 5 : top
    };

    if (this.tooltipTimer) clearTimeout(this.tooltipTimer);
    if (event.type === 'touchstart' || event.type === 'click') {
      this.tooltipTimer = setTimeout(() => {
        this.activeTooltip = null;
      }, 5000);
    }
  }

  hideTooltip(): void {
    if (this.tooltipTimer) clearTimeout(this.tooltipTimer);
    this.activeTooltip = null;
  }

  getSegmentTitle(seg: RowSegment): string {
    const startStr = this.formatMsToTzTime(seg.startMs);
    const endStr = this.formatMsToTzTime(seg.endMs);
    const tzCode = this.getTzCode();
    return `${seg.label}: ${startStr} to ${endStr} (${tzCode})`;
  }

  formatMsToTzTime(ms: number): string {
    const tzOffsetMs = Number(this.selectedTzOffset) * 3600 * 1000;
    const d = new Date(ms + tzOffsetMs);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthStr = months[d.getUTCMonth()];
    const dateNum = d.getUTCDate().toString().padStart(2, '0');
    let hours = d.getUTCHours();
    const minutes = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const hoursStr = hours.toString().padStart(2, '0');
    return `${monthStr} ${dateNum}, ${hoursStr}:${minutes} ${ampm}`;
  }

  getTzCode(): string {
    const current = this.timezones.find(t => Number(t.offset) === Number(this.selectedTzOffset));
    if (!current) return `UTC${this.selectedTzOffset >= 0 ? '+' : ''}${this.selectedTzOffset}`;
    if (current.label.includes('IST')) return 'IST';
    const match = current.label.match(/\(([^)]+)\)/);
    return match ? match[1] : current.label.split('-')[0].trim();
  }

  private scrollToDay(index: number): void {
    requestAnimationFrame(() => {
      if (!this.timelineBody) return;
      const el = this.timelineBody.nativeElement;
      const dayWidth = el.scrollWidth / this.totalDays;
      el.scrollLeft = dayWidth * index - el.clientWidth / 2 + dayWidth / 2;
    });
  }

  private scrollToNow(): void {
    if (!this.timelineBody) return;
    const el = this.timelineBody.nativeElement;
    const dayWidth = el.scrollWidth / this.totalDays;
    const nowDayOffset = (this.nowMs - this.rangeStartMs) / this.rangeMs * this.totalDays;
    const targetLeft = dayWidth * nowDayOffset - el.clientWidth / 2;

    const threshold = el.clientWidth * 0.3;
    if (Math.abs(el.scrollLeft - targetLeft) > threshold) {
      el.scrollLeft = targetLeft;
    }
  }

  prevDay(): void {
    this.baseDate.setDate(this.baseDate.getDate() - 1);
    this.loadTimeline();
  }

  nextDay(): void {
    this.baseDate.setDate(this.baseDate.getDate() + 1);
    this.loadTimeline();
  }

  goToday(): void {
    const today = new Date();
    this.baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
    this.baseDate.setHours(0, 0, 0, 0);
    this.loadTimeline();
    requestAnimationFrame(() => this.scrollToDay(7));
  }

  private loadTimeline(): void {
    const tzOffsetMs = Number(this.selectedTzOffset) * 3600 * 1000;

    const y = this.baseDate.getFullYear();
    const m = this.baseDate.getMonth();
    const d = this.baseDate.getDate();

    this.rangeStartMs = Date.UTC(y, m, d, 0, 0, 0) - tzOffsetMs;
    this.rangeEndMs = this.rangeStartMs + (this.totalDays * 24 * 3600 * 1000);
    this.rangeMs = this.rangeEndMs - this.rangeStartMs;

    const startIST = new Date(this.rangeStartMs + (5.5 * 3600 * 1000));
    const endIST = new Date(this.rangeEndMs + (5.5 * 3600 * 1000));

    const startDate = new Date(
      startIST.getUTCFullYear(), startIST.getUTCMonth(), startIST.getUTCDate(),
      startIST.getUTCHours(), startIST.getUTCMinutes()
    );
    const endDate = new Date(
      endIST.getUTCFullYear(), endIST.getUTCMonth(), endIST.getUTCDate(),
      endIST.getUTCHours(), endIST.getUTCMinutes()
    );

    const raw = this.astroService.getTransitionsInRange(startDate, endDate, 30);
    const points: RawPoint[] = raw.map(t => {
      const [td, tm, ty] = t.birthDate!.split('-').map(Number);
      const [th, tmin] = t.birthTime!.split(':').map(Number);
      const ms = Date.UTC(ty, tm - 1, td, th, tmin) - (5.5 * 3600 * 1000);
      return {
        ms,
        rashi: t.rashi!,
        nakshatra: t.nakshatra!,
        chandrashtama: t.chandrashtama!,
        rashiImg: t.rashiImg!,
      };
    }).sort((a, b) => a.ms - b.ms);

    this.dayHeaders = [];
    const nowInTz = new Date(Date.now() + tzOffsetMs);
    for (let i = 0; i < this.totalDays; i++) {
      const dayStartMs = this.rangeStartMs + (i * 24 * 3600 * 1000);
      const dInTz = new Date(dayStartMs + tzOffsetMs);
      const isToday =
        nowInTz.getUTCFullYear() === dInTz.getUTCFullYear() &&
        nowInTz.getUTCMonth() === dInTz.getUTCMonth() &&
        nowInTz.getUTCDate() === dInTz.getUTCDate();

      this.dayHeaders.push({
        date: new Date(dInTz.getUTCFullYear(), dInTz.getUTCMonth(), dInTz.getUTCDate()),
        isToday,
      });
    }

    this.rashiSegments = this.buildRowSegments(points, p => p.rashi, p => p.rashiImg, p => p.rashi);
    this.nakSegments = this.buildRowSegments(points, p => p.nakshatra, () => undefined, p => p.nakshatra);
    this.chaSegments = this.buildRowSegments(points, p => p.chandrashtama, () => undefined, p => p.chandrashtama);

    this.tickMarks = [];
    const tickInterval = 6 * 3600 * 1000;
    for (let t = this.rangeStartMs; t < this.rangeEndMs; t += tickInterval) {
      const tickTz = new Date(t + tzOffsetMs);
      const label = `${tickTz.getUTCHours().toString().padStart(2, '0')}:${tickTz.getUTCMinutes().toString().padStart(2, '0')}`;
      this.tickMarks.push({ ms: t, label });
    }
  }

  private buildRowSegments(
    points: RawPoint[],
    getVal: (p: RawPoint) => string,
    getImg: (p: RawPoint) => string | undefined,
    getLabel: (p: RawPoint) => string,
  ): RowSegment[] {
    if (points.length === 0) return [];
    const result: RowSegment[] = [];
    let cur = points[0];
    let curVal = getVal(cur);
    let curImg = getImg(cur);
    let curLabel = getLabel(cur);

    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const val = getVal(p);
      if (val !== curVal) {
        result.push({
          startMs: cur.ms,
          endMs: p.ms,
          value: curVal,
          img: curImg,
          label: curLabel,
        });
        cur = p;
        curVal = val;
        curImg = getImg(p);
        curLabel = getLabel(p);
      }
    }

    result.push({
      startMs: cur.ms,
      endMs: this.rangeEndMs,
      value: curVal,
      img: curImg,
      label: curLabel,
    });

    return result;
  }

  segStyle(seg: RowSegment): { [key: string]: string } {
    const left = ((seg.startMs - this.rangeStartMs) / this.rangeMs) * 100;
    const width = ((seg.endMs - seg.startMs) / this.rangeMs) * 100;
    return {
      left: `${left}%`,
      width: `${Math.max(width, 0.1)}%`,
    };
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

  onPointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.scrollLeft = this.timelineBody.nativeElement.scrollLeft;
    this.timelineBody.nativeElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;
    const dx = event.clientX - this.startX;
    this.timelineBody.nativeElement.scrollLeft = this.scrollLeft - dx;
  }

  onPointerUp(): void {
    this.isDragging = false;
  }
}
