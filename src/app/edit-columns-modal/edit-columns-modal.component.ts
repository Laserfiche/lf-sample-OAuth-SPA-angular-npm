import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { LfLocalizationService} from '@laserfiche/lf-js-utils';
import { ColumnDef } from '@laserfiche/lf-ui-components/lf-selection-list';


const resources: Map<string, object> = new Map<string, object>([
  ['en-US', {
    'NAME': 'Name',
    'OK': 'Ok',
    'CANCEL': 'Cancel',
    'ADD_REMOVE_COLUMNS': 'Add/Remove Columns',
  }],
  ['es-MX', {
    'NAME': 'Name -Spanish',
    'OK': 'Ok - Spanish',
    'CANCEL': 'Cancel - Spanish',
    'ADD_REMOVE_COLUMNS': 'Add/Remove Columns - Spanish',
  }]
]);


@Component({
  selector: 'app-edit-columns-modal',
  templateUrl: './edit-columns-modal.component.html',
  styleUrls: ['./edit-columns-modal.component.css']
})

export class EditColumnsModalComponent implements OnInit {
  localizationService: LfLocalizationService = new LfLocalizationService(resources);

  NAME = this.localizationService.getString('NAME');
  OK = this.localizationService.getString('OK');
  CANCEL = this.localizationService.getString('CANCEL');
  ADD_REMOVE_COLUMNS = this.localizationService.getString('ADD_REMOVE_COLUMNS');

  errorMessage?: string;
  columnsSelected?: ColumnDef[];

  @Input() initialColumnsSelected: ColumnDef[] = [];
  @Input() allColumnOptions: ColumnDef[] = [];

  @Output() columnEmitter: EventEmitter<ColumnDef[]> = new EventEmitter<ColumnDef[]>();
  @Output() shouldCloseModal: EventEmitter<boolean> = new EventEmitter<boolean>();


  constructor() { }

  ngOnInit(): void {
    this.columnsSelected = this.initialColumnsSelected.map(value => value);
  }

  closeDialog(columns?: ColumnDef[]) {
    this.columnEmitter.emit(columns ?? this.initialColumnsSelected);
    this.shouldCloseModal.emit(true);
  }

  onModalClick(event: MouseEvent)  {
    const isInsideModal = event.target instanceof Element && event.target.closest('.edit-columns-dialog-modal-content');

    if (!isInsideModal) {
      this.closeDialog();
    }
  }
  onCheckboxChange(column: ColumnDef) {
    if (this.columnsSelected.includes(column)) {
      this.columnsSelected = this.columnsSelected.filter(c => c != column);
    } else {
      this.columnsSelected.push(column);
    }
  }

}
