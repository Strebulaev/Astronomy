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
  series?: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart?: ApexChart;
  dataLabels?: ApexDataLabels;
  plotOptions?: ApexPlotOptions;
  colors?: string[];
  labels?: string[];
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis | ApexYAxis[];
  stroke?: ApexStroke;
  markers?: ApexMarkers;
  fill?: ApexFill;
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
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
    efficiency: false,
    planning: false
  });

  private chartInstances: {[key: string]: any} = {};
  targetDate: Date = new Date();
  isTargetDateAdjusted = false;

  // Default chart options
  private defaultChartOptions: ChartOptions = {
    series: [],
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      }
    } as ApexChart,
    xaxis: {
      categories: []
    } as ApexXAxis,
    yaxis: {
      min: 0
    } as ApexYAxis,
    stroke: {
      curve: 'smooth',
      width: 3
    } as ApexStroke,
    markers: {
      size: 5
    } as ApexMarkers,
    colors: ['#000000'],
    tooltip: {
      enabled: true
    } as ApexTooltip,
    plotOptions: {
      bar: {
        horizontal: false
      }
    } as ApexPlotOptions,
    legend: {
      show: true
    } as ApexLegend,
    annotations: {
      points: []
    } as ApexAnnotations,
    fill: {
      type: 'solid',
      opacity: 1
    } as ApexFill,
    labels: []
  };

  // Chart signals
  completionChart = signal<ChartOptions>({...this.defaultChartOptions});
  difficultyChart = signal<ChartOptions>({...this.defaultChartOptions});
  timeChart = signal<ChartOptions>({...this.defaultChartOptions});
  forecastChart = signal<ChartOptions>({...this.defaultChartOptions});
  dailyProgressChart = signal<ChartOptions>({...this.defaultChartOptions});
  efficiencyChart = signal<ChartOptions>({...this.defaultChartOptions});
  planningChart = signal<ChartOptions>({...this.defaultChartOptions});

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

  updateTargetDate(event: any): void {
    this.targetDate = new Date(event.target.value);
    this.isTargetDateAdjusted = true;
    this.calculatePlanningData();
  }
  
  resetTargetDate(): void {
    this.targetDate = this.calculateRealisticEndDate();
    this.isTargetDateAdjusted = false;
    this.calculatePlanningData();
  }

  calculateCurrentRate(): number {
    if (this.completedTopics.length === 0) return 0;
    
    const completedDates = this.completedTopics
      .filter(t => t.completedDate)
      .map(t => new Date(t.completedDate!).getTime());
    
    if (completedDates.length === 0) return 0;
    
    const minDate = Math.min(...completedDates);
    const maxDate = Math.max(...completedDates);
    const days = (maxDate - minDate) / (1000 * 60 * 60 * 24) + 1;
    
    return this.completedTopics.length / Math.max(1, days);
  }
  
  calculateBehindTopics(): number {
    const currentRate = this.calculateCurrentRate();
    const daysPassed = this.getDaysPassed();
    const expectedTopics = currentRate * daysPassed;
    
    return Math.max(0, Math.round(expectedTopics - this.completedTopics.length));
  }

  getEarliestTopicDate(): Date {
    if (this.allTopics.length === 0) return new Date();
    
    return this.allTopics.reduce((min, topic) => 
      topic.dueDate < min ? topic.dueDate : min, 
      new Date(9999, 0)
    );
  }

  getDaysBetween(start: Date, end: Date): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const timeDiff = endDate.getTime() - startDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
  getCurrentDate(): Date {
    return new Date();
  }
  
  getDaysRemaining(): number {
    return this.getDaysBetween(new Date(), this.targetDate);
  }
  getDaysPassed(): number {
    if (this.allTopics.length === 0) return 0;
    
    const startDate = this.getEarliestTopicDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getDaysBetween(startDate, today);
  }

  calculateHistoricalProgressRate(): { x: number; y: number }[] {
    const historicalData: { x: number; y: number }[] = [];
    const completedByDate: { [key: string]: number } = {};
    
    // Группируем выполненные темы по дате
    this.completedTopics.forEach(topic => {
      if (!topic.completedDate) return;
      
      const dateKey = new Date(topic.completedDate).toISOString().split('T')[0];
      completedByDate[dateKey] = (completedByDate[dateKey] || 0) + 1;
    });
    
    // Создаем данные для графика (темп в темах/день)
    Object.entries(completedByDate).forEach(([date, count]) => {
      historicalData.push({
        x: new Date(date).getTime(),
        y: count // Количество тем в этот день
      });
    });
    
    return historicalData.sort((a, b) => a.x - b.x);
  }
  generateTargetSeries(startDate: Date, endDate: Date): { x: number; y: number }[] {
    const series: { x: number; y: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const remainingTopics = this.allTopics.length - this.completedTopics.length;
    const daysRemaining = this.getDaysBetween(today, endDate);
    
    if (daysRemaining <= 0) return series;
    
    const requiredDailyRate = remainingTopics / daysRemaining;
    
    series.push({
      x: today.getTime(),
      y: this.calculateCurrentRate() // Текущий темп в темах/день
    });
    
    series.push({
      x: endDate.getTime(),
      y: requiredDailyRate // Необходимый темп в темах/день
    });
    
    return series;
  }

  generateRequiredSeries(startDate: Date, endDate: Date): { x: number; y: number }[] {
    const series: { x: number; y: number }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const remainingTopics = this.allTopics.length - this.completedTopics.length;
    const daysRemaining = this.getDaysBetween(today, endDate);
    
    if (daysRemaining <= 0) return series;
    
    const requiredDailyRate = remainingTopics / daysRemaining;
    
    // Начальная точка - сегодня (необходимый темп)
    series.push({
      x: today.getTime(),
      y: requiredDailyRate
    });
    
    // Конечная точка - дата окончания (тот же темп)
    series.push({
      x: endDate.getTime(),
      y: requiredDailyRate
    });
    
    return series;
  }
  calculateRealisticEndDate(): Date {
    const currentRate = this.calculateCurrentRate();
    const remainingTopics = this.allTopics.length - this.completedTopics.length;
    
    if (currentRate <= 0) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      return futureDate;
    }
    
    const daysNeeded = remainingTopics / currentRate;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysNeeded);
    
    return endDate;
  }

  calculateRequiredRate(): number {
    const today = this.getCurrentDate();
    today.setHours(0, 0, 0, 0);
    
    const daysRemaining = this.getDaysBetween(today, this.targetDate);
    const remainingTopics = this.allTopics.length - this.completedTopics.length;
    
    if (daysRemaining <= 0) return 0;
    
    return remainingTopics / daysRemaining;
  }
  private initCharts(): void {
    // 1. Completion Chart (Radial Bar)
    this.completionChart.set({
      ...this.defaultChartOptions,
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
      }
    });
  
    // 2. Difficulty Chart (Horizontal Bar)
    this.difficultyChart.set({
      ...this.defaultChartOptions,
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
      }
    });
  
    // 3. Time Chart (Area)
    this.timeChart.set({
      ...this.defaultChartOptions,
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
      }
    });
  
    // 4. Forecast Chart (Line)
    this.forecastChart.set({
      ...this.defaultChartOptions,
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
      ...this.defaultChartOptions,
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
      }
    });
  
    // 6. Efficiency Chart (Stacked Bar)
    this.efficiencyChart.set({
      ...this.defaultChartOptions,
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
      }
    });

    // 7. Planning Chart
    this.planningChart.set({
      ...this.defaultChartOptions,
      chart: {
        type: 'line',
        height: 400,
        events: {
          mounted: (chartContext: any) => {
            this.chartInstances['planning'] = chartContext;
          }
        },
        toolbar: { show: true },
        zoom: { enabled: false }
      },
      series: [
        { name: 'Целевой темп', data: [] },
        { name: 'Фактический темп', data: [] },
        { name: 'Необходимый темп', data: [] }
      ],
      colors: ['#00E396', '#008FFB', '#FF4560'],
      stroke: {
        width: [3, 3, 4],
        curve: 'straight',
        dashArray: [0, 0, 5]
      },
      markers: {
        size: [4, 4, 0]
      },
      xaxis: {
        type: 'datetime',
        title: {
          text: 'Дата',
          style: { fontSize: '14px', fontWeight: 'bold' }
        },
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'short',
              year: date.getMonth() === 0 ? 'numeric' : undefined // год только для января
            });
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
          text: 'Темы/день',
          style: { fontSize: '14px', fontWeight: 'bold' }
        },
        min: 0,
        labels: {
          style: {
            fontSize: '12px'
          },
          formatter: (value: number) => {
            // Форматируем числа без лишних нулей
            if (value === 0) return '0';
            if (value < 0.01) return value.toExponential(2);
            return value.toFixed(2).replace(/\.?0+$/, ''); // Убираем trailing zeros
          }
        }
      },
      tooltip: {
        x: {
          formatter: (val: number) => new Date(val).toLocaleDateString('ru-RU')
        },
        y: {
          formatter: (val: number) => `${val.toFixed(2)} тем/день`
        }
      },
      annotations: {
        yaxis: [
          {
            y: this.calculateCurrentRate(),
            borderColor: '#00E396',
            label: {
              borderColor: '#00E396',
              style: {
                color: '#fff',
                background: '#00E396'
              },
              text: 'Текущий темп'
            }
          }
        ]
      },
      legend: {
        position: 'top'
      }
    });
  }

  private updateCharts(): void {
    this.updateCompletionChart();
    this.updateDifficultyChart();
    this.updateTimeChart();
    this.updateForecastChart();
    this.updateDailyProgressChart();
    this.updateEfficiencyChart();
    this.updatePlanningChart();
  }

  private updateCompletionChart(): void {
    const completedCount = this.completedTopics.length;
    const totalCount = this.allTopics.length;
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    
    this.completionChart.update(chart => {
      const updatedChart = {
        ...chart,
        series: [progress],
        labels: [`Выполнено: ${completedCount}/${totalCount}`]
      };
      
      // Безопасное обновление plotOptions
      if (chart.plotOptions && (chart.plotOptions as any).radialBar) {
        updatedChart.plotOptions = {
          ...chart.plotOptions,
          radialBar: {
            ...(chart.plotOptions as any).radialBar,
            dataLabels: {
              ...(chart.plotOptions as any).radialBar.dataLabels,
              total: {
                ...((chart.plotOptions as any).radialBar.dataLabels?.total || {}),
                formatter: () => `${progress.toFixed(1)}%`
              }
            }
          }
        };
      }
      
      return updatedChart;
    });
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

  private updatePlanningChart(): void {
    if (!this.allTopics.length) return;
  
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = this.targetDate;
    const daysRemaining = this.getDaysBetween(today, endDate);
    
    if (daysRemaining <= 0) return;
    
    const remainingTopics = this.allTopics.length - this.completedTopics.length;
    const requiredRate = this.calculateRequiredRate();
    
    // Исторические данные (фактический темп)
    const historicalData = this.calculateHistoricalProgressRate();
    
    // Целевой темп от текущей даты
    const targetSeries = this.generateTargetSeries(today, endDate);
  
    // Необходимый темп (постоянный)
    const requiredSeries = this.generateRequiredSeries(today, endDate);
    
    this.planningChart.update(chart => ({
      ...chart,
      series: [
        { name: 'Целевой темп', data: targetSeries },
        { name: 'Фактический темп', data: historicalData },
        { name: 'Необходимый темп', data: requiredSeries }
      ],
      annotations: {
        ...chart.annotations,
        yaxis: [
          {
            y: this.calculateCurrentRate(),
            borderColor: '#00E396',
            label: {
              borderColor: '#00E396',
              style: {
                color: '#fff',
                background: '#00E396'
              },
              text: 'Текущий темп'
            }
          },
          {
            y: requiredRate,
            borderColor: '#FF4560',
            label: {
              borderColor: '#FF4560',
              style: {
                color: '#fff',
                background: '#FF4560'
              },
              text: `Необходимо: ${requiredRate.toFixed(2)} тем/день`
            }
          }
        ]
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

  private calculatePlanningData(): void {
    if (!this.allTopics.length || !this.forecast) return;
    
    const startDate = this.getEarliestTopicDate();
    const endDate = this.targetDate;
    const totalDays = this.getDaysBetween(startDate, endDate);
    
    if (totalDays <= 0) return;
    
    this.updatePlanningChart();
  }
}