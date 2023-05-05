import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { LfLocalizationService} from '@laserfiche/lf-js-utils';
import {MatDialog, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

const resources: Map<string, object> = new Map<string, object>([
  ['en-US', {
    'NAME': 'Name',
    'OK': 'Ok',
    'CANCEL': 'Cancel',
    'NEW_FOLDER': 'New Folder',
  }],
  ['es-MX', {
    'NAME': 'Name -Spanish',
    'OK': 'Ok - Spanish',
    'CANCEL': 'Cancel - Spanish',
    'NEW_FOLDER': 'New Folder - Spanish',
  }]
]);


interface NewFolderDialogData {
  makeNewFolder:  (folderName: string) => Promise<void>;
}

@Component({
  selector: 'app-new-folder-modal',
  templateUrl: './new-folder-modal.component.html',
  styleUrls: ['./new-folder-modal.component.css']
})
export class NewFolderModalComponent implements OnInit {
  localizationService: LfLocalizationService = new LfLocalizationService(resources);

  NAME = this.localizationService.getString('NAME');
  OK = this.localizationService.getString('OK');
  CANCEL = this.localizationService.getString('CANCEL');
  NEW_FOLDER = this.localizationService.getString('NEW_FOLDER');

  errorMessage?: string;
  folderName?: string;

  constructor(
    public dialogRef: MatDialogRef<NewFolderModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: NewFolderDialogData,
  ) { }

  ngOnInit(): void {
  }

  async closeDialog(folder?: string) {
    if (!folder){
      this.dialogRef.close();
      return;
    }

    try{
      await this.data.makeNewFolder(folder ?? "");
      this.dialogRef.close(folder);
    }
    catch (error: any) {
      console.log(error);
      this.errorMessage = error.message;
    }
  }

}
