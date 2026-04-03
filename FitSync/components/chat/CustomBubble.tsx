import React from 'react';
import { Bubble, BubbleProps, IMessage } from 'react-native-gifted-chat';
import { useTheme } from '@/hooks/useTheme';

export function CustomBubble(props: BubbleProps<IMessage>) {
  const { colors } = useTheme();

  return (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: colors.chatUserBubble,
          borderRadius: 18,
          borderBottomRightRadius: 4,
          paddingHorizontal: 2,
          paddingVertical: 1,
          shadowColor: colors.chatUserBubble,
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 6,
          elevation: 3,
        },
        left: {
          backgroundColor: colors.chatBotBubble,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          paddingHorizontal: 2,
          paddingVertical: 1,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 4,
          elevation: 2,
        },
      }}
      textStyle={{
        right: { color: colors.chatUserText, fontSize: 15, lineHeight: 22 },
        left: { color: colors.chatBotText, fontSize: 15, lineHeight: 22 },
      }}
    />
  );
}
