export interface Constellation {
    id: string;
    name: string;
    latinName: string;
    images: string[]; // Все изображения созвездия
    description: string;
    difficulty: number;
    hemisphere: 'north' | 'south' | 'both';
    zodiac: boolean;
  }
  
  export interface ConstellationTest {
    id: string;
    name: string;
    constellations: Constellation[];
    testType: 'constellation';
    mode: 'name' | 'image'; // Режим: угадать название или выбрать картинку
    hemisphere?: 'north' | 'south' | 'all'; // Фильтр по полушарию
    zodiacOnly?: boolean; // Только зодиакальные
  }
  
  export interface GameMode {
    id: string;
    name: string;
    description: string;
    type: 'name' | 'image';
    hemisphere?: 'north' | 'south' | 'all';
    zodiacOnly?: boolean;
  }