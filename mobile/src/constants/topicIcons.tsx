import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export const TOPIC_ICONS = [
  { id: 'book', icon: 'book' },
  { id: 'brain', icon: 'bulb' },
  { id: 'globe', icon: 'globe' },
  { id: 'numbers', icon: 'calculator' },
  { id: 'music', icon: 'musical-notes' },
  { id: 'science', icon: 'flask' },
  { id: 'history', icon: 'library' },
  { id: 'code', icon: 'code-slash' },
  { id: 'art', icon: 'color-palette' },
  { id: 'read', icon: 'reader' },
  { id: 'speech', icon: 'chatbubbles' },
  { id: 'write', icon: 'create' },
] as const;

const LEGACY_EMOJI_MAP: Record<string, string> = {
  '📚': 'book',
  '🧠': 'bulb',
  '🌍': 'globe',
  '🔢': 'calculator',
  '🎵': 'musical-notes',
  '🔬': 'flask',
  '🏛️': 'library',
  '💻': 'code-slash',
  '🎨': 'color-palette',
  '📖': 'reader',
  '🗣️': 'chatbubbles',
  '✍️': 'create',
  '🇪🇸': 'globe',
  '🏛': 'library',
};

export function resolveTopicIcon(emoji: string): keyof typeof Ionicons.glyphMap {
  const match = TOPIC_ICONS.find((item) => item.id === emoji);
  if (match) return match.icon as keyof typeof Ionicons.glyphMap;
  const legacy = LEGACY_EMOJI_MAP[emoji];
  if (legacy) return legacy as keyof typeof Ionicons.glyphMap;
  return 'book';
}

export function TopicIcon({
  emoji,
  size,
  color,
}: {
  emoji: string;
  size: number;
  color: string;
}) {
  return <Ionicons name={resolveTopicIcon(emoji)} size={size} color={color} />;
}
