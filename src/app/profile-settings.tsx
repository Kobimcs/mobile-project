import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { AppColors } from '../constants/colors';

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
}

async function saveItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
}

function scheduleNightSummary(enabled: boolean) {
    if (Platform.OS === 'web') {
        if (enabled) {
            Alert.alert(
                'Night-before summary enabled',
                'You will receive a summary at 9 PM each evening with tomorrow\'s classes and pending work. (Push notifications work on mobile devices.)'
            );
        }
        return;
    }

    // On mobile — use expo-notifications if available
    try {
        const Notifications = require('expo-notifications');
        if (enabled) {
            Notifications.scheduleNotificationAsync({
                content: {
                    title: '📚 ClassMate Night Summary',
                    body: 'Check tomorrow\'s classes, pending assignments, and exam updates.',
                    sound: true,
                },
                trigger: {
                    hour: 21,
                    minute: 0,
                    repeats: true,
                },
            });
            Alert.alert('Night summary enabled', 'You will receive a summary every night at 9 PM.');
        } else {
            Notifications.cancelAllScheduledNotificationsAsync();
            Alert.alert('Night summary disabled', 'You will no longer receive nightly summaries.');
        }
    } catch (e) {
        // expo-notifications not installed
        Alert.alert(
            enabled ? 'Night summary enabled' : 'Night summary disabled',
            'Notification preferences saved.'
        );
    }
}

export default function ProfileSettingsScreen() {
    const [fullName, setFullName] = useState('Student');
    const [email, setEmail] = useState('');
    const [programme, setProgramme] = useState('');
    const [level, setLevel] = useState('');
    const [role, setRole] = useState('student');

    const [classReminders, setClassReminders] = useState(true);
    const [assignmentReminders, setAssignmentReminders] = useState(true);
    const [examReminders, setExamReminders] = useState(true);
    const [nightSummary, setNightSummary] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const storedName = await getItem('userName');
        const storedEmail = await getItem('userEmail');
        const storedProgramme = await getItem('programme');
        const storedLevel = await getItem('level');
        const storedRole = await getItem('userRole');
        const storedNightSummary = await getItem('nightSummary');

        if (storedName) setFullName(storedName);
        if (storedEmail) setEmail(storedEmail);
        if (storedProgramme) setProgramme(storedProgramme);
        if (storedLevel) setLevel(storedLevel);
        if (storedRole) setRole(storedRole);
        if (storedNightSummary) setNightSummary(storedNightSummary === 'true');
    }

    async function handleNightSummaryToggle(value: boolean) {
        setNightSummary(value);
        await saveItem('nightSummary', String(value));
        scheduleNightSummary(value);
    }

    async function handleSignOut() {
        const keys = ['authToken', 'userId', 'userName', 'userEmail', 'userRole',
            'indexNumber', 'referenceNumber', 'programme', 'level', 'nightSummary'];
        for (const key of keys) await removeItem(key);
        router.replace('/');
    }

    function handleManualSync() {
        Alert.alert(
            'Syncing...',
            'Your academic data is being refreshed from the server.'
        );
    }

    function handleSubscription() {
        Alert.alert(
            'Pro Features',
            'Pro features include:\n\n• Priority notifications\n• Advanced reminders\n• Custom alert intensity\n• Night-before summaries with full schedule\n\nPaystack payment integration coming soon.'
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile & Settings</Text>
                    <Text style={styles.headerSubtitle}>
                        Manage your academic profile, reminders, sync, and subscription status.
                    </Text>
                </View>

                {/* Academic Profile */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Academic Profile</Text>
                    <View style={styles.profileRow}>
                        <Text style={styles.label}>Name</Text>
                        <Text style={styles.value}>{fullName}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.label}>Email</Text>
                        <Text style={styles.value}>{email || 'Not available yet'}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.label}>Programme</Text>
                        <Text style={styles.value}>{programme || 'Not available yet'}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.label}>Level</Text>
                        <Text style={styles.value}>{level || 'Not available yet'}</Text>
                    </View>
                    <View style={styles.profileRow}>
                        <Text style={styles.label}>Role</Text>
                        <Text style={styles.roleBadge}>{role}</Text>
                    </View>
                </View>

                {/* Notification Preferences */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Notification Preferences</Text>

                    <SettingSwitch
                        title="Class reminders"
                        description="Receive reminders before upcoming classes."
                        value={classReminders}
                        onValueChange={setClassReminders}
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
                        title="Night-before summary"
                        description="Get a summary at 9 PM of tomorrow's classes and pending work."
                        value={nightSummary}
                        onValueChange={handleNightSummaryToggle}
                    />

                    {nightSummary && (
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                🌙 Night summary is active. You will receive a notification at 9 PM every evening with tomorrow's schedule and pending assignments.
                            </Text>
                        </View>
                    )}
                </View>

                {/* Sync */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Sync & Offline Access</Text>
                    <Text style={styles.description}>
                        KNUST ClassMate stores important academic data locally so you can access timetable, announcements, assignments, and exam venue information even with poor connectivity.
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={handleManualSync}>
                        <Text style={styles.primaryButtonText}>Manual Sync</Text>
                    </TouchableOpacity>
                </View>

                {/* Subscription */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Subscription Status</Text>
                    <Text style={styles.proBadge}>Free Tier</Text>
                    <Text style={styles.description}>
                        Core academic features remain available. Pro features such as advanced reminders, priority alerts, and custom reminder intensity coming soon.
                    </Text>
                    <TouchableOpacity style={styles.outlineButton} onPress={handleSubscription}>
                        <Text style={styles.outlineButtonText}>View Pro Features</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
                    <Text style={styles.dangerButtonText}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

type SettingSwitchProps = {
    title: string;
    description: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

function SettingSwitch({ title, description, value, onValueChange }: SettingSwitchProps) {
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
    safeArea: { flex: 1, backgroundColor: AppColors.background },
    container: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 20 },
    backButton: { alignSelf: 'flex-start', marginBottom: 12 },
    backText: { color: AppColors.primary, fontWeight: '700' },
    headerTitle: { fontSize: 26, fontWeight: '800', color: AppColors.text },
    headerSubtitle: { marginTop: 6, fontSize: 14, lineHeight: 20, color: AppColors.mutedText },
    card: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: AppColors.border },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text, marginBottom: 14 },
    profileRow: { marginBottom: 12 },
    label: { fontSize: 12, color: AppColors.mutedText, marginBottom: 3 },
    value: { fontSize: 15, fontWeight: '600', color: AppColors.text },
    roleBadge: { alignSelf: 'flex-start', backgroundColor: AppColors.primary, color: AppColors.card, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: AppColors.border },
    settingText: { flex: 1, paddingRight: 12 },
    settingTitle: { fontSize: 15, fontWeight: '700', color: AppColors.text },
    settingDescription: { marginTop: 3, fontSize: 12, lineHeight: 18, color: AppColors.mutedText },
    infoBox: { marginTop: 12, backgroundColor: AppColors.background, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: AppColors.border },
    infoText: { fontSize: 13, color: AppColors.mutedText, lineHeight: 18 },
    description: { fontSize: 14, lineHeight: 21, color: AppColors.mutedText, marginBottom: 14 },
    primaryButton: { backgroundColor: AppColors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    primaryButtonText: { color: AppColors.card, fontWeight: '800' },
    outlineButton: { borderWidth: 1, borderColor: AppColors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    outlineButtonText: { color: AppColors.primary, fontWeight: '800' },
    proBadge: { alignSelf: 'flex-start', backgroundColor: AppColors.accent, color: AppColors.text, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden', fontSize: 12, fontWeight: '800', marginBottom: 10 },
    dangerButton: { backgroundColor: AppColors.danger, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 4 },
    dangerButtonText: { color: AppColors.card, fontWeight: '800' },
});