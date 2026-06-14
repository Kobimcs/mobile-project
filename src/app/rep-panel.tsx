import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RepPanel() {
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
                        <Text style={styles.title}>Course Rep Panel</Text>
                        <Text style={styles.subtitle}>Manage academic updates for your class</Text>
                    </View>

                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.noticeCard}>
                    <Text style={styles.noticeLabel}>Rep Access</Text>
                    <Text style={styles.noticeTitle}>Class coordination tools</Text>
                    <Text style={styles.noticeText}>
                        Use this panel to prepare announcements, timetable updates,
                        assignments, and exam venue records.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>

                    <View style={styles.actionList}>
                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/post-announcement')}
                        >
                            <Text style={styles.actionTitle}>Post Announcement</Text>
                            <Text style={styles.actionText}>
                                Share class updates, cancellations, venue changes, and reminders.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/manage-timetable')}
                        >
                            <Text style={styles.actionTitle}>Manage Timetable</Text>
                            <Text style={styles.actionText}>
                                Add or update class times, course titles, lecturers, and venues.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/add-assignment')}
                        >
                            <Text style={styles.actionTitle}>Add Assignment</Text>
                            <Text style={styles.actionText}>
                                Record assignment details, due dates, and submission instructions.
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionCard}
                            onPress={() => router.push('/manage-exam-venues')}
                        >
                            <Text style={styles.actionTitle}>Upload Exam Venue Info</Text>
                            <Text style={styles.actionText}>
                                Add exam venues so students can search and prepare early.
                            </Text>
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

                <View style={styles.grid}>
                    <View style={styles.smallCard}>
                        <Text style={styles.cardValue}>0</Text>
                        <Text style={styles.cardLabel}>announcements posted</Text>
                    </View>

                    <View style={styles.smallCard}>
                        <Text style={styles.cardValue}>0</Text>
                        <Text style={styles.cardLabel}>assignments added</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>

                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No activity yet</Text>
                        <Text style={styles.emptyText}>
                            Your recent timetable, announcement, assignment, and exam venue
                            updates will appear here after backend sync is connected.
                        </Text>
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
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: AppColors.text,
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.mutedText,
        marginTop: 4,
        maxWidth: 220,
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
    noticeCard: {
        backgroundColor: AppColors.primary,
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
    },
    noticeLabel: {
        color: AppColors.accent,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
    },
    noticeTitle: {
        color: AppColors.card,
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    noticeText: {
        color: AppColors.card,
        fontSize: 14,
        lineHeight: 20,
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
    cardValue: {
        fontSize: 30,
        color: AppColors.primary,
        fontWeight: '900',
        marginBottom: 4,
    },
    cardLabel: {
        fontSize: 13,
        color: AppColors.mutedText,
        lineHeight: 18,
    },
    emptyCard: {
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
});