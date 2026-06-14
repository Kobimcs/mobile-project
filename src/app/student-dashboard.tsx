import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StudentDashboard() {
    const [studentName, setStudentName] = useState('Student');
    const [programme, setProgramme] = useState('Programme not loaded');
    const [level, setLevel] = useState('Level not loaded');

    useEffect(() => {
        const loadStudentProfile = async () => {
            const storedName = await SecureStore.getItemAsync('userName');
            const storedProgramme = await SecureStore.getItemAsync('programme');
            const storedLevel = await SecureStore.getItemAsync('level');

            if (storedName) {
                setStudentName(storedName);
            }

            if (storedProgramme) {
                setProgramme(storedProgramme);
            }

            if (storedLevel) {
                setLevel(storedLevel);
            }
        };

        loadStudentProfile();
    }, []);

    const handleSignOut = async () => {
        await SecureStore.deleteItemAsync('authToken');
        await SecureStore.deleteItemAsync('userId');
        await SecureStore.deleteItemAsync('userName');
        await SecureStore.deleteItemAsync('userEmail');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('indexNumber');
        await SecureStore.deleteItemAsync('referenceNumber');
        await SecureStore.deleteItemAsync('programme');
        await SecureStore.deleteItemAsync('level');

        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Hello, {studentName}</Text>
                        <Text style={styles.subGreeting}>Welcome back to ClassMate</Text>
                    </View>

                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileCard}>
                    <Text style={styles.profileLabel}>Academic Profile</Text>
                    <Text style={styles.profileText}>{programme}</Text>
                    <Text style={styles.profileSubText}>{level}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Next Class</Text>
                    <View style={styles.card}>
                        <Text style={styles.emptyTitle}>No class loaded yet</Text>
                        <Text style={styles.emptyText}>
                            Your next class will appear here after timetable data is synced.
                        </Text>
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

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push('/announcements')}
                    >
                        <Text style={styles.emptyTitle}>No announcement yet</Text>
                        <Text style={styles.emptyText}>
                            Course rep announcements will appear here once posted. Tap to view all announcements.
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.actionList}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/timetable')}
                        >
                            <Text style={styles.actionTitle}>View Timetable</Text>
                            <Text style={styles.actionText}>Check today, tomorrow, and weekly classes.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/exam-venue-search')}
                        >
                            <Text style={styles.actionTitle}>Exam Venue Search</Text>
                            <Text style={styles.actionText}>Find your exam venue using your index number.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/assignments')}
                        >
                            <Text style={styles.actionTitle}>Assignments</Text>
                            <Text style={styles.actionText}>Track deadlines and completed work.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/profile-settings' as any)}
                        >
                            <Text style={styles.actionTitle}>Profile & Settings</Text>
                            <Text style={styles.actionText}>
                                Manage reminders, sync, subscription, and account settings.
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    container: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    content: {
        padding: 20,
        paddingBottom: 36,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 26,
        fontWeight: '800',
        color: AppColors.text,
    },
    subGreeting: {
        fontSize: 14,
        color: AppColors.mutedText,
        marginTop: 4,
    },
    signOutButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: AppColors.card,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    signOutText: {
        color: AppColors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    profileCard: {
        backgroundColor: AppColors.primary,
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
    },
    profileLabel: {
        color: AppColors.accent,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    profileText: {
        color: AppColors.card,
        fontSize: 20,
        fontWeight: '800',
    },
    profileSubText: {
        color: AppColors.card,
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        marginBottom: 22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 10,
    },
    card: {
        backgroundColor: AppColors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.text,
        marginBottom: 6,
    },
    emptyText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 20,
    },
    grid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 22,
    },
    smallCard: {
        flex: 1,
        backgroundColor: AppColors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    cardLabel: {
        fontSize: 13,
        color: AppColors.mutedText,
        fontWeight: '600',
    },
    cardValue: {
        fontSize: 30,
        color: AppColors.primary,
        fontWeight: '900',
        marginTop: 6,
    },
    cardHint: {
        fontSize: 13,
        color: AppColors.mutedText,
        marginTop: 2,
    },
    actionList: {
        gap: 12,
    },
    actionCard: {
        backgroundColor: AppColors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: AppColors.primary,
        marginBottom: 4,
    },
    actionText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 20,
    },
});