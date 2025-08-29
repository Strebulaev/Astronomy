import { Injectable } from '@angular/core';
import * as yaml from 'js-yaml';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Test } from '../models/test.model';
import { SubjectManagerService } from './subject-manager.service';
import { Subject } from '../models/subject.model';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  private readonly TESTS_PATH = '/assets/data/tests/';
  private readonly CUSTOM_TESTS_KEY = 'custom_tests';

  constructor(
    private http: HttpClient,
    private subjectManager: SubjectManagerService
  ) {}
  private parseYaml(yamlText: string): any {
    try {
      // Используем js-yaml или простой парсер
      return yamlText.split('---').map(block => {
        const lines = block.split('\n').filter(line => line.trim());
        const obj: any = {};
        lines.forEach(line => {
          const [key, ...value] = line.split(':');
          if (key && value.length) {
            obj[key.trim()] = value.join(':').trim();
          }
        });
        return obj;
      }).filter(item => Object.keys(item).length > 0);
    } catch (e) {
      console.error('Error parsing YAML', e);
      return [];
    }
  }
  getPlan(): Observable<any> {
    return this.subjectManager.getCurrentSubject().pipe(
      switchMap(subject => {
        if (!subject) return of(null);
        return this.http.get(subject.planPath, { responseType: 'text' }).pipe(
          map(yamlText => this.parseYaml(yamlText)),
          catchError(err => {
            console.error('Error loading plan', err);
            return of(null);
          })
        );
      })
    );
  }
  
  getQuestions(): Observable<any[]> {
    return this.subjectManager.getCurrentSubject().pipe(
      switchMap(subject => {
        if (!subject) return of([]);
        return this.http.get(subject.questionsPath, { responseType: 'text' }).pipe(
          map(yamlText => this.parseYaml(yamlText)),
          catchError(err => {
            console.error('Error loading questions', err);
            return of([]);
          })
        );
      })
    );
  }
  

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
  
  // Обновите методы загрузки
  getQuestionsForSubject(subject: Subject): Observable<Question[]> {
    if (!subject?.questionsPath) {
      console.error('No questions path for subject:', subject?.name);
      return of([]);
    }
    
    return this.http.get(subject.questionsPath, { responseType: 'text' }).pipe(
      map(yamlText => {
        try {
          return this.parseYamlToQuestions(yamlText);
        } catch (error) {
          console.error('Error parsing questions YAML:', error);
          return [];
        }
      }),
      catchError(this.handleError('getQuestionsForSubject', []))
    );
  }

  getTags(): Observable<any[]> {
    return this.subjectManager.getCurrentSubject().pipe(
      switchMap(subject => {
        if (!subject) return of([]);
        return this.http.get(subject.tagsPath, { responseType: 'text' }).pipe(
          map(yamlText => this.parseYaml(yamlText)),
          catchError(err => {
            console.error('Error loading tags', err);
            return of([]);
          })
        );
      })
    );
  }

  getTestsForSubject(subject: Subject): Observable<Test[]> {
    return this.http.get<string[]>(`${subject.testsPath}index.json`).pipe(
      switchMap(testFiles => {
        const requests = testFiles.map(file => 
          this.http.get(`${subject.testsPath}${file}`, { responseType: 'text' })
            .pipe(
              map(text => {
                const test = this.parseYamlToTest(text);
                test.isCustom = false;
                return test;
              }),
              catchError(err => of(null))
            )
        );
        return forkJoin(requests).pipe(
          map(tests => tests.filter(t => t !== null) as Test[])
        );
      }),
      catchError(err => {
        console.error('Error loading tests for subject', subject.name, err);
        return of([]);
      })
    );
  }

  getThematicTests(): Observable<Test[]> {
    return this.http.get<string[]>('/assets/data/tests/index.json').pipe(
      switchMap(testFiles => {
        const requests = testFiles.map(file => 
          this.http.get(`/assets/data/tests/${file}`, { responseType: 'text' })
            .pipe(
              map(text => {
                const test = yaml.load(text) as Test;
                test.isCustom = false;
                
                // Вычисляем среднюю сложность, если есть данные
                if (test.questions.some(q => q.difficulty !== undefined)) {
                  const sum = test.questions.reduce((acc, q) => acc + (q.difficulty || 0), 0);
                  test.averageDifficulty = Math.round(sum / test.questions.length);
                }
                
                test.questionCount = test.questions.length;
                
                return test;
              }),
              catchError(err => of(null))
        ));
        return forkJoin(requests).pipe(
          map(tests => tests.filter(t => t !== null) as Test[])
        );
      })
    );
  }
  deleteTest(testId: string): Observable<boolean> {
    try {
      const customTests = this.getCustomTests();
      const updatedTests = customTests.filter(t => t.id !== testId);
      localStorage.setItem(this.CUSTOM_TESTS_KEY, JSON.stringify(updatedTests));
      return of(true);
    } catch (error) {
      console.error('Error deleting test:', error);
      return of(false);
    }
  }
  saveCustomTest(test: Test): void {
    // Вычисляем сложность для кастомных тестов
    if (test.questions.some(q => q.difficulty !== undefined)) {
      const sum = test.questions.reduce((acc, q) => acc + (q.difficulty || 0), 0);
      test.averageDifficulty = Math.round(sum / test.questions.length);
    }
    test.questionCount = test.questions.length;
    
    const customTests = this.getCustomTests();
    const existingIndex = test.id ? customTests.findIndex(t => t.id === test.id) : -1;
    
    if (existingIndex >= 0) {
      customTests[existingIndex] = test;
    } else {
      customTests.push(test);
    }
    
    localStorage.setItem(this.CUSTOM_TESTS_KEY, JSON.stringify(customTests));
  }

  getCustomTests(): Test[] {
    const testsJson = localStorage.getItem(this.CUSTOM_TESTS_KEY);
    return testsJson ? JSON.parse(testsJson) : [];
  }

  getAllTests(): Observable<Test[]> {
    return this.getThematicTests().pipe(
      map(thematicTests => {
        const customTests = this.getCustomTests();
        return [...thematicTests, ...customTests];
      })
    );
  }

  validateYamlQuestions(yamlContent: string): { valid: boolean; questions?: Question[]; error?: string } {
    try {
      const data = yaml.load(yamlContent);
      if (!Array.isArray(data)) {
        return { valid: false, error: 'YAML должен содержать массив вопросов' };
      }
  
      const questions: Question[] = [];
      for (const item of data) {
        if (this.isValidQuestionStructure(item)) {
          questions.push({
            id: item.id || this.generateId(),
            tags: item.tags || [],
            text: item.text,
            difficulty: item.difficulty || 50,
            options: item.options.map((opt: any) => ({
              text: opt.text,
              correct: opt.correct || false
            })),
            explanation: item.explanation
          });
        }
      }
  
      return { valid: questions.length > 0, questions };
    } catch (error) {
      return { valid: false, error: 'Ошибка парсинга YAML' };
    }
  }
  
  private isValidQuestionStructure(item: any): boolean {
    return item && 
           typeof item.text === 'string' &&
           Array.isArray(item.options) &&
           item.options.length >= 2 &&
           item.options.every((opt: any) => typeof opt.text === 'string') &&
           item.options.some((opt: any) => opt.correct === true);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private parseYamlToQuestions(yamlText: string): Question[] {
    try {
      const parsedData = yaml.load(yamlText);
      
      if (!Array.isArray(parsedData)) {
        console.error('YAML questions should be an array');
        return [];
      }

      return parsedData
        .map((item: any, index: number) => {
          try {
            // Валидация обязательных полей
            if (!item.text || !item.options || !Array.isArray(item.options)) {
              console.warn(`Invalid question structure at index ${index}`);
              return null;
            }

            // Проверяем, что есть хотя бы один правильный ответ
            const hasCorrectAnswer = item.options.some((opt: any) => opt.correct === true);
            if (!hasCorrectAnswer) {
              console.warn(`Question "${item.text}" has no correct answers`);
              return null;
            }

            const question: Question = {
              id: item.id || this.generateQuestionId(item.text),
              text: item.text.trim(),
              tags: Array.isArray(item.tags) ? item.tags : [],
              difficulty: this.validateDifficulty(item.difficulty),
              options: item.options.map((opt: any, optIndex: number) => ({
                text: opt.text?.toString().trim() || `Option ${optIndex + 1}`,
                correct: Boolean(opt.correct)
              })),
              explanation: item.explanation?.toString().trim()
            };

            return question;

          } catch (error) {
            console.error(`Error parsing question at index ${index}:`, error);
            return null;
          }
        })
        .filter((question: Question | null): question is Question => question !== null);

    } catch (error) {
      console.error('Error parsing YAML questions:', error);
      return [];
    }
  }

  private parseYamlToTest(yamlText: string): Test {
    try {
      const parsedData = yaml.load(yamlText);
      
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error('Invalid test structure');
      }

      const testData = parsedData as any;
      
      // Валидация обязательных полей
      if (!testData.name || !testData.questions || !Array.isArray(testData.questions)) {
        throw new Error('Test missing required fields: name or questions');
      }

      const test: Test = {
        id: testData.id || this.generateTestId(testData.name),
        name: testData.name.toString().trim(),
        tags: Array.isArray(testData.tags) ? testData.tags.map((t: any) => t.toString().trim()) : [],
        questions: testData.questions.map((q: any, index: number) => {
          // Валидация вопроса
          if (!q.question || !q.options || !Array.isArray(q.options)) {
            throw new Error(`Invalid question structure at index ${index}`);
          }

          // Проверяем правильные ответы
          const correctAnswers = q.options.filter((opt: any) => opt.correct);
          if (correctAnswers.length === 0) {
            throw new Error(`Question "${q.question}" has no correct answers`);
          }

          return {
            question: q.question.toString().trim(),
            options: q.options.map((opt: any, optIndex: number) => ({
              text: opt.text?.toString().trim() || `Option ${optIndex + 1}`,
              correct: Boolean(opt.correct)
            })),
            explanation: q.explanation?.toString().trim(),
            difficulty: this.validateDifficulty(q.difficulty)
          };
        }),
        isCustom: false,
        questionCount: testData.questions.length
      };

      // Вычисляем среднюю сложность
      if (test.questions.some(q => q.difficulty !== undefined)) {
        const sum = test.questions.reduce((acc, q) => acc + (q.difficulty || 50), 0);
        test.averageDifficulty = Math.round(sum / test.questions.length);
      }

      return test;

    } catch (error) {
      console.error('Error parsing YAML test:', error);
      // Возвращаем пустой тест в случае ошибки
      return {
        id: 'error',
        name: 'Invalid Test',
        tags: [],
        questions: [],
        isCustom: false,
        questionCount: 0,
        averageDifficulty: 50
      };
    }
  }

  private validateDifficulty(difficulty: any): number {
    if (typeof difficulty === 'number') {
      return Math.max(0, Math.min(100, difficulty));
    }
    if (typeof difficulty === 'string') {
      const num = parseInt(difficulty, 10);
      if (!isNaN(num)) {
        return Math.max(0, Math.min(100, num));
      }
    }
    return 50; // Значение по умолчанию
  }

  private generateQuestionId(text: string): string {
    // Создаем ID на основе текста вопроса
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20);
    
    return `${baseId}-${Date.now().toString(36)}`;
  }

  private generateTestId(name: string): string {
    // Создаем ID на основе названия теста
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${baseId}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Метод для загрузки плана предмета
  getPlanForSubject(subject: Subject): Observable<any> {
    return this.http.get(subject.planPath, { responseType: 'text' }).pipe(
      map(yamlText => this.parseYamlToPlan(yamlText)),
      catchError(err => {
        console.error('Error loading plan for subject', subject.name, err);
        return of(null);
      })
    );
  }

  private parseYamlToPlan(yamlText: string): any {
    try {
      const parsedData = yaml.load(yamlText);
      
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error('Invalid plan structure');
      }

      const planData = parsedData as any;
      
      // Базовая валидация плана
      if (!planData.name || !planData.schedule || !Array.isArray(planData.schedule)) {
        throw new Error('Plan missing required fields: name or schedule');
      }

      // Преобразуем план в стандартный формат
      const plan = {
        name: planData.name.toString().trim(),
        total_topics: typeof planData.total_topics === 'number' ? planData.total_topics : 0,
        schedule: planData.schedule.map((week: any) => ({
          week: typeof week.week === 'number' ? week.week : 0,
          days: Array.isArray(week.days) ? week.days.map((day: any) => ({
            day: typeof day.day === 'number' ? day.day : 0,
            topics: this.parsePlanTopics(day.topics)
          })) : []
        }))
      };

      return plan;

    } catch (error) {
      console.error('Error parsing YAML plan:', error);
      return null;
    }
  }

  private parsePlanTopics(topics: any): any[] {
    if (!Array.isArray(topics)) {
      return [];
    }

    return topics.map(topic => {
      if (typeof topic === 'string') {
        // Парсим строковый формат: "Тема (сложность: 50, время: 2ч)"
        const match = topic.match(/(.+?)\s*\((?:сложность:\s*(\d+))?[,\s]*(?:время:\s*([^)]+))?\)/i);
        
        if (match) {
          return {
            title: match[1].trim(),
            difficulty: match[2] ? parseInt(match[2], 10) : 50,
            time: match[3] ? match[3].trim() : '1ч'
          };
        }
        
        return {
          title: topic.trim(),
          difficulty: 50,
          time: '1ч'
        };
      }
      
      if (typeof topic === 'object' && topic !== null) {
        // Объектный формат
        return {
          title: topic.title || topic.topic || '',
          difficulty: this.validateDifficulty(topic.difficulty),
          time: topic.time || '1ч',
          subtopics: Array.isArray(topic.subtopics) ? topic.subtopics : undefined
        };
      }
      
      return {
        title: String(topic),
        difficulty: 50,
        time: '1ч'
      };
    });
  }

  // Метод для загрузки тегов предмета
  getTagsForSubject(subject: Subject): Observable<any[]> {
    return this.http.get(subject.tagsPath, { responseType: 'text' }).pipe(
      map(yamlText => this.parseYamlToTags(yamlText)),
      catchError(err => {
        console.error('Error loading tags for subject', subject.name, err);
        return of([]);
      })
    );
  }

  private parseYamlToTags(yamlText: string): any[] {
    try {
      const parsedData = yaml.load(yamlText);
      
      console.log('Parsed tags data:', parsedData); // Для отладки
      
      if (!Array.isArray(parsedData)) {
        console.error('YAML tags should be an array of categories');
        return [];
      }
  
      return parsedData
        .map((category: any) => {
          try {
            // Обрабатываем разные форматы
            const theme = category.theme || category.Theme || category.name;
            let tags = category.tags || category.Tags || category.tag;
            
            if (!theme) {
              console.warn('Invalid tag category structure: missing theme', category);
              return null;
            }
            
            // Преобразуем tags в массив, если это не массив
            if (!Array.isArray(tags)) {
              if (typeof tags === 'string') {
                tags = [tags];
              } else {
                tags = [];
              }
            }
            
            // Фильтруем пустые теги
            tags = tags.filter((tag: any) => tag && typeof tag === 'string' && tag.trim().length > 0);
  
            return {
              theme: theme.toString().trim(),
              tags: tags.map((tag: any) => tag.toString().trim())
            };
          } catch (error) {
            console.error('Error parsing tag category:', error, category);
            return null;
          }
        })
        .filter((category: any) => category !== null && category.tags.length > 0);
  
    } catch (error) {
      console.error('Error parsing YAML tags:', error);
      console.log('Raw YAML content:', yamlText); // Для отладки
      return [];
    }
  }
}