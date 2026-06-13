export interface User {
  _id: string;
  name: string;
  email: string;
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
  timesReviewed: number;
  timesCorrect: number;
  timesWrong: number;
  lastReviewedAt?: string;
  easeFactor: number;
  interval: number;
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

export interface DailyActivity {
  date: string;
  sessions: number;
  cardsReviewed: number;
  accuracy: number;
}

export interface WeakCard {
  _id: string;
  question: string;
  accuracy: number;
  timesReviewed: number;
}

export interface Analytics {
  totalSessions: number;
  totalCardsReviewed: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number;
  averageScore: number;
  streakDays: number;
  dueToday: number;
  dailyActivity: DailyActivity[];
  recentSessions: ReviewSession[];
  weakCards: WeakCard[];
}

export type ReviewResult = 'correct' | 'wrong';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Topics: undefined;
  Quiz: undefined;
  Analytics: undefined;
  Profile: undefined;
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
  QuizResult: { sessionId: string; topicId: string; score: number; correct: number; wrong: number; total: number };
};
