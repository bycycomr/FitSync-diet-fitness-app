import React from 'react';
import { View, StyleSheet } from 'react-native';
import { IMessage, AvatarProps } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

export function CustomAvatar(props: AvatarProps<IMessage>) {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={styles.botAvatar}>
      <Ionicons name="fitness" size={16} color="#FFF" />
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  botAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
});
