import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterModule, NgbNavModule, AsyncPipe]
})
export class AppComponent {
  title = 'stary';
  active = 1;
  links = [
    {
      title: 'Timeline', fragment: 'timeline', heading: 'Timeline',
      overview: "Follow the Moon's transit through every Rashi (moon sign), Nakshatra and Chandrashtama across a rolling 15-day window, with times shown in the time zone of your choice."
    },
    {
      title: 'Month View', fragment: 'list', heading: 'Month View',
      overview: 'Browse a full month of Moon sign transits as either a list or a calendar, with every Rashi and Nakshatra change marked by date and time in IST.'
    },
    {
      title: 'Find Birth Star', fragment: 'home', heading: 'Find Birth Star',
      overview: 'Enter your date of birth, time and time zone to find your Nakshatra (birth star), Moon sign and its general characteristics.'
    },
    {
      title: 'About', fragment: 'about', heading: 'About',
      overview: 'What Stary is, who built it, and the vpv-panchangam API that powers every calculation.'
    },
  ];

  route = inject(ActivatedRoute);

  pageFor(fragment: string) {
    return this.links.find(link => link.fragment === fragment);
  }
}
