import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AboutComponent } from './about/about.component';
import { UserInputComponent } from './user-input/user-input.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { AstroListComponent } from './astro-list/astro-list.component';

const routes: Routes = [
      {path: 'home', component: UserInputComponent},
      {path: 'about', component: AboutComponent},
      {path: 'list', component: AstroListComponent},
      {path: '', redirectTo: '/home', pathMatch: 'full'},
    {path: '**', component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
