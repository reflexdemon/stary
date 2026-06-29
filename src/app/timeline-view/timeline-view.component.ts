import {Component, OnInit, OnDestroy, inject, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import { NgStyle } from '@angular/common';
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
    imports: [NgStyle]
})
export class TimelineViewComponent implements OnInit, AfterViewInit, OnDestroy {
  private astroService = inject(AstroServiceService);

  @ViewChild('timelineBody') timelineBody!: ElementRef;

  baseDate: Date = new Date();
  rangeStartMs = 0;
  rangeEndMs = 0;
  rangeMs = 0;

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

  ngOnInit(): void {
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
  }

  get nowPercent(): number {
    if (this.rangeMs === 0) return 50;
    return ((this.nowMs - this.rangeStartMs) / this.rangeMs) * 100;
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
    const endDate = new Date(this.baseDate);
    endDate.setDate(endDate.getDate() + this.totalDays);

    this.rangeStartMs = this.baseDate.getTime();
    this.rangeEndMs = endDate.getTime();
    this.rangeMs = this.rangeEndMs - this.rangeStartMs;

    const raw = this.astroService.getTransitionsInRange(this.baseDate, endDate, 30);
    const points: RawPoint[] = raw.map(t => {
      const [d, m, y] = t.birthDate!.split('-').map(Number);
      const [h, min] = t.birthTime!.split(':').map(Number);
      return {
        ms: new Date(y, m - 1, d, h, min).getTime(),
        rashi: t.rashi!,
        nakshatra: t.nakshatra!,
        chandrashtama: t.chandrashtama!,
        rashiImg: t.rashiImg!,
      };
    }).sort((a, b) => a.ms - b.ms);

    this.dayHeaders = [];
    for (let i = 0; i < this.totalDays; i++) {
      const d = new Date(this.baseDate);
      d.setDate(d.getDate() + i);
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
      this.dayHeaders.push({ date: d, isToday });
    }

    this.rashiSegments = this.buildRowSegments(points, p => p.rashi, p => p.rashiImg, p => p.rashi);
    this.nakSegments = this.buildRowSegments(points, p => p.nakshatra, () => undefined, p => p.nakshatra);
    this.chaSegments = this.buildRowSegments(points, p => p.chandrashtama, () => undefined, p => p.chandrashtama);

    this.tickMarks = [];
    const tickInterval = 6 * 3600 * 1000;
    const start = new Date(this.baseDate);
    start.setHours(0, 0, 0, 0);
    const tickStart = start.getTime();
    const tickEnd = this.rangeEndMs;
    for (let t = tickStart; t < tickEnd; t += tickInterval) {
      const d = new Date(t);
      const label = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
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
