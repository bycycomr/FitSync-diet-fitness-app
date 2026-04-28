import { Pedometer } from 'expo-sensors';

export interface HealthData {
  steps: number;
  activeCalories: number;
  stepGoal: number;
  isAvailable: boolean;
}

const STEP_GOAL = 10_000;
// Ortalama yetişkin için adım başına yaklaşık 0.04 kcal
const KCAL_PER_STEP = 0.04;

/**
 * Bugünün başından itibaren atılan adım sayısını döndürür.
 * Cihazda adım sayacı yoksa isAvailable: false döner.
 */
export async function getTodaySteps(): Promise<HealthData> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return { steps: 0, activeCalories: 0, stepGoal: STEP_GOAL, isAvailable: false };
    }

    const end = new Date();
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Pedometer.getStepCountAsync(start, end);
    const steps = result.steps ?? 0;
    const activeCalories = Math.round(steps * KCAL_PER_STEP);

    return { steps, activeCalories, stepGoal: STEP_GOAL, isAvailable: true };
  } catch {
    return { steps: 0, activeCalories: 0, stepGoal: STEP_GOAL, isAvailable: false };
  }
}

/**
 * Adım sayacını gerçek zamanlı dinler.
 * Döndürdüğü fonksiyon çağrılarak unsubscribe yapılır.
 */
export function subscribeToSteps(onUpdate: (steps: number) => void): () => void {
  let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;

  Pedometer.isAvailableAsync().then((available) => {
    if (!available) return;
    subscription = Pedometer.watchStepCount((result) => {
      onUpdate(result.steps);
    });
  }).catch(() => {});

  return () => { subscription?.remove(); };
}
