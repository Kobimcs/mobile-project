import { API_BASE_URL } from '@/constants/config';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export type PickedDocument = {
    uri: string;
    name: string;
    mimeType?: string;
    size?: number;
    // Web only: the real browser File/Blob for the picked document (see
    // expo-document-picker's DocumentPickerAsset.file). On web, the plain
    // { uri, name, type } descriptor below does NOT produce an actual
    // multipart file part — the browser's native FormData silently
    // stringifies a non-Blob value, so the backend sees no "file" part at
    // all (MissingServletRequestPartException). When this is present we
    // append it directly instead.
    file?: Blob;
};

// Kept in sync with the backend's spring.servlet.multipart.max-file-size and
// each controller's own MAX_DOCUMENT_BYTES (application.properties,
// AssignmentController, TimetableDocumentController).
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

/**
 * Upload a picked document to a backend path as multipart/form-data. Uses
 * XMLHttpRequest so we can report determinate upload progress on both native and
 * web. Resolves with the parsed JSON response (or undefined if the body is
 * empty), rejects with a user-facing message otherwise.
 */
function uploadToPath<T = void>(
    path: string,
    file: PickedDocument,
    token: string | null,
    onProgress?: (fraction: number) => void,
    extraFields?: Record<string, string>
): Promise<T> {
    // Caught here (before a network round trip) so oversized files get an
    // immediate, specific message instead of waiting on the server to reject them.
    if (file.size != null && file.size > MAX_UPLOAD_BYTES) {
        return Promise.reject(new Error('File is too large. The maximum size is 25 MB.'));
    }
    return new Promise((resolve, reject) => {
        const form = new FormData();
        if (file.file) {
            // Web: a real Blob/File, so the browser attaches it as an actual
            // multipart file part with the given filename.
            form.append('file', file.file, file.name);
        } else {
            // Native: React Native's FormData polyfill accepts this
            // { uri, name, type } descriptor and streams the file at that URI.
            form.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.mimeType || 'application/octet-stream',
            } as unknown as Blob);
        }
        if (extraFields) {
            for (const [key, value] of Object.entries(extraFields)) {
                form.append(key, value);
            }
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}${path}`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable && onProgress) {
                    onProgress(event.loaded / event.total);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                if (!xhr.responseText) {
                    resolve(undefined as T);
                    return;
                }
                try {
                    resolve(JSON.parse(xhr.responseText) as T);
                } catch {
                    resolve(undefined as T);
                }
                return;
            }
            let message = 'Upload failed. Please try again.';
            try {
                const parsed = JSON.parse(xhr.responseText);
                if (parsed?.message) message = parsed.message;
            } catch {
                // keep default message
            }
            // Surfaced here (not to the user) so the real status/body is visible
            // during diagnosis instead of only the generic message above.
            console.warn(`Upload to ${path} failed (status ${xhr.status}):`, xhr.responseText);
            reject(new Error(message));
        };
        xhr.onerror = () => reject(new Error('Upload failed. Please check your connection and try again.'));
        xhr.send(form);
    });
}

/**
 * Download an authenticated document from a backend path and hand it to the OS so
 * the user can open or save it. On web it triggers a browser download instead.
 */
async function openFromPath(path: string, fileName: string, token: string | null): Promise<void> {
    const url = `${API_BASE_URL}${path}`;
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    if (Platform.OS === 'web') {
        const response = await fetch(url, { headers: authHeaders });
        if (!response.ok) throw new Error('Could not download the document. Please try again.');
        const blob = await response.blob();
        const globalAny = globalThis as unknown as {
            URL: { createObjectURL: (b: Blob) => string; revokeObjectURL: (u: string) => void };
            document: { createElement: (t: string) => any; body: any };
        };
        const objectUrl = globalAny.URL.createObjectURL(blob);
        const anchor = globalAny.document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
        globalAny.URL.revokeObjectURL(objectUrl);
        return;
    }

    // Sharing is a native module; a dev client built before expo-sharing was added
    // throws "Cannot find native module 'ExpoSharing'". Check first and give a clear
    // message instead of downloading a file the app then can't open.
    let canShare = false;
    try {
        canShare = await Sharing.isAvailableAsync();
    } catch {
        canShare = false;
    }
    if (!canShare) {
        throw new Error('Opening documents needs an updated app build. Ask the team to rebuild the development client.');
    }

    const safeName = fileName.replace(/[^\w.\-]+/g, '_') || 'document';
    const target = (FileSystem.cacheDirectory ?? '') + safeName;
    const result = await FileSystem.downloadAsync(url, target, { headers: authHeaders });
    if (result.status !== 200) {
        throw new Error('Could not download the document. Please try again.');
    }
    await Sharing.shareAsync(result.uri);
}

// ── Assignment documents ────────────────────────────────────────────────────
export function uploadAssignmentDocument(
    assignmentId: number,
    file: PickedDocument,
    token: string | null,
    onProgress?: (fraction: number) => void
): Promise<void> {
    return uploadToPath(`/assignments/${assignmentId}/document`, file, token, onProgress);
}

export function openAssignmentDocument(assignmentId: number, fileName: string, token: string | null): Promise<void> {
    return openFromPath(`/assignments/${assignmentId}/document`, fileName, token);
}

// ── Timetable documents (official timetable file) ───────────────────────────
export type TimetableDocumentMeta = {
    id: number;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    uploadedAt: string;
};

export function uploadTimetableDocument(
    file: PickedDocument,
    token: string | null,
    onProgress?: (fraction: number) => void
): Promise<void> {
    return uploadToPath('/timetable/document', file, token, onProgress);
}

export function openTimetableDocument(documentId: number, fileName: string, token: string | null): Promise<void> {
    return openFromPath(`/timetable/document/${documentId}`, fileName, token);
}

// ── Lab exam schedule PDF (per-student placements, replaces CSV bulk upload) ─
export type LabExamPdfUploadResult = {
    courseCode: string;
    entriesParsed: number;
    entriesSaved: number;
};

export function uploadLabExamPdf(
    file: PickedDocument,
    fields: { courseCode: string; courseTitle?: string },
    token: string | null,
    onProgress?: (fraction: number) => void
): Promise<LabExamPdfUploadResult> {
    const formFields: Record<string, string> = { courseCode: fields.courseCode };
    if (fields.courseTitle) formFields.courseTitle = fields.courseTitle;
    return uploadToPath<LabExamPdfUploadResult>('/exam-venues/upload-pdf', file, token, onProgress, formFields);
}

/** Human-readable file size, e.g. "1.4 MB". */
export function formatFileSize(bytes?: number | null): string {
    if (!bytes || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${size >= 10 || unit === 0 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`;
}
