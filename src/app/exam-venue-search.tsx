import { NavigateButton } from '@/components/navigate-button';
import { AppColors } from '@/constants/colors';
import { Fonts, cardShadow } from '@/constants/ui';
import { useAuth } from '@/context/auth-context';
import { apiRequest } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExamVenueLookupResponse = {
    found: boolean;
    source: 'LAB_EXAM_PDF' | 'RANGE' | null;
    courseCode: string | null;
    courseTitle: string | null;
    examDate: string | null;
    examTime: string | null;
    venue: string | null;
    buildingOrBlock: string | null;
    roomOrHall: string | null;
    status: string | null;
};

function formatStatusLabel(status: string) {
    if (status === 'confirmed') return 'Confirmed';
    return 'Pending';
}

export default function ExamVenueSearchScreen() {
    const { token } = useAuth();

    const [courseCode, setCourseCode] = useState('');
    const [searchNumber, setSearchNumber] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [result, setResult] = useState<ExamVenueLookupResponse | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    async function handleSearchVenue() {
        const cleanedCourseCode = courseCode.trim();
        const cleanedNumber = searchNumber.trim();

        if (!cleanedCourseCode) {
            Alert.alert('Missing course code', 'Please enter the course code.');
            return;
        }
        if (!cleanedNumber) {
            Alert.alert('Missing number', 'Please enter your index or reference number.');
            return;
        }
        if (!/^\d+$/.test(cleanedNumber)) {
            Alert.alert('Invalid number', 'Please enter numbers only. Example: 6170524 or 21475407.');
            return;
        }

        try {
            setIsSearching(true);
            setSearchError(null);
            setResult(null);
            const response = await apiRequest<ExamVenueLookupResponse>(
                `/exam-venues/lookup?courseCode=${encodeURIComponent(cleanedCourseCode)}&query=${encodeURIComponent(cleanedNumber)}`,
                { token }
            );
            setResult(response);
        } catch (e) {
            setSearchError(e instanceof Error ? e.message : 'Could not search right now. Please try again.');
        } finally {
            setIsSearching(false);
            setHasSearched(true);
        }
    }

    function handleClearSearch() {
        setCourseCode('');
        setSearchNumber('');
        setResult(null);
        setSearchError(null);
        setHasSearched(false);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
                    <Ionicons name="chevron-back" size={22} color={AppColors.text} />
                </TouchableOpacity>

                <Text style={styles.title}>Exam Venue Search</Text>
                <Text style={styles.subtitle}>
                    Enter the course code and your index or reference number to find your exam venue.
                </Text>

                <View style={styles.searchCard}>
                    <Text style={styles.label}>Course Code</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor={AppColors.mutedText}
                        value={courseCode}
                        onChangeText={setCourseCode}
                        autoCapitalize="characters"
                    />

                    <Text style={styles.label}>Index / Reference Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholderTextColor={AppColors.mutedText}
                        value={searchNumber}
                        onChangeText={setSearchNumber}
                        keyboardType="number-pad"
                    />

                    <TouchableOpacity
                        style={[styles.searchButton, isSearching && styles.disabledButton]}
                        onPress={handleSearchVenue}
                        disabled={isSearching}
                    >
                        {isSearching ? (
                            <ActivityIndicator color={AppColors.card} />
                        ) : (
                            <Text style={styles.searchButtonText}>Search Venue</Text>
                        )}
                    </TouchableOpacity>

                    {hasSearched && (
                        <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                            <Text style={styles.clearButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!hasSearched && !isSearching && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Search for your exam venue</Text>
                        <Text style={styles.emptyText}>
                            Enter the course code and your index or reference number to see your venue.
                        </Text>
                    </View>
                )}

                {searchError && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Search failed</Text>
                        <Text style={styles.emptyText}>{searchError}</Text>
                    </View>
                )}

                {hasSearched && !searchError && result?.found && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <Text style={styles.courseCode}>{result.courseCode}</Text>
                            {result.status ? (
                                <Text
                                    style={[
                                        styles.statusBadge,
                                        result.status === 'confirmed' && styles.confirmedBadge,
                                    ]}
                                >
                                    {formatStatusLabel(result.status)}
                                </Text>
                            ) : null}
                        </View>

                        <Text style={styles.courseTitle}>{result.courseTitle}</Text>

                        {result.examDate ? (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Exam Date</Text>
                                <Text style={styles.infoValue}>{result.examDate}</Text>
                            </View>
                        ) : null}

                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Exam Time</Text>
                            <Text style={styles.infoValue}>{result.examTime}</Text>
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoLabel}>Venue</Text>
                            <Text style={styles.infoValue}>{result.venue}</Text>
                        </View>

                        {result.buildingOrBlock ? (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Building / Block</Text>
                                <Text style={styles.infoValue}>{result.buildingOrBlock}</Text>
                            </View>
                        ) : null}

                        {result.roomOrHall ? (
                            <View style={styles.infoBox}>
                                <Text style={styles.infoLabel}>Room / Hall</Text>
                                <Text style={styles.infoValue}>{result.roomOrHall}</Text>
                            </View>
                        ) : null}

                        <NavigateButton
                            query={`${result.venue ?? ''} ${result.buildingOrBlock ?? ''}`.trim()}
                        />
                    </View>
                )}

                {hasSearched && !searchError && result && !result.found && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>You&apos;re not on this list</Text>
                        <Text style={styles.emptyText}>
                            You&apos;re not on this list for that course. If you&apos;re sure of the
                            course, check with your course rep, or report to the default centre.
                        </Text>
                    </View>
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
    searchCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 18,
        ...cardShadow,
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
        marginBottom: 16,
        fontSize: 15,
        color: AppColors.text,
        backgroundColor: AppColors.background,
        fontFamily: Fonts.body,
    },
    searchButton: {
        height: 52,
        borderRadius: 12,
        backgroundColor: AppColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchButtonText: {
        color: AppColors.card,
        fontSize: 16,
        fontFamily: Fonts.bodyBold,
    },
    disabledButton: {
        backgroundColor: AppColors.primaryDark,
    },
    clearButton: {
        height: 46,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.border,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    clearButtonText: {
        color: AppColors.mutedText,
        fontSize: 14,
        fontFamily: Fonts.bodyMedium,
    },
    resultCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 14,
    },
    resultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10,
    },
    courseCode: {
        color: AppColors.primary,
        fontSize: 13,
        fontFamily: Fonts.bodyBold,
    },
    statusBadge: {
        backgroundColor: AppColors.warning,
        color: AppColors.card,
        fontSize: 11,
        fontFamily: Fonts.bodyBold,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
    confirmedBadge: {
        backgroundColor: AppColors.success,
    },
    courseTitle: {
        color: AppColors.text,
        fontSize: 18,
        fontFamily: Fonts.headingSemi,
        marginBottom: 14,
    },
    infoBox: {
        backgroundColor: AppColors.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.border,
        padding: 12,
        marginBottom: 10,
    },
    infoLabel: {
        fontSize: 12,
        color: AppColors.mutedText,
        fontFamily: Fonts.bodyMedium,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 14,
        color: AppColors.text,
        fontFamily: Fonts.bodyBold,
        lineHeight: 20,
    },
    emptyCard: {
        backgroundColor: AppColors.card,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: AppColors.border,
        marginBottom: 18,
        ...cardShadow,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: Fonts.headingSemi,
        color: AppColors.text,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: AppColors.mutedText,
        lineHeight: 21,
        fontFamily: Fonts.body,
    },
});