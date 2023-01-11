import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { LfLoginModule } from '@laserfiche/lf-ui-components/lf-login';
import { LfMetadataModule } from '@laserfiche/lf-ui-components/lf-metadata';
import { AppComponent } from './app.component';
import { LfRepositoryBrowserModule } from '@laserfiche/lf-ui-components/lf-repository-browser';
import { LfBreadcrumbsModule } from '@laserfiche/lf-ui-components/shared';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    LfLoginModule,
    LfBreadcrumbsModule,
    LfRepositoryBrowserModule,
    LfMetadataModule,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
