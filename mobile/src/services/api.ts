import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store';
import type { Topic, Card, ReviewSession, Analytics, SubmitReviewResponse, ReviewQuality } from '../types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Topic', 'Card', 'Session', 'Analytics'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation<{ token: string; user: { _id: string; name: string; email: string } }, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: builder.mutation<{ token: string; user: { _id: string; name: string; email: string } }, { name: string; email: string; password: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    getMe: builder.query<{ _id: string; name: string; email: string }, void>({
      query: () => '/auth/me',
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
