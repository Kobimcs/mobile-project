import { AppColors } from '@/constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SelectedFile = {
    name: string;
    uri: string;
    mimeType?: string;
    size?: number;
};

type ClassStatus = 'Normal' | 'Venue Changed' | 'Time Changed' | 'Cancelled';

export default function ManageTimetableScreen() {
    const [officialFile, setOfficialFile] = useState<SelectedFile | null>(null);

    const [courseCode, setCourseCode] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [day, setDay] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [venue, setVenue] = useState('');
    const [lecturer, setLecturer] = useState('');
    const [status, setStatus] = useState<ClassStatus>('Normal');

    const [oldVenue, setOldVenue] = useState('');
    const [newVenue, setNewVenue] = useState('');
    const [oldTime, setOldTime] = useState('');
    const [newTime, setNewTime] = useState('');
    const [updateReason, setUpdateReason] = useState('');
    const [makeUpClassInfo, setMakeUpClassInfo] = useState('');

    const handleSelectTimetableFile = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: [
                'application/pdf',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'image/*',
            ],
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return;
        }

        const file = result.assets[0];

        setOfficialFile({
            name: file.name,
            uri: file.uri,
            mimeType: file.mimeType,
            size: file.size,
        });
    };

    const resetUpdateFields = () => {
        setOldVenue('');
        setNewVenue('');
        setOldTime('');
        setNewTime('');
        setUpdateReason('');
        setMakeUpClassInfo('');
    };

    const handleStatusChange = (selectedStatus: ClassStatus) => {
        setStatus(selectedStatus);
        resetUpdateFields();
    };

    const handleSaveClass = () => {
        const cleanedCourseCode = courseCode.trim();
        const cleanedCourseTitle = courseTitle.trim();
        const cleanedDay = day.trim();
        const cleanedStartTime = startTime.trim();
        const cleanedEndTime = endTime.trim();
        const cleanedVenue = venue.trim();

        if (
            !cleanedCourseCode ||
            !cleanedCourseTitle ||
            !cleanedDay ||
            !cleanedStartTime ||
            !cleanedEndTime ||
            !cleanedVenue
        ) {
            Alert.alert(
                'Missing details',
                'Please enter the course code, course title, day, time, and venue.'
            );
            return;
        }

        if (status === 'Venue Changed' && (!oldVenue.trim() || !newVenue.trim())) {
            Alert.alert(
                'Missing venue update',
                'Please enter both the old venue and the new venue.'
            );
            return;
        }

        if (status === 'Time Changed' && (!oldTime.trim() || !newTime.trim())) {
            Alert.alert(
                'Missing time update',
                'Please enter both the old time and the new time.'
            );
            return;
        }

        if (status === 'Cancelled' && !updateReason.trim()) {
            Alert.alert(
                'Missing cancellation reason',
                'Please enter why the class was cancelled.'
            );
            return;
        }

        Alert.alert(
            'Class record ready',
            'The timetable form works. Backend saving will be connected later.'
        );

        setCourseCode('');
        setCourseTitle('');
        setDay('');
        setStartTime('');
        setEndTime('');
        setVenue('');
        setLecturer('');
        setStatus('Normal');
        resetUpdateFields();
    };

    const statusOptions: ClassStatus[] = [
        'Normal',
        'Venue Changed',
        'Time Changed',
        'Cancelled',
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    style={styles.container}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.title}>Manage Timetable</Text>
                    <Text style={styles.subtitle}>
                        Upload the official timetable file and add editable class records for students.
                    </Text>

                    <View style={styles.fileCard}>
                        <Text style={styles.sectionTitle}>Official Timetable File</Text>
                        <Text style={styles.helperText}>
                            Upload the department timetable as PDF, Excel, or image for reference.
                        </Text>

                        <TouchableOpacity
                            style={styles.fileButton}
                            onPress={handleSelectTimetableFile}
                        >
                            <Text style={styles.fileButtonText}>Select Timetable File</Text>
                        </TouchableOpacity>

                        <View style={styles.filePreview}>
                            <Text style={styles.filePreviewLabel}>Selected file</Text>
                            <Text style={styles.filePreviewText}>
                                {officialFile ? officialFile.name : 'No file selected'}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Add Class Record</Text>
                        <Text style={styles.helperText}>
                            These records allow the app to show today's classes, next class,
                            venue changes, and reminders.
                        </Text>

                        <Text style={styles.label}>Course Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Example: CSM 281"
                            placeholderTextColor={AppColors.mutedText}
                            value={courseCode}
                            onChangeText={setCourseCode}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Course Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Example: Object Oriented Programming"
                            placeholderTextColor={AppColors.mutedText}
                            value={courseTitle}
                            onChangeText={setCourseTitle}
                        />

                        <Text style={styles.label}>Day</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Example: Monday"
                            placeholderTextColor={AppColors.mutedText}
                            value={day}
                            onChangeText={setDay}
                        />

                        <View style={styles.timeRow}>
                            <View style={styles.timeInputWrapper}>
                                <Text style={styles.label}>Start Time</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="8:00 AM"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={startTime}
                                    onChangeText={setStartTime}
                                />
                            </View>

                            <View style={styles.timeInputWrapper}>
                                <Text style={styles.label}>End Time</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="10:00 AM"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={endTime}
                                    onChangeText={setEndTime}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Current Venue</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Example: CCB Auditorium"
                            placeholderTextColor={AppColors.mutedText}
                            value={venue}
                            onChangeText={setVenue}
                        />

                        <Text style={styles.label}>Lecturer</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Example: Dr. Mensah"
                            placeholderTextColor={AppColors.mutedText}
                            value={lecturer}
                            onChangeText={setLecturer}
                        />

                        <Text style={styles.label}>Class Status</Text>
                        <View style={styles.statusList}>
                            {statusOptions.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.statusButton,
                                        status === item && styles.activeStatusButton,
                                    ]}
                                    onPress={() => handleStatusChange(item)}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            status === item && styles.activeStatusText,
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {status === 'Venue Changed' && (
                            <View style={styles.updateBox}>
                                <Text style={styles.updateTitle}>Venue Change Details</Text>

                                <Text style={styles.label}>Old Venue</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Example: Room 5"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={oldVenue}
                                    onChangeText={setOldVenue}
                                />

                                <Text style={styles.label}>New Venue</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Example: CCB Auditorium"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={newVenue}
                                    onChangeText={setNewVenue}
                                />

                                <Text style={styles.label}>Reason / Note</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Example: Lecturer requested a larger room"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={updateReason}
                                    onChangeText={setUpdateReason}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        )}

                        {status === 'Time Changed' && (
                            <View style={styles.updateBox}>
                                <Text style={styles.updateTitle}>Time Change Details</Text>

                                <Text style={styles.label}>Old Time</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Example: 8:00 AM - 10:00 AM"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={oldTime}
                                    onChangeText={setOldTime}
                                />

                                <Text style={styles.label}>New Time</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Example: 2:00 PM - 4:00 PM"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={newTime}
                                    onChangeText={setNewTime}
                                />

                                <Text style={styles.label}>Reason / Note</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Example: Lecturer is unavailable in the morning"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={updateReason}
                                    onChangeText={setUpdateReason}
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        )}

                        {status === 'Cancelled' && (
                            <View style={styles.updateBox}>
                                <Text style={styles.updateTitle}>Cancellation Details</Text>

                                <Text style={styles.label}>Cancellation Reason</Text>
                                <TextInput
                                    style={styles.noteInput}
                                    placeholder="Example: Lecturer is unavailable"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={updateReason}
                                    onChangeText={setUpdateReason}
                                    multiline
                                    textAlignVertical="top"
                                />

                                <Text style={styles.label}>Make-up Class Information</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Example: To be announced"
                                    placeholderTextColor={AppColors.mutedText}
                                    value={makeUpClassInfo}
                                    onChangeText={setMakeUpClassInfo}
                                />
                            </View>
                        )}

                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveClass}>
                            <Text style={styles.saveButtonText}>Save Class Record</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.noteCard}>
                        <Text style={styles.noteTitle}>Why both file and records?</Text>
                        <Text style={styles.noteText}>
                            The official file keeps the department's original timetable.
                            The editable records let course reps update only one venue or time
                            when lecturers make changes.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: AppColors.background,
    },
    keyboardView: {
        flex: 1,
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
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 18,
    },
    formCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: AppColors.text,
        marginBottom: 6,
    },
    helperText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 20,
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: AppColors.text,
        marginBottom: 8,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderColor: AppColors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        marginBottom: 18,
        fontSize: 15,
        color: AppColors.text,
        backgroundColor: AppColors.background,
    },
    noteInput: {
        minHeight: 90,
        borderWidth: 1,
        borderColor: AppColors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 18,
        fontSize: 15,
        color: AppColors.text,
        backgroundColor: AppColors.background,
        lineHeight: 21,
    },
    timeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    timeInputWrapper: {
        flex: 1,
    },
    fileButton: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    fileButtonText: {
        color: AppColors.primary,
        fontSize: 15,
        fontWeight: '800',
    },
    filePreview: {
        backgroundColor: AppColors.background,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    filePreviewLabel: {
        fontSize: 12,
        color: AppColors.mutedText,
        fontWeight: '700',
        marginBottom: 4,
    },
    filePreviewText: {
        fontSize: 14,
        color: AppColors.text,
        fontWeight: '700',
    },
    statusList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    statusButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 18,
        backgroundColor: AppColors.background,
        borderWidth: 1,
        borderColor: AppColors.border,
    },
    activeStatusButton: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    statusText: {
        color: AppColors.mutedText,
        fontSize: 13,
        fontWeight: '700',
    },
    activeStatusText: {
        color: AppColors.card,
    },
    updateBox: {
        backgroundColor: AppColors.background,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 20,
    },
    updateTitle: {
        fontSize: 16,
        fontWeight: '900',
        color: AppColors.primary,
        marginBottom: 12,
    },
    saveButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: AppColors.card,
        fontSize: 16,
        fontWeight: '800',
    },
    noteCard: {
        marginTop: 18,
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