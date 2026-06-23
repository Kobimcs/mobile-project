import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const API_URL = 'http://localhost:8080/api';

type PendingUser = {
    id: number;
    fullName: string;
    email: string;
    indexNumber: string;
    programme: string;
    level: string;
};

async function getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
}

async function removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
}

export default function AdminPanel() {
    const [adminName, setAdminName] = useState('Admin');
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);

    useEffect(() => {
        const load = async () => {
            const name = await getItem('userName');
            if (name) setAdminName(name);
            fetchPendingUsers();
        };
        load();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const token = await getItem('authToken');
            const response = await fetch(`${API_URL}/admin/pending-reps`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setPendingUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch pending users', error);
        }
    };

    const handleApprove = async (userId: number) => {
        try {
            const token = await getItem('authToken');
            const response = await fetch(`${API_URL}/admin/approve-rep/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                Alert.alert('Approved', 'Course rep account has been approved.');
                fetchPendingUsers();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to approve user.');
        }
    };

    const handleReject = async (userId: number) => {
        try {
            const token = await getItem('authToken');
            const response = await fetch(`${API_URL}/admin/reject-rep/${userId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                Alert.alert('Rejected', 'Course rep request has been rejected.');
                fetchPendingUsers();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to reject user.');
        }
    };

    const handleSignOut = async () => {
        const keys = ['authToken', 'userId', 'userName', 'userEmail', 'userRole',
            'indexNumber', 'referenceNumber', 'programme', 'level'];
        for (const key of keys) await removeItem(key);
        router.replace('/');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Admin Panel</Text>
                        <Text style={styles.subtitle}>Hello, {adminName}</Text>
                    </View>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign out</Text>
                    </TouchableOpacity>
                </View>

                {/* Admin badge */}
                <View style={styles.noticeCard}>
                    <Text style={styles.noticeLabel}>Full Access</Text>
                    <Text style={styles.noticeTitle}>Administrator Dashboard</Text>
                    <Text style={styles.noticeText}>
                        You have access to all features including course rep approval and all academic tools.
                    </Text>
                </View>

                {/* Course Rep Approval Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Pending Course Rep Requests ({pendingUsers.length})
                    </Text>

                    {pendingUsers.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No pending requests</Text>
                            <Text style={styles.emptyText}>
                                When students register as course reps, their requests will appear here.
                            </Text>
                        </View>
                    ) : (
                        pendingUsers.map((user) => (
                            <View key={user.id} style={styles.userCard}>
                                <Text style={styles.userName}>{user.fullName}</Text>
                                <Text style={styles.userDetail}>{user.email}</Text>
                                <Text style={styles.userDetail}>Index: {user.indexNumber}</Text>
                                <Text style={styles.userDetail}>{user.programme} — Level {user.level}</Text>
                                <View style={styles.actionRow}>
                                    <TouchableOpacity style={styles.approveButton} onPress={() => handleApprove(user.id)}>
                                        <Text style={styles.approveText}>Approve</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.rejectButton} onPress={() => handleReject(user.id)}>
                                        <Text style={styles.rejectText}>Reject</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}

                    <TouchableOpacity style={styles.refreshButton} onPress={fetchPendingUsers}>
                        <Text style={styles.refreshText}>Refresh List</Text>
                    </TouchableOpacity>
                </View>

                {/* Academic Tools — same as rep panel */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Academic Tools</Text>
                    <View style={styles.actionList}>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/post-announcement')}>
                            <Text style={styles.actionTitle}>Post Announcement</Text>
                            <Text style={styles.actionText}>Share class updates, cancellations, venue changes, and reminders.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manage-timetable')}>
                            <Text style={styles.actionTitle}>Manage Timetable</Text>
                            <Text style={styles.actionText}>Add or update class times, course titles, lecturers, and venues.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/add-assignment')}>
                            <Text style={styles.actionTitle}>Add Assignment</Text>
                            <Text style={styles.actionText}>Record assignment details, due dates, and submission instructions.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/manage-exam-venues')}>
                            <Text style={styles.actionTitle}>Upload Exam Venue Info</Text>
                            <Text style={styles.actionText}>Add exam venues so students can search and prepare early.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/announcements')}>
                            <Text style={styles.actionTitle}>View Announcements</Text>
                            <Text style={styles.actionText}>See all announcements posted to students.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/timetable')}>
                            <Text style={styles.actionTitle}>View Timetable</Text>
                            <Text style={styles.actionText}>Check today, tomorrow, and weekly classes.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/assignments')}>
                            <Text style={styles.actionTitle}>View Assignments</Text>
                            <Text style={styles.actionText}>Track all posted assignments and deadlines.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/exam-venue-search')}>
                            <Text style={styles.actionTitle}>Exam Venue Search</Text>
                            <Text style={styles.actionText}>Find exam venues using index or reference number.</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/profile-settings' as any)}>
                            <Text style={styles.actionTitle}>Profile & Settings</Text>
                            <Text style={styles.actionText}>Manage account settings and preferences.</Text>
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
    title: { fontSize: 26, fontWeight: '800', color: AppColors.text },
    subtitle: { fontSize: 14, color: AppColors.mutedText, marginTop: 4 },
    signOutButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: AppColors.card, borderWidth: 1, borderColor: AppColors.border },
    signOutText: { color: AppColors.primary, fontWeight: '700', fontSize: 13 },
    noticeCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18, marginBottom: 24 },
    noticeLabel: { color: AppColors.accent, fontSize: 13, fontWeight: '700', marginBottom: 8 },
    noticeTitle: { color: AppColors.card, fontSize: 20, fontWeight: '800', marginBottom: 6 },
    noticeText: { color: AppColors.card, fontSize: 14, lineHeight: 20 },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text, marginBottom: 10 },
    emptyCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: AppColors.text, marginBottom: 6 },
    emptyText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
    userCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border, marginBottom: 12 },
    userName: { fontSize: 17, fontWeight: '800', color: AppColors.text, marginBottom: 4 },
    userDetail: { fontSize: 14, color: AppColors.mutedText, marginBottom: 2 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    approveButton: { flex: 1, height: 44, backgroundColor: AppColors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    approveText: { color: AppColors.card, fontWeight: '800', fontSize: 14 },
    rejectButton: { flex: 1, height: 44, borderWidth: 1, borderColor: '#e74c3c', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    rejectText: { color: '#e74c3c', fontWeight: '800', fontSize: 14 },
    refreshButton: { height: 44, borderRadius: 10, borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
    refreshText: { color: AppColors.mutedText, fontWeight: '700' },
    actionList: { gap: 12 },
    actionCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    actionTitle: { fontSize: 16, fontWeight: '800', color: AppColors.primary, marginBottom: 4 },
    actionText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
});
