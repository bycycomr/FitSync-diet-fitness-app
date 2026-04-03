import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';
import { MenuModal } from './MenuModal';

const FAQ = [
  { q: 'Planlarım nereden görebilirim?', a: 'Alt menüden "Planlar" sekmesine geç. AI asistanından plan isteðinde orada görünür.' },
  { q: 'AI asistana nasıl ulaşırım?', a: '"Sohbet" sekmesinden mesaj yaz. Diyet ve antrenman konularında yardımcı olur.' },
  { q: 'Tamamladığım öğünler nerede görünür?', a: 'Profil ekranındaki "Bugünkü İlerleme" kartında ve haftalık grafikte görürürsün.' },
  { q: 'Profil bilgilerimi değiştirebilir miyim?', a: 'Evet! Profil ekranındaki "Profili Düzenle" butonuna bas.' },
  { q: 'Şifremi unuttum, ne yapmalıyım?', a: 'Giriş ekranındaki "Hesabı Ayarları"ndan şifre sıfırlama yapabilirsin.' },
];

export interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HelpModal({ visible, onClose }: HelpModalProps) {
  const { colors } = useTheme();
  const ms = getStyles(colors);

  return (
    <MenuModal visible={visible} onClose={onClose} title="Yardım & Destek">
      <View style={ms.section}>
        <Text style={ms.sectionLabel}>💭 Sıkca Sorulan Sorular</Text>
        {FAQ.map((item, i) => (
          <View key={i} style={ms.faqItem}>
            <Text style={ms.faqQ}>{item.q}</Text>
            <Text style={ms.faqA}>{item.a}</Text>
            {i < FAQ.length - 1 && <View style={ms.divider} />}
          </View>
        ))}
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
  faqItem: { gap: 6 },
  faqQ: { fontSize: 14, fontWeight: '700', color: colors.text },
  faqA: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  divider: { height: 1, backgroundColor: colors.border },
});
