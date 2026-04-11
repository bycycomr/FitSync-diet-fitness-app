import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GiftedChat,
  IMessage,
  Day,
} from 'react-native-gifted-chat';
import { useUserStore } from '@/store/userStore';
import {
  addChatMessage,
  fetchChatHistory,
  fetchTodayFoodLog,
  fetchWeightLog,
  fetchWorkoutHistory,
} from '@/services/userService';
import { sendChatMessageStream, type GeminiMessage, type RichContext } from '@/services/geminiService';
import { parsePlanFromText, userAskedForPlan, mightContainPlan } from '@/services/parseService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { CustomBubble } from '@/components/chat/CustomBubble';
import { CustomInputToolbar } from '@/components/chat/CustomInputToolbar';
import { CustomSend } from '@/components/chat/CustomSend';
import { CustomAvatar } from '@/components/chat/CustomAvatar';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { StreamingBubble } from '@/components/chat/StreamingBubble';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { BOT_ID, BOT_USER } from '@/components/chat/constants';
import { makeMsg, pruneHistory, buildWelcomeMessage } from '@/components/chat/utils';

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

// _layout.tsx'te tanımlanan gerçek tab bar yükseklikleri
const TAB_BAR_IOS     = 88;
const TAB_BAR_ANDROID = 64;

export default function SohbetScreen() {
  const { colors } = useTheme();
  const styles = getScreenStyles(colors);
  const insets = useSafeAreaInsets();

  // Dinamik karşılama mesajı — saate ve kullanıcı verisine göre
  const getDynamicWelcomeMsg = (userWeight?: number | null) => {
    const hour = new Date().getHours();
    return buildWelcomeMessage(hour, userWeight ? { weight: userWeight } : undefined);
  };

  // Android: Keyboard API ile doğrudan klavye yüksekliğini dinle
  const [androidKbPadding, setAndroidKbPadding] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      const overlap = Math.max(
        e.endCoordinates.height - TAB_BAR_ANDROID - insets.bottom,
        0,
      );
      setAndroidKbPadding(overlap);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      setAndroidKbPadding(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

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

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const [welcomeInitialized, setWelcomeInitialized] = useState(false);

  // Hoş geldin mesajını başlangıçta ayarla
  useEffect(() => {
    if (!welcomeInitialized) {
      setMessages([getDynamicWelcomeMsg(weight)]);
      setWelcomeInitialized(true);
    }
  }, [welcomeInitialized, weight]);

  useEffect(() => {
    if (!uid) {
      setHistoryLoading(false);
      return;
    }

    fetchChatHistory(uid, 60).then((history) => {
      if (history.length === 0) {
        setHistoryLoading(false);
        return;
      }

      const loaded: IMessage[] = history.map((m) => ({
        _id: m.id,
        text: m.text,
        createdAt: m.createdAt ? m.createdAt.toDate() : new Date(),
        user: m.role === 'assistant'
          ? BOT_USER
          : { _id: uid, name: displayName },
      }));

      // GiftedChat en yeni mesajı başa koyar
      setMessages(GiftedChat.append([getDynamicWelcomeMsg(weight)], loaded.reverse()));
      setHistoryLoading(false);
    }).catch(console.error).finally(() => setHistoryLoading(false));
  }, [uid, weight, displayName]);

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
        // Token limitine yaklaşmasını önlemek için geçmiş buda
        // İlk 2 mesaj (anchor) + son 20 mesaj koru, ortayı sil
        geminiHistory.current = pruneHistory(geminiHistory.current, 20);

        // Zengin bağlam: bugünkü öğünler, son kilo, haftalık antrenmanlar
        let richContext: RichContext = {};
        if (uid) {
          try {
            // Hedeflenen kalori: basit formül (e.g., body weight × 30 kcal/kg)
            const targetCalories = weight ? Math.round(weight * 30) : 2000;
            const todayFood = await fetchTodayFoodLog(uid, targetCalories);
            if (todayFood) richContext.todayCalorieSummary = todayFood;
          } catch {
            // Sessiz başarısızlık — eksik bağlam AI'ı çok kötü etkilemez
          }

          try {
            const weightLogs = await fetchWeightLog(uid, 1);
            if (weightLogs && weightLogs.length > 0) {
              richContext.latestWeight = weightLogs[0];
            }
          } catch {
            // Sessiz başarısızlık
          }

          try {
            const workoutLogs = await fetchWorkoutHistory(uid, 7);
            if (workoutLogs && workoutLogs.length > 0) {
              richContext.weeklyWorkoutHistory = workoutLogs;
            }
          } catch {
            // Sessiz başarısızlık
          }
        }

        const botText = await sendChatMessageStream(
          geminiHistory.current,
          { displayName: displayName || undefined, height, weight, targetWeight, bmi, goal, age },
          last5DaysStats,
          (accumulated) => {
            // İlk chunk geldiğinde typing göstergesini kaldır
            if (isTyping) setIsTyping(false);
            setStreamingText(accumulated);
          },
          richContext,
        );

        // Streaming bitti — balonu temizle ve gerçek mesajı ekle
        setStreamingText('');
        setIsTyping(false);

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
        // Optimization: Sadece kullanıcı plan istedi VEYA bot yanıtı plan içeriyorsa parse et
        const shouldParse = userAskedForPlan(userMsg.text) || mightContainPlan(botText);
        if (shouldParse) {
          parsePlanFromText(botText).then((parsed) => {
            if (!parsed) return;
            if (parsed.type === 'meal' && parsed.mealPlan) {
              setActiveMealPlan(parsed.mealPlan);
            } else if (parsed.type === 'workout' && parsed.workoutPlan) {
              setActiveWorkoutPlan(parsed.workoutPlan);
            }
          }).catch(console.error);
        }
      } catch (err) {
        setStreamingText('');
        const errText = err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar dene.';
        const errMsg = makeMsg(errText, true, uid ?? BOT_ID, 'FitSync AI');

        // Hata mesajını işaretle ve retry callback'i ekle
        const errorMsgWithRetry = {
          ...errMsg,
          _id: `error_${Date.now()}`,
          metadata: {
            onRetry: () => {
              // Hatalı mesajı geçmişten kaldır ve yeniden gönder
              geminiHistory.current.pop();
              onSend([userMsg]);
            },
          },
        };

        setMessages((prev) => GiftedChat.append(prev, [errorMsgWithRetry]));
        // Hatalı mesajı geçmişe ekleme — tutarlılığı koru
        geminiHistory.current.pop();
      } finally {
        setIsTyping(false);
        setStreamingText('');
      }
    },
    [uid, displayName, height, weight, targetWeight, bmi, goal, age, setActiveMealPlan, setActiveWorkoutPlan],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* iOS: KAV ile padding, Android: manual paddingBottom */}
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

          {/* Hızlı eylem çipleri — son mesaj bot tarafındansa göster */}
          {messages.length > 0 && messages[0].user._id === BOT_ID && !streamingText && !isTyping && (
            <QuickReplies
              onSendMessage={(text) => {
                const msgToSend: IMessage[] = [
                  {
                    _id: `${Date.now()}`,
                    text,
                    createdAt: new Date(),
                    user: { _id: uid ?? 'guest', name: displayName || 'Sen' },
                  },
                ];
                onSend(msgToSend);
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

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
