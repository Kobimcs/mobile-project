import { Alert, Linking, Platform } from 'react-native';

// Native scheme first so the OS hands off directly to the maps app instead of
// bouncing through the browser (which is what a plain https Google Maps URL
// does on Android). Falls back to the https URL — which always works via the
// browser — if no native maps app is available or opening it fails.
function nativeSchemeUrl(query: string): string | null {
    const encoded = encodeURIComponent(query);
    if (Platform.OS === 'android') return `geo:0,0?q=${encoded}`;
    if (Platform.OS === 'ios') return `maps://?q=${encoded}`;
    return null; // web has no native maps app to hand off to
}

function webFallbackUrl(query: string): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Opens the device's native maps app directly for the given search query. Never
 * fails silently — if neither the native app nor the web fallback can be
 * opened, shows an alert so the user knows navigation didn't work.
 */
export async function openMapsSearch(query: string): Promise<void> {
    const native = nativeSchemeUrl(query);

    if (native) {
        try {
            const supported = await Linking.canOpenURL(native);
            if (supported) {
                await Linking.openURL(native);
                return;
            }
        } catch {
            // Fall through to the web fallback below.
        }
    }

    try {
        await Linking.openURL(webFallbackUrl(query));
    } catch {
        Alert.alert('Cannot open Maps', 'Something went wrong opening the map.');
    }
}
