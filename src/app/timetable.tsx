import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimetableRecord = {
    id: number;
    courseCode: string;
    courseTitle: string;
    day: string;
    startTime: string;
    endTime: string;
    venue: string;
    lecturer: string;
    status: 'Normal' | 'Venue Changed' | 'Time Changed' | 'Cancelled';
};

const timetableRecords: TimetableRecord[] = [];

export default function TimetableScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Timetable</Text>
                <Text style={styles.subtitle}>
                    View your weekly classes, official timetable file, and venue or time updates.
                </Text>

                <View style={styles.fileCard}>
                    <Text style={styles.fileLabel}>Official Timetable File</Text>
                    <Text style={styles.fileTitle}>No timetable file uploaded yet</Text>
                    <Text style={styles.fileText}>
                        When the department releases the official timetable, the course rep
                        or admin can upload it here for students to open later.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today&apos;s Classes</Text>

                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No classes loaded yet</Text>
                        <Text style={styles.emptyText}>
                            Your classes for today will appear here after timetable records
                            are added by the course rep or admin.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Timetable</Text>

                    {timetableRecords.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Text style={styles.emptyTitle}>No timetable records yet</Text>
                            <Text style={styles.emptyText}>
                                Structured timetable records will appear here. This will allow
                                the app to show next class, venue changes, and reminders.
                            </Text>
                        </View>
                    ) : (
                        timetableRecords.map((record) => (
                            <View key={record.id} style={styles.classCard}>
                                <View style={styles.classHeader}>
                                    <Text style={styles.courseCode}>{record.courseCode}</Text>
                                    <Text style={styles.status}>{record.status}</Text>
                                </View>

                                <Text style={styles.courseTitle}>{record.courseTitle}</Text>
                                <Text style={styles.classDetail}>
                                    {record.day} • {record.startTime} - {record.endTime}
                                </Text>
                                <Text style={styles.classDetail}>Venue: {record.venue}</Text>
                                <Text style={styles.classDetail}>Lecturer: {record.lecturer}</Text>
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>Why this design?</Text>
                    <Text style={styles.noteText}>
                        The app stores both the official timetable file and editable class
                        records. This makes it possible to update only one changed venue or
                        time without replacing the entire timetable file.
                    </Text>
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
        marginBottom: 22,
        lineHeight: 20,
    },
    fileCard: {
        backgroundColor: AppColors.primary,
        borderRadius: 18,
        padding: 18,
        marginBottom: 24,
    },
    fileLabel: {
        color: AppColors.accent,
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 8,
    },
    fileTitle: {
        color: AppColors.card,
        fontSize: 19,
        fontWeight: '900',
        marginBottom: 6,
    },
    fileText: {
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
    emptyCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    emptyTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 21,
    },
    classCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 14,
    },
    classHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    courseCode: {
        color: AppColors.primary,
        fontSize: 13,
        fontWeight: '900',
    },
    status: {
        color: AppColors.warning,
        fontSize: 12,
        fontWeight: '800',
    },
    courseTitle: {
        color: AppColors.text,
        fontSize: 17,
        fontWeight: '800',
        marginBottom: 8,
    },
    classDetail: {
        color: AppColors.mutedText,
        fontSize: 14,
        lineHeight: 21,
    },
    noteCard: {
        backgroundColor: AppColors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    noteTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 6,
    },
    noteText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 20,
    },
});