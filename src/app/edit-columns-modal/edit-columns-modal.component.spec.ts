// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { EditColumnsModalComponent } from './edit-columns-modal.component';

describe('EditColumnsModalComponent', () => {
  let component: EditColumnsModalComponent;
  let fixture: ComponentFixture<EditColumnsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditColumnsModalComponent],
      providers: [
        {
          provide: MatDialogRef,
          useValue: {
            close: jasmine.createSpy('close'),
          },
        },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            columnsSelected: [],
            allColumnOptions: [],
            updateColumns: jasmine.createSpy('updateColumns'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditColumnsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
