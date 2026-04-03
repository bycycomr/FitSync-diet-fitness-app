import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/userStore';
import { logoutUser } from '@/services/authService';
import { fetchTodayCompletions, fetchWeeklyCompletions, calculateAndUpdateStreak, checkAndAwardAchievements } from '@/services/userService';
import type { DayStats } from '@/services/userService';
import type { Goal } from '@/types';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from '@/components/modals/MenuModal';
import { AccountSettingsModal } from '@/components/modals/AccountSettingsModal';
import { NotificationsModal } from '@/components/modals/NotificationsModal';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import { HelpModal } from '@/components/modals/HelpModal';
import { EditProfileModal } from '@/components/modals/EditProfileModal';
import { StreakCard } from '@/components/StreakCard';

// Renkler useTheme() hook'undan alınır
// Bu sabitler yalnızca hook dışında (component render öncesi) kullanılır

// ─── Veri ─────────────────────────────────────────────────────────────────────

interface MenuItem {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { id: '1', icon: 'settings-outline',        label: 'Hesap Ayarları' },
  { id: '2', icon: 'notifications-outline',   label: 'Bildirimler' },
  { id: '3', icon: 'shield-checkmark-outline', label: 'Gizlilik' },
  { id: '4', icon: 'help-circle-outline',      label: 'Yardım & Destek' },
];

const GOAL_LABELS: Record<string, string> = {
  lose: 'Kilo Ver', maintain: 'Koru', gain: 'Kilo Al',
};

// Renk değerleri useTheme() hook'undan dinamik alınır, aşağıda colors parametresi kullanılır

// ─── Animasyonlu Progress Bar ─────────────────────────────────────────────────

function AnimatedProgressBar({ progress, color }: { progress: number; color: string }) {
  const { colors } = useTheme();
  const pbStyles = getPbStyles(colors);
  
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [progress]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={pbStyles.bg}>
      <Animated.View style={[pbStyles.fill, { width, backgroundColor: color }]} />
    </View>
  );
}

const getPbStyles = (colors: ThemeColors) => StyleSheet.create({
  bg: { height: 8, backgroundColor: colors.skeletonBg, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Skeleton Loader ─────────────────────────────────────────────────────────

function SkeletonBar({ width, height = 8, style }: { width: string | number; height?: number; style?: object }) {
  const { colors } = useTheme();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[{ width, height, borderRadius: height / 2, backgroundColor: colors.skeletonBg, opacity: anim }, style]}
    />
  );
}

function DailyProgressSkeleton() {
  const { colors } = useTheme();
  const dpStyles = getDpStyles(colors);
  return (
    <View style={dpStyles.card}>
      <View style={dpStyles.header}>
        <View style={[dpStyles.iconBox, { backgroundColor: colors.skeletonBg }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonBar width="55%" height={14} />
          <SkeletonBar width="75%" height={10} />
        </View>
        <SkeletonBar width={40} height={22} />
      </View>
      <SkeletonBar width="100%" height={8} style={{ marginBottom: 14 }} />
      <SkeletonBar width="45%" height={10} style={{ marginBottom: 10 }} />
      <SkeletonBar width="100%" height={8} style={{ marginBottom: 14 }} />
      <SkeletonBar width="45%" height={10} style={{ marginBottom: 10 }} />
      <SkeletonBar width="100%" height={8} />
    </View>
  );
}

// ─── Günlük İlerleme Kartı ────────────────────────────────────────────────────

function DailyProgressCard({ uid }: { uid: string }) {
  const { colors } = useTheme();
  const dpStyles = getDpStyles(colors);

  const activeMealPlan    = useUserStore((s) => s.activeMealPlan);
  const activeWorkoutPlan = useUserStore((s) => s.activeWorkoutPlan);
  const totalMeals    = activeMealPlan?.meals.length ?? 0;
  const totalWorkouts = activeWorkoutPlan ? 1 : 0;
  const [mealCount, setMealCount]       = useState(0);
  const [workoutCount, setWorkoutCount] = useState(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetchTodayCompletions(uid)
      .then(({ mealCount: m, workoutCount: w }) => { setMealCount(m); setWorkoutCount(w); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const mealProgress    = totalMeals > 0 ? Math.min(mealCount / totalMeals, 1) : 0;
  const workoutProgress = totalWorkouts > 0 ? Math.min(workoutCount / totalWorkouts, 1) : 0;
  const overallProgress = totalMeals + totalWorkouts > 0
    ? (mealCount + workoutCount) / (totalMeals + totalWorkouts) : 0;

  if (loading) return <DailyProgressSkeleton />;

  return (
    <View style={dpStyles.card}>
      <View style={dpStyles.header}>
        <View style={dpStyles.iconBox}><Ionicons name="today" size={20} color={colors.primary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={dpStyles.title}>Bugünkü İlerleme</Text>
          <Text style={dpStyles.sub}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        </View>
        <Text style={[dpStyles.pct, { color: overallProgress >= 1 ? colors.primary : colors.textSecondary }]}>
          {Math.round(overallProgress * 100)}%
        </Text>
      </View>
      <AnimatedProgressBar progress={overallProgress} color={colors.primary} />
      {overallProgress >= 1 && <Text style={dpStyles.congrats}>🎉 Günlük hedeflerin tamamlandı!</Text>}
      <View style={dpStyles.details}>
        <View style={dpStyles.detailRow}>
          <Ionicons name="nutrition" size={14} color={colors.primary} />
          <Text style={dpStyles.detailLabel}>Öğünler</Text>
          <Text style={dpStyles.detailVal}>{mealCount}/{totalMeals > 0 ? totalMeals : '—'}</Text>
        </View>
        {totalMeals > 0 && <AnimatedProgressBar progress={mealProgress} color={colors.primary} />}
        <View style={[dpStyles.detailRow, { marginTop: 10 }]}>
          <Ionicons name="barbell" size={14} color={colors.workoutColor} />
          <Text style={dpStyles.detailLabel}>Antrenman</Text>
          <Text style={dpStyles.detailVal}>{workoutCount}/{totalWorkouts > 0 ? totalWorkouts : '—'}</Text>
        </View>
        {totalWorkouts > 0 && <AnimatedProgressBar progress={workoutProgress} color={colors.workoutColor} />}
      </View>
      {totalMeals === 0 && totalWorkouts === 0 && (
        <Text style={dpStyles.hint}>Planlar sekmesinden AI'a plan iste 💡</Text>
      )}
    </View>
  );
}

const getDpStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: colors.cardBackground, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  sub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  pct: { fontSize: 20, fontWeight: '700' },
  congrats: { fontSize: 12, color: colors.primary, marginTop: 6, fontWeight: '600' },
  details: { marginTop: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  detailLabel: { flex: 1, fontSize: 12, color: colors.textSecondary },
  detailVal: { fontSize: 12, fontWeight: '700', color: colors.text },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 10, textAlign: 'center' },
});

// ─── Profil Menü Modalları ──────────────────────────────────────────────────

// MenuModal moved to components/modals/MenuModal.tsx

// Modal components moved to components/modals/

// ─── Haftalık İlerleme Grafiği ────────────────────────────────────────────────────

function WeeklyBar({ value, maxValue, color }: { value: number; maxValue: number; color: string }) {
  const { colors } = useTheme();
  const wc = getWcStyles(colors);
  
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: maxValue > 0 ? value / maxValue : 0,
      duration: 700,
      useNativeDriver: false,
    }).start();
  }, [value, maxValue]);
  const height = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={wc.barBg}>
      <Animated.View style={[wc.barFill, { height, backgroundColor: color }]} />
    </View>
  );
}

function WeeklyChart({ uid }: { uid: string }) {
  const { colors } = useTheme();
  const wc = getWcStyles(colors);

  // Dinamik renkler
  const PRIMARY = colors.primary;
  const WORKOUT_COLOR = colors.workoutColor;

  const [data, setData] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchWeeklyCompletions(uid)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [uid]);

  const maxMeal    = Math.max(...data.map((d) => d.mealCount),    1);
  const maxWorkout = Math.max(...data.map((d) => d.workoutCount), 1);

  if (loading) {
    return (
      <View style={wc.card}>
        <SkeletonBar width="50%" height={14} style={{ marginBottom: 16 }} />
        <View style={wc.barsRow}>
          {[...Array(7)].map((_, i) => (
            <View key={i} style={wc.barCol}>
              <View style={[wc.barBg, { overflow: 'hidden' }]}>
                <SkeletonBar width="100%" height={Math.random() * 60 + 20} style={{ position: 'absolute', bottom: 0, borderRadius: 4 }} />
              </View>
              <SkeletonBar width={24} height={10} style={{ marginTop: 6 }} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  const hasAnyData = data.some((d) => d.mealCount + d.workoutCount > 0);

  return (
    <View style={wc.card}>
      <View style={wc.header}>
        <View style={wc.iconBox}>
          <Ionicons name="bar-chart" size={18} color={PRIMARY} />
        </View>
        <Text style={wc.title}>Bu Hafta</Text>
        <View style={wc.legend}>
          <View style={[wc.dot, { backgroundColor: PRIMARY }]} />
          <Text style={wc.legendText}>Yemek</Text>
          <View style={[wc.dot, { backgroundColor: WORKOUT_COLOR }]} />
          <Text style={wc.legendText}>Antrenman</Text>
        </View>
      </View>

      {!hasAnyData ? (
        <Text style={wc.empty}>Henüz tamamlama kaydı yok. Plan ekleyip başla! 💪</Text>
      ) : (
        <View style={wc.barsRow}>
          {data.map((d) => (
            <View key={d.date} style={wc.barCol}>
              {/* Antrenman (arkaplanda) */}
              <View style={wc.stackedBars}>
                <WeeklyBar value={d.workoutCount} maxValue={maxWorkout} color={WORKOUT_COLOR + 'AA'} />
                <WeeklyBar value={d.mealCount}    maxValue={maxMeal}    color={PRIMARY} />
              </View>
              <Text style={[wc.dayLabel, d.date === today && { color: PRIMARY, fontWeight: '700' }]}>
                {d.day}
              </Text>
              {d.date === today && <View style={wc.todayDot} />}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const getWcStyles = (colors: ThemeColors) => StyleSheet.create({
  card: { backgroundColor: colors.cardBackground, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 3 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primary + '1A', alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 10, color: colors.textSecondary, marginRight: 6 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 90 },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  stackedBars: { flex: 1, width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barBg: { flex: 1, height: '100%', backgroundColor: colors.skeletonBg, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  dayLabel: { fontSize: 10, color: colors.textMuted, textAlign: 'center' },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
});

// EditProfileModal, EditField moved to components/modals/

// ─── Ana Ekran ────────────────────────────────────────────────────────────────

export default function ProfilScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const store = useUserStore();
  const { displayName, email, height, weight, targetWeight, bmi, goal, uid } = store;
  const [editVisible,    setEditVisible]    = useState(false);
  const [accountVisible, setAccountVisible] = useState(false);
  const [notifVisible,   setNotifVisible]   = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [helpVisible,    setHelpVisible]    = useState(false);

  const menuActions: Record<string, () => void> = {
    '1': () => setAccountVisible(true),
    '2': () => setNotifVisible(true),
    '3': () => setPrivacyVisible(true),
    '4': () => setHelpVisible(true),
  };

  // bmi'yi mevcut store'dan al (updateUserProfile bmi hesaplayabilir)
  const stats = [
    { label: 'Boy',   value: height       ? `${height} cm`       : '—', icon: 'resize'    as const, color: colors.workoutColor },
    { label: 'Kilo',  value: weight       ? `${weight} kg`       : '—', icon: 'scale'     as const, color: colors.warning },
    { label: 'Hedef', value: targetWeight ? `${targetWeight} kg` : '—', icon: 'trophy'    as const, color: colors.primary },
    { label: 'BMI',   value: bmi          ? `${bmi}`             : '—', icon: 'analytics' as const, color: colors.info },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.name}>{displayName || 'Kullanıcı'}</Text>
          <Text style={styles.email}>{email || ''}</Text>
          {goal && (
            <View style={styles.goalBadge}>
              <Text style={styles.goalBadgeText}>{GOAL_LABELS[goal]}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={() => setEditVisible(true)}>
            <Ionicons name="create-outline" size={15} color={colors.primary} />
            <Text style={styles.editBtnText}>Profili Düzenle</Text>
          </TouchableOpacity>
        </View>

        {/* Streak & Başarılar */}
        <StreakCard />

        {/* Günlük İlerleme */}
        {uid && <DailyProgressCard uid={uid} />}

        {/* Haftalık Grafik */}
        {uid && <WeeklyChart uid={uid} />}

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '1A' }]}>
                <Ionicons name={s.icon} size={20} color={s.color} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {MENU_ITEMS.map((item, idx) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={menuActions[item.id]}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {idx < MENU_ITEMS.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={() => logoutUser().catch(console.error)}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Profil Düzenleme Modal */}
      <EditProfileModal visible={editVisible} onClose={() => setEditVisible(false)} />

      {/* Menü Modalları */}
      <AccountSettingsModal visible={accountVisible} onClose={() => setAccountVisible(false)} />
      <NotificationsModal  visible={notifVisible}   onClose={() => setNotifVisible(false)} />
      <PrivacyModal        visible={privacyVisible} onClose={() => setPrivacyVisible(false)} />
      <HelpModal           visible={helpVisible}    onClose={() => setHelpVisible(false)} />
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 20, gap: 20 },
  header: { alignItems: 'center', gap: 8 },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, elevation: 6,
  },
  name:  { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
  email: { fontSize: 13, color: colors.textSecondary },
  goalBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: colors.primary + '1A', marginTop: 4 },
  goalBadgeText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: colors.primary },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    flex: 1, minWidth: '44%', backgroundColor: colors.cardBackground,
    borderRadius: 16, padding: 16, alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  menuCard: {
    backgroundColor: colors.cardBackground, borderRadius: 16, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 6, elevation: 2,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  menuLabel: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.error + '1A' },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
