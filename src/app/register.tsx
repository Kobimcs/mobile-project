import { AppColors } from '@/constants/colors';
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

type Role = 'student' | 'course_rep';

const API_URL = 'http://localhost:8080/api';

function getPasswordStrength(password: string): { label: string; color: string } {
    if (password.length === 0) return { label: '', color: 'transparent' };
    if (password.length < 6) return { label: 'Too short', color: '#e74c3c' };
    if (password.length < 8) return { label: 'Weak', color: '#e67e22' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { label: 'Strong', color: '#27ae60' };
    return { label: 'Medium', color: '#f1c40f' };
}

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [indexNumber, setIndexNumber] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [email, setEmail] = useState('');
    const [programme, setProgramme] = useState('');
    const [level, setLevel] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<Role>('student');
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password);
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    const handleRegister = async () => {
        const cleanedFullName = fullName.trim();
        const cleanedIndexNumber = indexNumber.trim();
        const cleanedReferenceNumber = referenceNumber.trim();
        const cleanedEmail = email.trim().toLowerCase();
        const cleanedProgramme = programme.trim();
        const cleanedLevel = level.trim();
        const cleanedPassword = password.trim();
        const cleanedConfirmPassword = confirmPassword.trim();

        if (!cleanedFullName) { Alert.alert('Missing field', 'Please enter your full name.'); return; }
        if (!cleanedIndexNumber) { Alert.alert('Missing field', 'Please enter your index number.'); return; }
        if (!cleanedReferenceNumber) { Alert.alert('Missing field', 'Please enter your reference number.'); return; }
        if (!cleanedEmail || !cleanedEmail.includes('@')) { Alert.alert('Invalid email', 'Please enter a valid email address.'); return; }
        if (!cleanedProgramme) { Alert.alert('Missing field', 'Please enter your programme.'); return; }
        if (!cleanedLevel) { Alert.alert('Missing field', 'Please enter your level.'); return; }
        if (cleanedPassword.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return; }
        if (cleanedPassword !== cleanedConfirmPassword) { Alert.alert('Password mismatch', 'Both passwords must match.'); return; }

        try {
            setIsLoading(true);

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: cleanedFullName,
                    indexNumber: cleanedIndexNumber,
                    referenceNumber: cleanedReferenceNumber,
                    email: cleanedEmail,
                    programme: cleanedProgramme,
                    level: cleanedLevel,
                    password: cleanedPassword,
                    role: role,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                Alert.alert('Registration failed', errorData?.message || 'The index number, reference number, or email may already be in use.');
                return;
            }

            if (role === 'course_rep') {
                Alert.alert(
                    'Request submitted',
                    'Your course rep request has been submitted. Please wait for admin approval before signing in.',
                    [{ text: 'OK', onPress: () => router.replace('/') }]
                );
            } else {
                Alert.alert(
                    'Account created',
                    'Your account has been created successfully. Please sign in.',
                    [{ text: 'Sign in', onPress: () => router.replace('/') }]
                );
            }
        } catch (error) {
            Alert.alert('Connection error', 'Unable to connect to the server. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Register for KNUST ClassMate</Text>

                {/* Role Selector */}
                <Text style={styles.sectionLabel}>I am registering as:</Text>
                <View style={styles.roleRow}>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'student' && styles.roleButtonActive]}
                        onPress={() => setRole('student')}
                    >
                        <Text style={[styles.roleButtonText, role === 'student' && styles.roleButtonTextActive]}>
                            Student
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleButton, role === 'course_rep' && styles.roleButtonActive]}
                        onPress={() => setRole('course_rep')}
                    >
                        <Text style={[styles.roleButtonText, role === 'course_rep' && styles.roleButtonTextActive]}>
                            Course Rep
                        </Text>
                    </TouchableOpacity>
                </View>

                {role === 'course_rep' && (
                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            Course rep accounts require admin approval before you can sign in.
                        </Text>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={AppColors.mutedText}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Index Number"
                    placeholderTextColor={AppColors.mutedText}
                    value={indexNumber}
                    onChangeText={setIndexNumber}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Student ID / Reference Number"
                    placeholderTextColor={AppColors.mutedText}
                    value={referenceNumber}
                    onChangeText={setReferenceNumber}
                    autoCapitalize="characters"
                    autoCorrect={false}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={AppColors.mutedText}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Programme (e.g. BSc Computer Science)"
                    placeholderTextColor={AppColors.mutedText}
                    value={programme}
                    onChangeText={setProgramme}
                    autoCapitalize="words"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Level (e.g. 200)"
                    placeholderTextColor={AppColors.mutedText}
                    value={level}
                    onChangeText={setLevel}
                    keyboardType="number-pad"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={AppColors.mutedText}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                {password.length > 0 && (
                    <View style={styles.strengthRow}>
                        <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
                        <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                            {passwordStrength.label}
                        </Text>
                    </View>
                )}

                <TextInput
                    style={[
                        styles.input,
                        passwordsMismatch && styles.inputError,
                        passwordsMatch && styles.inputSuccess,
                    ]}
                    placeholder="Confirm Password"
                    placeholderTextColor={AppColors.mutedText}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                {passwordsMismatch && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                )}
                {passwordsMatch && (
                    <Text style={styles.successText}>Passwords match</Text>
                )}

                <TouchableOpacity
                    style={[styles.button, isLoading && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={AppColors.card} />
                    ) : (
                        <Text style={styles.buttonText}>
                            {role === 'course_rep' ? 'Submit Request' : 'Create Account'}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.replace('/')}>
                    <Text style={styles.linkText}>Already have an account? Sign in</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.background },
    scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
    title: { fontSize: 32, fontWeight: 'bold', color: AppColors.primary, textAlign: 'center', marginBottom: 8 },
    subtitle: { fontSize: 16, color: AppColors.mutedText, textAlign: 'center', marginBottom: 24 },
    sectionLabel: { fontSize: 14, fontWeight: '700', color: AppColors.text, marginBottom: 10 },
    roleRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    roleButton: { flex: 1, height: 48, borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: AppColors.card },
    roleButtonActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
    roleButtonText: { fontSize: 15, fontWeight: '700', color: AppColors.mutedText },
    roleButtonTextActive: { color: AppColors.card },
    infoBox: { backgroundColor: AppColors.card, borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: AppColors.border },
    infoText: { fontSize: 13, color: AppColors.mutedText, lineHeight: 18 },
    input: { height: 52, borderWidth: 1, borderColor: AppColors.border, borderRadius: 10, paddingHorizontal: 16, marginBottom: 14, fontSize: 16, backgroundColor: AppColors.card, color: AppColors.text },
    inputError: { borderColor: '#e74c3c' },
    inputSuccess: { borderColor: '#27ae60' },
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -8, marginBottom: 10 },
    strengthBar: { height: 4, flex: 1, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: '700' },
    errorText: { fontSize: 12, color: '#e74c3c', marginTop: -10, marginBottom: 10 },
    successText: { fontSize: 12, color: '#27ae60', marginTop: -10, marginBottom: 10 },
    button: { height: 52, backgroundColor: AppColors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    disabledButton: { backgroundColor: AppColors.primaryDark },
    buttonText: { color: AppColors.card, fontSize: 16, fontWeight: '700' },
    linkText: { marginTop: 20, textAlign: 'center', color: AppColors.primary, fontSize: 15, fontWeight: '600' },
});