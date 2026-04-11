import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

/**
 * Hızlı eylem chip'leri — bot mesajının altında kullanıcıya seçim sunma.
 * Kullanıcı bir chip'e basınca metin otomatik olarak sohbete gönderilir.
 */

export interface QuickReply {
  id: string;
  emoji: string;
  label: string;
  message: string;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'daily-plan',
    emoji: '📋',
    label: 'Bugünlük Plan',
    message: 'Bugün için bir beslenme ve antrenman planı oluştur.',
  },
  {
    id: 'workout-suggestion',
    emoji: '💪',
    label: 'Antrenman Öner',
    message: 'Bana uygun bir antrenman programı öner.',
  },
  {
    id: 'low-calorie-recipe',
    emoji: '🥗',
    label: 'Düşük Kalorili Tarif',
    message: 'Düşük kalorili ve lezzetli yemek tariflerini paylaş.',
  },
  {
    id: 'weight-tracking',
    emoji: '⚖️',
    label: 'Kilo Takibi',
    message: 'Kilom hakkında analiz et ve ilerlemeyi değerlendir.',
  },
  {
    id: 'progress-summary',
    emoji: '📊',
    label: 'İlerleme Özeti',
    message: 'Bu haftanın ilerlemesinin bir özetini ver.',
  },
];

interface QuickRepliesProps {
  onSendMessage: (text: string) => void;
  replies?: QuickReply[];
}

export function QuickReplies({ onSendMessage, replies = DEFAULT_QUICK_REPLIES }: QuickRepliesProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {replies.map((reply) => (
          <TouchableOpacity
            key={reply.id}
            style={styles.chip}
            onPress={() => onSendMessage(reply.message)}
            activeOpacity={0.75}
          >
            <Text style={styles.emoji}>{reply.emoji}</Text>
            <Text style={styles.label}>{reply.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    scrollContent: {
      gap: 8,
      paddingRight: 16,
    },

    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 24,
      backgroundColor: colors.inputBg,
      borderWidth: 1,
      borderColor: colors.primary,
      gap: 6,
      minWidth: 'auto',
      shadowColor: colors.primary,
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },

    emoji: {
      fontSize: 16,
    },

    label: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.text,
    },
  });
