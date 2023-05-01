import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LfLocalizationService} from '@laserfiche/lf-js-utils';


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


  @Output() folderEmitter: EventEmitter<string> = new EventEmitter<string>();
  @Output() shouldCloseModal: EventEmitter<boolean> = new EventEmitter<boolean>();


  constructor() { }

  ngOnInit(): void {
  }

  closeDialog(folder?: string) {
    this.folderEmitter.emit(folder ?? "");
    this.shouldCloseModal.emit(true);
  }

  onModalClick(event: MouseEvent)  {
    const isInsideModal = event.target instanceof Element && event.target.closest('.new-folder-dialog-modal-content');

    if (!isInsideModal) {
      this.closeDialog();
    }
  }

}
