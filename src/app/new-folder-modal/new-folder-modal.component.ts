// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LfLocalizationService } from '@laserfiche/lf-js-utils';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

const resources: Map<string, object> = new Map<string, object>([
  [
    'en-US',
    {
      NAME: 'Name',
      OK: 'Ok',
      CANCEL: 'Cancel',
      NEW_FOLDER: 'New Folder',
    },
  ],
  [
    'es-MX',
    {
      NAME: 'Name -Spanish',
      OK: 'Ok - Spanish',
      CANCEL: 'Cancel - Spanish',
      NEW_FOLDER: 'New Folder - Spanish',
    },
  ],
]);

interface NewFolderDialogData {
  makeNewFolder: (folderName: string) => Promise<void>;
}

@Component({
  selector: 'app-new-folder-modal',
  templateUrl: './new-folder-modal.component.html',
  styleUrls: ['./new-folder-modal.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class NewFolderModalComponent {
  localizationService: LfLocalizationService = new LfLocalizationService(
    resources
  );

  NAME = this.localizationService.getString('NAME');
  OK = this.localizationService.getString('OK');
  CANCEL = this.localizationService.getString('CANCEL');
  NEW_FOLDER = this.localizationService.getString('NEW_FOLDER');

  errorMessage?: string;
  folderName?: string;

  dialogRef = inject<MatDialogRef<NewFolderModalComponent>>(MatDialogRef);
  data = inject<NewFolderDialogData>(MAT_DIALOG_DATA);

  async closeDialog(folder?: string) {
    if (!folder) {
      this.dialogRef.close();
      return;
    }

    try {
      await this.data.makeNewFolder(folder ?? '');
      this.dialogRef.close(folder);
    } catch (error: any) {
      console.log(error);
      this.errorMessage = error.message;
    }
  }
}
