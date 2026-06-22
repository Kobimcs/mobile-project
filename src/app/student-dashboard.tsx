import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
}

// Calculate days until next exam period
// KNUST typically has exams in January and July
function getDaysUntilExams(): number | null {
    const now = new Date();
    const year = now.getFullYear();

    // Next exam periods — adjust these dates to match KNUST academic calendar
    const examPeriods = [
        new Date(year, 0, 13),   // January exams
        new Date(year, 6, 7),    // July exams
        new Date(year + 1, 0, 13), // Next January
    ];

    for (const examDate of examPeriods) {
        const diffMs = examDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
            return diffDays;
        }
    }
    return null;
}

export default function StudentDashboard() {
    const [studentName, setStudentName] = useState('Student');
    const [programme, setProgramme] = useState('Programme not loaded');
    const [level, setLevel] = useState('Level not loaded');
    const daysUntilExams = getDaysUntilExams();

    useEffect(() => {
        const loadStudentProfile = async () => {
            const storedName = await getItem('userName');
            const storedProgramme = await getItem('programme');
            const storedLevel = await getItem('level');
            if (storedName) setStudentName(storedName);
            if (storedProgramme) setProgramme(storedProgramme);
            if (storedLevel) setLevel(storedLevel);
        };
        loadStudentProfile();
    }, []);

    const handleSignOut = async () => {
        const keys = ['authToken', 'userId', 'userName', 'userEmail', 'userRole',
            'indexNumber', 'referenceNumber', 'programme', 'level'];
        for (const key of keys) await removeItem(key);
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {studentName}</Text>
                        <Text style={styles.subGreeting}>Welcome back to ClassMate</Text>
                    </View>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

                {/* Exam Countdown Banner */}
                {daysUntilExams !== null && (
                    <TouchableOpacity
                        style={[
                            styles.countdownBanner,
                            daysUntilExams <= 7 && styles.countdownUrgent,
                        ]}
                        onPress={() => router.push('/exam-venue-search')}
                    >
                        <View>
                            <Text style={styles.countdownLabel}>
                                {daysUntilExams === 0 ? '🚨 Exams start TODAY' : `📅 Exams in ${daysUntilExams} day${daysUntilExams === 1 ? '' : 's'}`}
                            </Text>
                            <Text style={styles.countdownSub}>
                                Tap to search your exam venue
                            </Text>
                        </View>
                        <Text style={styles.countdownDays}>
                            {daysUntilExams === 0 ? '!' : daysUntilExams}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={styles.profileCard}>
                    <Text style={styles.profileLabel}>Academic Profile</Text>
                    <Text style={styles.profileText}>{programme}</Text>
                    <Text style={styles.profileSubText}>{level}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Next Class</Text>
                    <View style={styles.card}>
                        <Text style={styles.emptyTitle}>No class loaded yet</Text>
                        <Text style={styles.emptyText}>Your next class will appear here after timetable data is synced.</Text>
                    </View>
                </View>

                <View style={styles.grid}>
                    <View style={styles.smallCard}>
                        <Text style={styles.cardLabel}>Today</Text>
                        <Text style={styles.cardValue}>0</Text>
                        <Text style={styles.cardHint}>classes loaded</Text>
                    </View>
                    <View style={styles.smallCard}>
                        <Text style={styles.cardLabel}>Assignments</Text>
                        <Text style={styles.cardValue}>0</Text>
                        <Text style={styles.cardHint}>pending</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Latest Announcement</Text>
                    <TouchableOpacity style={styles.card} onPress={() => router.push('/announcements')}>
                        <Text style={styles.emptyTitle}>No announcement yet</Text>
                        <Text style={styles.emptyText}>Course rep announcements will appear here once posted. Tap to view all announcements.</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionList}>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/timetable')}>
                            <Text style={styles.actionTitle}>View Timetable</Text>
                            <Text style={styles.actionText}>Check today, tomorrow, and weekly classes.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/exam-venue-search')}>
                            <Text style={styles.actionTitle}>Exam Venue Search</Text>
                            <Text style={styles.actionText}>Find your exam venue using your index number.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/assignments')}>
                            <Text style={styles.actionTitle}>Assignments</Text>
                            <Text style={styles.actionText}>Track deadlines and completed work.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile-settings' as any)}>
                            <Text style={styles.actionTitle}>Profile & Settings</Text>
                            <Text style={styles.actionText}>Manage reminders, sync, subscription, and account settings.</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: AppColors.background },
    container: { flex: 1, backgroundColor: AppColors.background },
    content: { padding: 20, paddingBottom: 36 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    greeting: { fontSize: 26, fontWeight: '800', color: AppColors.text },
    subGreeting: { fontSize: 14, color: AppColors.mutedText, marginTop: 4 },
    signOutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: AppColors.card, borderWidth: 1, borderColor: AppColors.border },
    signOutText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
    countdownBanner: { backgroundColor: '#1a6b3a', borderRadius: 16, padding: 16, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    countdownUrgent: { backgroundColor: '#c0392b' },
    countdownLabel: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
    countdownSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
    countdownDays: { color: '#fff', fontSize: 42, fontWeight: '900' },
    profileCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18, marginBottom: 24 },
    profileLabel: { color: AppColors.accent, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    profileText: { color: AppColors.card, fontSize: 20, fontWeight: '800' },
    profileSubText: { color: AppColors.card, fontSize: 14, marginTop: 4 },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text, marginBottom: 10 },
    card: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 22 },
    smallCard: { flex: 1, backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    cardLabel: { fontSize: 13, color: AppColors.mutedText, fontWeight: '600' },
    cardValue: { fontSize: 30, color: AppColors.primary, fontWeight: '900', marginTop: 6 },
    cardHint: { fontSize: 13, color: AppColors.mutedText, marginTop: 2 },
    actionList: { gap: 12 },
    actionCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    actionTitle: { fontSize: 16, fontWeight: '800', color: AppColors.primary, marginBottom: 4 },
    actionText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
});