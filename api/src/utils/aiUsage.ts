import User from '../models/User';
import { FREE_AI_GENERATIONS_PER_MONTH, PRO_AI_GENERATIONS_PER_MONTH } from '../constants/ai';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getAiLimit(tier: 'free' | 'pro'): number {
  return tier === 'pro' ? PRO_AI_GENERATIONS_PER_MONTH : FREE_AI_GENERATIONS_PER_MONTH;
}

export async function getAiUsage(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const month = currentMonthKey();
  const used = user.aiGenerationsMonth === month ? user.aiGenerationsUsed : 0;
  const limit = getAiLimit(user.subscriptionTier);
  const remaining = Math.max(limit - used, 0);

  return {
    tier: user.subscriptionTier,
    used,
    limit,
    remaining,
    month,
  };
}

export async function requireProForAi(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const usage = await getAiUsage(userId);
  if (user.subscriptionTier !== 'pro') {
    return { allowed: false as const, usage };
  }
  return { allowed: true as const, usage };
}

export async function checkAiGenerationAllowed(userId: string) {
  const proCheck = await requireProForAi(userId);
  if (!proCheck.allowed) {
    return { allowed: false, usage: proCheck.usage, code: 'AI_PRO_REQUIRED' as const };
  }

  const usage = proCheck.usage;
  return {
    allowed: usage.remaining > 0,
    usage,
    code: usage.remaining > 0 ? undefined : ('AI_LIMIT_REACHED' as const),
  };
}

export async function consumeAiGeneration(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const month = currentMonthKey();
  const limit = getAiLimit(user.subscriptionTier);
  const used = user.aiGenerationsMonth === month ? user.aiGenerationsUsed : 0;

  if (used >= limit) {
    return {
      allowed: false as const,
      usage: { tier: user.subscriptionTier, used, limit, remaining: 0, month },
    };
  }

  user.aiGenerationsMonth = month;
  user.aiGenerationsUsed = used + 1;
  await user.save();

  const newUsed = user.aiGenerationsUsed;
  return {
    allowed: true as const,
    usage: {
      tier: user.subscriptionTier,
      used: newUsed,
      limit,
      remaining: Math.max(limit - newUsed, 0),
      month,
    },
  };
}
