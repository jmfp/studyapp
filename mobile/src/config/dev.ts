import type { User } from '../types';

export const BYPASS_AUTH = process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true';

export const DEV_USER: User = {
  _id: 'dev-user',
  name: 'Demo User',
  email: 'demo@flashstudy.app',
  subscriptionTier: 'pro',
};

export const DEV_TOKEN = 'dev-bypass-token';
