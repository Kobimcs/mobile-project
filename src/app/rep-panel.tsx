import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'https://mobile-project-production.up.railway.app/api';

type ActivityItem = {
    id: number;
    type: 'announcement' | 'assignment' | 'timetable' | 'exam_venue';
    title: string;
    postedAt: string;
};

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
}

export default function RepPanel() {
    const [repName, setRepName] = useState('Course Rep');
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [announcementCount, setAnnouncementCount] = useState(0);
    const [assignmentCount, setAssignmentCount] = useState(0);

    useEffect(() => {
        const load = async () => {
            const name = await getItem('userName');
            if (name) setRepName(name);
            fetchActivity();
        };
        load();
    }, []);

    const fetchActivity = async () => {
        try {
            const token = await getItem('authToken');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch announcements
            const annRes = await fetch(`${API_URL}/announcements`, { headers });
            if (annRes.ok) {
                const announcements = await annRes.json();
                setAnnouncementCount(announcements.length);
                const annItems: ActivityItem[] = announcements.slice(0, 3).map((a: any) => ({
                    id: a.id,
                    type: 'announcement',
                    title: a.title,
                    postedAt: a.postedAt,
                }));

                // Fetch assignments
                const assRes = await fetch(`${API_URL}/assignments`, { headers });
                if (assRes.ok) {
                    const assignments = await assRes.json();
                    setAssignmentCount(assignments.length);
                    const assItems: ActivityItem[] = assignments.slice(0, 3).map((a: any) => ({
                        id: a.id + 1000,
                        type: 'assignment',
                        title: `${a.courseCode} — ${a.title}`,
                        postedAt: a.postedAt || '',
                    }));

                    // Merge and sort by most recent
                    const all = [...annItems, ...assItems]
                        .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
                        .slice(0, 5);
                    setRecentActivity(all);
                }
            }
        } catch (error) {
            console.error('Failed to fetch activity', error);
        }
    };

    const handleSignOut = async () => {
        const keys = ['authToken', 'userId', 'userName', 'userEmail', 'userRole',
            'indexNumber', 'referenceNumber', 'programme', 'level'];
        for (const key of keys) await removeItem(key);
        router.replace('/');
    };

    function getActivityIcon(type: ActivityItem['type']) {
        if (type === 'announcement') return '📢';
        if (type === 'assignment') return '📝';
        if (type === 'timetable') return '🗓️';
        return '📍';
    }

    function getActivityLabel(type: ActivityItem['type']) {
        if (type === 'announcement') return 'Announcement';
        if (type === 'assignment') return 'Assignment';
        if (type === 'timetable') return 'Timetable';
        return 'Exam Venue';
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Course Rep Panel</Text>
                        <Text style={styles.subtitle}>Hello, {repName}</Text>
                    </View>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.noticeCard}>
                    <Text style={styles.noticeLabel}>Rep Access</Text>
                    <Text style={styles.noticeTitle}>Class coordination tools</Text>
                    <Text style={styles.noticeText}>
                        Use this panel to prepare announcements, timetable updates, assignments, and exam venue records.
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.grid}>
                    <View style={styles.smallCard}>
                        <Text style={styles.cardValue}>{announcementCount}</Text>
                        <Text style={styles.cardLabel}>announcements posted</Text>
                    </View>
                    <View style={styles.smallCard}>
                        <Text style={styles.cardValue}>{assignmentCount}</Text>
                        <Text style={styles.cardLabel}>assignments added</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionList}>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/post-announcement')}>
                            <Text style={styles.actionTitle}>📢 Post Announcement</Text>
                            <Text style={styles.actionText}>Share class updates, cancellations, venue changes, and reminders.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manage-timetable')}>
                            <Text style={styles.actionTitle}>🗓️ Manage Timetable</Text>
                            <Text style={styles.actionText}>Add or update class times, course titles, lecturers, and venues.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-assignment')}>
                            <Text style={styles.actionTitle}>📝 Add Assignment</Text>
                            <Text style={styles.actionText}>Record assignment details, due dates, and submission instructions.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manage-exam-venues')}>
                            <Text style={styles.actionTitle}>📍 Upload Exam Venue Info</Text>
                            <Text style={styles.actionText}>Add exam venues so students can search and prepare early.</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile-settings' as any)}>
                            <Text style={styles.actionTitle}>⚙️ Profile & Settings</Text>
                            <Text style={styles.actionText}>Manage reminders, sync, subscription, and account settings.</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Recent Activity / Post History */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Activity</Text>
                        <TouchableOpacity onPress={fetchActivity}>
                            <Text style={styles.refreshText}>Refresh</Text>
                        </TouchableOpacity>
                    </View>

                    {recentActivity.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No activity yet</Text>
                            <Text style={styles.emptyText}>
                                Your recent announcements, assignments, and exam venue updates will appear here.
                            </Text>
                        </View>
                    ) : (
                        recentActivity.map((item) => (
                            <View key={item.id} style={styles.activityCard}>
                                <View style={styles.activityIconBox}>
                                    <Text style={styles.activityIcon}>{getActivityIcon(item.type)}</Text>
                                </View>
                                <View style={styles.activityInfo}>
                                    <Text style={styles.activityType}>{getActivityLabel(item.type)}</Text>
                                    <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                                    {item.postedAt ? (
                                        <Text style={styles.activityTime}>{item.postedAt}</Text>
                                    ) : null}
                                </View>
                            </View>
                        ))
                    )}
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
    title: { fontSize: 26, fontWeight: '800', color: AppColors.text },
    subtitle: { fontSize: 14, color: AppColors.mutedText, marginTop: 4, maxWidth: 220 },
    signOutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: AppColors.card, borderWidth: 1, borderColor: AppColors.border },
    signOutText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
    noticeCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18, marginBottom: 24 },
    noticeLabel: { color: AppColors.accent, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    noticeTitle: { color: AppColors.card, fontSize: 20, fontWeight: '800', marginBottom: 6 },
    noticeText: { color: AppColors.card, fontSize: 14, lineHeight: 20 },
    grid: { flexDirection: 'row', gap: 12, marginBottom: 22 },
    smallCard: { flex: 1, backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    cardValue: { fontSize: 30, color: AppColors.primary, fontWeight: '900', marginBottom: 4 },
    cardLabel: { fontSize: 13, color: AppColors.mutedText, lineHeight: 18 },
    section: { marginBottom: 22 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text },
    refreshText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
    actionList: { gap: 12 },
    actionCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    actionTitle: { fontSize: 16, fontWeight: '800', color: AppColors.primary, marginBottom: 4 },
    actionText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
    emptyCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
    activityCard: { backgroundColor: AppColors.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: AppColors.border, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    activityIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: AppColors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: AppColors.border },
    activityIcon: { fontSize: 20 },
    activityInfo: { flex: 1 },
    activityType: { fontSize: 11, fontWeight: '800', color: AppColors.primary, textTransform: 'uppercase', marginBottom: 2 },
    activityTitle: { fontSize: 14, fontWeight: '700', color: AppColors.text, marginBottom: 2 },
    activityTime: { fontSize: 12, color: AppColors.mutedText },
});
