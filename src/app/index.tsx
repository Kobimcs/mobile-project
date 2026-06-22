import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type UserRole = 'student' | 'course_rep' | 'admin';

type LoginResponse = {
  token: string;
  user: {
    id: number;
    fullName: string;
    indexNumber?: string;
    referenceNumber?: string;
    email: string;
    role: UserRole;
    programme?: string;
    level?: string;
  };
};

const API_URL = 'http://localhost:8080/api';

async function saveItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    const cleanedIdentifier = identifier.trim();
    const cleanedPassword = password.trim();

    if (!cleanedIdentifier || !cleanedPassword) {
      Alert.alert(
        'Missing details',
        'Please enter your index number, reference number, or email and password.'
      );
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanedIdentifier,
          password: cleanedPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        Alert.alert(
          'Login failed',
          errorData?.message || 'Invalid credentials. Please try again.'
        );
        return;
      }

      const data: LoginResponse = await response.json();

      await saveItem('authToken', data.token);
      await saveItem('userId', String(data.user.id));
      await saveItem('userName', data.user.fullName);
      await saveItem('userEmail', data.user.email);
      await saveItem('userRole', data.user.role);

      if (data.user.indexNumber) await saveItem('indexNumber', data.user.indexNumber);
      if (data.user.referenceNumber) await saveItem('referenceNumber', data.user.referenceNumber);
      if (data.user.programme) await saveItem('programme', data.user.programme);
      if (data.user.level) await saveItem('level', data.user.level);

      if (data.user.role === 'student') {
        router.replace('/student-dashboard');
        return;
      }

      if (data.user.role === 'course_rep') {
        router.replace('/rep-panel');
        return;
      }

      if (data.user.role === 'admin') {
        router.replace('/admin-panel');
        return;
      }

      Alert.alert('Login failed', 'Your account role is not recognized.');
    } catch (error) {
      Alert.alert(
        'Connection error',
        'Unable to connect to the server. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>ClassMate</Text>
        <Text style={styles.subtitle}>Sign in to your academic dashboard</Text>

        <TextInput
          style={styles.input}
          placeholder="Index Number / Reference Number / Email"
          placeholderTextColor={AppColors.mutedText}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={AppColors.mutedText}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={AppColors.card} />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.linkText}>Create a new account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/forgot-password')}>
          <Text style={styles.secondaryLink}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.background },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: AppColors.primary, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: AppColors.mutedText, marginBottom: 32, textAlign: 'center' },
  input: { height: 52, borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, paddingHorizontal: 16, marginBottom: 16, fontSize: 16, backgroundColor: AppColors.card, color: AppColors.text },
  button: { height: 52, backgroundColor: AppColors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  disabledButton: { backgroundColor: AppColors.primaryDark },
  buttonText: { color: AppColors.card, fontSize: 16, fontWeight: '700' },
  linkText: { marginTop: 22, textAlign: 'center', color: AppColors.primary, fontSize: 15, fontWeight: '600' },
  secondaryLink: { marginTop: 12, textAlign: 'center', color: AppColors.mutedText, fontSize: 14, fontWeight: '500' },
});
