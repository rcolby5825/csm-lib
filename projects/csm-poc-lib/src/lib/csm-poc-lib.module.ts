import { NgModule } from '@angular/core';
import { CsmPocLibComponent } from './csm-poc-lib.component';
import { CsmModuleComponent } from './csm-module/csm-module.component';

@NgModule({
  imports: [
  ],
  declarations: [CsmPocLibComponent, CsmModuleComponent],
  exports: [CsmPocLibComponent]
})
export class CsmPocLibModule { }
