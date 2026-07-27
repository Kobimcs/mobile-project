import { AppColors } from '@/constants/colors';
import { OfflineBanner } from '@/components/offline-banner';
import { BottomNav } from '@/components/ui/bottom-nav';
import { StatusPill } from '@/components/ui/status-pill';
import { Fonts, cardShadow } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { useSignOut } from '@/hooks/use-sign-out';
import { apiRequest } from '@/services/api';
import { CacheKeys, fetchWithCache } from '@/services/cache';
import { syncReminders } from '@/services/notifications';
import { getItem } from '@/services/storage';
import { openMapsSearch } from '@/utils/open-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type TimetableRecord = {
    id: number;
    courseCode: string;
    courseTitle: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    venue: string;
    lecturer: string;
    status: string;
};

type Assignment = {
    id: number;
    courseCode: string;
    title: string;
    dueDate: string;
    completed: boolean;
};

type Announcement = {
    id: number;
    title: string;
    message: string;
    category: string;
    postedBy: string;
    postedAt: string;
    read: boolean;
};

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseTimeToMinutes(time: string): number | null {
    // Accepts "8:00", "08:00", "8:00 AM", "8:00:00" (e.g. from Excel-typed data) etc.
    const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
}

type ExamCountdown = { days: number; courseCode: string; examDate: string };

function parseExamDate(value: string): Date | null {
    const t = Date.parse(value);
    return Number.isNaN(t) ? null : new Date(t);
}

function daysUntil(date: Date): number {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfDate = new Date(date);
    startOfDate.setHours(0, 0, 0, 0);
    return Math.round((startOfDate.getTime() - startOfToday.getTime()) / 86400000);
}

function initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || 'S';
}

function openInMaps(venue: string) {
    openMapsSearch(`${venue} KNUST Kumasi`);
}

const quickActions: { label: string; icon: IconName; route: string }[] = [
    { label: 'Timetable', icon: 'calendar-outline', route: '/timetable' },
    { label: 'Assignments', icon: 'document-text-outline', route: '/assignments' },
    { label: 'Exam search', icon: 'search-outline', route: '/exam-venue-search' },
    { label: 'Midsem scores', icon: 'ribbon-outline', route: '/my-scores' },
    { label: 'Announcements', icon: 'megaphone-outline', route: '/announcements' },
    { label: 'Profile', icon: 'person-outline', route: '/profile-settings' },
];

export default function StudentDashboard() {
    const { token } = useAuth();
    const handleSignOut = useSignOut();
    const [studentName, setStudentName] = useState('Student');
    const [programme, setProgramme] = useState('');
    const [level, setLevel] = useState('');

    const [timetable, setTimetable] = useState<TimetableRecord[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [examCountdown, setExamCountdown] = useState<ExamCountdown | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        (async () => {
            const [name, prog, lvl] = await Promise.all([
                getItem('userName'),
                getItem('programme'),
                getItem('level'),
            ]);
            if (name) setStudentName(name);
            if (prog) setProgramme(prog);
            if (lvl) setLevel(lvl);
        })();
    }, []);

    const loadDashboard = useCallback(async () => {
        const [tt, asg, ann] = await Promise.allSettled([
            fetchWithCache<TimetableRecord[]>(CacheKeys.timetable, '/timetable', token),
            fetchWithCache<Assignment[]>(CacheKeys.assignments, '/assignments', token),
            fetchWithCache<Announcement[]>(CacheKeys.announcements, '/announcements', token),
        ]);
        let offline = false;
        if (tt.status === 'fulfilled') { setTimetable(tt.value.data); offline = offline || tt.value.fromCache; }
        if (asg.status === 'fulfilled') { setAssignments(asg.value.data); offline = offline || asg.value.fromCache; }
        if (ann.status === 'fulfilled') { setAnnouncements(ann.value.data); offline = offline || ann.value.fromCache; }
        setIsOffline(offline);
        setIsLoading(false);
        setRefreshing(false);
    }, [token]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    useEffect(() => {
        (async () => {
            const index = await getItem('indexNumber');
            if (!index) return;
            try {
                const exams = await apiRequest<{ courseCode: string; examDate: string }[]>(
                    `/exam-venues/search?number=${encodeURIComponent(index)}`,
                    { token }
                );
                const soonest = exams
                    .map((e) => ({ e, date: parseExamDate(e.examDate) }))
                    .filter((x): x is { e: { courseCode: string; examDate: string }; date: Date } => x.date !== null)
                    .map((x) => ({ courseCode: x.e.courseCode, examDate: x.e.examDate, days: daysUntil(x.date) }))
                    .filter((x) => x.days >= 0 && x.days <= 14)
                    .sort((a, b) => a.days - b.days)[0];
                if (soonest) setExamCountdown(soonest);
            } catch {
                // No countdown if exams can't be loaded or the date isn't parseable.
            }
        })();
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        loadDashboard();
    };

    const todayName = weekDays[new Date().getDay()];

    const todaysClasses = useMemo(
        () =>
            timetable
                .filter((c) => c.dayOfWeek === todayName && c.status !== 'cancelled')
                .sort((a, b) => (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0)),
        [timetable, todayName]
    );

    const nextClass = useMemo(() => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        // "Next class" = the soonest class that hasn't started yet. A class already
        // in progress is not shown here (it's still visible in Today's schedule below).
        return todaysClasses
            .map((c) => ({ record: c, start: parseTimeToMinutes(c.startTime) }))
            .filter((x): x is { record: TimetableRecord; start: number } => x.start !== null && x.start >= nowMinutes)
            .sort((a, b) => a.start - b.start)[0]?.record ?? null;
    }, [todaysClasses]);

    const pendingAssignments = useMemo(
        () => assignments.filter((a) => !a.completed),
        [assignments]
    );

    useEffect(() => {
        if (isLoading) return;
        syncReminders(timetable);
    }, [isLoading, timetable]);

    // Mirrors "Assignments due": once read, an announcement drops off this
    // home widget, but stays visible (marked read) on the full Announcements page.
    const latestAnnouncements = useMemo(
        () => announcements.filter((a) => !a.read).slice(0, 3),
        [announcements]
    );
    const profileLine = [programme, level ? `Level ${level}` : ''].filter(Boolean).join(' · ');

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials(studentName)}</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting} numberOfLines={1}>Hello, {studentName}</Text>
                        <Text style={styles.subGreeting} numberOfLines={1}>
                            {todayName}{profileLine ? ` · ${profileLine}` : ''}
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.bellButton} onPress={() => router.push('/announcements')}>
                        <Ionicons name="notifications-outline" size={22} color={AppColors.text} />
                        {announcements.length > 0 && <View style={styles.bellDot} />}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Ionicons name="log-out-outline" size={20} color={AppColors.primary} />
                    </TouchableOpacity>
                </View>

                {isOffline && <OfflineBanner />}

                {examCountdown && (
                    <TouchableOpacity style={styles.examStrip} onPress={() => router.push('/exam-venue-search')}>
                        <Ionicons name="alarm-outline" size={18} color={AppColors.text} />
                        <Text style={styles.examStripText}>
                            {examCountdown.days === 0
                                ? `${examCountdown.courseCode} exam is today`
                                : `${examCountdown.courseCode} exam in ${examCountdown.days} day${examCountdown.days === 1 ? '' : 's'}`}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={AppColors.text} />
                    </TouchableOpacity>
                )}

                {isLoading ? (
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color={AppColors.primary} />
                    </View>
                ) : (
                    <>
                        {/* Next class hero */}
                        <View style={[styles.hero, cardShadow]}>
                            <View style={styles.heroLabelRow}>
                                <Ionicons name="school-outline" size={16} color={AppColors.accent} />
                                <Text style={styles.heroLabel}>Next class</Text>
                            </View>
                            {nextClass ? (
                                <>
                                    <Text style={styles.heroTitle}>{nextClass.courseTitle}</Text>
                                    <View style={styles.heroMetaRow}>
                                        <Ionicons name="time-outline" size={15} color="#DDEFE4" />
                                        <Text style={styles.heroMeta}>{nextClass.startTime} – {nextClass.endTime}</Text>
                                    </View>
                                    {!!nextClass.lecturer && (
                                        <View style={styles.heroMetaRow}>
                                            <Ionicons name="person-outline" size={15} color="#DDEFE4" />
                                            <Text style={styles.heroMeta}>{nextClass.lecturer}</Text>
                                        </View>
                                    )}
                                    <View style={styles.heroMetaRow}>
                                        <Ionicons name="location-outline" size={15} color="#DDEFE4" />
                                        <Text style={styles.heroMeta}>{nextClass.venue}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.navigateBtn} onPress={() => openInMaps(nextClass.venue)}>
                                        <Ionicons name="navigate" size={16} color={AppColors.primaryDark} />
                                        <Text style={styles.navigateBtnText}>Navigate</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <Text style={styles.heroEmpty}>
                                    {todaysClasses.length === 0 ? 'Nothing scheduled today.' : "That's all your classes for today."}
                                </Text>
                            )}
                        </View>

                        {/* Today's schedule */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Today&apos;s schedule</Text>
                                <TouchableOpacity onPress={() => router.push('/timetable')}>
                                    <Text style={styles.sectionLink}>Timetable</Text>
                                </TouchableOpacity>
                            </View>
                            {todaysClasses.length === 0 ? (
                                <Text style={styles.emptyLine}>No classes scheduled for today.</Text>
                            ) : (
                                todaysClasses.map((c) => (
                                    <View key={c.id} style={styles.railRow}>
                                        <View style={styles.railTime}>
                                            <Text style={styles.railTimeText}>{c.startTime}</Text>
                                        </View>
                                        <View style={[styles.railCard, cardShadow]}>
                                            <View style={styles.railCardTop}>
                                                <Text style={styles.railCourse}>{c.courseCode}</Text>
                                                <StatusPill status={c.status} />
                                            </View>
                                            <Text style={styles.railTitle}>{c.courseTitle}</Text>
                                            <View style={styles.railMetaRow}>
                                                <Ionicons name="location-outline" size={13} color={AppColors.mutedText} />
                                                <Text style={styles.railMeta}>{c.venue}</Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>

                        {/* Assignments due */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Assignments due</Text>
                                <TouchableOpacity onPress={() => router.push('/assignments')}>
                                    <Text style={styles.sectionLink}>All</Text>
                                </TouchableOpacity>
                            </View>
                            {pendingAssignments.length === 0 ? (
                                <Text style={styles.emptyLine}>You&apos;re all caught up.</Text>
                            ) : (
                                <>
                                    {pendingAssignments.slice(0, 3).map((a) => (
                                        <TouchableOpacity key={a.id} style={[styles.iconRow, cardShadow]} onPress={() => router.push('/assignments')}>
                                            <View style={styles.iconBadgeGold}>
                                                <Ionicons name="document-text-outline" size={18} color={AppColors.accent} />
                                            </View>
                                            <View style={styles.iconRowBody}>
                                                <Text style={styles.iconRowTitle}>{a.title}</Text>
                                                <Text style={styles.iconRowMeta}>{a.courseCode} · due {a.dueDate}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    {pendingAssignments.length > 3 && (
                                        <Text style={styles.moreLine}>+{pendingAssignments.length - 3} more</Text>
                                    )}
                                </>
                            )}
                        </View>

                        {/* Latest Announcements */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Latest Announcements</Text>
                                <TouchableOpacity onPress={() => router.push('/announcements')}>
                                    <Text style={styles.sectionLink}>All</Text>
                                </TouchableOpacity>
                            </View>
                            {latestAnnouncements.length === 0 ? (
                                <Text style={styles.emptyLine}>No announcements yet.</Text>
                            ) : (
                                latestAnnouncements.map((a) => (
                                    <TouchableOpacity key={a.id} style={[styles.iconRow, cardShadow]} onPress={() => router.push('/announcements')}>
                                        <View style={styles.iconBadgeGreen}>
                                            <Ionicons name="megaphone-outline" size={18} color={AppColors.primary} />
                                        </View>
                                        <View style={styles.iconRowBody}>
                                            <Text style={styles.iconRowTitle}>{a.title}</Text>
                                            <Text style={styles.iconRowMeta}>{a.category} · {a.postedAt}</Text>
                                            <Text style={styles.iconRowMessage} numberOfLines={2}>{a.message}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        {/* Quick actions */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quick actions</Text>
                            <View style={styles.grid}>
                                {quickActions.map((action) => (
                                    <TouchableOpacity
                                        key={action.route}
                                        style={[styles.gridItem, cardShadow]}
                                        onPress={() => router.push(action.route as never)}
                                    >
                                        <View style={styles.gridIcon}>
                                            <Ionicons name={action.icon} size={22} color={AppColors.primary} />
                                        </View>
                                        <Text style={styles.gridLabel}>{action.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            <BottomNav active="home" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: AppColors.background },
    container: { flex: 1, backgroundColor: AppColors.background },
    content: { padding: 20, paddingBottom: 40 },

    header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
    avatar: {
        width: 46, height: 46, borderRadius: 23, backgroundColor: AppColors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    avatarText: { color: AppColors.card, fontFamily: Fonts.bodyBold, fontSize: 16 },
    headerText: { flex: 1 },
    greeting: { fontSize: 20, fontFamily: Fonts.heading, color: AppColors.text },
    subGreeting: { fontSize: 13, color: AppColors.mutedText, marginTop: 2, fontFamily: Fonts.body },
    bellButton: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: AppColors.card,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center',
    },
    bellDot: {
        position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5,
        backgroundColor: AppColors.accent, borderWidth: 1.5, borderColor: AppColors.card,
    },
    signOutButton: {
        width: 42, height: 42, borderRadius: 21, backgroundColor: AppColors.card,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center',
    },

    examStrip: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: AppColors.accent, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
        marginBottom: 18,
    },
    examStripText: { flex: 1, fontSize: 14, fontFamily: Fonts.bodyBold, color: AppColors.text },

    loadingCard: { paddingVertical: 60, alignItems: 'center' },

    hero: { backgroundColor: AppColors.primary, borderRadius: 18, padding: 20, marginBottom: 22 },
    heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
    heroLabel: {
        fontSize: 12, fontFamily: Fonts.bodyBold, color: AppColors.accent,
        textTransform: 'uppercase', letterSpacing: 0.5,
    },
    heroTitle: { fontSize: 21, fontFamily: Fonts.heading, color: AppColors.card, marginBottom: 10 },
    heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 },
    heroMeta: { fontSize: 14, color: '#DDEFE4', fontFamily: Fonts.body },
    heroEmpty: { fontSize: 15, color: '#DDEFE4', lineHeight: 21, fontFamily: Fonts.body },
    navigateBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: AppColors.accent, borderRadius: 12, paddingVertical: 11, marginTop: 14,
    },
    navigateBtnText: { color: AppColors.primaryDark, fontFamily: Fonts.bodyBold, fontSize: 15 },

    section: { marginBottom: 22 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontFamily: Fonts.headingSemi, color: AppColors.text, marginBottom: 12 },
    sectionLink: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: AppColors.primary },
    emptyLine: { fontSize: 14, color: AppColors.mutedText, lineHeight: 20, fontFamily: Fonts.body },
    moreLine: { fontSize: 13, color: AppColors.mutedText, fontFamily: Fonts.bodyMedium, marginTop: 2 },

    railRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    railTime: { width: 62, paddingTop: 14, alignItems: 'flex-end' },
    railTimeText: { fontSize: 13, fontFamily: Fonts.bodyBold, color: AppColors.primary },
    railCard: {
        flex: 1, backgroundColor: AppColors.card, borderRadius: 14, padding: 14,
        borderWidth: 1, borderColor: AppColors.border,
    },
    railCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    railCourse: { fontSize: 12, fontFamily: Fonts.bodyBold, color: AppColors.primary },
    railTitle: { fontSize: 15, fontFamily: Fonts.bodyBold, color: AppColors.text, marginBottom: 5 },
    railMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    railMeta: { fontSize: 13, color: AppColors.mutedText, fontFamily: Fonts.body },

    iconRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: AppColors.card,
        borderRadius: 14, padding: 14, borderWidth: 1, borderColor: AppColors.border, marginBottom: 10,
    },
    iconBadgeGold: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.accent + '1F',
        justifyContent: 'center', alignItems: 'center',
    },
    iconBadgeGreen: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.primary + '14',
        justifyContent: 'center', alignItems: 'center',
    },
    iconRowBody: { flex: 1 },
    iconRowTitle: { fontSize: 15, fontFamily: Fonts.bodyBold, color: AppColors.text, marginBottom: 3 },
    iconRowMeta: { fontSize: 13, color: AppColors.mutedText, fontFamily: Fonts.body },
    iconRowMessage: { fontSize: 13, color: AppColors.mutedText, fontFamily: Fonts.body, marginTop: 3, lineHeight: 18 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: {
        flexBasis: '31%', flexGrow: 1, backgroundColor: AppColors.card, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: AppColors.border,
    },
    gridIcon: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: AppColors.primary + '14',
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    gridLabel: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: AppColors.text, textAlign: 'center' },
});
