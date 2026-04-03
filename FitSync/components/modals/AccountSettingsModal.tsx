import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';
import { changePassword, deleteAccount } from '@/services/authService';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from './MenuModal';
import { EditField } from './EditField';

export interface AccountSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ visible, onClose }: AccountSettingsModalProps) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [deletePw, setDeletePw] = useState('');
  const [loading, setLoading] = useState(false);

  const themeMode = useUserStore((s) => s.themeMode);
  const setThemeMode = useUserStore((s) => s.setThemeMode);
  const { colors } = useTheme();
  const ms = getStyles(colors);

  const handleChangePw = async () => {
    if (!currentPw || newPw.length < 6) {
      return Alert.alert('Hata', 'Mevcut şifre ve en az 6 karakterli yeni şifre girin.');
    }
    setLoading(true);
    try {
      await changePassword(currentPw, newPw);
      Alert.alert('✅ Başarılı', 'Şifreniz güncellendi.');
      setCurrentPw('');
      setNewPw('');
    } catch {
      Alert.alert('Hata', 'Mevcut şifreniz yanlış olabilir.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Hesabı Sil',
      'Bu işlem geri alınamaz. Tüm verileriniz silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            if (!deletePw) {
              return Alert.alert('Hata', 'Şifrenizi girin.');
            }
            setLoading(true);
            try {
              await deleteAccount(deletePw);
            } catch {
              Alert.alert('Hata', 'Şifreniz yanlış veya işlem başarısız.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <MenuModal visible={visible} onClose={onClose} title="Hesap Ayarları">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Tema Seçimi */}
        <View style={ms.section}>
          <Text style={ms.sectionLabel}>🎨 Görünüm</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['light', 'dark', 'system'] as const).map((m) => {
              const active = themeMode === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setThemeMode(m)}
                  style={[
                    ms.themeBtn,
                    {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + '10' : 'transparent',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      ms.themeBtnText,
                      { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '600' },
                    ]}
                  >
                    {m === 'light' ? 'Açık' : m === 'dark' ? 'Koyu' : 'Sistem'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Şifre Değiştir */}
        <View style={ms.section}>
          <Text style={ms.sectionLabel}>🔒 Şifre Değiştir</Text>
          <EditField
            label="Mevcut Şifre"
            value={currentPw}
            onChange={setCurrentPw}
            placeholder="********"
            icon="lock-closed-outline"
          />
          <EditField
            label="Yeni Şifre"
            value={newPw}
            onChange={setNewPw}
            placeholder="En az 6 karakter"
            icon="lock-open-outline"
          />
          <TouchableOpacity style={ms.btn} onPress={handleChangePw} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ms.btnGradient}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={ms.btnText}>Şifreyi Güncelle</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Hesabı Sil */}
        <View style={[ms.section, { borderColor: colors.error + '33', borderWidth: 1 }]}>
          <Text style={[ms.sectionLabel, { color: colors.error }]}>⚠️ Hesabı Sil</Text>
          <Text style={ms.hint}>Bu işlem geri alınamaz. Tüm plan ve sohbet geçmişiniz silinecek.</Text>
          <EditField
            label="Şifreni Onayla"
            value={deletePw}
            onChange={setDeletePw}
            placeholder="Mevcut şifren"
            icon="trash-outline"
          />
          <TouchableOpacity style={ms.dangerBtn} onPress={handleDelete} disabled={loading} activeOpacity={0.85}>
            <Text style={ms.dangerBtnText}>Hesabı Kalıcı Olarak Sil</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MenuModal>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 18,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  hint: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  btn: { borderRadius: 14, overflow: 'hidden' },
  btnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  dangerBtn: {
    backgroundColor: colors.error + '1A',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerBtnText: { fontSize: 15, fontWeight: '700', color: colors.error },
  themeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  themeBtnText: { fontSize: 13 },
});
