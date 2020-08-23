import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { UserInputComponent } from './user-input/user-input.component';
import { AboutComponent } from './about/about.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { FormsModule } from '@angular/forms';
import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { Calendar } from 'ngx-bootstrap-icons';

import { AstroServiceService } from './astro-service.service';
import { AstroListComponent } from './astro-list/astro-list.component';

// Select some icons (use an object, not an array)
const icons = {
  Calendar
};
@NgModule({
  declarations: [
    AppComponent,
    UserInputComponent,
    AboutComponent,
    PageNotFoundComponent,
    AstroListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    FormsModule,
    NgxBootstrapIconsModule.pick(icons)
  ],
  providers: [AstroServiceService],
  bootstrap: [AppComponent]
})
export class AppModule {

}
