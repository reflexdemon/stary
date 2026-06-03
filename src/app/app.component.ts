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
      { title: 'Month View', fragment: 'list' },
      { title: 'Find Birth Star', fragment: 'home' },
      { title: 'About', fragment: 'about' }
    ];
  route = inject(ActivatedRoute);
}
