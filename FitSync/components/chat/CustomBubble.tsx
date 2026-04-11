import React from 'react';
import { Bubble, BubbleProps, IMessage } from 'react-native-gifted-chat';
import { View, Text, TouchableOpacity, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/hooks/useTheme';
import { BOT_ID } from './constants';

/**
 * CustomBubble: Hata durumunda retry butonu göster
 * IMessage._id başında 'error_' ise hata mesajıdır
 */
export interface IMessageWithRetry extends IMessage {
  _id: string; // 'error_<timestamp>' format
}

export function CustomBubble(props: BubbleProps<IMessage>) {
  const { colors } = useTheme();
  const isBot = props.currentMessage?.user._id === BOT_ID;
  const isError = typeof props.currentMessage?._id === 'string' && props.currentMessage._id.startsWith('error_');

  const handleLongPress = async () => {
    if (!props.currentMessage?.text) return;

    try {
      await Clipboard.setStringAsync(props.currentMessage.text);
      // Göster Toast bildirimi
      if (Platform.OS === 'android') {
        // @ts-ignore — React Native'nin ToastAndroid modülü SDK 54'te mevcut
        require('react-native').ToastAndroid.show('Mesaj kopyalandı! ✓', 1500);
      } else {
        // iOS için basit bir Alert
        Alert.alert('Başarılı', 'Mesaj kopyalandı!', [{ text: 'Tamam' }], { cancelable: true });
      }
    } catch (error) {
      console.error('Clipboard error:', error);
    }
  };

  // Hata mesajı ise çıkart ve retry düğmesi göster
  const renderMessageText = () => {
    if (isError && props.currentMessage?.text) {
      const styles = getErrorStyles(colors);
      const errorMessage = props.currentMessage.text;

      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <View style={styles.errorContent}>
            <Text style={styles.errorTitle}>Yanıt alınamadı</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                // Retry callback — parent'tan gelir
                const metadata = (props.currentMessage as any)?.metadata;
                if (metadata?.onRetry) {
                  metadata.onRetry();
                }
              }}
            >
              <Text style={styles.retryText}>Tekrar Dene →</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Normal bot mesajları için Markdown render
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
    <Pressable onLongPress={handleLongPress}>
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
            backgroundColor: isError ? colors.error + '15' : colors.chatBotBubble,
            borderRadius: 18,
            borderBottomLeftRadius: 4,
            paddingHorizontal: 2,
            paddingVertical: 1,
            borderWidth: isError ? 1 : 0,
            borderColor: colors.error,
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
    </Pressable>
  );
}

const getErrorStyles = (colors: any) =>
  StyleSheet.create({
    errorContainer: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    errorIcon: {
      fontSize: 18,
      marginTop: 2,
    },
    errorContent: {
      flex: 1,
      gap: 6,
    },
    errorTitle: {
      fontWeight: '600',
      color: colors.error,
      fontSize: 14,
    },
    errorMessage: {
      color: colors.text,
      fontSize: 13,
      lineHeight: 18,
    },
    retryButton: {
      marginTop: 8,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.error + '20',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.error,
      alignSelf: 'flex-start',
    },
    retryText: {
      color: colors.error,
      fontWeight: '600',
      fontSize: 12,
    },
  });
