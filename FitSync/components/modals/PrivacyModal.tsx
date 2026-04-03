import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from './MenuModal';

export interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  const { colors } = useTheme();
  const ms = getStyles(colors);

  return (
    <MenuModal visible={visible} onClose={onClose} title="Gizlilik">
      <View style={ms.section}>
        <Text style={ms.sectionLabel}>🛡️ Verileriniz</Text>
        <Text style={ms.body}>
          FitSync, sağlık ve fitness hedeflerinize ulaşmanıza yardımcı olmak için boy, kilo, antrenman ve beslenme verilerini Firebase Firestore'da saklar.
        </Text>
        <Text style={ms.body}>Bu veriler hiçbir üçüncü tarafla paylaşılmaz.</Text>
      </View>
      <View style={ms.section}>
        <Text style={ms.sectionLabel}>🗑️ Veri Silme</Text>
        <Text style={ms.body}>
          Tüm verilerinizi silmek için "Hesap Ayarları" → "Hesabı Sil" seçeneğini kullanabilirsiniz.
        </Text>
        <TouchableOpacity
          style={ms.outlineBtn}
          onPress={() => Alert.alert('Bilgi', 'Hesap ayarlarından hesabınızı ve tüm verilerinizi silebilirsiniz.')}
          activeOpacity={0.8}
        >
          <Text style={ms.outlineBtnText}>Veri Silme Hakkında Bilgi Al</Text>
        </TouchableOpacity>
      </View>
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
  body: { fontSize: 14, color: colors.textSecondary, lineHeight: 22 },
  outlineBtn: {
    borderRadius: 14,
    height: 50,
    borderWidth: 1.5,
    borderColor: '#5C6BC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 14, fontWeight: '600', color: '#5C6BC0' },
});
