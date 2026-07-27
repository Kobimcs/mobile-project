import { AppColors } from '@/constants/colors';
import { API_BASE_URL as API_URL } from '@/constants/config';
import { Fonts } from '@/constants/ui';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

// Matches the backend's generic response wording — shown for every resend,
// regardless of whether the email exists or the request got rate-limited.
const GENERIC_SENT_MESSAGE = "If an account exists for that email, we've sent a code.";
const RESEND_COOLDOWN_SECONDS = 60;

type FieldProps = TextInputProps & {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    borderColor?: string;
    rightSlot?: React.ReactNode;
};

function Field({ icon, label, borderColor, rightSlot, ...inputProps }: FieldProps) {
    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[styles.field, borderColor ? { borderColor } : null]}>
                <Ionicons name={icon} size={18} color={AppColors.mutedText} />
                <TextInput style={styles.input} placeholderTextColor={AppColors.mutedText} {...inputProps} />
                {rightSlot}
            </View>
        </View>
    );
}

export default function ResetPasswordScreen() {
    const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

    const [email, setEmail] = useState(emailParam ?? '');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    // A code was just sent to get here, so the resend cooldown starts immediately.
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const codeValid = /^\d{6}$/.test(code.trim());
    const passwordTooShort = newPassword.length > 0 && newPassword.length < 6;
    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

    const canSubmit =
        email.trim().length > 0 &&
        codeValid &&
        newPassword.length >= 6 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword &&
        !isSubmitting;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        try {
            setIsSubmitting(true);
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    code: code.trim(),
                    newPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                // Keep whatever the user typed — don't clear on failure so they
                // can just fix the wrong field and retry.
                Alert.alert('Could not reset password', errorData?.message || 'Please try again.');
                return;
            }

            Alert.alert('Password reset', 'Your password has been reset. Please sign in with your new password.', [
                { text: 'Sign in', onPress: () => router.replace('/') },
            ]);
        } catch (error) {
            Alert.alert('Connection error', 'Unable to connect to the server. Please check your connection and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        const cleanedEmail = email.trim().toLowerCase();
        if (resendCooldown > 0 || isResending || !cleanedEmail || !cleanedEmail.includes('@')) return;
        try {
            setIsResending(true);
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
            Alert.alert('Code sent', GENERIC_SENT_MESSAGE);
        } catch {
            Alert.alert('Connection error', 'Unable to connect to the server. Please check your connection and try again.');
        } finally {
            setIsResending(false);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')} hitSlop={8}>
                    <Ionicons name="chevron-back" size={22} color={AppColors.text} />
                </TouchableOpacity>

                <Text style={styles.heading}>Enter your code</Text>
                <Text style={styles.subtitle}>
                    Enter the 6-digit code we emailed you, then choose a new password.
                </Text>

                <Field
                    label="Email"
                    icon="mail-outline"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                />

                <Field
                    label="6-digit code"
                    icon="keypad-outline"
                    value={code}
                    onChangeText={(v) => setCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <Field
                    label="New password"
                    icon="lock-closed-outline"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    borderColor={passwordTooShort ? AppColors.danger : undefined}
                    rightSlot={
                        <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={AppColors.mutedText} />
                        </TouchableOpacity>
                    }
                />
                {passwordTooShort && <Text style={styles.errorText}>Password must be at least 6 characters.</Text>}

                <Field
                    label="Confirm new password"
                    icon="lock-closed-outline"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    borderColor={passwordsMismatch ? AppColors.danger : passwordsMatch ? AppColors.success : undefined}
                />
                {passwordsMismatch && <Text style={styles.errorText}>Passwords do not match</Text>}
                {passwordsMatch && <Text style={styles.successText}>Passwords match</Text>}

                <TouchableOpacity style={[styles.button, !canSubmit && styles.disabledButton]} onPress={handleSubmit} disabled={!canSubmit}>
                    {isSubmitting ? <ActivityIndicator color={AppColors.card} /> : <Text style={styles.buttonText}>Reset password</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.resendRow}
                    onPress={handleResend}
                    disabled={resendCooldown > 0 || isResending}
                >
                    {isResending ? (
                        <ActivityIndicator size="small" color={AppColors.primary} />
                    ) : (
                        <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get a code? Resend"}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerRow}>
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
    fieldGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: AppColors.text, marginBottom: 8 },
    field: {
        flexDirection: 'row', alignItems: 'center', gap: 10, height: 54,
        borderWidth: 1, borderColor: AppColors.border, borderRadius: 14, paddingHorizontal: 14,
        backgroundColor: AppColors.card,
    },
    input: { flex: 1, fontSize: 15, color: AppColors.text, fontFamily: Fonts.body },
    errorText: { fontSize: 12, color: AppColors.danger, marginTop: -8, marginBottom: 14, fontFamily: Fonts.bodyMedium },
    successText: { fontSize: 12, color: AppColors.success, marginTop: -8, marginBottom: 14, fontFamily: Fonts.bodyMedium },
    button: {
        height: 54, backgroundColor: AppColors.primary, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginTop: 6,
    },
    disabledButton: { backgroundColor: AppColors.border },
    buttonText: { color: AppColors.card, fontSize: 16, fontFamily: Fonts.bodyBold },
    resendRow: { alignItems: 'center', marginTop: 18 },
    resendText: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: AppColors.primary },
    resendTextDisabled: { color: AppColors.mutedText },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
    footerLink: { fontSize: 14, fontFamily: Fonts.bodyBold, color: AppColors.primary },
});
