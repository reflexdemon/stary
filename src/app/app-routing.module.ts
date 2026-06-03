import { Routes } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { UserInputComponent } from './user-input/user-input.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AstroListComponent } from './astro-list/astro-list.component';

export const routes: Routes = [
      {path: 'home', component: UserInputComponent},
      {path: 'about', component: AboutComponent},
      {path: 'list', component: AstroListComponent},
      {path: '', redirectTo: '/list', pathMatch: 'full'},
    {path: '**', component: PageNotFoundComponent}
];
