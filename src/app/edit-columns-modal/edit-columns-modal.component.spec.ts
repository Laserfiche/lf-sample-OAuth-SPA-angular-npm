import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditColumnsModalComponent } from './edit-columns-modal.component';

describe('EditColumnsModalComponent', () => {
  let component: EditColumnsModalComponent;
  let fixture: ComponentFixture<EditColumnsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditColumnsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(EditColumnsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
