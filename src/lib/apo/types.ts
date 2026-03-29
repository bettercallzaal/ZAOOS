export interface TestCase {
  input: string;
  criteria: string[];
  idealOutput?: string;
}

export interface PromptConfig {
  name: string;
  description: string;
  currentPrompt: string;
  testCases: TestCase[];
  gradingPrompt: string;
  maxRounds: number;
}

export interface TestScore {
  input: string;
  output: string;
  score: number;
  feedback: string;
}

export interface RoundResult {
  round: number;
  prompt: string;
  avgScore: number;
  testScores: TestScore[];
  critique?: string;
  kept: boolean;
}

export interface APOResult {
  promptName: string;
  rounds: RoundResult[];
  bestPrompt: string;
  bestScore: number;
  baselineScore: number;
  improvement: number;
}
