import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Send, IMessage, SendProps } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

export function CustomSend(props: SendProps<IMessage>) {
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

const getStyles = (colors: ThemeColors) => StyleSheet.create({
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
});
