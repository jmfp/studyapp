import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import type { Topic, Card, ReviewSession, Analytics, SubmitReviewResponse, ReviewQuality, GenerateCardsResponse, AiUsage, DraftCard, CardImprovementResult, StudyCoachResult, AnalyticsInsightsResult, MultilingualAssistResult } from '../types';
import { BYPASS_AUTH, DEV_USER } from '../config/dev';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

function cardTags(topicId: string) {
  return [
    { type: 'Card' as const, id: topicId },
    { type: 'Card' as const, id: `due-${topicId}` },
  ];
}

const realBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

function getMockData(url: string, method: string, body?: Record<string, unknown>) {
  if (method === 'GET' && url === '/ai/usage') {
    return {
      tier: 'pro',
      used: 0,
      limit: 9999,
      remaining: 9999,
      month: '2026-06',
      configured: true,
    } satisfies AiUsage;
  }

  const generateMatch = url.match(/^\/topics\/([^/]+)\/cards\/generate$/);
  if (method === 'POST' && generateMatch) {
    return {
      cards: [
        { question: 'What is spaced repetition?', answer: 'Reviewing material at increasing intervals to strengthen memory.' },
        { question: 'What does SM-2 optimize?', answer: 'When each card should be reviewed next based on recall quality.' },
        { question: 'What is an atomic flashcard?', answer: 'A card that tests exactly one fact.' },
      ],
      usage: { tier: 'pro', used: 1, limit: 9999, remaining: 9998, month: '2026-06' },
    } satisfies GenerateCardsResponse;
  }

  const bulkMatch = url.match(/^\/topics\/([^/]+)\/cards\/bulk$/);
  if (method === 'POST' && bulkMatch) {
    const topicId = bulkMatch[1];
    const cards = (body?.cards as DraftCard[]) || [];
    return {
      count: cards.length,
      cards: cards.map((c, i) => ({
        _id: `card-ai-${Date.now()}-${i}`,
        topicId,
        userId: DEV_USER._id,
        question: c.question,
        answer: c.answer,
        language: 'en',
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        isMature: false,
        qualityHistory: [],
        timesReviewed: 0,
        timesCorrect: 0,
        timesWrong: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    };
  }

  const improveMatch = url.match(/^\/topics\/([^/]+)\/cards\/([^/]+)\/improve$/);
  if (method === 'POST' && improveMatch) {
    return {
      isWeakCard: true,
      suggestions: [
        {
          id: 'shorten-1',
          type: 'shorten_answer',
          title: 'Shorten the answer',
          explanation: 'The answer covers multiple ideas. One short phrase is easier to recall under pressure.',
          suggestedQuestion: 'What does === check?',
          suggestedAnswer: 'Value and type equality',
        },
        {
          id: 'mnemonic-1',
          type: 'mnemonic',
          title: 'Add a memory hook',
          explanation: 'A quick mnemonic can boost recall for this weak card.',
          suggestedAnswer: 'Strict equality (value and type)',
          mnemonic: 'Same === same type',
        },
      ],
    } satisfies CardImprovementResult;
  }

  const coachMatch = url.match(/^\/topics\/([^/]+)\/cards\/([^/]+)\/coach$/);
  if (method === 'POST' && coachMatch) {
    return {
      explanation: 'This card tests a detail you may not have linked to a broader pattern yet. Missing it often means the prompt and answer feel disconnected.',
      memoryHook: 'Picture the answer as a label on the question — one vivid image ties them together.',
      compareCard: {
        question: 'What is spaced repetition?',
        answer: 'Reviewing at increasing intervals',
        reason: 'Both reward linking a short prompt to a crisp definition.',
      },
    } satisfies StudyCoachResult;
  }

  const multilingualMatch = url.match(/^\/topics\/([^/]+)\/cards\/multilingual$/);
  if (method === 'POST' && multilingualMatch) {
    const action = body?.action as string;
    if (action === 'translate') {
      return { translated: '[mock translation]' } satisfies MultilingualAssistResult;
    }
    if (action === 'examples') {
      return { examples: ['Example sentence one.', 'Example sentence two.'] } satisfies MultilingualAssistResult;
    }
    if (action === 'reverse') {
      return { reverseCard: { question: 'Reversed question?', answer: 'Reversed answer.' } } satisfies MultilingualAssistResult;
    }
    if (action === 'romaji' || action === 'nativeScript') {
      return { nativeScript: 'みどり', romaji: 'みどり' } satisfies MultilingualAssistResult;
    }
  }

  if (method === 'GET' && (url === '/ai/insights' || url.startsWith('/ai/insights?'))) {
    return {
      summary: 'You struggled with a few weak cards this week — mostly low recall quality on cards you have seen before.',
      recommendation: '3 cards are due tomorrow. A focused 5-minute session now would smooth out those gaps.',
      focusArea: 'vocabulary',
    } satisfies AnalyticsInsightsResult;
  }

  if (method === 'GET' && url === '/topics') return demoTopics;
  if (method === 'GET' && url === '/analytics') return demoAnalytics;
  if (method === 'GET' && url.startsWith('/analytics?')) return demoAnalytics;
  if (method === 'GET' && url === '/auth/me') return DEV_USER;

  const topicMatch = url.match(/^\/topics\/([^/]+)$/);
  if (method === 'GET' && topicMatch) {
    return demoTopics.find((t) => t._id === topicMatch[1]) ?? demoTopics[0];
  }

  const cardsMatch = url.match(/^\/topics\/([^/]+)\/cards$/);
  if (method === 'GET' && cardsMatch) {
    return demoCards.filter((c) => c.topicId === cardsMatch[1]);
  }

  const dueMatch = url.match(/^\/topics\/([^/]+)\/cards\/due$/);
  if (method === 'GET' && dueMatch) {
    return demoCards.filter((c) => c.topicId === dueMatch[1] && c.nextReviewAt);
  }

  const sessionsMatch = url.match(/^\/topics\/([^/]+)\/sessions$/);
  if (method === 'GET' && sessionsMatch) return demoAnalytics.recentSessions;

  if (method === 'POST' && url.match(/^\/topics\/[^/]+\/sessions$/)) {
    return {
      _id: 'mock-session',
      userId: DEV_USER._id,
      topicId: url.split('/')[2],
      startedAt: new Date().toISOString(),
      totalCards: 0,
      correctCount: 0,
      wrongCount: 0,
      score: 0,
    } satisfies ReviewSession;
  }

  if (method === 'POST' && url.match(/^\/sessions\/[^/]+\/reviews$/)) {
    return {
      session: demoAnalytics.recentSessions[0],
      sm2Result: {
        newInterval: 1,
        newEaseFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
        nextReviewLabel: 'Tomorrow',
        repetitions: 1,
      },
    } satisfies SubmitReviewResponse;
  }

  if (method === 'POST' && url.match(/^\/sessions\/[^/]+\/complete$/)) {
    return demoAnalytics.recentSessions[0];
  }

  if (method === 'POST' && url === '/topics') {
    return {
      ...demoTopics[0],
      _id: `topic-${Date.now()}`,
      title: (body?.title as string) || 'New Topic',
      emoji: (body?.emoji as string) || 'book',
      color: (body?.color as string) || '#6C63FF',
      language: (body?.language as string) || 'en',
      sourceLanguage: (body?.sourceLanguage as string) || 'en',
    } satisfies Topic;
  }

  if (method === 'POST' && url.match(/^\/topics\/[^/]+\/cards$/)) {
    const topicId = url.split('/')[2];
    return {
      _id: `card-${Date.now()}`,
      topicId,
      userId: DEV_USER._id,
      question: (body?.question as string) || '',
      answer: (body?.answer as string) || '',
      language: (body?.language as string) || 'en',
      repetitions: 0,
      easeFactor: 2.5,
      interval: 0,
      isMature: false,
      qualityHistory: [],
      timesReviewed: 0,
      timesCorrect: 0,
      timesWrong: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies Card;
  }

  return null;
}

const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (args, api, extraOptions) => {
  if (!BYPASS_AUTH) return realBaseQuery(args, api, extraOptions);

  const request = typeof args === 'string' ? { url: args, method: 'GET' as const } : args;
  const url = request.url;
  const method = request.method ?? 'GET';
  const data = getMockData(url, method, request.body as Record<string, unknown> | undefined);

  if (data !== null) return { data };
  if (method === 'DELETE') return { data: null };
  if (method === 'PUT') return { data: request.body };

  return realBaseQuery(args, api, extraOptions);
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Topic', 'Card', 'Session', 'Analytics', 'AiUsage'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation<{ token: string; user: { _id: string; name: string; email: string; subscriptionTier: string } }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<{ token: string; user: { _id: string; name: string; email: string; subscriptionTier: string } }, { name: string; email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: builder.query<{ _id: string; name: string; email: string; subscriptionTier: string }, void>({
      query: () => '/auth/me',
      providesTags: ['Topic'],
    }),
    updateSubscription: builder.mutation<{ user: { _id: string; name: string; email: string; subscriptionTier: string } }, { subscriptionTier: 'free' | 'pro'; revenueCatUserId?: string }>({
      query: (body) => ({ url: '/auth/subscription', method: 'POST', body }),
      invalidatesTags: ['Topic'],
    }),

    // Topics
    getTopics: builder.query<Topic[], void>({
      query: () => '/topics',
      providesTags: ['Topic'],
    }),
    getTopic: builder.query<Topic, string>({
      query: (id) => `/topics/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Topic', id }],
    }),
    createTopic: builder.mutation<Topic, Partial<Topic>>({
      query: (body) => ({ url: '/topics', method: 'POST', body }),
      invalidatesTags: ['Topic'],
    }),
    updateTopic: builder.mutation<Topic, { id: string; data: Partial<Topic> }>({
      query: ({ id, data }) => ({ url: `/topics/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Topic', id }, 'Topic'],
    }),
    deleteTopic: builder.mutation<void, string>({
      query: (id) => ({ url: `/topics/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Topic'],
    }),

    // Cards
    getCards: builder.query<Card[], string>({
      query: (topicId) => `/topics/${topicId}/cards`,
      providesTags: (_r, _e, topicId) => [{ type: 'Card', id: topicId }],
    }),
    getDueCards: builder.query<Card[], string>({
      query: (topicId) => `/topics/${topicId}/cards/due`,
      providesTags: (_r, _e, topicId) => [{ type: 'Card', id: `due-${topicId}` }],
    }),
    createCard: builder.mutation<Card, { topicId: string; question: string; answer: string; language?: string }>({
      query: ({ topicId, ...body }) => ({ url: `/topics/${topicId}/cards`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { topicId }) => [...cardTags(topicId), 'Topic', 'Analytics'],
    }),
    updateCard: builder.mutation<Card, { id: string; topicId: string; data: Partial<Card> }>({
      query: ({ id, topicId, data }) => ({ url: `/topics/${topicId}/cards/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { topicId }) => [...cardTags(topicId), 'Topic', 'Analytics'],
    }),
    deleteCard: builder.mutation<void, { id: string; topicId: string }>({
      query: ({ id, topicId }) => ({ url: `/topics/${topicId}/cards/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { topicId }) => [...cardTags(topicId), 'Topic', 'Analytics'],
    }),
    generateCards: builder.mutation<
      GenerateCardsResponse,
      {
        topicId: string;
        sourceType: 'text' | 'url' | 'site' | 'image' | 'pdf';
        content?: string;
        imageBase64?: string;
        pdfBase64?: string;
        mimeType?: string;
        maxCards?: number;
      }
    >({
      query: ({ topicId, ...body }) => ({
        url: `/topics/${topicId}/cards/generate`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AiUsage'],
    }),
    bulkCreateCards: builder.mutation<
      { count: number; cards: Card[] },
      { topicId: string; cards: DraftCard[] }
    >({
      query: ({ topicId, cards }) => ({
        url: `/topics/${topicId}/cards/bulk`,
        method: 'POST',
        body: { cards },
      }),
      invalidatesTags: (_r, _e, { topicId }) => [...cardTags(topicId), 'Topic', 'Analytics'],
    }),
    getAiUsage: builder.query<AiUsage & { configured: boolean }, void>({
      query: () => '/ai/usage',
      providesTags: ['AiUsage'],
    }),
    improveCard: builder.mutation<
      CardImprovementResult,
      { topicId: string; cardId: string; trigger?: 'manual' | 'weak_card' }
    >({
      query: ({ topicId, cardId, trigger }) => ({
        url: `/topics/${topicId}/cards/${cardId}/improve`,
        method: 'POST',
        body: { trigger: trigger ?? 'manual' },
      }),
    }),
    getStudyCoach: builder.mutation<
      StudyCoachResult,
      { topicId: string; cardId: string; qualityRated?: number }
    >({
      query: ({ topicId, cardId, qualityRated }) => ({
        url: `/topics/${topicId}/cards/${cardId}/coach`,
        method: 'POST',
        body: { qualityRated: qualityRated ?? 2 },
      }),
    }),
    multilingualAssist: builder.mutation<
      MultilingualAssistResult,
      {
        topicId: string;
        action: 'translate' | 'examples' | 'reverse' | 'romaji' | 'nativeScript';
        question?: string;
        answer?: string;
        text?: string;
        side?: 'question' | 'answer';
      }
    >({
      query: ({ topicId, ...body }) => ({
        url: `/topics/${topicId}/cards/multilingual`,
        method: 'POST',
        body,
      }),
    }),
    generateAnalyticsInsights: builder.mutation<AnalyticsInsightsResult, { topicId?: string }>({
      query: ({ topicId } = {}) => ({
        url: `/ai/insights${topicId ? `?topicId=${topicId}` : ''}`,
        method: 'GET',
      }),
    }),

    // Review Sessions
    startSession: builder.mutation<ReviewSession, string>({
      query: (topicId) => ({ url: `/topics/${topicId}/sessions`, method: 'POST' }),
    }),
    submitReview: builder.mutation<
      SubmitReviewResponse,
      { sessionId: string; cardId: string; topicId: string; quality: ReviewQuality; timeSpentMs: number }
    >({
      query: ({ sessionId, topicId: _topicId, ...body }) => ({
        url: `/sessions/${sessionId}/reviews`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { topicId }) => [...cardTags(topicId), 'Analytics'],
    }),
    completeSession: builder.mutation<ReviewSession, string>({
      query: (sessionId) => ({ url: `/sessions/${sessionId}/complete`, method: 'POST' }),
      invalidatesTags: (result) => [
        'Session',
        'Analytics',
        ...(result?.topicId ? cardTags(result.topicId) : [{ type: 'Card' as const }]),
      ],
    }),
    getSessionHistory: builder.query<ReviewSession[], string>({
      query: (topicId) => `/topics/${topicId}/sessions`,
      providesTags: (_r, _e, topicId) => [{ type: 'Session', id: topicId }],
    }),
    getAnalytics: builder.query<Analytics, { topicId?: string }>({
      query: ({ topicId } = {}) => `/analytics${topicId ? `?topicId=${topicId}` : ''}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateSubscriptionMutation,
  useGetTopicsQuery,
  useGetTopicQuery,
  useCreateTopicMutation,
  useUpdateTopicMutation,
  useDeleteTopicMutation,
  useGetCardsQuery,
  useGetDueCardsQuery,
  useCreateCardMutation,
  useUpdateCardMutation,
  useDeleteCardMutation,
  useGenerateCardsMutation,
  useBulkCreateCardsMutation,
  useGetAiUsageQuery,
  useImproveCardMutation,
  useGetStudyCoachMutation,
  useMultilingualAssistMutation,
  useGenerateAnalyticsInsightsMutation,
  useStartSessionMutation,
  useSubmitReviewMutation,
  useCompleteSessionMutation,
  useGetSessionHistoryQuery,
  useGetAnalyticsQuery,
} = api;
