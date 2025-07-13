export interface Olympiad {
  id: string;
  name: string;
  year: number;
  stage: string;
  pdfUrl: string;
  solutionUrl?: string;
  maxScore: number;
  createdAt: Date;
}