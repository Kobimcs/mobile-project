import { AppColors } from '@/constants/colors';
import { Fonts, cardShadow } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/services/api';
import { type PickedDocument, uploadLabExamPdf } from '@/services/documents';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
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

type ExamVenueStatus = 'pending' | 'confirmed';

export default function ManageExamVenuesScreen() {
    const { token } = useAuth();
    const [courseCode, setCourseCode] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [examDate, setExamDate] = useState('');
    const [examTime, setExamTime] = useState('');
    const [venue, setVenue] = useState('');
    const [buildingOrBlock, setBuildingOrBlock] = useState('');
    const [roomOrHall, setRoomOrHall] = useState('');
    const [startNumber, setStartNumber] = useState('');
    const [endNumber, setEndNumber] = useState('');
    const [status, setStatus] = useState<ExamVenueStatus>('confirmed');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pdfCourseCode, setPdfCourseCode] = useState('');
    const [pdfCourseTitle, setPdfCourseTitle] = useState('');
    const [pdfFile, setPdfFile] = useState<PickedDocument | null>(null);
    const [isUploadingPdf, setIsUploadingPdf] = useState(false);
    const [pdfUploadResult, setPdfUploadResult] = useState<{ courseCode: string; entriesSaved: number } | null>(null);

    const handlePickPdf = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });
            if (result.canceled) return;

            const asset = result.assets[0];
            setPdfFile({
                uri: asset.uri,
                name: asset.name,
                mimeType: asset.mimeType,
                size: asset.size ?? undefined,
                // Only present on web — see the PickedDocument.file doc comment
                // in services/documents.ts for why this matters.
                file: (asset as { file?: Blob }).file,
            });
            setPdfUploadResult(null);
        } catch (e) {
            Alert.alert('Could not select file', e instanceof Error ? e.message : 'Please try again.');
        }
    };

    const handleUploadPdf = async () => {
        const cleanedCourseCode = pdfCourseCode.trim();
        const cleanedCourseTitle = pdfCourseTitle.trim();

        if (!cleanedCourseCode) {
            Alert.alert('Missing details', 'Please enter the course code.');
            return;
        }
        if (!pdfFile) {
            Alert.alert('No file selected', 'Please choose the lab exam schedule PDF to upload.');
            return;
        }

        try {
            setIsUploadingPdf(true);
            setPdfUploadResult(null);
            const result = await uploadLabExamPdf(
                pdfFile,
                { courseCode: cleanedCourseCode, courseTitle: cleanedCourseTitle || undefined },
                token
            );

            setPdfUploadResult({ courseCode: result.courseCode, entriesSaved: result.entriesSaved });
            Alert.alert('Upload complete', `Parsed and saved ${result.entriesSaved} entries for ${result.courseCode}.`);

            setPdfCourseCode('');
            setPdfCourseTitle('');
            setPdfFile(null);
        } catch (e) {
            Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not upload the PDF. Please try again.');
        } finally {
            setIsUploadingPdf(false);
        }
    };

    const handleSaveVenueRange = async () => {
        const cleanedCourseCode = courseCode.trim();
        const cleanedCourseTitle = courseTitle.trim();
        const cleanedExamDate = examDate.trim();
        const cleanedExamTime = examTime.trim();
        const cleanedVenue = venue.trim();
        const cleanedBuildingOrBlock = buildingOrBlock.trim();
        const cleanedStartNumber = startNumber.trim();
        const cleanedEndNumber = endNumber.trim();

        if (
            !cleanedCourseCode ||
            !cleanedCourseTitle ||
            !cleanedExamDate ||
            !cleanedExamTime ||
            !cleanedVenue ||
            !cleanedBuildingOrBlock ||
            !cleanedStartNumber ||
            !cleanedEndNumber
        ) {
            Alert.alert(
                'Missing details',
                'Please enter the course details, exam time, venue, building/block, and index/reference number range.'
            );
            return;
        }

        const start = Number(cleanedStartNumber);
        const end = Number(cleanedEndNumber);

        if (Number.isNaN(start) || Number.isNaN(end)) {
            Alert.alert(
                'Invalid range',
                'Start number and end number must contain numbers only.'
            );
            return;
        }

        if (start > end) {
            Alert.alert('Invalid range', 'The start number cannot be greater than the end number.');
            return;
        }

        try {
            setIsSubmitting(true);
            await apiRequest('/exam-venues', {
                method: 'POST',
                token,
                body: {
                    courseCode: cleanedCourseCode,
                    courseTitle: cleanedCourseTitle,
                    examDate: cleanedExamDate,
                    examTime: cleanedExamTime,
                    venue: cleanedVenue,
                    buildingOrBlock: cleanedBuildingOrBlock,
                    roomOrHall: roomOrHall.trim() || null,
                    startIndex: start,
                    endIndex: end,
                    status,
                },
            });

            Alert.alert('Venue range saved', 'Students in this range can now find their venue.', [
                { text: 'OK', onPress: () => router.back() },
            ]);

            setCourseCode('');
            setCourseTitle('');
            setExamDate('');
            setExamTime('');
            setVenue('');
            setBuildingOrBlock('');
            setRoomOrHall('');
            setStartNumber('');
            setEndNumber('');
            setStatus('confirmed');
        } catch (e) {
            Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
                        <Ionicons name="chevron-back" size={22} color={AppColors.text} />
                    </TouchableOpacity>

                    <Text style={styles.title}>Manage Exam Venues</Text>
                    <Text style={styles.subtitle}>
                        Add exam venue ranges so students can search with their index or
                        reference number.
                    </Text>

                    <View style={styles.uploadCard}>
                        <Text style={styles.sectionTitle}>Lab Exam Schedule (PDF)</Text>
                        <Text style={styles.helperText}>
                            Upload the lecturer&apos;s PDF listing students individually with their venue.
                            Re-uploading for the same course code replaces the previous list.
                        </Text>

                        <Text style={styles.label}>Course Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={pdfCourseCode}
                            onChangeText={setPdfCourseCode}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Course Title (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={pdfCourseTitle}
                            onChangeText={setPdfCourseTitle}
                        />

                        <TouchableOpacity style={styles.fileButton} onPress={handlePickPdf}>
                            <Text style={styles.fileButtonText}>
                                {pdfFile ? 'Change PDF file' : 'Choose PDF file'}
                            </Text>
                        </TouchableOpacity>

                        {pdfFile && (
                            <View style={styles.filePreview}>
                                <Text style={styles.filePreviewLabel}>Selected file</Text>
                                <Text style={styles.filePreviewText}>{pdfFile.name}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.uploadButton, isUploadingPdf && styles.disabledButton]}
                            onPress={handleUploadPdf}
                            disabled={isUploadingPdf}
                        >
                            {isUploadingPdf ? (
                                <ActivityIndicator color={AppColors.card} />
                            ) : (
                                <Text style={styles.uploadButtonText}>Upload PDF</Text>
                            )}
                        </TouchableOpacity>

                        {pdfUploadResult && (
                            <View style={styles.successBanner}>
                                <Text style={styles.successBannerText}>
                                    Parsed and saved {pdfUploadResult.entriesSaved} entries for {pdfUploadResult.courseCode}.
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.formCard}>
                        <Text style={styles.sectionTitle}>Or add one manually</Text>

                        <Text style={styles.label}>Course Code</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={courseCode}
                            onChangeText={setCourseCode}
                            autoCapitalize="characters"
                        />

                        <Text style={styles.label}>Course Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={courseTitle}
                            onChangeText={setCourseTitle}
                        />

                        <Text style={styles.label}>Exam Date</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={examDate}
                            onChangeText={setExamDate}
                        />

                        <Text style={styles.label}>Exam Time</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={examTime}
                            onChangeText={setExamTime}
                        />

                        <Text style={styles.sectionTitle}>Venue Details</Text>

                        <Text style={styles.label}>Venue</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={venue}
                            onChangeText={setVenue}
                        />

                        <Text style={styles.label}>Building / Block</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={buildingOrBlock}
                            onChangeText={setBuildingOrBlock}
                        />

                        <Text style={styles.label}>Room / Hall (optional)</Text>
                        <TextInput
                            style={styles.input}
                            placeholderTextColor={AppColors.mutedText}
                            value={roomOrHall}
                            onChangeText={setRoomOrHall}
                        />

                        <Text style={styles.sectionTitle}>Index / Reference Range</Text>
                        <Text style={styles.helperText}>
                            Enter the index/reference number range from the official exam
                            venue notice.
                        </Text>

                        <View style={styles.rangeRow}>
                            <View style={styles.rangeInputWrapper}>
                                <Text style={styles.label}>Start Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={AppColors.mutedText}
                                    value={startNumber}
                                    onChangeText={setStartNumber}
                                    keyboardType="number-pad"
                                />
                            </View>

                            <View style={styles.rangeInputWrapper}>
                                <Text style={styles.label}>End Number</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholderTextColor={AppColors.mutedText}
                                    value={endNumber}
                                    onChangeText={setEndNumber}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Status</Text>

                        <View style={styles.statusRow}>
                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    status === 'confirmed' && styles.activeStatusButton,
                                ]}
                                onPress={() => setStatus('confirmed')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        status === 'confirmed' && styles.activeStatusButtonText,
                                    ]}
                                >
                                    Confirmed
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.statusButton,
                                    status === 'pending' && styles.activeStatusButton,
                                ]}
                                onPress={() => setStatus('pending')}
                            >
                                <Text
                                    style={[
                                        styles.statusButtonText,
                                        status === 'pending' && styles.activeStatusButtonText,
                                    ]}
                                >
                                    Pending
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                            onPress={handleSaveVenueRange}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={AppColors.card} />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Venue Range</Text>
                            )}
                        </TouchableOpacity>
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
    backButton: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: AppColors.card,
        borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    title: {
        fontSize: 28,
        fontFamily: Fonts.heading,
        color: AppColors.text,
    },
    subtitle: {
        fontSize: 14,
        color: AppColors.mutedText,
        marginTop: 6,
        marginBottom: 22,
        lineHeight: 20,
        fontFamily: Fonts.body,
    },
    formCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        ...cardShadow,
    },
    uploadCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 16,
        ...cardShadow,
    },
    codeText: {
        fontSize: 12,
        color: AppColors.text,
        backgroundColor: AppColors.background,
        borderRadius: 8,
        padding: 10,
        marginBottom: 14,
        lineHeight: 18,
        fontFamily: Fonts.body,
    },
    uploadButton: {
        height: 50,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadButtonText: {
        color: AppColors.card,
        fontSize: 15,
        fontFamily: Fonts.bodyBold,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: Fonts.heading,
        color: AppColors.text,
        marginBottom: 10,
    },
    helperText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 20,
        marginBottom: 16,
        fontFamily: Fonts.body,
    },
    label: {
        fontSize: 14,
        fontFamily: Fonts.bodyBold,
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
        fontFamily: Fonts.body,
    },
    rangeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    rangeInputWrapper: {
        flex: 1,
    },
    statusRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 18,
    },
    statusButton: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.border,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: AppColors.card,
    },
    activeStatusButton: {
        backgroundColor: AppColors.primary,
        borderColor: AppColors.primary,
    },
    statusButtonText: {
        color: AppColors.mutedText,
        fontSize: 14,
        fontFamily: Fonts.bodyBold,
    },
    activeStatusButtonText: {
        color: AppColors.card,
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
        marginBottom: 20,
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
    successBanner: {
        backgroundColor: AppColors.success,
        borderRadius: 12,
        padding: 14,
        marginTop: 14,
    },
    successBannerText: {
        color: AppColors.card,
        fontSize: 14,
        fontFamily: Fonts.bodyBold,
        lineHeight: 20,
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
        fontFamily: Fonts.bodyBold,
    },
    disabledButton: {
        backgroundColor: AppColors.primaryDark,
    },
});