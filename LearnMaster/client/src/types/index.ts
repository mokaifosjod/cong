export interface SubjectProgress {
  novice: number;
  adept: number;
  expert: number;
  master: number;
}

export interface UserPreferences {
  starredSubjects: string[];
  progress: Record<string, SubjectProgress>;
  lastAccessed: string;
}

export interface PuzzleState {
  currentPuzzleIndex: number;
  selectedAnswer: string;
  chancesRemaining: number;
  hintsUsed: number;
  showSolution: boolean;
  showHint: boolean;
}
