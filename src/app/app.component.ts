import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'stary';
  active = 1;
  links = [
      { title: 'Home', fragment: 'home' },
      { title: 'List', fragment: 'list' },
      { title: 'About', fragment: 'about' }
    ];
  constructor(public route: ActivatedRoute) {}
}
