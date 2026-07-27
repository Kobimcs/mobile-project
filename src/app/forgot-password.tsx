import { AppColors } from '@/constants/colors';
import { API_BASE_URL as API_URL } from '@/constants/config';
import { Fonts } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

// Same wording as the backend's generic response — shown regardless of
// whether the email is actually registered, so this screen never becomes an
// account-enumeration signal either.
const GENERIC_SENT_MESSAGE = "If an account exists for that email, we've sent a code.";

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        const cleanedEmail = email.trim().toLowerCase();
        if (!cleanedEmail || !cleanedEmail.includes('@')) {
            Alert.alert('Invalid email', 'Please enter a valid email address.');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: cleanedEmail }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                Alert.alert('Something went wrong', errorData?.message || 'Please try again.');
                return;
            }

            Alert.alert('Check your email', GENERIC_SENT_MESSAGE, [
                {
                    text: 'Enter code',
                    onPress: () => router.push({ pathname: '/reset-password', params: { email: cleanedEmail } }),
                },
            ]);
        } catch (error) {
            Alert.alert('Connection error', 'Unable to connect to the server. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')} hitSlop={8}>
                    <Ionicons name="chevron-back" size={22} color={AppColors.text} />
                </TouchableOpacity>

                <Text style={styles.heading}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                    Enter your account email and we'll send you a 6-digit code to reset your password.
                </Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                    style={styles.input}
                    placeholderTextColor={AppColors.mutedText}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                />

                <TouchableOpacity style={[styles.button, isLoading && styles.disabledButton]} onPress={handleSubmit} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={AppColors.card} /> : <Text style={styles.buttonText}>Send code</Text>}
                </TouchableOpacity>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Remembered it?</Text>
                    <TouchableOpacity onPress={() => router.replace('/')}>
                        <Text style={styles.footerLink}>Back to sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.background },
    content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
    backButton: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.card,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    },
    heading: { fontSize: 26, fontFamily: Fonts.heading, color: AppColors.text },
    subtitle: { fontSize: 15, color: AppColors.mutedText, marginTop: 6, marginBottom: 24, lineHeight: 21, fontFamily: Fonts.body },
    label: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: AppColors.text, marginBottom: 8 },
    input: {
        height: 54, borderWidth: 1, borderColor: AppColors.border, borderRadius: 14,
        paddingHorizontal: 16, marginBottom: 20, fontSize: 16, color: AppColors.text,
        backgroundColor: AppColors.card, fontFamily: Fonts.body,
    },
    button: {
        height: 54, backgroundColor: AppColors.primary, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
    },
    disabledButton: { backgroundColor: AppColors.primaryDark },
    buttonText: { color: AppColors.card, fontSize: 16, fontFamily: Fonts.bodyBold },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
    footerText: { fontSize: 14, color: AppColors.mutedText, fontFamily: Fonts.body },
    footerLink: { fontSize: 14, fontFamily: Fonts.bodyBold, color: AppColors.primary },
});
