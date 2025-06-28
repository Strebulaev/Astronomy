import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Question } from '../../models/question.model' 
import { TagCategory } from '../../models/tag.model';

@Component({
  selector: 'app-test-creator',
  templateUrl: './test-creator.component.html',
  styleUrls: ['./test-creator.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class TestCreatorComponent implements OnInit {
  allQuestions: Question[] = [];
  filteredQuestions: Question[] = [];
  tags: TagCategory[] = [];
  selectedTags: string[] = [];
  difficultyRange: [number, number] = [0, 100];
  questionCount = 10;
  selectedQuestions: Question[] = [];

  constructor(
    
    private dataService: DataService,
    private router: Router
  ) {this.selectedTags = [];}

  ngOnInit(): void {
    this.loadQuestions();
    this.loadTags();
  }

  loadQuestions(): void {
    this.dataService.getQuestions().subscribe((questions: Question[]) => {
      this.allQuestions = questions;
      this.filteredQuestions = [...questions];
    });
  }

  loadTags(): void {
    this.dataService.getTags().subscribe((tags: TagCategory[]) => {
      this.tags = tags;
    });
  }

  applyFilters(): void {
    this.filteredQuestions = this.allQuestions.filter((question: Question) => {
      const tagMatch = this.selectedTags.length === 0 || 
        this.selectedTags.some(tag => question.tags.includes(tag));
      
      const difficultyMatch = question.difficulty >= this.difficultyRange[0] && 
        question.difficulty <= this.difficultyRange[1];
      
      return tagMatch && difficultyMatch;
    });
  }

  resetFilters(): void {
    this.selectedTags = [];
    this.difficultyRange = [0, 100];
    this.questionCount = 10;
    this.filteredQuestions = [...this.allQuestions];
  }

  toggleQuestionSelection(question: Question): void {
    const index = this.selectedQuestions.findIndex(q => q.id === question.id);
    if (index > -1) {
      this.selectedQuestions.splice(index, 1);
    } else {
      this.selectedQuestions.push(question);
    }
  }

  isSelected(question: Question): boolean {
    return this.selectedQuestions.some(q => q.id === question.id);
  }

  startTest(): void {
    if (this.selectedQuestions.length > 0) {
      const test = {
        name: 'Сгенерированный тест',
        questions: this.selectedQuestions.map(q => ({
          question: q.text,
          options: q.options,
          multiple: q.options.filter(o => o.correct).length > 1
        }))
      };
  
      console.log('Generated test:', test); // Для отладки
      
      this.router.navigate(['quiz'], {
        state: {
          test: test,
          testType: 'custom'
        }
      });
    }
  }
}