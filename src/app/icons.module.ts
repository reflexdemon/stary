import { NgModule } from '@angular/core';
import { NgxBootstrapIconsModule } from 'ngx-bootstrap-icons';
import { calendar } from 'ngx-bootstrap-icons';

const icons = { calendar };

@NgModule({
  imports: [NgxBootstrapIconsModule.pick(icons)],
  exports: [NgxBootstrapIconsModule]
})
export class AppIconsModule {}
