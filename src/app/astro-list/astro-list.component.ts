import { Component, OnInit } from '@angular/core';
import { AstroServiceService } from '../astro-service.service';
import { AstroResponse } from '../astro.response';

@Component({
  selector: 'app-astro-list',
  templateUrl: './astro-list.component.html',
  styleUrls: ['./astro-list.component.scss']
})
export class AstroListComponent implements OnInit {
  response: AstroResponse[];
  constructor(private astroService: AstroServiceService) { }

  ngOnInit(): void {
    this.response = this.astroService.getListWithTransisionsInGMT(8, 2020);
  }

}
