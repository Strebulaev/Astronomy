import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SubjectManagerService } from '../../services/subject-manager.service';
import { Subject } from '../../models/subject.model';

@Component({
  selector: 'app-subject-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subject-manager.component.html',
  styleUrls: ['./subject-manager.component.css']
})
export class SubjectManagerComponent implements OnInit {
  subjects: Subject[] = [];
  currentSubject: Subject | null = null;
  newSubject = {
    name: '',
    icon: 'school',
    color: '#3f51b5'
  };
  editingSubject: Subject | null = null;
  showAdvanced = false;

  availableIcons = ['star', 'calculate', 'science', 'history_edu', 'language', 'psychology', 'biotech', 'code'];
  availableColors = ['#3f51b5', '#f44336', '#4caf50', '#ff9800', '#9c27b0', '#2196f3', '#607d8b', '#795548'];

  constructor(
    private subjectManager: SubjectManagerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSubjects();
    this.subjectManager.getCurrentSubject().subscribe(subject => {
      this.currentSubject = subject;
    });
  }

  loadSubjects(): void {
    this.subjects = this.subjectManager.getSubjects();
  }

  createSubject(): void {
    if (this.newSubject.name.trim()) {
      const config = this.subjectManager.getDefaultConfig(this.newSubject.name);
      this.subjectManager.addSubject(
        this.newSubject.name.trim(),
        config,
        this.newSubject.icon,
        this.newSubject.color
      );
      
      this.resetForm();
      this.loadSubjects();
    }
  }

  selectSubject(subject: Subject): void {
    this.subjectManager.setCurrentSubject(subject);
    this.router.navigate(['/']);
  }

  editSubject(subject: Subject): void {
    this.editingSubject = { ...subject };
  }

  updateSubject(): void {
    if (this.editingSubject) {
      // Обновляем предмет через сервис
      const updatedSubjects = this.subjects.map(s => 
        s.id === this.editingSubject!.id ? this.editingSubject! : s
      );
      
      // Сохраняем обновленный список
      localStorage.setItem('subjects_list', JSON.stringify(updatedSubjects));
      
      // Обновляем текущий предмет если он редактируется
      if (this.currentSubject?.id === this.editingSubject.id) {
        this.subjectManager.setCurrentSubject(this.editingSubject);
      }
      
      this.cancelEdit();
      this.loadSubjects();
    }
  }

  deleteSubject(subject: Subject): void {
    if (confirm(`Удалить предмет "${subject.name}"? Все данные будут потеряны.`)) {
      this.subjectManager.removeSubject(subject.id);
      this.loadSubjects();
    }
  }

  cancelEdit(): void {
    this.editingSubject = null;
  }

  resetForm(): void {
    this.newSubject = {
      name: '',
      icon: 'school',
      color: '#3f51b5'
    };
    this.showAdvanced = false;
  }

  getSubjectIconStyle(subject: Subject): any {
    return {
      'background-color': subject.color,
      'color': 'white'
    };
  }
}