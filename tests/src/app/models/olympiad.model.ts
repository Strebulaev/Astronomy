// models/olympiad.model.ts
export interface Olympiad {
    id: string;
    name: string;
    year: number;
    stage: string; // 'school' | 'municipal' | 'regional' | 'final'
    pdfUrl: string;
    maxScore: number;
    uploadDate: Date;
  }