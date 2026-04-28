import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GiftedChat, IMessage, Day } from 'react-native-gifted-chat';
import { useUserStore } from '@/store/userStore';
import { fetchChatHistory, safeToDate } from '@/services/userService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { useChatSend } from '@/hooks/useChatSend';
import { CustomBubble } from '@/components/chat/CustomBubble';
import { CustomInputToolbar } from '@/components/chat/CustomInputToolbar';
import { CustomSend } from '@/components/chat/CustomSend';
import { CustomAvatar } from '@/components/chat/CustomAvatar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { StreamingBubble } from '@/components/chat/StreamingBubble';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { BOT_ID, BOT_USER } from '@/components/chat/constants';
import { buildWelcomeMessage } from '@/components/chat/utils';

const TAB_BAR_IOS     = 88;
const TAB_BAR_ANDROID = 64;

export default function SohbetScreen() {
  const { colors } = useTheme();
  const styles = getScreenStyles(colors);
  const insets = useSafeAreaInsets();

  // Zustand selectors
  const uid            = useUserStore((s) => s.uid);
  const displayName    = useUserStore((s) => s.displayName);
  const height         = useUserStore((s) => s.height);
  const weight         = useUserStore((s) => s.weight);
  const targetWeight   = useUserStore((s) => s.targetWeight);
  const bmi            = useUserStore((s) => s.bmi);
  const goal           = useUserStore((s) => s.goal);
  const age            = useUserStore((s) => s.age);
  const last5DaysStats = useUserStore((s) => s.last5DaysStats);
  const setActiveMealPlan    = useUserStore((s) => s.setActiveMealPlan);
  const setActiveWorkoutPlan = useUserStore((s) => s.setActiveWorkoutPlan);

  // UI state
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [welcomeInitialized, setWelcomeInitialized] = useState(false);
  const [androidKbPadding, setAndroidKbPadding] = useState(0);

  // Sohbet gönderme mantığı — custom hook'a taşındı
  const { isTyping, streamingText, onSend, handleQuickReply } = useChatSend({
    uid,
    displayName,
    height,
    weight,
    targetWeight,
    bmi,
    goal,
    age,
    last5DaysStats,
    setMessages,
    setActiveMealPlan,
    setActiveWorkoutPlan,
  });

  // Android: klavye yüksekliğini doğrudan dinle
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      setAndroidKbPadding(Math.max(e.endCoordinates.height - TAB_BAR_ANDROID - insets.bottom, 0));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setAndroidKbPadding(0));
    return () => { show.remove(); hide.remove(); };
  }, [insets.bottom]);

  // Dinamik karşılama mesajı
  useEffect(() => {
    if (welcomeInitialized) return;
    const hour = new Date().getHours();
    setMessages([buildWelcomeMessage(hour, weight ? { weight } : undefined)]);
    setWelcomeInitialized(true);
  }, [welcomeInitialized, weight]);

  // Firestore geçmiş yükle
  useEffect(() => {
    if (!uid) { setHistoryLoading(false); return; }

    const hour = new Date().getHours();
    const welcomeMsg = buildWelcomeMessage(hour, weight ? { weight } : undefined);

    fetchChatHistory(uid, 60)
      .then((history) => {
        if (history.length === 0) return;
        const loaded: IMessage[] = history.map((m) => ({
          _id: m.id,
          text: m.text,
          createdAt: safeToDate(m.createdAt),
          user: m.role === 'assistant' ? BOT_USER : { _id: uid, name: displayName },
        }));
        setMessages(GiftedChat.append([welcomeMsg], loaded.reverse()));
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [uid, weight, displayName]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={TAB_BAR_IOS}
      >
        <View style={[{ flex: 1 }, Platform.OS === 'android' && { paddingBottom: androidKbPadding }]}>
          {historyLoading && (
            <View style={styles.historyLoader}>
              <View style={styles.historyLoaderBar} />
              <View style={[styles.historyLoaderBar, { width: '60%' }]} />
              <View style={[styles.historyLoaderBar, { width: '80%' }]} />
            </View>
          )}

          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{ _id: uid ?? 'guest', name: displayName || 'Sen' }}
            locale="tr"
            isSendButtonAlwaysVisible
            isUserAvatarVisible={false}
            renderBubble={(props) => <CustomBubble {...props} />}
            renderInputToolbar={(props) => <CustomInputToolbar {...props} />}
            renderSend={(props) => <CustomSend {...props} />}
            renderAvatar={(props) => <CustomAvatar {...props} />}
            renderDay={(props) => <Day {...props} textStyle={{ color: colors.textSecondary }} />}
            renderFooter={() => {
              if (streamingText) return <StreamingBubble text={streamingText} />;
              if (isTyping) return <TypingIndicator />;
              return null;
            }}
            messagesContainerStyle={styles.messagesContainer}
            textInputProps={{ placeholder: 'Bir şeyler sor...', style: styles.textInput }}
            bottomOffset={0}
            keyboardShouldPersistTaps="handled"
          />

          {messages.length > 0 && messages[0].user._id === BOT_ID && !streamingText && !isTyping && (
            <QuickReplies onSendMessage={handleQuickReply} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getScreenStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messagesContainer: { backgroundColor: colors.background, paddingBottom: 4 },
  historyLoader: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 10,
    zIndex: 1,
    pointerEvents: 'none',
  },
  historyLoaderBar: {
    width: '85%',
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.skeletonBg,
    opacity: 0.8,
  },
  textInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 6,
    paddingBottom: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 15,
    color: colors.text,
    marginTop: 0,
    marginBottom: 0,
    lineHeight: 20,
  },
});
