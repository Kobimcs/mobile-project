const { withAndroidManifest } = require('expo/config-plugins');

// Android 11+ (API 30) restricts package visibility: Linking.canOpenURL('geo:...')
// returns false even when a maps app is installed, unless this app declares in
// its manifest that it intends to query the `geo` scheme. Without this, the
// native-maps handoff in src/utils/open-maps.ts silently falls back to the
// browser on every Android 11+ device. See:
// https://developer.android.com/training/package-visibility
const GEO_QUERY = {
    intent: [
        {
            action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
            data: [{ $: { 'android:scheme': 'geo' } }],
        },
    ],
};

module.exports = function withMapsQueries(config) {
    return withAndroidManifest(config, (config) => {
        const manifest = config.modResults.manifest;
        const hasGeoQuery = (manifest.queries || []).some((q) =>
            (q.intent || []).some((intent) =>
                (intent.data || []).some((d) => d.$?.['android:scheme'] === 'geo')
            )
        );
        if (!hasGeoQuery) {
            manifest.queries = [...(manifest.queries || []), GEO_QUERY];
        }
        return config;
    });
};
