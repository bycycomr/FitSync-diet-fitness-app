import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import {
  addChatMessage,
  fetchTodayFoodLog,
  fetchWeightLog,
  fetchWorkoutHistory,
} from '@/services/userService';
import { getTodaySteps } from '@/services/healthKitService';
import {
  sendChatMessageStream,
  type GeminiMessage,
  type RichContext,
} from '@/services/geminiService';
import { parsePlanFromText, userAskedForPlan, mightContainPlan } from '@/services/parseService';
import { BOT_ID } from '@/components/chat/constants';
import { makeMsg, pruneHistory } from '@/components/chat/utils';
import type { DayStats, MealPlan, WorkoutPlan } from '@/types';

interface UseChatSendOptions {
  uid: string | null;
  displayName: string;
  height: number | null;
  weight: number | null;
  targetWeight: number | null;
  bmi: number | null;
  goal: 'lose' | 'maintain' | 'gain' | null;
  age: number | null;
  last5DaysStats: DayStats[];
  setMessages: React.Dispatch<React.SetStateAction<IMessage[]>>;
  setActiveMealPlan: (plan: MealPlan | null) => void;
  setActiveWorkoutPlan: (plan: WorkoutPlan | null) => void;
}

export function useChatSend({
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
}: UseChatSendOptions) {
  const geminiHistory = useRef<GeminiMessage[]>([]);
  const isParsingRef = useRef(false);

  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Farklı kullanıcı oturumunda geçmişi sıfırla — veri sızmasını önler
  useEffect(() => {
    geminiHistory.current = [];
  }, [uid]);

  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const userMsg = newMessages[0];
      setMessages((prev) => GiftedChat.append(prev, newMessages));
      setIsTyping(true);

      // Kullanıcı mesajını Firestore'a kaydet (fire-and-forget)
      if (uid) {
        addChatMessage(uid, { role: 'user', text: userMsg.text, createdAt: null }).catch(console.error);
      }

      geminiHistory.current.push({ role: 'user', text: userMsg.text });

      try {
        // Token limitine yaklaşmasını önlemek için geçmişi buda
        geminiHistory.current = pruneHistory(geminiHistory.current, 20);

        // Zengin bağlam: bugünkü öğünler, son kilo, haftalık antrenmanlar
        const richContext: RichContext = {};
        if (uid) {
          try {
            const targetCalories = weight ? Math.round(weight * 30) : 2000;
            const todayFood = await fetchTodayFoodLog(uid, targetCalories);
            if (todayFood) richContext.todayCalorieSummary = todayFood;
          } catch { /* sessiz başarısızlık */ }

          try {
            const weightLogs = await fetchWeightLog(uid, 1);
            if (weightLogs && weightLogs.length > 0) richContext.latestWeight = weightLogs[0];
          } catch { /* sessiz başarısızlık */ }

          try {
            const workoutLogs = await fetchWorkoutHistory(uid, 7);
            if (workoutLogs && workoutLogs.length > 0) richContext.weeklyWorkoutHistory = workoutLogs;
          } catch { /* sessiz başarısızlık */ }
        }

        // Adım verisi (cihaz sensöründen, uid bağımsız)
        try {
          const health = await getTodaySteps();
          if (health.isAvailable && health.steps > 0) {
            richContext.stepData = { steps: health.steps, activeCalories: health.activeCalories, stepGoal: health.stepGoal };
          }
        } catch { /* sessiz başarısızlık */ }

        const botText = await sendChatMessageStream(
          geminiHistory.current,
          { displayName: displayName || undefined, height, weight, targetWeight, bmi, goal, age },
          last5DaysStats,
          (accumulated) => {
            setIsTyping(false);
            setStreamingText(accumulated);
          },
          richContext,
        );

        setStreamingText('');
        setIsTyping(false);
        geminiHistory.current.push({ role: 'model', text: botText });

        const botMsg = makeMsg(botText, true, uid ?? BOT_ID, 'FitSync AI');
        setMessages((prev) => GiftedChat.append(prev, [botMsg]));

        if (uid) {
          addChatMessage(uid, { role: 'assistant', text: botText, createdAt: null }).catch(console.error);
        }

        // Yanıt plan içeriyorsa arka planda parse et
        const shouldParse = userAskedForPlan(userMsg.text) || mightContainPlan(botText);
        if (shouldParse && !isParsingRef.current) {
          isParsingRef.current = true;
          parsePlanFromText(botText)
            .then((parsed) => {
              if (!parsed) return;
              if (parsed.type === 'meal' && parsed.mealPlan) setActiveMealPlan(parsed.mealPlan);
              else if (parsed.type === 'workout' && parsed.workoutPlan) setActiveWorkoutPlan(parsed.workoutPlan);
            })
            .catch(console.error)
            .finally(() => { isParsingRef.current = false; });
        }
      } catch (err) {
        setStreamingText('');
        const errText = err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar dene.';
        const errMsg = makeMsg(errText, true, uid ?? BOT_ID, 'FitSync AI');
        const errorMsgWithRetry = {
          ...errMsg,
          _id: `error_${Date.now()}`,
          metadata: {
            onRetry: () => {
              geminiHistory.current.pop();
              onSend([userMsg]);
            },
          },
        };
        setMessages((prev) => GiftedChat.append(prev, [errorMsgWithRetry]));
        geminiHistory.current.pop();
      } finally {
        setIsTyping(false);
        setStreamingText('');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uid, displayName, height, weight, targetWeight, bmi, goal, age, last5DaysStats, setMessages, setActiveMealPlan, setActiveWorkoutPlan],
  );

  const handleQuickReply = useCallback(
    (text: string) => {
      const msgToSend: IMessage[] = [{
        _id: `${Date.now()}`,
        text,
        createdAt: new Date(),
        user: { _id: uid ?? 'guest', name: displayName || 'Sen' },
      }];
      onSend(msgToSend);
    },
    [uid, displayName, onSend],
  );

  return { isTyping, streamingText, onSend, handleQuickReply };
}
