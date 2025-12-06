export interface Scene {
  id: string;
  name: string;
  description: string;
  promptModifier: string;
  icon: string;
  color: string;
}

export interface AnalysisResult {
  era: string;
  description: string;
  confidence: number;
}

export enum AppState {
  HOME,
  CAMERA,
  PREVIEW,
  PROCESSING,
  RESULT,
  ANALYSIS_RESULT,
  DOC_RESULT
}