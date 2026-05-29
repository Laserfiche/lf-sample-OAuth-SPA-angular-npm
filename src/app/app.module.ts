// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { NewFolderModalComponent } from './new-folder-modal/new-folder-modal.component';
import { EditColumnsModalComponent } from './edit-columns-modal/edit-columns-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule} from '@angular/material/select';

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    FormsModule,
    MatDialogModule,
    MatSelectModule,
    AppComponent,
    NewFolderModalComponent,
    EditColumnsModalComponent,
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
