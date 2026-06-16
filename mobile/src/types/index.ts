export interface User {
  _id: string;
  name: string;
  email: string;
  subscriptionTier: 'free' | 'pro';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface Topic {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  language: string;
  sourceLanguage?: string;
  color: string;
  emoji: string;
  cardCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  _id: string;
  topicId: string;
  userId: string;
  question: string;
  answer: string;
  language: string;
  // SM-2 fields
  repetitions: number;
  easeFactor: number;
  interval: number;
  isMature: boolean;
  qualityHistory: number[];
  // Stats
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewSession {
  _id: string;
  userId: string;
  topicId: string;
  startedAt: string;
  completedAt?: string;
  totalCards: number;
  correctCount: number;
  wrongCount: number;
  score: number;
}

export interface SM2Result {
  newInterval: number;
  newEaseFactor: number;
  nextReviewAt: string;
  nextReviewLabel: string;
  repetitions: number;
}

export interface SubmitReviewResponse {
  session: ReviewSession;
  sm2Result: SM2Result;
}

// SM-2 quality rating 0-5
// 0 = complete blackout
// 1 = wrong; correct remembered on seeing
// 2 = wrong; easy to recall once seen
// 3 = correct; required serious effort (Hard)
// 4 = correct; after hesitation (Good)
// 5 = perfect recall (Easy)
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

export interface QualityOption {
  quality: ReviewQuality;
  label: string;
  sublabel: string;
  color: string;
  icon: string;
  isCorrect: boolean; // quality >= 3
}

export interface DailyActivity {
  date: string;
  sessions: number;
  cardsReviewed: number;
  accuracy: number;
  avgQuality: number;
}

export interface WeakCard {
  _id: string;
  topicId?: string;
  question: string;
  answer?: string;
  accuracy: number;
  timesReviewed: number;
  easeFactor: number;
  interval: number;
  avgQuality: number;
}

export interface StrongCard {
  _id: string;
  question: string;
  easeFactor: number;
  interval: number;
  accuracy: number;
}

export interface QualityDistribution {
  quality: number;
  count: number;
  label: string;
}

export interface CardStates {
  new: number;
  young: number;
  mature: number;
  total: number;
}

export interface ForecastDay {
  date: string;
  dueCount: number;
}

export interface DraftCard {
  question: string;
  answer: string;
}

export interface AiUsage {
  tier: 'free' | 'pro';
  used: number;
  limit: number;
  remaining: number;
  month: string;
  configured?: boolean;
}

export interface GenerateCardsResponse {
  cards: DraftCard[];
  usage: AiUsage;
}

export type ImprovementType =
  | 'shorten_answer'
  | 'split_card'
  | 'mnemonic'
  | 'clarify_question';

export interface CardImprovementSuggestion {
  id: string;
  type: ImprovementType;
  title: string;
  explanation: string;
  suggestedQuestion?: string;
  suggestedAnswer?: string;
  additionalCards?: DraftCard[];
  mnemonic?: string;
}

export interface CardImprovementResult {
  suggestions: CardImprovementSuggestion[];
  isWeakCard: boolean;
}

export interface StudyCoachResult {
  explanation: string;
  memoryHook: string;
  compareCard?: {
    question: string;
    answer: string;
    reason: string;
  };
}

export interface AnalyticsInsightsResult {
  summary: string;
  recommendation: string;
  focusArea?: string;
}

export interface MultilingualAssistResult {
  translated?: string;
  examples?: string[];
  romaji?: string;
  nativeScript?: string;
  reverseCard?: { question: string; answer: string };
}

export interface Analytics {
  totalSessions: number;
  totalCardsReviewed: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number;
  averageScore: number;
  retentionRate: number;
  avgQuality: number;
  streakDays: number;
  dueToday: number;
  cardStates: CardStates;
  qualityDistribution: QualityDistribution[];
  dailyActivity: DailyActivity[];
  forecast: ForecastDay[];
  recentSessions: ReviewSession[];
  weakCards: WeakCard[];
  strongCards: StrongCard[];
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  TopicsTab: import('@react-navigation/native').NavigatorScreenParams<TopicsStackParamList> | undefined;
  QuizTab: import('@react-navigation/native').NavigatorScreenParams<QuizStackParamList> | undefined;
  AnalyticsTab: undefined;
  ProfileTab: undefined;
};

export type TopicsStackParamList = {
  TopicList: undefined;
  TopicDetail: { topicId: string; topicTitle: string };
  AddTopic: undefined;
  EditTopic: { topicId: string };
  AddCard: { topicId: string; topicTitle: string };
  EditCard: { cardId: string; topicId: string };
};

export type QuizStackParamList = {
  QuizSelect: undefined;
  QuizSession: { topicId: string; topicTitle: string };
  QuizResult: {
    sessionId: string; topicId: string;
    score: number; correct: number; wrong: number; total: number;
    avgQuality: number;
  };
};
