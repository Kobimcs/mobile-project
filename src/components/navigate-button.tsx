import { AppColors } from '@/constants/colors';
import { openMapsSearch } from '@/utils/open-maps';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

/**
 * Opens the native maps app searching for a venue on KNUST campus. The backend
 * does not store coordinates, so we search by name — accurate enough for campus
 * halls and it works whether or not a maps app is installed (falls back to the
 * browser if not).
 */
export function NavigateButton({ query }: { query: string }) {
    const openInMaps = async () => {
        await openMapsSearch(`${query} KNUST Kumasi`.trim());
    };

    return (
        <TouchableOpacity style={styles.button} onPress={openInMaps} accessibilityRole="button">
            <Text style={styles.text}>Navigate</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: AppColors.primary,
        backgroundColor: AppColors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    text: {
        color: AppColors.primary,
        fontSize: 15,
        fontWeight: '800',
    },
});
