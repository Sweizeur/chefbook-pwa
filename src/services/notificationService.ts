import { Platform } from 'react-native';

export class NotificationService {
  static alert(title: string, message?: string, buttons?: Array<{ text: string; onPress?: () => void }>): void {
    if (Platform.OS === 'web') {
      // Utiliser les alertes web natives
      if (buttons && buttons.length > 1) {
        // Pour les confirmations (suppression, etc.)
        const result = window.confirm(`${title}\n\n${message || ''}`);
        if (result && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      } else {
        // Pour les alertes simples
        window.alert(`${title}\n\n${message || ''}`);
        if (buttons && buttons[0]?.onPress) {
          buttons[0].onPress();
        }
      }
    } else {
      // Sur mobile, utiliser Alert de React Native
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons);
    }
  }

  static confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
    if (Platform.OS === 'web') {
      const result = window.confirm(`${title}\n\n${message}`);
      if (result) {
        onConfirm();
      } else if (onCancel) {
        onCancel();
      }
    } else {
      const { Alert } = require('react-native');
      Alert.alert(
        title,
        message,
        [
          { text: 'Annuler', onPress: onCancel, style: 'cancel' },
          { text: 'Confirmer', onPress: onConfirm, style: 'destructive' }
        ]
      );
    }
  }

  static showError(title: string, message: string): void {
    this.alert(title, message);
  }

  static showSuccess(title: string, message: string): void {
    this.alert(title, message);
  }
}
