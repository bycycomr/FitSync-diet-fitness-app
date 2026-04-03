import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
  User,
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebaseConfig';
import { useUserStore, Goal } from '@/store/userStore';

export interface RegisterParams {
  displayName: string;
  email: string;
  password: string;
  height: number | null;
  weight: number | null;
  targetWeight: number | null;
  goal: Goal | null;
}

/**
 * Yeni kullanıcı kaydı:
 * 1. Firebase Auth ile hesap oluşturur
 * 2. displayName'i Auth profiline yazar
 * 3. Zustand verilerini Firestore 'users' koleksiyonuna kaydeder
 * 4. Zustand store'u günceller
 */
export async function registerUser(params: RegisterParams): Promise<User> {
  const { displayName, email, password, height, weight, targetWeight, goal } = params;

  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  // Auth profiline isim yaz
  await updateProfile(user, { displayName });

  // Firestore'a kullanıcı belgesi yaz
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    displayName,
    email,
    height: height ?? null,
    weight: weight ?? null,
    targetWeight: targetWeight ?? null,
    goal: goal ?? null,
    bmi:
      height && weight
        ? parseFloat((weight / ((height / 100) * (height / 100))).toFixed(1))
        : null,
    createdAt: serverTimestamp(),
  });

  // Zustand store'u güncelle
  const store = useUserStore.getState();
  store.setProfile({ displayName, email, uid: user.uid });
  if (height || weight || targetWeight || goal) {
    store.setBodyMetrics({
      height: height ?? undefined,
      weight: weight ?? undefined,
      targetWeight: targetWeight ?? undefined,
      goal: goal ?? undefined,
    });
  }

  return user;
}

/**
 * Mevcut kullanıcı girişi:
 * 1. Firebase Auth ile oturum açar
 * 2. Zustand store'u günceller
 */
export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  useUserStore.getState().setProfile({
    displayName: user.displayName ?? '',
    email: user.email ?? '',
    uid: user.uid,
  });

  return user;
}

/**
 * Oturumu kapat ve Zustand store'u sıfırla
 */
export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
  useUserStore.getState().reset();
}

/**
 * Auth durum dinleyicisi — kök layout'ta kullanılır
 */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Şifre değiştirme — önce mevcut şifre ile re-auth yapılır
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Oturum bulunamadı.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/**
 * Hesap silme — re-auth + Firestore belgesi + Auth kaydı silme
 */
export async function deleteAccount(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('Oturum bulunamadı.');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  // Firestore belgesini sil
  await deleteDoc(doc(db, 'users', user.uid)).catch(() => {});
  // Auth kaydını sil
  await deleteUser(user);
  useUserStore.getState().reset();
}
