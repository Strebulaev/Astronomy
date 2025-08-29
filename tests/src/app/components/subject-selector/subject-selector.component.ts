import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { Subject } from '../../models/subject.model';

@Component({
  selector: 'app-subject-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-selector.component.html',
  styleUrls: ['./subject-selector.component.css']
})
export class SubjectSelectorComponent implements OnInit {
  subjects: Subject[] = [];
  currentSubject: Subject | null = null;
  showAddForm = false;
  newSubjectName = '';

  constructor(private subjectManager: SubjectManagerService) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.subjectManager.getCurrentSubject().subscribe(subject => {
      this.currentSubject = subject;
    });
  }

  loadSubjects(): void {
    this.subjects = this.subjectManager.getSubjects();
  }

  selectSubject(subject: Subject): void {
    this.subjectManager.setCurrentSubject(subject);
  }

  addSubject(): void {
    if (this.newSubjectName.trim()) {
      const config = this.subjectManager.getDefaultConfig(this.newSubjectName);
      this.subjectManager.addSubject(this.newSubjectName.trim(), config);
      this.newSubjectName = '';
      this.showAddForm = false;
      this.loadSubjects();
    }
  }

  removeSubject(subject: Subject, event: Event): void {
    event.stopPropagation();
    if (confirm(`Удалить предмет "${subject.name}"?`)) {
      this.subjectManager.removeSubject(subject.id);
      this.loadSubjects();
    }
  }
}