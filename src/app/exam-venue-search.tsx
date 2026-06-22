import { AppColors } from '@/constants/colors';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ExamVenueStatus = 'pending' | 'confirmed';

type ExamVenueRecord = {
    id: number;
    courseCode: string;
    courseTitle: string;
    examDate: string;
    examTime: string;
    venue: string;
    buildingOrBlock: string;
    roomOrHall?: string;
    startIndex: number;
    endIndex: number;
    status: ExamVenueStatus;
};

const examVenueRecords: ExamVenueRecord[] = [];

function formatStatusLabel(status: ExamVenueStatus) {
    return status === 'confirmed' ? 'Confirmed' : 'Pending';
}

function navigateToVenue(venue: string) {
    const query = encodeURIComponent(`${venue} KNUST Kumasi Ghana`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
}

export default function ExamVenueSearchScreen() {
    const [searchNumber, setSearchNumber] = useState('');
    const [matchedVenues, setMatchedVenues] = useState<ExamVenueRecord[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    function handleSearchVenue() {
        const cleanedNumber = searchNumber.trim();
        if (!cleanedNumber) {
            Alert.alert('Missing number', 'Please enter your index number or reference number.');
            return;
        }
        const numericValue = Number(cleanedNumber);
        if (Number.isNaN(numericValue)) {
            Alert.alert('Invalid number', 'Please enter numbers only. Example: 6170524');
            return;
        }
        const foundVenues = examVenueRecords.filter(
            (r) => numericValue >= r.startIndex && numericValue <= r.endIndex
        );
        setMatchedVenues(foundVenues);
        setHasSearched(true);
    }

    function handleClearSearch() {
        setSearchNumber('');
        setMatchedVenues([]);
        setHasSearched(false);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Exam Venue Search</Text>
                <Text style={styles.subtitle}>
                    Enter your index number or reference number to find the exam venue range that matches your number.
                </Text>

                <View style={styles.searchCard}>
                    <Text style={styles.label}>Index / Reference Number</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter index or reference number"
                        placeholderTextColor={AppColors.mutedText}
                        value={searchNumber}
                        onChangeText={setSearchNumber}
                        keyboardType="number-pad"
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchVenue}>
                        <Text style={styles.searchButtonText}>Search Venue</Text>
                    </TouchableOpacity>
                    {hasSearched && (
                        <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
                            <Text style={styles.clearButtonText}>Clear Search</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!hasSearched && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Search for your exam venue</Text>
                        <Text style={styles.emptyText}>
                            Your venue result will appear here after you enter your index or reference number.
                        </Text>
                    </View>
                )}

                {hasSearched && matchedVenues.length > 0 && (
                    <View style={styles.resultsSection}>
                        <Text style={styles.sectionTitle}>
                            {matchedVenues.length} matching venue{matchedVenues.length === 1 ? '' : 's'} found
                        </Text>

                        {matchedVenues.map((venueRecord) => (
                            <View key={venueRecord.id} style={styles.resultCard}>
                                <View style={styles.resultHeader}>
                                    <Text style={styles.courseCode}>{venueRecord.courseCode}</Text>
                                    <Text style={[styles.statusBadge, venueRecord.status === 'confirmed' && styles.confirmedBadge]}>
                                        {formatStatusLabel(venueRecord.status)}
                                    </Text>
                                </View>

                                <Text style={styles.courseTitle}>{venueRecord.courseTitle}</Text>

                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Exam Date</Text>
                                    <Text style={styles.infoValue}>{venueRecord.examDate}</Text>
                                </View>

                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Exam Time</Text>
                                    <Text style={styles.infoValue}>{venueRecord.examTime}</Text>
                                </View>

                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Venue</Text>
                                    <Text style={styles.infoValue}>{venueRecord.venue}</Text>
                                </View>

                                <View style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Building / Block</Text>
                                    <Text style={styles.infoValue}>{venueRecord.buildingOrBlock}</Text>
                                </View>

                                {venueRecord.roomOrHall && (
                                    <View style={styles.infoBox}>
                                        <Text style={styles.infoLabel}>Room / Hall</Text>
                                        <Text style={styles.infoValue}>{venueRecord.roomOrHall}</Text>
                                    </View>
                                )}

                                <View style={styles.rangeBox}>
                                    <Text style={styles.rangeLabel}>Index Range</Text>
                                    <Text style={styles.rangeValue}>
                                        {venueRecord.startIndex} - {venueRecord.endIndex}
                                    </Text>
                                </View>

                                {/* Navigate Button */}
                                <TouchableOpacity
                                    style={styles.navigateButton}
                                    onPress={() => navigateToVenue(venueRecord.venue)}
                                >
                                    <Text style={styles.navigateText}>📍 Navigate to Venue</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

                {hasSearched && matchedVenues.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No venue found</Text>
                        <Text style={styles.emptyText}>
                            No exam venue range matches this index or reference number yet. Please check again later.
                        </Text>
                    </View>
                )}
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
    subtitle: { fontSize: 14, color: AppColors.mutedText, marginTop: 6, marginBottom: 22, lineHeight: 20 },
    searchCard: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: AppColors.border, marginBottom: 18 },
    label: { fontSize: 14, fontWeight: '800', color: AppColors.text, marginBottom: 8 },
    input: { height: 52, borderWidth: 1, borderColor: AppColors.border, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, fontSize: 15, color: AppColors.text, backgroundColor: AppColors.background },
    searchButton: { height: 52, borderRadius: 12, backgroundColor: AppColors.primary, justifyContent: 'center', alignItems: 'center' },
    searchButtonText: { color: AppColors.card, fontSize: 16, fontWeight: '800' },
    clearButton: { height: 46, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
    clearButtonText: { color: AppColors.mutedText, fontSize: 14, fontWeight: '700' },
    resultsSection: { marginBottom: 18 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: AppColors.text, marginBottom: 10 },
    resultCard: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: AppColors.border, marginBottom: 14 },
    resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10 },
    courseCode: { color: AppColors.primary, fontSize: 13, fontWeight: '900' },
    statusBadge: { backgroundColor: AppColors.warning, color: AppColors.card, fontSize: 11, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden', textTransform: 'uppercase' },
    confirmedBadge: { backgroundColor: AppColors.success },
    courseTitle: { color: AppColors.text, fontSize: 18, fontWeight: '800', marginBottom: 14 },
    infoBox: { backgroundColor: AppColors.background, borderRadius: 12, borderWidth: 1, borderColor: AppColors.border, padding: 12, marginBottom: 10 },
    infoLabel: { fontSize: 12, color: AppColors.mutedText, fontWeight: '700', marginBottom: 4 },
    infoValue: { fontSize: 14, color: AppColors.text, fontWeight: '800', lineHeight: 20 },
    rangeBox: { backgroundColor: AppColors.primary, borderRadius: 12, padding: 12, marginTop: 2, marginBottom: 10 },
    rangeLabel: { fontSize: 12, color: AppColors.accent, fontWeight: '800', marginBottom: 4 },
    rangeValue: { fontSize: 15, color: AppColors.card, fontWeight: '900' },
    navigateButton: { marginTop: 4, height: 48, backgroundColor: AppColors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    navigateText: { color: AppColors.card, fontSize: 15, fontWeight: '800' },
    emptyCard: { backgroundColor: AppColors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: AppColors.border, marginBottom: 18 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: AppColors.text, marginBottom: 8 },
    emptyText: { fontSize: 14, color: AppColors.mutedText, lineHeight: 21 },
});