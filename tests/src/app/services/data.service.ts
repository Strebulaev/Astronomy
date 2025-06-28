// app/services/data.service.ts
import { Component, Injectable, OnInit } from '@angular/core';
import * as yaml from 'js-yaml';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Question } from '../models/question.model';
import { Test } from '../models/test.model' 
import { TagCategory } from '../models/tag.model' 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from 'express';


@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly TESTS_PATH = '/assets/data/tests/';

  constructor(private http: HttpClient) {}

  getQuestions(): Observable<Question[]> {
    return this.http.get('/assets/data/questions.yml', { responseType: 'text' }).pipe(
      map(yamlText => {
        try {
          return yaml.load(yamlText) as Question[];
        } catch (e) {
          console.error('Error parsing YAML', e);
          return [];
        }
      }),
      catchError(err => {
        console.error('Error loading questions', err);
        return of([]);
      })
    );
  }

  getTags(): Observable<TagCategory[]> {
    return this.http.get('/assets/data/tags.yml', { responseType: 'text' }).pipe(
      map(yamlText => yaml.load(yamlText) as TagCategory[]),
      catchError(() => of([]))
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
                if (!test.questions) {
                  console.error(`Test ${file} has no questions array`);
                  test.questions = [];
                }
                return test;
              }),
              catchError(err => {
                console.error(`Error loading test file ${file}:`, err);
                return of(null);
              })
            )
        );
        return forkJoin(requests).pipe(
          map(tests => tests.filter(t => t !== null) as Test[]
        ));
      }),
      catchError(err => {
        console.error('Error loading test index:', err);
        return of([]);
      })
    );
  }
}