import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '@/hooks/useTheme';

export interface EditFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType'];
  autoCapitalize?: React.ComponentProps<typeof TextInput>['autoCapitalize'];
  maxLength?: number;
}

export function EditField({
  label,
  value,
  onChange,
  placeholder,
  icon,
  keyboardType = 'default',
  autoCapitalize = 'none',
  maxLength,
}: EditFieldProps) {
  const { colors } = useTheme();
  const ef = getStyles(colors);

  const [focused, setFocused] = useState(false);

  return (
    <View style={ef.wrap}>
      <Text style={ef.label}>{label}</Text>
      <View style={[ef.box, focused && ef.boxFocused]}>
        <Ionicons
          name={icon}
          size={16}
          color={focused ? colors.primary : colors.textMuted}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={ef.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginLeft: 2 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  boxFocused: { borderColor: colors.primary },
  input: { flex: 1, fontSize: 15, color: colors.text },
});
