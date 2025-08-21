import { Component, Input, OnChanges, SimpleChanges, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  NgApexchartsModule, 
  ChartComponent,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexPlotOptions,
  ApexXAxis,
  ApexYAxis,
  ApexStroke,
  ApexMarkers,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  ApexDataLabels,
  ApexResponsive,
  ApexTheme,
  ApexTitleSubtitle,
  ApexAnnotations,
  ApexGrid
} from 'ng-apexcharts';
import { ProgressForecast } from '../daily-topics/daily-topics.component';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  dataLabels?: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
  labels: string[]; // Убедитесь, что это свойство присутствует во всех графиках
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  stroke: ApexStroke;
  markers: ApexMarkers; // Убрано "?"
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend; // Убрано "?"
  responsive?: ApexResponsive[];
  theme?: ApexTheme;
  title?: ApexTitleSubtitle;
  subtitle?: ApexTitleSubtitle;
  annotations?: ApexAnnotations;
  grid?: ApexGrid;
};

@Component({
  selector: 'app-progress-charts',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './progress-charts.component.html',
  styleUrls: ['./progress-charts.component.css']
})
export class ProgressChartsComponent implements OnChanges {
  @Input() allTopics: any[] = [];
  @Input() completedTopics: any[] = [];
  @Input() totalProgress: number = 0;
  @Input() todayProgress: number = 0;
  @Input() forecast?: ProgressForecast;
  
  @ViewChild('completionChart') completionChartEl?: ChartComponent;
  @ViewChild('difficultyChart') difficultyChartEl?: ChartComponent;
  @ViewChild('timeChart') timeChartEl?: ChartComponent;
  @ViewChild('forecastChart') forecastChartEl?: ChartComponent;
  @ViewChild('dailyProgressChart') dailyProgressChartEl?: ChartComponent;
  @ViewChild('efficiencyChart') efficiencyChartEl?: ChartComponent;

  currentDate = signal<Date>(new Date());
  showDescriptions = signal<{[key: string]: boolean}>({
    completion: false,
    difficulty: false,
    time: false,
    forecast: false,
    daily: false,
    efficiency: false
  });
  
  private chartInstances: {[key: string]: any} = {};
  
  completionChart = signal<ChartOptions>({} as ChartOptions);
  difficultyChart = signal<ChartOptions>({} as ChartOptions);
  timeChart = signal<ChartOptions>({} as ChartOptions);
  forecastChart = signal<ChartOptions>({} as ChartOptions);
  dailyProgressChart = signal<ChartOptions>({} as ChartOptions);
  efficiencyChart = signal<ChartOptions>({} as ChartOptions);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['allTopics'] || changes['completedTopics'] || changes['forecast']) {
      this.initCharts();
      this.updateCharts();
    }
  }

  toggleDescription(chart: string): void {
    this.showDescriptions.update(descriptions => ({
      ...descriptions,
      [chart]: !descriptions[chart]
    }));
  }

  async downloadChart(chartType: string): Promise<void> {
    const chartInstance = this.chartInstances[chartType];
    if (!chartInstance) {
      console.warn(`Chart instance for ${chartType} not found`);
      return;
    }

    try {
      const { imgURI } = await chartInstance.dataURI();
      
      const link = document.createElement('a');
      link.download = `${chartType}-chart-${new Date().toISOString().slice(0,10)}.png`;
      link.href = imgURI;
      link.click();
    } catch (error) {
      console.error('Error downloading chart:', error);
    }
  }

  private initCharts(): void {
    // 1. Completion Chart (Radial Bar)
    this.completionChart.set({
      chart: {
        type: 'radialBar',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['completion'] = chartContext;
          }
        },
        toolbar: { show: false }
      },
      series: [this.totalProgress],
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 0,
            size: '70%',
            background: 'transparent',
          },
          track: {
            background: '#f0f0f0',
            strokeWidth: '67%',
            margin: 0,
          },
          dataLabels: {
            name: {
              offsetY: -15,
              color: '#333',
              fontSize: '14px',
              fontWeight: 'bold'
            },
            value: {
              color: '#333',
              fontSize: '36px',
              fontWeight: 'bold',
              show: true,
              offsetY: 5
            },
            total: {
              show: true,
              label: 'Общий прогресс',
              color: '#333',
              fontSize: '14px',
              formatter: () => `${this.totalProgress}%`
            }
          }
        }
      },
      colors: ['#4CAF50'],
      labels: ['Прогресс'],
      xaxis: {
        categories: [],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false }
      },
      yaxis: {
        show: false,
        labels: { show: false }
      },
      stroke: {
        lineCap: 'round',
        width: 3,
        colors: ['#4CAF50']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          shadeIntensity: 0.15,
          gradientToColors: ['#66BB6A'],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 65, 91]
        },
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`
        }
      },
      markers: {
        size: 0
      },
      legend: {
        show: false
      }
    });
  
    // 2. Difficulty Chart (Horizontal Bar)
    this.difficultyChart.set({
      chart: {
        type: 'bar',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['difficulty'] = chartContext;
          }
        },
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      series: [{
        name: 'Сложность',
        data: []
      }],
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: true,
          barHeight: '70%',
          distributed: false,
          dataLabels: {
            position: 'center'
          }
        }
      },
      colors: ['#3F51B5'],
      dataLabels: {
        enabled: true,
        textAnchor: 'middle',
        style: {
          colors: ['#fff'],
          fontSize: '12px',
          fontWeight: 'bold'
        },
        formatter: (val: number) => `${val}%`,
        offsetX: 0,
        dropShadow: {
          enabled: false
        }
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Средняя сложность (%)',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0'
        }
      },
      yaxis: {
        title: {
          text: 'Неделя',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      stroke: {
        show: true,
        width: 1,
        colors: ['#fff']
      },
      fill: {
        opacity: 1,
        type: 'solid'
      },
      tooltip: {
        y: {
          formatter: (val: number) => `Сложность: ${val}%`
        }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 4
      },
      markers: {
        size: 0
      },
      legend: {
        show: false
      },
      labels: []
    });
  
    // 3. Time Chart (Area)
    this.timeChart.set({
      chart: {
        type: 'area',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['time'] = chartContext;
          }
        },
        stacked: false,
        zoom: { enabled: false },
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      series: [{
        name: 'Часов изучения',
        data: []
      }],
      plotOptions: {
        area: {
          fillTo: 'origin'
        }
      },
      colors: ['#FF9800'],
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [],
        title: {
          text: 'Неделя',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0'
        }
      },
      yaxis: {
        title: {
          text: 'Часов',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (val: number) => `${val.toFixed(1)}`
        },
        min: 0
      },
      stroke: {
        curve: 'smooth',
        width: 3,
        colors: ['#FF9800']
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.6,
          inverseColors: false,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)} часов`
        }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
        }
      },
      markers: {
        size: 5,
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      legend: {
        show: false
      },
      labels: []
    });
  
    // 4. Forecast Chart (Line)
    this.forecastChart.set({
      chart: {
        type: 'line',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['forecast'] = chartContext;
          }
        },
        animations: { 
          enabled: true,
          speed: 800
        },
        toolbar: { show: false },
        foreColor: '#333'
      },
      plotOptions: {
        line: {}
      },
      labels: [],
      series: [
        {
          name: 'Исторический прогресс',
          data: []
        },
        {
          name: 'Прогноз завершения',
          data: []
        }
      ],
      colors: ['#4CAF50', '#E91E63'],
      stroke: {
        width: [3, 4],
        curve: 'smooth',
        dashArray: [0, 5]
      },
      fill: {
        type: 'solid',
        opacity: 1
      },
      markers: {
        size: [5, 0],
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: string) => {
            return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
          }
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0'
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: number) => `${value}%`
        },
        title: {
          text: 'Прогресс (%)',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      tooltip: {
        x: {
          formatter: (value: number) => new Date(value).toLocaleDateString('ru-RU')
        },
        y: {
          formatter: (value: number) => `${value.toFixed(1)}% завершено`
        }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
        }
      },
      annotations: {
        yaxis: [
          {
            y: 100,
            borderColor: '#00E396',
            strokeDashArray: 0,
            label: {
              borderColor: '#00E396',
              style: {
                color: '#fff',
                background: '#00E396'
              },
              text: 'Цель: 100%'
            }
          }
        ]
      },
      legend: {
        position: 'top'
      }
    });
  
    // 5. Daily Progress Chart (Line)
    this.dailyProgressChart.set({
      chart: {
        type: 'line',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['daily'] = chartContext;
          }
        },
        sparkline: { enabled: false },
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      plotOptions: {
        line: {}
      },
      labels: [],
      series: [{
        name: 'Прогресс',
        data: []
      }],
      colors: ['#00BCD4'],
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: '12px'
          },
          rotate: -45,
          formatter: (value: string) => value
        },
        title: {
          text: 'Дата',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0'
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: number) => `${value}%`
        },
        title: {
          text: 'Прогресс (%)',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: ['#00BCD4']
      },
      fill: {
        type: 'solid',
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value.toFixed(1)}% выполнено`
        }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 20,
          bottom: 0,
          left: 20
        }
      },
      markers: {
        size: 5,
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      legend: {
        show: false
      }
    });
  
    // 6. Efficiency Chart (Stacked Bar)
    this.efficiencyChart.set({
      chart: {
        type: 'bar',
        height: 350,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['efficiency'] = chartContext;
          }
        },
        stacked: true,
        toolbar: { show: false },
        animations: {
          enabled: true,
          speed: 800
        }
      },
      series: [
        { name: 'Выполнено', data: [] },
        { name: 'В работе', data: [] },
        { name: 'Пропущено', data: [] }
      ],
      colors: ['#8BC34A', '#FFC107', '#F44336'],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${Math.round(val)}%`,
        style: {
          fontSize: '10px',
          fontWeight: 'bold',
          colors: ['#333']
        },
        offsetY: -20
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '60%',
          dataLabels: {
            position: 'top'
          }
        }
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            fontSize: '12px'
          },
          rotate: -45
        },
        title: {
          text: 'Неделя',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        axisBorder: {
          show: true,
          color: '#e0e0e0'
        },
        axisTicks: {
          show: true,
          color: '#e0e0e0'
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: number) => `${value}%`
        },
        title: {
          text: 'Эффективность (%)',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      stroke: {
        width: 1,
        colors: ['#fff']
      },
      fill: {
        opacity: 1,
        type: 'solid'
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '14px',
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 4,
        padding: {
          top: 30,
          right: 20,
          bottom: 0,
          left: 20
        }
      },
      markers: {
        size: 0
      },
      labels: []
    });
  }

  private updateCharts(): void {
    this.updateCompletionChart();
    this.updateDifficultyChart();
    this.updateTimeChart();
    this.updateForecastChart();
    this.updateDailyProgressChart();
    this.updateEfficiencyChart();
  }

  private updateCompletionChart(): void {
    const completedCount = this.completedTopics.length;
    const totalCount = this.allTopics.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    this.completionChart.update(chart => ({
      ...chart,
      series: [progress],
      labels: [`Выполнено: ${completedCount}/${totalCount}`],
      plotOptions: {
        ...chart.plotOptions,
        radialBar: {
          ...chart.plotOptions?.radialBar,
          dataLabels: {
            ...chart.plotOptions?.radialBar?.dataLabels,
            total: {
              ...chart.plotOptions?.radialBar?.dataLabels?.total,
              formatter: () => `${progress.toFixed(1)}%`
            }
          }
        }
      }
    }));
  }

  private updateDifficultyChart(): void {
    const weeklyDifficulty = this.calculateWeeklyDifficulty();
    const categories = weeklyDifficulty.map(w => `Неделя ${w.week}`);
    const data = weeklyDifficulty.map(w => w.avgDifficulty);
    
    this.difficultyChart.update(chart => ({
      ...chart,
      series: [{
        name: 'Сложность',
        data: data
      }],
      xaxis: {
        ...chart.xaxis,
        categories: categories,
        min: 0,
        max: 100
      }
    }));
  }

  private updateTimeChart(): void {
    const weeklyTime = this.calculateWeeklyTime();
    const categories = weeklyTime.map(w => `Неделя ${w.week}`);
    const data = weeklyTime.map(w => w.totalHours);
    
    this.timeChart.update(chart => ({
      ...chart,
      series: [{
        name: 'Часов изучения',
        data: data
      }],
      xaxis: {
        ...chart.xaxis,
        categories: categories
      }
    }));
  }

  private updateForecastChart(): void {
    if (!this.forecast) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Historical data (last 30 days)
    const historyDays = 30;
    const historicalData: {x: Date, y: number}[] = [];
    const completedTopicsByDate = this.getCompletedTopicsByDate();
    
    for (let i = historyDays; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dateKey = date.toISOString().split('T')[0];
      const completedCount = completedTopicsByDate[dateKey]?.length || 0;
      
      const progress = this.calculateProgressUpToDate(date);
      historicalData.push({
        x: date,
        y: progress
      });
    }
    
    // Forecast data (next 90 days max)
    const forecastDays = Math.min(90, Math.ceil((100 - this.totalProgress) / (this.forecast.currentRate * 10)));
    const forecastData: {x: Date, y: number}[] = [];
    
    for (let i = 1; i <= forecastDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const progress = Math.min(100, this.totalProgress + i * this.forecast.currentRate * 10);
      forecastData.push({
        x: date,
        y: progress
      });
      
      if (progress >= 100) break;
    }
    
    this.forecastChart.update(chart => ({
      ...chart,
      series: [
        {
          name: 'Исторический прогресс',
          data: historicalData
        },
        {
          name: 'Прогноз завершения',
          data: forecastData
        }
      ],
      annotations: {
        ...chart.annotations,
        xaxis: [
          {
            x: today.getTime(),
            borderColor: '#999',
            strokeDashArray: 0,
            label: {
              borderColor: '#999',
              style: {
                color: '#fff',
                background: '#999'
              },
              text: 'Сегодня',
              orientation: 'horizontal',
              position: 'top'
            }
          }
        ]
      }
    }));
  }

  private updateDailyProgressChart(): void {
    const dailyData = this.calculateDailyProgress();
    const categories = dailyData.map(d => 
      new Date(d.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    );
    const data = dailyData.map(d => d.percentage);
    
    this.dailyProgressChart.update(chart => ({
      ...chart,
      series: [{
        name: 'Прогресс',
        data: data
      }],
      xaxis: {
        ...chart.xaxis,
        categories: categories
      }
    }));
  }

  private updateEfficiencyChart(): void {
    const weeklyEfficiency = this.calculateWeeklyEfficiency();
    const categories = weeklyEfficiency.map(w => `Неделя ${w.week}`);
    
    this.efficiencyChart.update(chart => ({
      ...chart,
      series: [
        {
          name: 'Выполнено',
          data: weeklyEfficiency.map(w => w.completedScore)
        },
        {
          name: 'В работе',
          data: weeklyEfficiency.map(w => w.inProgressScore)
        },
        {
          name: 'Пропущено',
          data: weeklyEfficiency.map(w => w.missedScore)
        }
      ],
      xaxis: {
        ...chart.xaxis,
        categories: categories
      }
    }));
  }

  private calculateWeeklyDifficulty(): {week: number, avgDifficulty: number}[] {
    const weeklyStats: {[week: number]: {total: number, sum: number}} = {};

    this.allTopics.forEach(topic => {
      if (!weeklyStats[topic.week]) {
        weeklyStats[topic.week] = {total: 0, sum: 0};
      }
      weeklyStats[topic.week].total++;
      weeklyStats[topic.week].sum += topic.difficulty || 0;
    });

    return Object.entries(weeklyStats)
      .map(([week, stats]) => ({
        week: +week,
        avgDifficulty: stats.total > 0 ? Math.round(stats.sum / stats.total) : 0
      }))
      .sort((a, b) => a.week - b.week);
  }

  private calculateWeeklyTime(): {week: number, totalHours: number}[] {
    const weeklyStats: {[week: number]: number} = {};

    this.allTopics.forEach(topic => {
      const hours = this.parseTimeToHours(topic.time);
      weeklyStats[topic.week] = (weeklyStats[topic.week] || 0) + hours;
    });

    return Object.entries(weeklyStats)
      .map(([week, hours]) => ({
        week: +week,
        totalHours: Math.round(hours * 10) / 10
      }))
      .sort((a, b) => a.week - b.week);
  }

  private calculateDailyProgress(): {date: string, percentage: number}[] {
    const dailyStats: {[date: string]: {total: number, completed: number}} = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    // Get last 14 days
    const daysToShow = 21;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - daysToShow);
  
    // Initialize all days with zeros
    for (let i = 0; i <= daysToShow; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      dailyStats[dateKey] = {total: 0, completed: 0};
    }
  
    // Count completed topics per day
    this.allTopics.forEach(topic => {
      const topicDate = new Date(topic.dueDate);
      topicDate.setHours(0, 0, 0, 0);
      
      // Only consider topics from the last 14 days
      if (topicDate >= startDate && topicDate <= today) {
        const dateKey = topicDate.toISOString().split('T')[0];
        dailyStats[dateKey].total++;
        if (topic.completed) {
          dailyStats[dateKey].completed++;
        }
      }
    });
  
    return Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private calculateWeeklyEfficiency(): {
    week: number,
    completedScore: number,
    inProgressScore: number,
    missedScore: number
  }[] {
    const weeklyStats: {
      [week: number]: {
        completed: number,
        inProgress: number,
        missed: number,
        total: number
      }
    } = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.allTopics.forEach(topic => {
      if (!weeklyStats[topic.week]) {
        weeklyStats[topic.week] = {completed: 0, inProgress: 0, missed: 0, total: 0};
      }
      
      const topicDate = new Date(topic.dueDate);
      topicDate.setHours(0, 0, 0, 0);
      
      if (topic.completed) {
        weeklyStats[topic.week].completed++;
      } else if (topicDate > today) {
        weeklyStats[topic.week].inProgress++;
      } else {
        weeklyStats[topic.week].missed++;
      }
      
      weeklyStats[topic.week].total++;
    });

    return Object.entries(weeklyStats)
      .map(([week, stats]) => ({
        week: +week,
        completedScore: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
        inProgressScore: stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0,
        missedScore: stats.total > 0 ? (stats.missed / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.week - b.week);
  }

  private parseTimeToHours(timeStr: string): number {
    if (!timeStr) return 1;
    
    let hours = 0;
    let minutes = 0;
    
    // Handle different time formats: "2h 30m", "2 hours", "30 minutes", "2.5h" etc.
    const hourMatch = timeStr.match(/(\d+\.?\d*)\s*(ч|час|часа|hours?|h)/i);
    if (hourMatch) {
      hours = parseFloat(hourMatch[1]);
    }
    
    const minuteMatch = timeStr.match(/(\d+)\s*(мин|минут|minutes?|m)/i);
    if (minuteMatch) {
      minutes = parseInt(minuteMatch[1], 10);
    }
    
    return hours + (minutes / 60);
  }

  private getCompletedTopicsByDate(): {[date: string]: any[]} {
    const result: {[date: string]: any[]} = {};
    
    this.completedTopics.forEach(topic => {
      if (!topic.completedDate) return;
      
      const dateKey = new Date(topic.completedDate).toISOString().split('T')[0];
      if (!result[dateKey]) {
        result[dateKey] = [];
      }
      result[dateKey].push(topic);
    });
    
    return result;
  }

  private calculateProgressUpToDate(date: Date): number {
    const dateKey = date.toISOString().split('T')[0];
    const completedUpToDate = this.completedTopics.filter(topic => {
      if (!topic.completedDate) return false;
      const topicDate = new Date(topic.completedDate).toISOString().split('T')[0];
      return topicDate <= dateKey;
    });
    
    return this.allTopics.length > 0 
      ? (completedUpToDate.length / this.allTopics.length) * 100 
      : 0;
  }
  private calculateHistoricalProgress(): {date: Date, progress: number}[] {
    if (!this.allTopics.length) return [];
    
    // Находим самую раннюю дату
    const startDate = this.allTopics.reduce((min, topic) => 
      topic.dueDate < min ? topic.dueDate : min, new Date());
    
    const completedByDate: {[key: string]: number} = {};
    
    // Группируем выполненные темы по дате
    this.completedTopics.forEach(topic => {
      if (!topic.completedDate) return;
      const dateStr = topic.completedDate.toISOString().split('T')[0];
      completedByDate[dateStr] = (completedByDate[dateStr] || 0) + 1;
    });

    const result: {date: Date, progress: number}[] = [];
    let totalCompleted = 0;
    const totalTopics = this.allTopics.length;
    
    // Создаем массив всех дат от начала до сегодня
    const currentDate = new Date(startDate);
    const today = new Date();
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      totalCompleted += completedByDate[dateStr] || 0;
      
      result.push({
        date: new Date(currentDate),
        progress: (totalCompleted / totalTopics) * 100
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return result;
  }

  private calculateSpeedTrend(): {date: Date, speed: number}[] {
    const historicalData = this.calculateHistoricalProgress();
    if (historicalData.length < 2) return [];
    
    const speedData: {date: Date, speed: number}[] = [];
    
    // Рассчитываем скорость между точками прогресса
    for (let i = 1; i < historicalData.length; i++) {
      const prev = historicalData[i-1];
      const curr = historicalData[i];
      
      const daysBetween = this.getWorkDaysBetween(prev.date, curr.date);
      if (daysBetween === 0) continue;
      
      const progressDiff = curr.progress - prev.progress;
      const speed = progressDiff / daysBetween; // % прогресса в день
      
      speedData.push({
        date: curr.date,
        speed: speed * (this.allTopics.length / 100) // преобразуем в темы/день
      });
    }
    
    return speedData;
  }

  private calculateCompletionForecast(): {date: Date, progress: number}[] {
    const historicalProgress = this.calculateHistoricalProgress();
    if (!historicalProgress.length) return [];
    
    const currentProgress = historicalProgress[historicalProgress.length - 1].progress;
    const remainingProgress = 100 - currentProgress;
    
    // Рассчитываем среднюю скорость с учетом сложности
    const speedData = this.calculateSpeedTrend();
    const avgSpeed = speedData.reduce((sum, item) => sum + item.speed, 0) / speedData.length;
    
    // Корректируем скорость на основе сложности оставшихся тем
    const remainingTopics = this.allTopics.filter(t => !t.completed);
    const remainingDifficulty = remainingTopics.reduce((sum, t) => sum + t.difficulty, 0) / remainingTopics.length;
    const completedDifficulty = this.completedTopics.reduce((sum, t) => sum + t.difficulty, 0) / this.completedTopics.length;
    const difficultyFactor = 1 - (remainingDifficulty - completedDifficulty) / 200;
    
    const adjustedSpeed = avgSpeed * difficultyFactor;
    
    // Генерируем прогноз
    const forecast: {date: Date, progress: number}[] = [];
    let currentDate = new Date();
    let progress = currentProgress;
    
    while (progress < 100) {
      currentDate = this.addWorkDays(currentDate, 1);
      progress = Math.min(100, progress + (adjustedSpeed * 100 / this.allTopics.length));
      
      forecast.push({
        date: new Date(currentDate),
        progress: progress
      });
    }
    
    return forecast;
  }

  // Вспомогательные методы
  private getWorkDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) count++; // не выходные
      current.setDate(current.getDate() + 1);
    }
    
    return count;
  }

  private addWorkDays(date: Date, days: number): Date {
    const result = new Date(date);
    let added = 0;
    
    while (added < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        added++;
      }
    }
    
    return result;
  }
}