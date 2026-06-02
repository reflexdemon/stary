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
      { title: 'Home', fragment: 'home' },
      { title: 'List', fragment: 'list' },
      { title: 'About', fragment: 'about' }
    ];
  route = inject(ActivatedRoute);
}
