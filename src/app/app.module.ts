import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { LfLoginModule } from '@laserfiche/lf-ui-components/lf-login';
import { TreeComponentsModule } from '@laserfiche/lf-ui-components/tree-components';
import { LfMetadataModule } from '@laserfiche/lf-ui-components/lf-metadata';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    LfLoginModule,
    TreeComponentsModule,
    LfMetadataModule,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
