// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewFolderModalComponent } from './new-folder-modal.component';

describe('NewFolderModalComponent', () => {
  let component: NewFolderModalComponent;
  let fixture: ComponentFixture<NewFolderModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewFolderModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewFolderModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
