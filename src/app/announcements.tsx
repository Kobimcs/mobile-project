import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AnnouncementCategory =
    | 'General'
    | 'Class Update'
    | 'Venue Change'
    | 'Assignment'
    | 'Exam';

type Announcement = {
    id: number;
    title: string;
    message: string;
    category: AnnouncementCategory;
    targetClassGroup: string;
    postedBy: string;
    postedAt: string;
    isRead: boolean;
};

type FilterCategory = 'All' | AnnouncementCategory;

// Backend data will be loaded into this list later.
// Keep this empty for now so the app does not show fake announcement records.
const initialAnnouncements: Announcement[] = [];

const filterCategories: FilterCategory[] = [
    'All',
    'General',
    'Class Update',
    'Venue Change',
    'Assignment',
    'Exam',
];

export default function AnnouncementsScreen() {
    const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
    const [announcements, setAnnouncements] =
        useState<Announcement[]>(initialAnnouncements);

    const unreadCount = useMemo(
        () => announcements.filter((announcement) => !announcement.isRead).length,
        [announcements]
    );

    const filteredAnnouncements = useMemo(() => {
        if (activeFilter === 'All') {
            return announcements;
        }

        return announcements.filter(
            (announcement) => announcement.category === activeFilter
        );
    }, [activeFilter, announcements]);

    function handleMarkAsRead(announcementId: number) {
        setAnnouncements((currentAnnouncements) =>
            currentAnnouncements.map((announcement) =>
                announcement.id === announcementId
                    ? { ...announcement, isRead: true }
                    : announcement
            )
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Announcements</Text>
                    <Text style={styles.subtitle}>
                        View important class updates from course reps.
                    </Text>
                </View>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{announcements.length}</Text>
                        <Text style={styles.summaryLabel}>Total</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryNumber}>{unreadCount}</Text>
                        <Text style={styles.summaryLabel}>Unread</Text>
                    </View>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterContent}
                    style={styles.filterScroll}
                >
                    {filterCategories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.filterChip,
                                activeFilter === category && styles.activeFilterChip,
                            ]}
                            onPress={() => setActiveFilter(category)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === category && styles.activeFilterText,
                                ]}
                            >
                                {category}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {filteredAnnouncements.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>
                            {activeFilter === 'All'
                                ? 'No announcements yet'
                                : `No ${activeFilter.toLowerCase()} announcements`}
                        </Text>
                        <Text style={styles.emptyText}>
                            Announcements posted by course reps will appear here with
                            categories, class group targeting, and read status.
                        </Text>
                    </View>
                ) : (
                    filteredAnnouncements.map((announcement) => (
                        <View
                            key={announcement.id}
                            style={[
                                styles.announcementCard,
                                !announcement.isRead && styles.unreadCard,
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <Text style={styles.category}>{announcement.category}</Text>

                                {!announcement.isRead && (
                                    <View style={styles.unreadBadge}>
                                        <Text style={styles.unreadBadgeText}>Unread</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.announcementTitle}>
                                {announcement.title}
                            </Text>
                            <Text style={styles.message}>{announcement.message}</Text>

                            <View style={styles.targetBox}>
                                <Text style={styles.targetLabel}>Target group</Text>
                                <Text style={styles.targetText}>
                                    {announcement.targetClassGroup}
                                </Text>
                            </View>

                            {!announcement.isRead && (
                                <TouchableOpacity
                                    style={styles.readButton}
                                    onPress={() => handleMarkAsRead(announcement.id)}
                                >
                                    <Text style={styles.readButtonText}>Mark as Read</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.footer}>
                                <Text style={styles.footerText}>
                                    {announcement.postedBy}
                                </Text>
                                <Text style={styles.footerText}>
                                    {announcement.postedAt}
                                </Text>
                            </View>
                        </View>
                    ))
                )}
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
        marginBottom: 18,
    },
    backText: {
        color: AppColors.primary,
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 14,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: AppColors.text,
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.mutedText,
        marginTop: 6,
        lineHeight: 20,
    },
    summaryCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        padding: 18,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryNumber: {
        fontSize: 26,
        fontWeight: '900',
        color: AppColors.primary,
    },
    summaryLabel: {
        marginTop: 4,
        fontSize: 13,
        fontWeight: '700',
        color: AppColors.mutedText,
    },
    summaryDivider: {
        width: 1,
        height: 42,
        backgroundColor: AppColors.border,
    },
    filterScroll: {
        marginBottom: 16,
    },
    filterContent: {
        gap: 10,
        paddingRight: 4,
    },
    filterChip: {
        backgroundColor: AppColors.card,
        borderWidth: 1,
        borderColor: AppColors.border,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    activeFilterChip: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    filterText: {
        color: AppColors.mutedText,
        fontSize: 13,
        fontWeight: '800',
    },
    activeFilterText: {
        color: AppColors.card,
    },
    emptyCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 21,
    },
    announcementCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 14,
    },
    unreadCard: {
        borderColor: AppColors.primary,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    category: {
        alignSelf: 'flex-start',
        backgroundColor: AppColors.background,
        color: AppColors.primary,
        fontSize: 12,
        fontWeight: '800',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        overflow: 'hidden',
    },
    unreadBadge: {
        backgroundColor: AppColors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
    },
    unreadBadgeText: {
        color: AppColors.card,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    announcementTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 21,
    },
    targetBox: {
        backgroundColor: AppColors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.border,
        padding: 12,
        marginTop: 14,
    },
    targetLabel: {
        fontSize: 12,
        color: AppColors.mutedText,
        fontWeight: '700',
        marginBottom: 4,
    },
    targetText: {
        fontSize: 14,
        color: AppColors.text,
        fontWeight: '800',
    },
    readButton: {
        height: 46,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    readButtonText: {
        color: AppColors.card,
        fontSize: 15,
        fontWeight: '800',
    },
    footer: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: AppColors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    footerText: {
        fontSize: 12,
        color: AppColors.mutedText,
        fontWeight: '600',
    },
});