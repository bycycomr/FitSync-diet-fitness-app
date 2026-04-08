import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

interface StreamingBubbleProps {
  text: string;
}

/**
 * Streaming sırasında renderFooter içinde gösterilen bot balonu.
 * Metin kademeli olarak gelir; sağ alt köşede yanıp sönen imleç gösterilir.
 */
export function StreamingBubble({ text }: StreamingBubbleProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cursorOpacity]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          {text}
          <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>▌</Animated.Text>
        </Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      paddingHorizontal: 12,
      paddingBottom: 8,
      alignItems: 'flex-start',
    },
    bubble: {
      backgroundColor: colors.chatBotBubble,
      borderRadius: 18,
      borderBottomLeftRadius: 4,
      paddingHorizontal: 14,
      paddingVertical: 10,
      maxWidth: '80%',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 2,
    },
    text: {
      color: colors.chatBotText,
      fontSize: 15,
      lineHeight: 22,
    },
    cursor: {
      color: colors.primary,
      fontSize: 15,
    },
  });
