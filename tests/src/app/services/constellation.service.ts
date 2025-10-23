import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin, of, catchError } from 'rxjs';
import { Constellation, ConstellationTest, GameMode } from '../models/constellation.model';

@Injectable({
  providedIn: 'root'
})
export class ConstellationService {
  private readonly CONSTELLATIONS_PATH = '/assets/constellations/';
  
  // Все 88 созвездий с информацией о полушарии и зодиаке
  private readonly CONSTELLATION_DATA: { name: string; hemisphere: 'north' | 'south' | 'both'; zodiac: boolean }[] = [
    { name: 'Андромеда', hemisphere: 'north', zodiac: false },
    { name: 'Близнецы', hemisphere: 'north', zodiac: true },
    { name: 'Большая Медведица', hemisphere: 'north', zodiac: false },
    { name: 'Большой Пес', hemisphere: 'south', zodiac: false },
    { name: 'Весы', hemisphere: 'south', zodiac: true },
    { name: 'Водолей', hemisphere: 'south', zodiac: true },
    { name: 'Возничий', hemisphere: 'north', zodiac: false },
    { name: 'Волк', hemisphere: 'south', zodiac: false },
    { name: 'Волопас', hemisphere: 'north', zodiac: false },
    { name: 'Волосы Вероники', hemisphere: 'north', zodiac: false },
    { name: 'Ворон', hemisphere: 'south', zodiac: false },
    { name: 'Геркулес', hemisphere: 'north', zodiac: false },
    { name: 'Гидра', hemisphere: 'south', zodiac: false },
    { name: 'Голубь', hemisphere: 'south', zodiac: false },
    { name: 'Гончие Псы', hemisphere: 'north', zodiac: false },
    { name: 'Дева', hemisphere: 'south', zodiac: true },
    { name: 'Дельфин', hemisphere: 'north', zodiac: false },
    { name: 'Дракон', hemisphere: 'north', zodiac: false },
    { name: 'Единорог', hemisphere: 'both', zodiac: false },
    { name: 'Жертвенник', hemisphere: 'south', zodiac: false },
    { name: 'Живописец', hemisphere: 'south', zodiac: false },
    { name: 'Жираф', hemisphere: 'north', zodiac: false },
    { name: 'Журавль', hemisphere: 'south', zodiac: false },
    { name: 'Заяц', hemisphere: 'south', zodiac: false },
    { name: 'Змееносец', hemisphere: 'both', zodiac: false },
    { name: 'Змея', hemisphere: 'both', zodiac: false },
    { name: 'Золотая Рыба', hemisphere: 'south', zodiac: false },
    { name: 'Индеец', hemisphere: 'south', zodiac: false },
    { name: 'Кассиопея', hemisphere: 'north', zodiac: false },
    { name: 'Киль', hemisphere: 'south', zodiac: false },
    { name: 'Кит', hemisphere: 'both', zodiac: false },
    { name: 'Козерог', hemisphere: 'south', zodiac: true },
    { name: 'Компас', hemisphere: 'south', zodiac: false },
    { name: 'Корма', hemisphere: 'south', zodiac: false },
    { name: 'Лебедь', hemisphere: 'north', zodiac: false },
    { name: 'Лев', hemisphere: 'north', zodiac: true },
    { name: 'Летучая Рыба', hemisphere: 'south', zodiac: false },
    { name: 'Лира', hemisphere: 'north', zodiac: false },
    { name: 'Лисичка', hemisphere: 'north', zodiac: false },
    { name: 'Малая Медведица', hemisphere: 'north', zodiac: false },
    { name: 'Малый Конь', hemisphere: 'north', zodiac: false },
    { name: 'Малый Лев', hemisphere: 'north', zodiac: false },
    { name: 'Малый Пес', hemisphere: 'both', zodiac: false },
    { name: 'Микроскоп', hemisphere: 'south', zodiac: false },
    { name: 'Муха', hemisphere: 'south', zodiac: false },
    { name: 'Насос', hemisphere: 'south', zodiac: false },
    { name: 'Наугольник', hemisphere: 'south', zodiac: false },
    { name: 'Овен', hemisphere: 'north', zodiac: true },
    { name: 'Октант', hemisphere: 'south', zodiac: false },
    { name: 'Орел', hemisphere: 'both', zodiac: false },
    { name: 'Орион', hemisphere: 'both', zodiac: false },
    { name: 'Павлин', hemisphere: 'south', zodiac: false },
    { name: 'Паруса', hemisphere: 'south', zodiac: false },
    { name: 'Пегас', hemisphere: 'north', zodiac: false },
    { name: 'Персей', hemisphere: 'north', zodiac: false },
    { name: 'Печь', hemisphere: 'south', zodiac: false },
    { name: 'Райская Птица', hemisphere: 'south', zodiac: false },
    { name: 'Рак', hemisphere: 'north', zodiac: true },
    { name: 'Резец', hemisphere: 'south', zodiac: false },
    { name: 'Рыбы', hemisphere: 'both', zodiac: true },
    { name: 'Рысь', hemisphere: 'north', zodiac: false },
    { name: 'Северная Корона', hemisphere: 'north', zodiac: false },
    { name: 'Секстант', hemisphere: 'both', zodiac: false },
    { name: 'Сетка', hemisphere: 'south', zodiac: false },
    { name: 'Скорпион', hemisphere: 'south', zodiac: true },
    { name: 'Скульптор', hemisphere: 'south', zodiac: false },
    { name: 'Столовая Гора', hemisphere: 'south', zodiac: false },
    { name: 'Стрела', hemisphere: 'north', zodiac: false },
    { name: 'Стрелец', hemisphere: 'south', zodiac: true },
    { name: 'Телескоп', hemisphere: 'south', zodiac: false },
    { name: 'Телец', hemisphere: 'north', zodiac: true },
    { name: 'Треугольник', hemisphere: 'north', zodiac: false },
    { name: 'Тукан', hemisphere: 'south', zodiac: false },
    { name: 'Феникс', hemisphere: 'south', zodiac: false },
    { name: 'Хамелеон', hemisphere: 'south', zodiac: false },
    { name: 'Центавр', hemisphere: 'south', zodiac: false },
    { name: 'Цефей', hemisphere: 'north', zodiac: false },
    { name: 'Циркуль', hemisphere: 'south', zodiac: false },
    { name: 'Часы', hemisphere: 'south', zodiac: false },
    { name: 'Чаша', hemisphere: 'south', zodiac: false },
    { name: 'Щит', hemisphere: 'south', zodiac: false },
    { name: 'Эридан', hemisphere: 'south', zodiac: false },
    { name: 'Южная Гидра', hemisphere: 'south', zodiac: false },
    { name: 'Южная Корона', hemisphere: 'south', zodiac: false },
    { name: 'Южная Рыба', hemisphere: 'south', zodiac: false },
    { name: 'Южный Крест', hemisphere: 'south', zodiac: false },
    { name: 'Южный Треугольник', hemisphere: 'south', zodiac: false },
    { name: 'Ящерица', hemisphere: 'north', zodiac: false }
  ];

  // Режимы игры
  readonly GAME_MODES: GameMode[] = [
    { id: 'name-all', name: 'Все созвездия', description: 'Угадай название по картинке', type: 'name', hemisphere: 'all' },
    { id: 'image-all', name: 'Все созвездия', description: 'Выбери картинку по названию', type: 'image', hemisphere: 'all' },
    { id: 'name-north', name: 'Северное полушарие', description: 'Угадай северные созвездия', type: 'name', hemisphere: 'north' },
    { id: 'image-north', name: 'Северное полушарие', description: 'Выбери северные созвездия', type: 'image', hemisphere: 'north' },
    { id: 'name-south', name: 'Южное полушарие', description: 'Угадай южные созвездия', type: 'name', hemisphere: 'south' },
    { id: 'image-south', name: 'Южное полушарие', description: 'Выбери южные созвездия', type: 'image', hemisphere: 'south' },
    { id: 'name-zodiac', name: 'Зодиакальные', description: 'Угадай зодиакальные созвездия', type: 'name', zodiacOnly: true },
    { id: 'image-zodiac', name: 'Зодиакальные', description: 'Выбери зодиакальные созвездия', type: 'image', zodiacOnly: true }
  ];

  constructor(private http: HttpClient) {}

  getGameModes(): GameMode[] {
    return this.GAME_MODES;
  }

  // Загрузка всех созвездий с их изображениями и описаниями
  loadAllConstellations(): Observable<Constellation[]> {
    const requests = this.CONSTELLATION_DATA.map(constData => 
      this.loadConstellation(constData.name, constData.hemisphere, constData.zodiac)
    );

    return forkJoin(requests).pipe(
      map(constellations => constellations.filter(c => c !== null && c.images.length > 0) as Constellation[])
    );
  }

  private loadConstellation(name: string, hemisphere: 'north' | 'south' | 'both', zodiac: boolean): Observable<Constellation | null> {
    const constellationPath = `${this.CONSTELLATIONS_PATH}${name}/`;
    
    return forkJoin({
      images: this.getConstellationImages(constellationPath),
      description: this.getDescription(constellationPath, name)
    }).pipe(
      map(({ images, description }) => {
        if (images.length === 0) {
          console.warn(`No images found for constellation: ${name}`);
          return null;
        }

        return {
          id: this.generateId(name),
          name: name,
          latinName: this.getLatinName(name),
          images: images,
          description: description,
          difficulty: Math.floor(Math.random() * 50) + 30,
          hemisphere: hemisphere,
          zodiac: zodiac
        };
      }),
      catchError((error) => {
        console.warn(`Error loading constellation ${name}:`, error);
        return of(null);
      })
    );
  }

  // Получение ВСЕХ изображений из папки созвездия
  private getConstellationImages(constellationPath: string): Observable<string[]> {
    // Предполагаем, что изображения имеют расширения .png, .jpg, .jpeg
    const possibleImages = ['1.png', '1.jpg', '1.jpeg', '2.png', '2.jpg', '2.jpeg', '3.png', '3.jpg', '3.jpeg'];
    
    const imageChecks = possibleImages.map(imageName => 
      this.checkImageExists(`${constellationPath}${imageName}`).pipe(
        map(exists => exists ? `${constellationPath}${imageName}` : null)
      )
    );

    return forkJoin(imageChecks).pipe(
      map(imageUrls => imageUrls.filter(url => url !== null) as string[]),
      catchError(() => of([]))
    );
  }

  private checkImageExists(url: string): Observable<boolean> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      map(response => response.status === 200),
      catchError(() => of(false))
    );
  }

  // Получение описания из текстового файла
  private getDescription(constellationPath: string, name: string): Observable<string> {
    const descriptionUrl = `${constellationPath}${name}.txt`;
    
    return this.http.get(descriptionUrl, { responseType: 'text' }).pipe(
      map(text => text.trim()),
      catchError(() => of(this.getDefaultDescription(name)))
    );
  }

  private getDefaultDescription(name: string): string {
    const descriptions: { [key: string]: string } = {
      'Андромеда': 'Созвездие северного полушария, названное в честь мифической принцессы Андромеды. Содержит знаменитую галактику Андромеды.',
      'Орион': 'Яркое экваториальное созвездие, названное в честь охотника Ориона из греческой мифологии. Содержит много ярких звезд и туманность Ориона.',
      'Большая Медведица': 'Одно из самых известных созвездий северного полушария, содержит астеризм Большой Ковш. Видно круглый год в северных широтах.',
      'Кассиопея': 'Созвездие северного полушария, напоминающее букву W или M. Названо в честь тщеславной царицы Кассиопеи.',
      'Лебедь': 'Созвездие северного полушария, также известное как Северный Крест. Содержит яркую звезду Денеб.',
      'Лира': 'Небольшое созвездие северного полушария, содержит яркую звезду Вегу - одну из самых ярких звезд ночного неба.',
      'Скорпион': 'Яркое зодиакальное созвездие, напоминающее скорпиона. Содержит красный сверхгигант Антарес.',
      'Телец': 'Зодиакальное созвездие, содержащее звездное скопление Плеяды и гигантскую звезду Альдебаран.',
      'Дева': 'Самое большое зодиакальное созвездие, содержит яркую звезду Спику.',
      'Лев': 'Яркое зодиакальное созвездие, напоминающее льва. Содержит звезду Регул.',
      'Близнецы': 'Зодиакальное созвездие, представляющее близнецов Кастора и Поллукса.',
      'Водолей': 'Зодиакальное созвездие, изображающее человека, льющего воду из кувшина.',
      'Рыбы': 'Зодиакальное созвездие, представляющее двух рыб, связанных лентой.',
      'Овен': 'Зодиакальное созвездие, представляющее барана с золотым руном.',
      'Рак': 'Зодиакальное созвездие, самое неяркое среди зодиакальных.',
      'Весы': 'Единственное зодиакальное созвездие, представляющее неодушевленный предмет.',
      'Стрелец': 'Зодиакальное созвездие, направленное в сторону центра Галактики.',
      'Козерог': 'Зодиакальное созвездие, представляющее морского козла.'
    };
    return descriptions[name] || `Созвездие ${name}. Одно из 88 современных созвездий, видимых с Земли.`;
  }

  private getLatinName(russianName: string): string {
    const latinNames: { [key: string]: string } = {
      'Андромеда': 'Andromeda', 'Близнецы': 'Gemini', 'Большая Медведица': 'Ursa Major',
      'Большой Пес': 'Canis Major', 'Весы': 'Libra', 'Водолей': 'Aquarius',
      'Возничий': 'Auriga', 'Волк': 'Lupus', 'Волопас': 'Boötes',
      'Волосы Вероники': 'Coma Berenices', 'Ворон': 'Corvus', 'Геркулес': 'Hercules',
      'Гидра': 'Hydra', 'Голубь': 'Columba', 'Гончие Псы': 'Canes Venatici',
      'Дева': 'Virgo', 'Дельфин': 'Delphinus', 'Дракон': 'Draco',
      'Единорог': 'Monoceros', 'Жертвенник': 'Ara', 'Кассиопея': 'Cassiopeia',
      'Кит': 'Cetus', 'Козерог': 'Capricornus', 'Лебедь': 'Cygnus',
      'Лев': 'Leo', 'Лира': 'Lyra', 'Малая Медведица': 'Ursa Minor',
      'Овен': 'Aries', 'Орион': 'Orion', 'Пегас': 'Pegasus',
      'Персей': 'Perseus', 'Рак': 'Cancer', 'Рыбы': 'Pisces',
      'Скорпион': 'Scorpius', 'Стрелец': 'Sagittarius', 'Телец': 'Taurus',
      'Центавр': 'Centaurus', 'Цефей': 'Cepheus', 'Южный Крест': 'Crux'
    };
    return latinNames[russianName] || russianName;
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  // Создание теста по выбранному режиму
  createConstellationTest(mode: GameMode, constellationCount: number = 88): Observable<ConstellationTest> {
    return this.loadAllConstellations().pipe(
      map(constellations => {
        // Фильтруем созвездия по выбранному режиму
        let filteredConstellations = constellations;
        
        if (mode.hemisphere && mode.hemisphere !== 'all') {
            if (mode.hemisphere === 'north') {
              // Только северные созвездия (не включая 'both')
              filteredConstellations = filteredConstellations.filter(c => 
                c.hemisphere === 'north'
              );
            } else if (mode.hemisphere === 'south') {
              // Только южные созвездия (не включая 'both')
              filteredConstellations = filteredConstellations.filter(c => 
                c.hemisphere === 'south'
              );
            }
          }
        
        if (mode.zodiacOnly) {
          filteredConstellations = filteredConstellations.filter(c => c.zodiac);
        }

        // Проверяем, что есть достаточно созвездий
        if (filteredConstellations.length === 0) {
            throw new Error(`Нет созвездий для выбранного режима`);
          }

        // Перемешиваем и берем нужное количество
        const shuffled = [...filteredConstellations].sort(() => Math.random() - 0.5);
        const selected = shuffled;

        return {
          id: `constellation-test-${mode.id}-${Date.now()}`,
          name: `${mode.name} - ${mode.description}`,
          constellations: selected,
          testType: 'constellation',
          mode: mode.type,
          hemisphere: mode.hemisphere,
          zodiacOnly: mode.zodiacOnly
        };
      })
    );
  }
}