import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { BottomNav } from '../components/ui/bottom-nav';
import { AppColors } from '../constants/colors';
import { Fonts } from '../constants/ui';
import { useAuth } from '../context/auth-context';
import { useSignOut } from '../hooks/use-sign-out';
import { apiRequest } from '../services/api';
import {
    cancelAllReminders,
    CLASS_REMINDERS_ENABLED_KEY,
    ensureNotificationPermissions,
    NIGHT_SUMMARY_ENABLED_KEY,
} from '../services/notifications';
import { getItem, setItem } from '../services/storage';
import { getSubscription, type SubscriptionStatus } from '../services/subscription';

type ProfileResponse = {
    fullName: string;
    email: string;
    studentIndexNumber: string | null;
    phone: string | null;
    bio: string | null;
    programme: string | null;
    level: string | null;
    classGroup: string | null;
};

function initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'S';
}

function roleLabel(role: string): string {
    if (role === 'course_rep') return 'Course Rep';
    if (role === 'admin') return 'Admin';
    return 'Student';
}

export default function ProfileSettingsScreen() {
    const handleSignOut = useSignOut();
    const { token, user, updateUser } = useAuth();

    // Read-mode fields are sourced from the auth context (not local state) so
    // an edit made on the Edit Profile screen shows here immediately, without
    // needing this screen to remount.
    const fullName = user?.fullName || 'Student';
    const email = user?.email || '';
    const indexNumber = user?.indexNumber || '';
    const programme = user?.programme || '';
    const level = user?.level || '';
    const role = user?.role || 'student';
    const referenceNumber = user?.referenceNumber || '';
    const classGroup = user?.classGroup || '';

    const [classReminders, setClassReminders] = useState(true);
    const [assignmentReminders, setAssignmentReminders] = useState(true);
    const [examReminders, setExamReminders] = useState(true);
    const [nightSummary, setNightSummary] = useState(false);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        // Fresh data when online; falls back silently to whatever's already in
        // the auth context (from storage) when offline.
        try {
            const profile = await apiRequest<ProfileResponse>('/profile/me', { token });
            await updateUser({
                fullName: profile.fullName,
                email: profile.email,
                indexNumber: profile.studentIndexNumber ?? undefined,
                phone: profile.phone ?? undefined,
                bio: profile.bio ?? undefined,
                programme: profile.programme ?? undefined,
                level: profile.level ?? undefined,
                classGroup: profile.classGroup ?? undefined,
            });
        } catch {
            // Offline or request failed — keep showing cached context data.
        }

        const remindersPref = await getItem(CLASS_REMINDERS_ENABLED_KEY);
        if (remindersPref !== null) setClassReminders(remindersPref === 'true');

        const summaryPref = await getItem(NIGHT_SUMMARY_ENABLED_KEY);
        if (summaryPref !== null) setNightSummary(summaryPref === 'true');

        setSubscription(await getSubscription());
    }

    async function handleToggleClassReminders(next: boolean) {
        if (next) {
            const granted = await ensureNotificationPermissions();
            if (!granted) {
                Alert.alert(
                    'Notifications are off',
                    'Allow notifications for ClassMate in your device settings to receive class reminders.'
                );
                return;
            }
            setClassReminders(true);
            await setItem(CLASS_REMINDERS_ENABLED_KEY, 'true');
        } else {
            setClassReminders(false);
            await setItem(CLASS_REMINDERS_ENABLED_KEY, 'false');
            await cancelAllReminders();
        }
    }

    function handleSubscription() {
        router.push('/paywall' as any);
    }

    async function handleToggleNightSummary(next: boolean) {
        // Night-before summary is a Pro feature — send non-Pro users to the paywall.
        if (!subscription?.isProActive) {
            router.push('/paywall' as any);
            return;
        }
        if (next) {
            const granted = await ensureNotificationPermissions();
            if (!granted) {
                Alert.alert(
                    'Notifications are off',
                    'Allow notifications for ClassMate in your device settings to receive the night-before summary.'
                );
                return;
            }
            setNightSummary(true);
            await setItem(NIGHT_SUMMARY_ENABLED_KEY, 'true');
        } else {
            setNightSummary(false);
            await setItem(NIGHT_SUMMARY_ENABLED_KEY, 'false');
        }
    }

    const isManager = role === 'course_rep' || role === 'admin';

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.topHeaderCard}>
                    <View style={styles.topHeaderLeft}>
                        {isManager && (
                            <TouchableOpacity onPress={() => router.back()} style={styles.topHeaderBackButton} hitSlop={8}>
                                <Ionicons name="chevron-back" size={20} color={AppColors.text} />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.topHeaderTitle}>Profile</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.bellButton}
                        onPress={() => router.push('/announcements')}
                        hitSlop={8}
                    >
                        <Ionicons name="notifications-outline" size={20} color={AppColors.text} />
                    </TouchableOpacity>
                </View>

                <LinearGradient
                    colors={[AppColors.primary, AppColors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroTopRow}>
                        <View style={styles.avatarWrap}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>{initials(fullName)}</Text>
                            </View>
                            {/* Static badge — there's no backend "verified" flag yet, so this
                                is a decorative visual element rather than data-driven. */}
                            <View style={styles.verifiedBadge}>
                                <Ionicons name="checkmark" size={11} color={AppColors.card} />
                            </View>
                        </View>

                        <View style={styles.heroNameBlock}>
                            <Text style={styles.heroName} numberOfLines={1}>{fullName}</Text>
                            <Text style={styles.heroReference} numberOfLines={1}>
                                Reference: {referenceNumber || 'Not available yet'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroSubBoxFull}>
                        <Text style={styles.heroSubLabel}>Programme</Text>
                        <Text style={styles.heroSubValue}>{programme || 'Not available yet'}</Text>
                    </View>

                    <View style={styles.heroSubRow}>
                        <View style={[styles.heroSubBox, { marginRight: 10 }]}>
                            <Text style={styles.heroSubLabel}>Email</Text>
                            <Text style={styles.heroSubValue} numberOfLines={1}>{email || 'Not available yet'}</Text>
                        </View>
                        <View style={styles.heroSubBox}>
                            <Text style={styles.heroSubLabel}>Role</Text>
                            <Text style={styles.heroSubValue}>{roleLabel(role)}</Text>
                        </View>
                    </View>

                    <View style={styles.heroSubRow}>
                        <View style={[styles.heroSubBox, { marginRight: 10 }]}>
                            <Text style={styles.heroSubLabel}>Student ID</Text>
                            <Text style={styles.heroSubValue}>{indexNumber || 'Not available yet'}</Text>
                        </View>
                        <View style={styles.heroSubBox}>
                            <Text style={styles.heroSubLabel}>Level</Text>
                            <Text style={styles.heroSubValue}>{level || 'Not available yet'}</Text>
                        </View>
                    </View>

                    {!!classGroup && (
                        <View style={styles.heroSubBoxFull}>
                            <Text style={styles.heroSubLabel}>Class Group</Text>
                            <Text style={styles.heroSubValue}>{classGroup}</Text>
                        </View>
                    )}
                </LinearGradient>

                <View style={styles.heroActionsRow}>
                    <TouchableOpacity style={styles.heroPrimaryButton} onPress={() => router.push('/edit-profile')}>
                        <Ionicons name="create-outline" size={16} color={AppColors.card} />
                        <Text style={styles.heroPrimaryButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.heroOutlineButton} onPress={() => router.push('/change-password')}>
                        <Ionicons name="lock-closed-outline" size={16} color={AppColors.primary} />
                        <Text style={styles.heroOutlineButtonText}>Change Password</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Notification Preferences</Text>

                    <SettingSwitch
                        title="Class reminders"
                        description="Get a reminder 30 minutes before each class today."
                        value={classReminders}
                        onValueChange={handleToggleClassReminders}
                    />

                    <SettingSwitch
                        title="Assignment reminders"
                        description="Receive reminders before assignment deadlines."
                        value={assignmentReminders}
                        onValueChange={setAssignmentReminders}
                    />

                    <SettingSwitch
                        title="Exam reminders"
                        description="Receive alerts before exams and venue updates."
                        value={examReminders}
                        onValueChange={setExamReminders}
                    />

                    <SettingSwitch
                        title="Night-before summary (Pro)"
                        description="Get a summary of tomorrow’s classes and pending work."
                        value={nightSummary}
                        onValueChange={handleToggleNightSummary}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Subscription Status</Text>
                    <Text style={styles.proBadge}>
                        {subscription?.subscribed
                            ? 'Pro'
                            : subscription?.inFreePeriod
                                ? 'Free semester'
                                : 'Free tier'}
                    </Text>
                    <Text style={styles.description}>
                        {subscription?.subscribed
                            ? 'You have all Pro features, including advanced reminders and the night-before summary.'
                            : subscription?.inFreePeriod
                                ? `All Pro features are unlocked free for ${subscription.daysLeftInFree} more days.`
                                : 'Core academic features remain free. Subscribe to unlock Pro reminder features.'}
                    </Text>

                    <TouchableOpacity style={styles.outlineButton} onPress={handleSubscription}>
                        <Text style={styles.outlineButtonText}>
                            {subscription?.subscribed ? 'Manage subscription' : 'View Pro features'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
                    <Text style={styles.dangerButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>

            <BottomNav active="profile" />
        </SafeAreaView>
    );
}

type SettingSwitchProps = {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

function SettingSwitch({
    title,
    description,
    value,
    onValueChange,
}: SettingSwitchProps) {
    return (
        <View style={styles.settingRow}>
            <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{title}</Text>
                <Text style={styles.settingDescription}>{description}</Text>
            </View>

            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: AppColors.border, true: AppColors.primary }}
                thumbColor={AppColors.card}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    topHeaderCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: AppColors.card,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    topHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    topHeaderBackButton: {
        width: 34, height: 34, borderRadius: 10, backgroundColor: AppColors.background,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center',
    },
    topHeaderTitle: {
        fontSize: 22,
        fontFamily: Fonts.heading,
        color: AppColors.text,
    },
    bellButton: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: AppColors.background,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center',
    },
    heroCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    avatarWrap: {
        marginRight: 14,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: AppColors.card + '26',
        borderWidth: 1,
        borderColor: AppColors.card + '40',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 22,
        fontFamily: Fonts.bodyBold,
        color: AppColors.card,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: AppColors.success,
        borderWidth: 2,
        borderColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroNameBlock: {
        flex: 1,
    },
    heroName: {
        fontSize: 19,
        fontFamily: Fonts.bodyBold,
        color: AppColors.card,
    },
    heroReference: {
        marginTop: 4,
        fontSize: 13,
        fontFamily: Fonts.body,
        color: AppColors.card + 'CC',
    },
    heroSubBoxFull: {
        backgroundColor: AppColors.card + '1F',
        borderWidth: 1,
        borderColor: AppColors.card + '33',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 10,
    },
    heroSubRow: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    heroSubBox: {
        flex: 1,
        backgroundColor: AppColors.card + '1F',
        borderWidth: 1,
        borderColor: AppColors.card + '33',
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    heroSubLabel: {
        fontSize: 11,
        fontFamily: Fonts.body,
        color: AppColors.card + 'B3',
        marginBottom: 3,
    },
    heroSubValue: {
        fontSize: 14,
        fontFamily: Fonts.bodyBold,
        color: AppColors.card,
    },
    heroActionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    heroPrimaryButton: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        backgroundColor: AppColors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroPrimaryButtonText: {
        color: AppColors.card,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    heroOutlineButton: {
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        backgroundColor: AppColors.card,
        borderWidth: 1,
        borderColor: AppColors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroOutlineButtonText: {
        color: AppColors.primary,
        fontFamily: Fonts.bodyBold,
        fontSize: 14,
    },
    card: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.headingSemi,
        color: AppColors.text,
        marginBottom: 14,
    },
    profileRow: {
        marginBottom: 12,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 3,
    },
    label: {
        fontSize: 12,
        color: AppColors.mutedText,
        marginBottom: 3,
        fontFamily: Fonts.body,
    },
    lockedNote: {
        fontSize: 11,
        color: AppColors.mutedText,
        fontFamily: Fonts.body,
        marginTop: -6,
        marginBottom: 14,
        lineHeight: 15,
    },
    value: {
        fontSize: 15,
        fontFamily: Fonts.bodyMedium,
        color: AppColors.text,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        backgroundColor: AppColors.primary,
        color: AppColors.card,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: 'hidden',
        fontSize: 12,
        fontFamily: Fonts.bodyBold,
        textTransform: 'uppercase',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: AppColors.border,
    },
    settingText: {
        flex: 1,
        paddingRight: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontFamily: Fonts.bodyBold,
        color: AppColors.text,
    },
    settingDescription: {
        marginTop: 3,
        fontSize: 12,
        lineHeight: 18,
        color: AppColors.mutedText,
        fontFamily: Fonts.body,
    },
    description: {
        fontSize: 14,
        lineHeight: 21,
        color: AppColors.mutedText,
        marginBottom: 14,
        fontFamily: Fonts.body,
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: AppColors.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: AppColors.primary,
        fontFamily: Fonts.bodyBold,
    },
    proBadge: {
        alignSelf: 'flex-start',
        backgroundColor: AppColors.accent,
        color: AppColors.text,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        overflow: 'hidden',
        fontSize: 12,
        fontFamily: Fonts.bodyBold,
        marginBottom: 10,
    },
    dangerButton: {
        backgroundColor: AppColors.danger,
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 4,
    },
    dangerButtonText: {
        color: AppColors.card,
        fontFamily: Fonts.bodyBold,
    },
});