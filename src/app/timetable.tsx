import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimetableStatus = 'active' | 'venue_changed' | 'time_changed' | 'cancelled';

type TimetableRecord = {
    id: number;
    courseCode: string;
    courseTitle: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    venue: string;
    lecturer: string;
    classGroup: string;
    status: TimetableStatus;
};

type TimetableTab = 'today' | 'tomorrow' | 'week';

const timetableRecords: TimetableRecord[] = [];

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getTodayName() { return weekDays[new Date().getDay()]; }
function getTomorrowName() { return weekDays[(new Date().getDay() + 1) % 7]; }

function formatStatusLabel(status: TimetableStatus) {
    if (status === 'active') return 'Active';
    if (status === 'venue_changed') return 'Venue Changed';
    if (status === 'time_changed') return 'Time Changed';
    return 'Cancelled';
}

function navigateToVenue(venue: string) {
    const query = encodeURIComponent(`${venue} KNUST Kumasi Ghana`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
}

export default function TimetableScreen() {
    const [activeTab, setActiveTab] = useState<TimetableTab>('today');

    const todayName = getTodayName();
    const tomorrowName = getTomorrowName();

    const todayRecords = useMemo(
        () => timetableRecords.filter((r) => r.dayOfWeek === todayName), [todayName]);

    const tomorrowRecords = useMemo(
        () => timetableRecords.filter((r) => r.dayOfWeek === tomorrowName), [tomorrowName]);

    const visibleRecords = useMemo(() => {
        if (activeTab === 'today') return todayRecords;
        if (activeTab === 'tomorrow') return tomorrowRecords;
        return timetableRecords;
    }, [activeTab, todayRecords, tomorrowRecords]);

    const activeClassesCount = timetableRecords.filter((r) => r.status !== 'cancelled').length;
    const changedClassesCount = timetableRecords.filter(
        (r) => r.status === 'venue_changed' || r.status === 'time_changed' || r.status === 'cancelled'
    ).length;

    function getEmptyTitle() {
        if (activeTab === 'today') return 'No classes for today';
        if (activeTab === 'tomorrow') return 'No classes for tomorrow';
        return 'No timetable records yet';
    }

    function getEmptyText() {
        if (activeTab === 'today') return 'Your classes for today will appear here after timetable records are added by the course rep or admin.';
        if (activeTab === 'tomorrow') return "Tomorrow's classes will appear here after the timetable is synced from the backend.";
        return 'Structured weekly timetable records will appear here.';
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Timetable</Text>
                <Text style={styles.subtitle}>View today's classes, tomorrow's classes, and your full weekly timetable.</Text>

                <View style={styles.fileCard}>
                    <Text style={styles.fileLabel}>Official Timetable File</Text>
                    <Text style={styles.fileTitle}>No timetable file uploaded yet</Text>
                    <Text style={styles.fileText}>
                        When the department releases the official timetable, the course rep or admin can upload it here.
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{activeClassesCount}</Text>
                        <Text style={styles.summaryLabel}>Active Classes</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{changedClassesCount}</Text>
                        <Text style={styles.summaryLabel}>Updates</Text>
                    </View>
                </View>

                <View style={styles.tabContainer}>
                    {(['today', 'tomorrow', 'week'] as TimetableTab[]).map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
                            onPress={() => setActiveTab(tab)}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        {activeTab === 'today' ? `Today - ${todayName}` : activeTab === 'tomorrow' ? `Tomorrow - ${tomorrowName}` : 'Weekly Timetable'}
                    </Text>

                    {visibleRecords.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>{getEmptyTitle()}</Text>
                            <Text style={styles.emptyText}>{getEmptyText()}</Text>
                        </View>
                    ) : (
                        visibleRecords.map((record) => (
                            <View key={record.id} style={styles.classCard}>
                                <View style={styles.classHeader}>
                                    <Text style={styles.courseCode}>{record.courseCode}</Text>
                                    <Text style={[styles.status, record.status === 'cancelled' && styles.cancelledStatus]}>
                                        {formatStatusLabel(record.status)}
                                    </Text>
                                </View>

                                <Text style={styles.courseTitle}>{record.courseTitle}</Text>
                                <Text style={styles.classDetail}>{record.dayOfWeek} · {record.startTime} – {record.endTime}</Text>
                                <Text style={styles.classDetail}>📍 {record.venue}</Text>
                                <Text style={styles.classDetail}>👨‍🏫 {record.lecturer}</Text>
                                <Text style={styles.classDetail}>👥 {record.classGroup}</Text>

                                {record.status !== 'cancelled' && (
                                    <TouchableOpacity
                                        style={styles.navigateButton}
                                        onPress={() => navigateToVenue(record.venue)}
                                    >
                                        <Text style={styles.navigateText}>📍 Navigate to Venue</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>Backend-ready timetable design</Text>
                    <Text style={styles.noteText}>
                        The app keeps the official timetable file and structured class records separate.
                        This allows one venue, time, or cancellation update to be changed without replacing the whole timetable file.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: AppColors.background },
    container: { flex: 1, backgroundColor: AppColors.background },
    content: { padding: 20, paddingBottom: 36 },
    backText: { color: AppColors.primary, fontSize: 15, fontWeight: '700', marginBottom: 14 },
    title: { fontSize: 28, fontWeight: '900', color: AppColors.text },
    subtitle: { fontSize: 14, color: AppColors.mutedText, marginTop: 6, marginBottom: 18, lineHeight: 20 },
    fileCard: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 18, marginBottom: 16 },
    fileLabel: { color: AppColors.accent, fontSize: 13, fontWeight: '800', marginBottom: 8 },
    fileTitle: { color: AppColors.card, fontSize: 19, fontWeight: '900', marginBottom: 6 },
    fileText: { color: AppColors.card, fontSize: 14, lineHeight: 20 },
    summaryCard: { backgroundColor: AppColors.card, borderRadius: 18, borderWidth: 1, borderColor: AppColors.border, padding: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center' },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryNumber: { fontSize: 26, fontWeight: '900', color: AppColors.primary },
    summaryLabel: { marginTop: 4, fontSize: 13, fontWeight: '700', color: AppColors.mutedText },
    summaryDivider: { width: 1, height: 42, backgroundColor: AppColors.border },
    tabContainer: { flexDirection: 'row', backgroundColor: AppColors.card, borderRadius: 14, borderWidth: 1, borderColor: AppColors.border, padding: 5, marginBottom: 18 },
    tabButton: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
    activeTabButton: { backgroundColor: AppColors.primary },
    tabText: { fontSize: 14, fontWeight: '800', color: AppColors.mutedText },
    activeTabText: { color: AppColors.card },
    section: { marginBottom: 22 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text, marginBottom: 10 },
    emptyCard: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: AppColors.border },
    emptyTitle: { fontSize: 17, fontWeight: '800', color: AppColors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 21 },
    classCard: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: AppColors.border, marginBottom: 14 },
    classHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10 },
    courseCode: { color: AppColors.primary, fontSize: 13, fontWeight: '900' },
    status: { color: AppColors.warning, fontSize: 12, fontWeight: '800' },
    cancelledStatus: { color: AppColors.danger },
    courseTitle: { color: AppColors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 },
    classDetail: { color: AppColors.mutedText, fontSize: 14, lineHeight: 21 },
    navigateButton: { marginTop: 12, height: 44, backgroundColor: AppColors.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    navigateText: { color: AppColors.card, fontSize: 14, fontWeight: '800' },
    noteCard: { backgroundColor: AppColors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: AppColors.border },
    noteTitle: { fontSize: 15, fontWeight: '800', color: AppColors.text, marginBottom: 6 },
    noteText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20 },
});