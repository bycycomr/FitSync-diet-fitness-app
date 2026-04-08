import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { InputToolbar, IMessage, InputToolbarProps } from 'react-native-gifted-chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

export function CustomInputToolbar(props: InputToolbarProps<IMessage>) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const styles = getStyles(colors, bottom);

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

const getStyles = (colors: ThemeColors, bottomInset: number) => StyleSheet.create({
  inputWrapper: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: bottomInset > 0 ? bottomInset : 8,
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
});
