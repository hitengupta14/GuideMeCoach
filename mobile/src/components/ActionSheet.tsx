import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing, borderRadius, typography } from '../theme/spacing';
import { lightColors, darkColors } from '../theme/colors';

interface ActionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  items: Array<{
    label: string;
    icon?: string;
    onPress: () => void;
    variant?: 'default' | 'destructive';
  }>;
  isDark?: boolean;
}

export function ActionSheet({
  isVisible,
  onClose,
  title,
  items,
  isDark = false,
}: ActionSheetProps) {
  const colors = isDark ? darkColors : lightColors;
  const snapPoints = [200 + items.length * 56];

  return (
    <BottomSheet
      snapPoints={snapPoints}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={{ backgroundColor: colors.surface }}
      handleIndicatorStyle={{ backgroundColor: colors.border }}
    >
      {title && (
        <Text
          style={[
            typography.heading3,
            {
              color: colors.text,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.md,
            },
          ]}
        >
          {title}
        </Text>
      )}

      <BottomSheetScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              item.onPress();
              onClose();
            }}
            activeOpacity={0.7}
            style={[
              styles.item,
              {
                borderBottomColor: colors.border,
                paddingHorizontal: spacing.lg,
              },
            ]}
          >
            {item.icon && (
              <MaterialCommunityIcons
                name={item.icon as any}
                size={24}
                color={item.variant === 'destructive' ? colors.error : colors.primary}
                style={{ marginRight: spacing.md }}
              />
            )}
            <Text
              style={[
                typography.body1,
                {
                  color:
                    item.variant === 'destructive' ? colors.error : colors.text,
                  fontWeight: '500',
                  flex: 1,
                },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
