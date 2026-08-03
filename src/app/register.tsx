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
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    TouchableOpacity,
    View,
} from 'react-native';

function getPasswordStrength(password: string): { label: string; color: string } {
    if (password.length === 0) return { label: '', color: 'transparent' };
    if (password.length < 6) return { label: 'Too short', color: AppColors.danger };
    if (password.length < 8) return { label: 'Weak', color: '#E67E22' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { label: 'Strong', color: AppColors.success };
    return { label: 'Medium', color: AppColors.accent };
}

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LEVEL_OPTIONS = ['100', '200', '300', '400', '500', '600'] as const;
const CLASS_GROUP_OPTIONS = ['Group 1', 'Group 2'] as const;

// Matches the backend's case-insensitive, trimmed comparison for programme.
function isComputerScience(programme: string): boolean {
    return programme.trim().toLowerCase() === 'computer science';
}

type LevelFieldProps = {
    value: string;
    onSelect: (value: string) => void;
    borderColor?: string;
};

function LevelField({ value, onSelect, borderColor }: LevelFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>Level</Text>
            <TouchableOpacity
                style={[styles.field, borderColor ? { borderColor } : null]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="layers-outline" size={18} color={AppColors.mutedText} />
                <Text style={[styles.input, !value && styles.placeholderText]}>
                    {value ? `Level ${value}` : 'Select your level'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={AppColors.mutedText} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                    <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Select your level</Text>
                        {LEVEL_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.modalOption}
                                onPress={() => {
                                    onSelect(option);
                                    setVisible(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>Level {option}</Text>
                                {value === option && <Ionicons name="checkmark" size={18} color={AppColors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

type ClassGroupFieldProps = {
    value: string;
    onSelect: (value: string) => void;
    borderColor?: string;
};

function ClassGroupField({ value, onSelect, borderColor }: ClassGroupFieldProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.fieldGroup}>
            <Text style={styles.label}>Class Group</Text>
            <TouchableOpacity
                style={[styles.field, borderColor ? { borderColor } : null]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="people-outline" size={18} color={AppColors.mutedText} />
                <Text style={[styles.input, !value && styles.placeholderText]}>
                    {value || 'Select your class group'}
                </Text>
                <Ionicons name="chevron-down" size={18} color={AppColors.mutedText} />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                    <TouchableOpacity style={styles.modalSheet} activeOpacity={1} onPress={() => {}}>
                        <Text style={styles.modalTitle}>Select your class group</Text>
                        {CLASS_GROUP_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option}
                                style={styles.modalOption}
                                onPress={() => {
                                    onSelect(option);
                                    setVisible(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{option}</Text>
                                {value === option && <Ionicons name="checkmark" size={18} color={AppColors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

type StepIndicatorProps = { step: 1 | 2 | 3 };

const STEP_LABELS = ['Basic Info', 'Academic Info', 'Security'];

function StepIndicator({ step }: StepIndicatorProps) {
    return (
        <View style={styles.stepIndicatorWrap}>
            <Text style={styles.stepIndicatorText}>
                Step {step} of 3 · {STEP_LABELS[step - 1]}
            </Text>
            <View style={styles.stepBarTrack}>
                {[1, 2, 3].map((s) => (
                    <View
                        key={s}
                        style={[styles.stepBarSegment, s <= step ? styles.stepBarSegmentActive : styles.stepBarSegmentInactive]}
                    />
                ))}
            </View>
        </View>
    );
}

type StepErrors = Partial<Record<
    'fullName' | 'indexNumber' | 'referenceNumber' | 'programme' | 'email' | 'level' | 'classGroup' | 'password' | 'confirmPassword',
    string
>>;

export default function RegisterScreen() {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [errors, setErrors] = useState<StepErrors>({});

    // All field values live here, at the parent level, so they survive
    // Back/Next navigation between steps instead of resetting per-step.
    const [fullName, setFullName] = useState('');
    const [indexNumber, setIndexNumber] = useState('');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [email, setEmail] = useState('');
    const [programme, setProgramme] = useState('');
    const [level, setLevel] = useState('');
    const [classGroup, setClassGroup] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const passwordStrength = getPasswordStrength(password);
    const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
    const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

    function validateStep1(): boolean {
        const next: StepErrors = {};
        if (!fullName.trim()) next.fullName = 'Please enter your full name.';
        if (!indexNumber.trim()) next.indexNumber = 'Please enter your index number.';
        if (!referenceNumber.trim()) next.referenceNumber = 'Please enter your reference number.';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function validateStep2(): boolean {
        const next: StepErrors = {};
        if (!programme.trim()) next.programme = 'Please enter your programme.';
        if (!email.trim()) next.email = 'Please enter your email address.';
        else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Please enter a valid email address.';
        if (!level.trim()) next.level = 'Please select your level.';
        if (isComputerScience(programme) && !classGroup.trim()) next.classGroup = 'Please select your class group.';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleProgrammeChange(text: string) {
        setProgramme(text);
        if (!isComputerScience(text)) setClassGroup('');
    }

    function validateStep3(): boolean {
        const next: StepErrors = {};
        if (password.length < 6) next.password = 'Password must be at least 6 characters.';
        if (password !== confirmPassword) next.confirmPassword = 'Both passwords must match.';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleNext() {
        const isValid = step === 1 ? validateStep1() : validateStep2();
        if (isValid) setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
    }

    function handleBack() {
        setErrors({});
        setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
    }

    const handleRegister = async () => {
        if (!validateStep3()) return;

        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.trim(),
                    indexNumber: indexNumber.trim(),
                    referenceNumber: referenceNumber.trim(),
                    email: email.trim().toLowerCase(),
                    programme: programme.trim(),
                    level: level.trim(),
                    classGroup: isComputerScience(programme) ? classGroup.trim() : null,
                    password: password.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                Alert.alert('Registration failed', errorData?.message || 'The index number, reference number, or email may already be in use.');
                return;
            }

            Alert.alert('Account created', 'Your account has been created successfully. Please sign in.', [{ text: 'Sign in', onPress: () => router.replace('/') }]);
        } catch (error) {
            Alert.alert('Connection error', 'Unable to connect to the server. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')} hitSlop={8}>
                    <Ionicons name="chevron-back" size={22} color={AppColors.text} />
                </TouchableOpacity>

                <Text style={styles.heading}>Create your account</Text>
                <Text style={styles.subtitle}>Register with your KNUST student details to get started.</Text>

                <StepIndicator step={step} />

                {step === 1 && (
                    <>
                        <Field
                            label="Full name"
                            icon="person-outline"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            borderColor={errors.fullName ? AppColors.danger : undefined}
                        />
                        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

                        <Field
                            label="Index number"
                            icon="id-card-outline"
                            value={indexNumber}
                            onChangeText={setIndexNumber}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            borderColor={errors.indexNumber ? AppColors.danger : undefined}
                        />
                        {errors.indexNumber && <Text style={styles.errorText}>{errors.indexNumber}</Text>}

                        <Field
                            label="Reference number"
                            icon="card-outline"
                            value={referenceNumber}
                            onChangeText={setReferenceNumber}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            borderColor={errors.referenceNumber ? AppColors.danger : undefined}
                        />
                        {errors.referenceNumber && <Text style={styles.errorText}>{errors.referenceNumber}</Text>}
                    </>
                )}

                {step === 2 && (
                    <>
                        <Field
                            label="Programme"
                            icon="book-outline"
                            value={programme}
                            onChangeText={handleProgrammeChange}
                            autoCapitalize="words"
                            borderColor={errors.programme ? AppColors.danger : undefined}
                        />
                        {errors.programme && <Text style={styles.errorText}>{errors.programme}</Text>}

                        <Field
                            label="Email"
                            icon="mail-outline"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            borderColor={errors.email ? AppColors.danger : undefined}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <LevelField value={level} onSelect={setLevel} borderColor={errors.level ? AppColors.danger : undefined} />
                        {errors.level && <Text style={styles.errorText}>{errors.level}</Text>}

                        {isComputerScience(programme) && (
                            <>
                                <ClassGroupField
                                    value={classGroup}
                                    onSelect={setClassGroup}
                                    borderColor={errors.classGroup ? AppColors.danger : undefined}
                                />
                                {errors.classGroup && <Text style={styles.errorText}>{errors.classGroup}</Text>}
                            </>
                        )}
                    </>
                )}

                {step === 3 && (
                    <>
                        <Field
                            label="Password"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                            borderColor={errors.password ? AppColors.danger : undefined}
                            rightSlot={
                                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={AppColors.mutedText} />
                                </TouchableOpacity>
                            }
                        />
                        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        {password.length > 0 && (
                            <View style={styles.strengthRow}>
                                <View style={[styles.strengthBar, { backgroundColor: passwordStrength.color }]} />
                                <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
                            </View>
                        )}

                        <Field
                            label="Confirm password"
                            icon="lock-closed-outline"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showPassword}
                            borderColor={
                                errors.confirmPassword || passwordsMismatch
                                    ? AppColors.danger
                                    : passwordsMatch
                                        ? AppColors.success
                                        : undefined
                            }
                        />
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
                        {!errors.confirmPassword && passwordsMismatch && <Text style={styles.errorText}>Passwords do not match</Text>}
                        {passwordsMatch && <Text style={styles.successText}>Passwords match</Text>}
                    </>
                )}

                <View style={styles.stepButtonsRow}>
                    {step > 1 && (
                        <TouchableOpacity style={styles.backStepButton} onPress={handleBack}>
                            <Ionicons name="chevron-back" size={18} color={AppColors.primary} />
                            <Text style={styles.backStepButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}

                    {step < 3 ? (
                        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.button, styles.nextButton, isLoading && styles.disabledButton]}
                            onPress={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? <ActivityIndicator color={AppColors.card} /> : <Text style={styles.buttonText}>Create account</Text>}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.footerRow}>
                    <Text style={styles.footerText}>Already have an account?</Text>
                    <TouchableOpacity onPress={() => router.replace('/')}>
                        <Text style={styles.footerLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.background },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    backButton: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.card,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    heading: { fontSize: 26, fontFamily: Fonts.heading, color: AppColors.text },
    subtitle: { fontSize: 15, color: AppColors.mutedText, marginTop: 4, marginBottom: 24, lineHeight: 21, fontFamily: Fonts.body },
    fieldGroup: { marginBottom: 14 },
    label: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: AppColors.text, marginBottom: 8 },
    field: {
        flexDirection: 'row', alignItems: 'center', gap: 10, height: 54,
        borderWidth: 1, borderColor: AppColors.border, borderRadius: 14, paddingHorizontal: 14,
        backgroundColor: AppColors.card,
    },
    input: { flex: 1, fontSize: 15, color: AppColors.text, fontFamily: Fonts.body },
    strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: 14 },
    strengthBar: { height: 4, flex: 1, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontFamily: Fonts.bodyBold },
    errorText: { fontSize: 12, color: AppColors.danger, marginTop: 2, marginBottom: 14, fontFamily: Fonts.bodyMedium },
    successText: { fontSize: 12, color: AppColors.success, marginTop: 2, marginBottom: 14, fontFamily: Fonts.bodyMedium },
    button: {
        height: 54, backgroundColor: AppColors.primary, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center', marginTop: 6,
    },
    disabledButton: { backgroundColor: AppColors.primaryDark },
    buttonText: { color: AppColors.card, fontSize: 16, fontFamily: Fonts.bodyBold },
    footerRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 22 },
    footerText: { fontSize: 14, color: AppColors.mutedText, fontFamily: Fonts.body },
    footerLink: { fontSize: 14, fontFamily: Fonts.bodyBold, color: AppColors.primary },
    placeholderText: { color: AppColors.mutedText },
    stepIndicatorWrap: { marginBottom: 22 },
    stepIndicatorText: {
        fontSize: 13,
        fontFamily: Fonts.bodyMedium,
        color: AppColors.mutedText,
        marginBottom: 8,
    },
    stepBarTrack: { flexDirection: 'row', gap: 6 },
    stepBarSegment: { flex: 1, height: 5, borderRadius: 3 },
    stepBarSegmentActive: { backgroundColor: AppColors.primary },
    stepBarSegmentInactive: { backgroundColor: AppColors.border },
    stepButtonsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
    nextButton: { flex: 1, marginTop: 0 },
    backStepButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2,
        height: 54, paddingHorizontal: 18, borderRadius: 14,
        borderWidth: 1, borderColor: AppColors.primary,
    },
    backStepButtonText: { color: AppColors.primary, fontSize: 15, fontFamily: Fonts.bodyBold },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalSheet: {
        backgroundColor: AppColors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 32,
    },
    modalTitle: {
        fontSize: 16,
        fontFamily: Fonts.headingSemi,
        color: AppColors.text,
        marginBottom: 12,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    modalOptionText: { fontSize: 15, fontFamily: Fonts.body, color: AppColors.text },
});
