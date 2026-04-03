import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GiftedChat,
  IMessage,
  Bubble,
  InputToolbar,
  Send,
  Avatar,
  Day,
  SystemMessage,
  BubbleProps,
  InputToolbarProps,
  SendProps,
  AvatarProps,
} from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { addChatMessage, fetchChatHistory } from '@/services/userService';
import { sendChatMessage, type GeminiMessage } from '@/services/geminiService';
import { parsePlanFromText } from '@/services/parseService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

const BOT_ID = 'fitsync-ai';

const BOT_USER = {
  _id: BOT_ID,
  name: 'FitSync AI',
  avatar: undefined as undefined,
};

function makeMsg(
  text: string,
  isBot: boolean,
  uid: string,
  displayName: string,
  id?: string,
): IMessage {
  return {
    _id: id ?? `${isBot ? 'b' : 'u'}_${Date.now()}_${Math.random()}`,
    text,
    createdAt: new Date(),
    user: isBot
      ? BOT_USER
      : { _id: uid, name: displayName },
  };
}

const WELCOME_MSG: IMessage = {
  _id: '__welcome__',
  text: 'Merhaba! 👋 Ben FitSync AI asistanın.\n\nBeslenme planın, antrenman programın veya kilo hedeflerin hakkında sana yardımcı olmaya hazırım. Ne öğrenmek istersin?',
  createdAt: new Date(),
  user: BOT_USER,
};

// ─── Özelleştirilmiş Bileşenler ──────────────────────────────────────────────

function CustomBubble(props: BubbleProps<IMessage>) {
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

function CustomInputToolbar(props: InputToolbarProps<IMessage>) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.inputWrapper}>
      <InputToolbar
        {...props}
        containerStyle={styles.inputToolbar}
        primaryStyle={styles.inputPrimary}
      />
    </View>
  );
}

function CustomSend(props: SendProps<IMessage>) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <Send {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendBtn}>
        <Ionicons name="send" size={18} color="#FFF" />
      </View>
    </Send>
  );
}

function CustomAvatar(props: AvatarProps<IMessage>) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.botAvatar}>
      <Ionicons name="fitness" size={16} color="#FFF" />
    </View>
  );
}

function TypingIndicator() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.typingRow}>
      <View style={styles.botAvatar}>
        <Ionicons name="fitness" size={16} color="#FFF" />
      </View>
      <View style={styles.typingBubble}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotMid]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function SohbetScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const uid = useUserStore((s) => s.uid);
  const displayName = useUserStore((s) => s.displayName);
  const height = useUserStore((s) => s.height);
  const weight = useUserStore((s) => s.weight);
  const targetWeight = useUserStore((s) => s.targetWeight);
  const bmi = useUserStore((s) => s.bmi);
  const goal = useUserStore((s) => s.goal);
  const age = useUserStore((s) => s.age);
  const last5DaysStats = useUserStore((s) => s.last5DaysStats);
  const setActiveMealPlan = useUserStore((s) => s.setActiveMealPlan);
  const setActiveWorkoutPlan = useUserStore((s) => s.setActiveWorkoutPlan);

  // Gemini'ye gönderilecek konuşma geçmişi (role: 'user' | 'model')
  const geminiHistory = React.useRef<GeminiMessage[]>([]);

  const [messages, setMessages] = useState<IMessage[]>([WELCOME_MSG]);
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setHistoryLoading(false);
      return;
    }

    fetchChatHistory(uid, 60).then((history) => {
      if (history.length === 0) return;

      const loaded: IMessage[] = history.map((m) => ({
        _id: m.id,
        text: m.text,
        createdAt: m.createdAt ? m.createdAt.toDate() : new Date(),
        user: m.role === 'assistant'
          ? BOT_USER
          : { _id: uid, name: displayName },
      }));

      // GiftedChat en yeni mesajı başa koyar
      setMessages(GiftedChat.append([WELCOME_MSG], loaded.reverse()));
    }).catch(console.error).finally(() => setHistoryLoading(false));
  }, [uid]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const userMsg = newMessages[0];
      setMessages((prev) => GiftedChat.append(prev, newMessages));
      setIsTyping(true);

      // Kullanıcı mesajını Firestore'a kaydet (fire-and-forget)
      if (uid) {
        addChatMessage(uid, {
          role: 'user',
          text: userMsg.text,
          createdAt: null,
        }).catch(console.error);
      }

      // Gemini geçmişine kullanıcı mesajını ekle
      geminiHistory.current.push({ role: 'user', text: userMsg.text });

      try {
        const botText = await sendChatMessage(
          geminiHistory.current,
          { displayName: displayName || undefined, height, weight, targetWeight, bmi, goal, age },
          last5DaysStats,
        );

        // Gemini geçmişine bot yanıtını ekle
        geminiHistory.current.push({ role: 'model', text: botText });

        const botMsg = makeMsg(botText, true, uid ?? BOT_ID, 'FitSync AI');
        setMessages((prev) => GiftedChat.append(prev, [botMsg]));

        if (uid) {
          addChatMessage(uid, {
            role: 'assistant',
            text: botText,
            createdAt: null,
          }).catch(console.error);
        }

        // Yanıt bir plan içeriyorsa arka planda parse et (fire-and-forget)
        parsePlanFromText(botText).then((parsed) => {
          if (!parsed) return;
          if (parsed.type === 'meal' && parsed.mealPlan) {
            setActiveMealPlan(parsed.mealPlan);
          } else if (parsed.type === 'workout' && parsed.workoutPlan) {
            setActiveWorkoutPlan(parsed.workoutPlan);
          }
        }).catch(console.error);
      } catch (err) {
        const errText = err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar dene.';
        const errMsg = makeMsg(errText, true, uid ?? BOT_ID, 'FitSync AI');
        setMessages((prev) => GiftedChat.append(prev, [errMsg]));
        // Hatalı mesajı geçmişe ekleme — tutarlılığı koru
        geminiHistory.current.pop();
      } finally {
        setIsTyping(false);
      }
    },
    [uid, displayName, height, weight, targetWeight, bmi, goal, age, setActiveMealPlan, setActiveWorkoutPlan],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
          renderFooter={() => (isTyping ? <TypingIndicator /> : null)}
          messagesContainerStyle={styles.messagesContainer}
          textInputProps={{ placeholder: 'Bir şeyler sor...', style: styles.textInput }}
          bottomOffset={Platform.OS === 'ios' ? 90 : 60}
          keyboardShouldPersistTaps="never"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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

  inputWrapper: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.background,
    borderTopWidth: 0,
  },
  inputToolbar: {
    backgroundColor: colors.cardBackground,
    borderTopWidth: 0,
    borderTopColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    marginHorizontal: 0,
    marginVertical: 0,
  },
  inputPrimary: {
    alignItems: 'center',
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

  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 4,
    paddingBottom: 0,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },

  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.chatBotBubble,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 5,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textMuted,
  },
  dotMid: {
    backgroundColor: colors.textSecondary,
  },
});
