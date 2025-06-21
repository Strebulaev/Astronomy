import { Component, Input } from '@angular/core';
import { TestStorageService } from '../../services/test-storage.service';
import { TestResult } from '../../models/test-result.model';

@Component({
  selector: 'app-test-statistics',
  templateUrl: './test-statistics.component.html',
  styleUrls: ['./test-statistics.component.scss']
})
export class TestStatisticsComponent {
  @Input() testId?: string;
  results: TestResult[] = [];
  chartData: any;
  chartOptions: any;

  constructor(private testStorage: TestStorageService) {}

  ngOnInit(): void {
    this.loadResults();
    this.prepareChart();
  }

  private loadResults(): void {
    this.results = this.testId
      ? this.testStorage.getTestResultsByTestId(this.testId)
      : this.testStorage.getAllTestResults();

    // Sort by date
    this.results.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private prepareChart(): void {
    const labels = this.results.map(r => new Date(r.date).toLocaleDateString());
    const data = this.results.map(r => (r.correctAnswers / r.totalQuestions) * 100);

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Результативность (%)',
          data: data,
          fill: false,
          borderColor: '#42A5F5',
          tension: 0.4
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const result = this.results[context.dataIndex];
              return [
                `Результат: ${result.correctAnswers}/${result.totalQuestions}`,
                `Время: ${result.timeSpent} сек.`,
                `Дата: ${new Date(result.date).toLocaleString()}`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Процент правильных ответов'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Дата прохождения'
          }
        }
      }
    };
  }

  get averageScore(): number {
    if (!this.results.length) return 0;
    const sum = this.results.reduce((acc, r) => acc + (r.correctAnswers / r.totalQuestions), 0);
    return (sum / this.results.length) * 100;
  }
}
