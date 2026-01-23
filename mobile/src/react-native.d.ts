// Mock React Native module for development
export const View = 'View';
export const Text = 'Text';
export const StyleSheet = { create: (styles: any) => styles };
export const ScrollView = 'ScrollView';
export const TouchableOpacity = 'TouchableOpacity';
export const TextInput = 'TextInput';
export const ActivityIndicator = 'ActivityIndicator';
export const Alert = {
  alert: (title: string, message?: string) => console.log(title, message),
};
export const KeyboardAvoidingView = 'KeyboardAvoidingView';
export const Platform = { select: (options: any) => options.default || options.ios || options.android };
