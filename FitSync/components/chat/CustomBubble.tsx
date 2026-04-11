import React from 'react';
import { Bubble, BubbleProps, IMessage } from 'react-native-gifted-chat';
import { View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '@/hooks/useTheme';

export function CustomBubble(props: BubbleProps<IMessage>) {
  const { colors } = useTheme();
  const isBot = props.currentMessage?.user._id === 'bot';

  // Bot mesajları için Markdown render, kullanıcı mesajları için düz metin
  const renderMessageText = () => {
    if (isBot && props.currentMessage?.text) {
      return (
        <View style={{ flex: 1 }}>
          <Markdown
            style={{
              body: {
                color: colors.chatBotText,
                fontSize: 15,
                lineHeight: 22,
              },
              heading1: {
                color: colors.primary,
                fontSize: 20,
                fontWeight: 'bold',
                marginVertical: 8,
              },
              heading2: {
                color: colors.primary,
                fontSize: 18,
                fontWeight: 'bold',
                marginVertical: 6,
              },
              heading3: {
                color: colors.primary,
                fontSize: 16,
                fontWeight: 'bold',
                marginVertical: 4,
              },
              hr: {
                backgroundColor: colors.border,
                height: 1,
                marginVertical: 8,
              },
              fence: {
                backgroundColor: colors.inputBg,
                color: colors.text,
                padding: 10,
                borderRadius: 6,
                fontFamily: 'monospace',
                fontSize: 13,
              },
              code_inline: {
                backgroundColor: colors.inputBg,
                color: colors.tertiary,
                paddingHorizontal: 4,
                borderRadius: 4,
                fontFamily: 'monospace',
                fontSize: 13,
              },
              strong: {
                fontWeight: 'bold',
                color: colors.text,
              },
              em: {
                fontStyle: 'italic',
              },
              blockquote: {
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
                paddingLeft: 10,
                marginVertical: 8,
                backgroundColor: colors.inputBg,
                paddingVertical: 8,
                paddingRight: 10,
              },
              list: {
                marginVertical: 4,
              },
              bullet_list_icon: {
                color: colors.primary,
                marginRight: 8,
              },
              ordered_list_icon: {
                color: colors.primary,
                marginRight: 8,
              },
              link: {
                color: colors.primary,
              },
            }}
          >
            {props.currentMessage.text}
          </Markdown>
        </View>
      );
    }
    return null;
  };

  return (
    <Bubble
      {...props}
      renderMessageText={renderMessageText}
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
