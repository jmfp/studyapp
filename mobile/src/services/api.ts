import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '../store';
import type { Topic, Card, ReviewSession, Analytics, SubmitReviewResponse, ReviewQuality } from '../types';
import { BYPASS_AUTH, DEV_USER } from '../config/dev';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const realBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

function getMockData(url: string, method: string, body?: Record<string, unknown>) {
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
  tagTypes: ['Topic', 'Card', 'Session', 'Analytics'],
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
    }),
    updateSubscription: builder.mutation<{ user: { _id: string; name: string; email: string; subscriptionTier: string } }, { subscriptionTier: 'free' | 'pro'; revenueCatUserId?: string }>({
      query: (body) => ({ url: '/auth/subscription', method: 'POST', body }),
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
      invalidatesTags: (_r, _e, { topicId }) => [{ type: 'Card', id: topicId }, 'Topic'],
    }),
    updateCard: builder.mutation<Card, { id: string; topicId: string; data: Partial<Card> }>({
      query: ({ id, data }) => ({ url: `/topics/${data.topicId || ''}/cards/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { topicId }) => [{ type: 'Card', id: topicId }],
    }),
    deleteCard: builder.mutation<void, { id: string; topicId: string }>({
      query: ({ id, topicId }) => ({ url: `/topics/${topicId}/cards/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { topicId }) => [{ type: 'Card', id: topicId }, 'Topic'],
    }),

    // Review Sessions
    startSession: builder.mutation<ReviewSession, string>({
      query: (topicId) => ({ url: `/topics/${topicId}/sessions`, method: 'POST' }),
    }),
    submitReview: builder.mutation<SubmitReviewResponse, { sessionId: string; cardId: string; quality: ReviewQuality; timeSpentMs: number }>({
      query: ({ sessionId, ...body }) => ({ url: `/sessions/${sessionId}/reviews`, method: 'POST', body }),
    }),
    completeSession: builder.mutation<ReviewSession, string>({
      query: (sessionId) => ({ url: `/sessions/${sessionId}/complete`, method: 'POST' }),
      invalidatesTags: ['Session', 'Analytics', 'Card'],
    }),
    getSessionHistory: builder.query<ReviewSession[], string>({
      query: (topicId) => `/topics/${topicId}/sessions`,
      providesTags: ['Session'],
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
  useStartSessionMutation,
  useSubmitReviewMutation,
  useCompleteSessionMutation,
  useGetSessionHistoryQuery,
  useGetAnalyticsQuery,
} = api;
