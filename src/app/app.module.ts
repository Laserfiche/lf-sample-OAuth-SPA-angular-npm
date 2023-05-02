import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { LfLoginModule } from '@laserfiche/lf-ui-components/lf-login';
import { LfMetadataModule } from '@laserfiche/lf-ui-components/lf-metadata';
import { AppComponent } from './app.component';
import { LfRepositoryBrowserModule } from '@laserfiche/lf-ui-components/lf-repository-browser';
import { LfToolbarModule } from '@laserfiche/lf-ui-components/shared';
import { LfBreadcrumbsModule } from '@laserfiche/lf-ui-components/shared';
import { NewFolderModalComponent } from './new-folder-modal/new-folder-modal.component';
import { EditColumnsModalComponent } from './edit-columns-modal/edit-columns-modal.component';
import { MatCheckboxModule } from '@angular/material/checkbox';

@NgModule({
  declarations: [
    AppComponent,
    NewFolderModalComponent,
    EditColumnsModalComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    LfLoginModule,
    LfBreadcrumbsModule,
    LfRepositoryBrowserModule,
    LfToolbarModule,
    LfMetadataModule,
    MatCheckboxModule,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
