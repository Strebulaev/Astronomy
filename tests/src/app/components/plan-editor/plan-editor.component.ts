import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PlanManagerService, Plan, WeekPlan, DayPlan, TopicPlan } from '../../services/plan-manager.service';
import { SubjectManagerService } from '../../services/subject-manager.service';

@Component({
  selector: 'app-plan-editor',
  templateUrl: './plan-editor.component.html',
  styleUrls: ['./plan-editor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class PlanEditorComponent implements OnInit {
  planForm: FormGroup;
  currentPlan: Plan | null = null;
  showYamlEditor = false;
  yamlContent = '';
  isEditing = false;

  constructor(
    private fb: FormBuilder,
    private planManager: PlanManagerService,
    private subjectManager: SubjectManagerService,
    private router: Router
  ) {
    this.planForm = this.createForm();
  }

  ngOnInit(): void {
    this.planManager.getCurrentPlan().subscribe(plan => {
      this.currentPlan = plan;
      this.isEditing = !!plan;
      
      if (plan) {
        this.loadPlanIntoForm(plan);
      } else {
        this.initializeNewPlan();
      }
    });
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      schedule: this.fb.array([])
    });
  }

  get schedule(): FormArray {
    return this.planForm.get('schedule') as FormArray;
  }

  getWeeks(): FormGroup[] {
    return this.schedule.controls as FormGroup[];
  }

  getDays(weekIndex: number): FormArray {
    return this.schedule.at(weekIndex).get('days') as FormArray;
  }

  getTopics(weekIndex: number, dayIndex: number): FormArray {
    return this.getDays(weekIndex).at(dayIndex).get('topics') as FormArray;
  }

  addWeek(): void {
    const weekGroup = this.fb.group({
      week: [this.schedule.length + 1, [Validators.required, Validators.min(1)]],
      days: this.fb.array([this.createDay()])
    });
    this.schedule.push(weekGroup);
  }

  removeWeek(weekIndex: number): void {
    if (this.schedule.length > 1) {
      this.schedule.removeAt(weekIndex);
    }
  }

  addDay(weekIndex: number): void {
    this.getDays(weekIndex).push(this.createDay());
  }

  removeDay(weekIndex: number, dayIndex: number): void {
    const days = this.getDays(weekIndex);
    if (days.length > 1) {
      days.removeAt(dayIndex);
    }
  }

  addTopic(weekIndex: number, dayIndex: number): void {
    this.getTopics(weekIndex, dayIndex).push(this.createTopic());
  }

  removeTopic(weekIndex: number, dayIndex: number, topicIndex: number): void {
    const topics = this.getTopics(weekIndex, dayIndex);
    if (topics.length > 1) {
      topics.removeAt(topicIndex);
    }
  }

  private createDay(): FormGroup {
    return this.fb.group({
      day: [1, [Validators.required, Validators.min(1)]],
      topics: this.fb.array([this.createTopic()])
    });
  }

  private createTopic(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      difficulty: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      time: ['1ч', Validators.required],
      subtopics: this.fb.array([])
    });
  }

  private initializeNewPlan(): void {
    // Добавляем первую неделю с одним днем и одной темой по умолчанию
    this.addWeek();
  }

  private loadPlanIntoForm(plan: Plan): void {
    this.planForm.patchValue({
      name: plan.name,
      description: plan.description
    });

    this.schedule.clear();
    plan.schedule.forEach(week => {
      const weekGroup = this.fb.group({
        week: [week.week, [Validators.required, Validators.min(1)]],
        days: this.fb.array([])
      });

      const daysArray = weekGroup.get('days') as FormArray;
      week.days.forEach(day => {
        const dayGroup = this.fb.group({
          day: [day.day, [Validators.required, Validators.min(1)]],
          topics: this.fb.array([])
        });

        const topicsArray = dayGroup.get('topics') as FormArray;
        day.topics.forEach(topic => {
          topicsArray.push(this.fb.group({
            title: [topic.title, [Validators.required, Validators.minLength(3)]],
            difficulty: [topic.difficulty, [Validators.required, Validators.min(0), Validators.max(100)]],
            time: [topic.time, Validators.required],
            subtopics: this.fb.array(topic.subtopics || [])
          }));
        });

        daysArray.push(dayGroup);
      });

      this.schedule.push(weekGroup);
    });
  }

  savePlan(): void {
    if (this.planForm.valid) {
      const formValue = this.planForm.value;
      
      if (this.currentPlan) {
        // Обновляем существующий план
        const updatedPlan: Partial<Plan> = {
          name: formValue.name,
          description: formValue.description,
          schedule: formValue.schedule,
          total_topics: this.calculateTotalTopics(formValue.schedule)
        };

        this.planManager.updatePlan(this.currentPlan.id, updatedPlan);
      } else {
        // Создаем новый план
        const currentSubject = this.subjectManager.getCurrentSubjectValue();
        if (currentSubject) {
          const newPlan = this.planManager.createPlan(
            currentSubject.id,
            formValue.name,
            formValue.description
          );
          
          // Обновляем расписание
          this.planManager.updatePlan(newPlan.id, {
            schedule: formValue.schedule,
            total_topics: this.calculateTotalTopics(formValue.schedule)
          });
        }
      }
      
      this.router.navigate(['/daily-topics']);
    } else {
      this.markFormGroupTouched(this.planForm);
    }
  }

  private calculateTotalTopics(schedule: any[]): number {
    return schedule.reduce((total, week) => {
      return total + week.days.reduce((weekTotal: number, day: any) => {
        return weekTotal + day.topics.length;
      }, 0);
    }, 0);
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control?.markAsTouched();
      }
    });
  }

  toggleYamlEditor(): void {
    this.showYamlEditor = !this.showYamlEditor;
    if (this.showYamlEditor && this.currentPlan) {
      this.yamlContent = this.planManager.exportToYaml(this.currentPlan.id);
    } else if (this.showYamlEditor) {
      // Генерируем YAML из текущей формы
      const formValue = this.planForm.value;
      const tempPlan: Plan = {
        id: 'temp',
        subjectId: 'temp',
        name: formValue.name || 'Новый план',
        description: formValue.description,
        total_topics: this.calculateTotalTopics(formValue.schedule),
        schedule: formValue.schedule,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.yamlContent = this.generateYaml(tempPlan);
    }
  }

  private generateYaml(plan: Plan): string {
    let yaml = `name: ${plan.name}\n`;
    if (plan.description) yaml += `description: ${plan.description}\n`;
    yaml += `total_topics: ${plan.total_topics}\n\n`;
    
    plan.schedule.forEach(week => {
      yaml += `week: ${week.week}\n`;
      week.days.forEach(day => {
        yaml += `  day: ${day.day}\n`;
        day.topics.forEach(topic => {
          yaml += `    - ${topic.title} (сложность: ${topic.difficulty}, время: ${topic.time})\n`;
        });
      });
      yaml += '\n';
    });

    return yaml;
  }

  importFromYaml(): void {
    if (this.yamlContent) {
      try {
        const currentSubject = this.subjectManager.getCurrentSubjectValue();
        if (currentSubject) {
          const plan = this.planManager.importFromYaml(currentSubject.id, this.yamlContent);
          this.loadPlanIntoForm(plan);
          this.showYamlEditor = false;
          alert('План успешно импортирован из YAML!');
        }
      } catch (error) {
        alert('Ошибка импорта: ' + error);
      }
    }
  }

  cancel(): void {
    this.router.navigate(['/daily-topics']);
  }

  isFieldInvalid(fieldPath: string): boolean {
    const field = this.planForm.get(fieldPath);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getTotalTopicsCount(): number {
    const schedule = this.planForm.get('schedule')?.value;
    return this.calculateTotalTopics(schedule || []);
  }

  getTotalWeeksCount(): number {
    return this.schedule.length;
  }
}