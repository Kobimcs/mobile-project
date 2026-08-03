import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearCachedData } from '@/services/cache';
import { deleteItem, getItem, setItem } from '@/services/storage';

export type UserRole = 'student' | 'course_rep' | 'admin';

export type AuthUser = {
    id: number;
    fullName: string;
    email: string;
    role: UserRole;
    indexNumber?: string;
    referenceNumber?: string;
    programme?: string;
    level?: string;
    // Only set for Computer Science students; undefined/null otherwise.
    classGroup?: string;
    // Not returned by /auth/login — populated once the profile screen fetches
    // GET /profile/me, then kept current via updateUser() after edits.
    phone?: string;
    bio?: string;
    avatarUrl?: string;
};

export type LoginResponse = {
    token: string;
    user: AuthUser;
};

type AuthContextValue = {
    token: string | null;
    role: UserRole | null;
    user: AuthUser | null;
    isLoading: boolean;
    signIn: (data: LoginResponse) => Promise<void>;
    signOut: () => Promise<void>;
    // Merges into the in-memory user (so any screen reading it re-renders
    // immediately) and persists the core fields so they survive an app restart.
    updateUser: (updates: Partial<AuthUser>) => Promise<void>;
};

// Every persisted session key, kept in one place so sign-out can clear them all.
const SESSION_KEYS = [
    'authToken',
    'userId',
    'userName',
    'userEmail',
    'userRole',
    'indexNumber',
    'referenceNumber',
    'programme',
    'level',
    'classGroup',
] as const;

// Per-student state that must not leak to the next person who signs in on the
// same device (notification dedupe). Assignment completion and announcement
// read status live on the backend, keyed to the user's id, so they don't need
// clearing here — they simply won't belong to whoever signs in next.
const PRIVATE_STATE_KEYS = [
    'seenScoreIds',
    'alertedCancelledClassIds',
] as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Landing route for each role after a successful sign-in.
export function homeRouteForRole(role: UserRole | null): '/student-dashboard' | '/rep-panel' | '/admin-panel' {
    if (role === 'admin') return '/admin-panel';
    if (role === 'course_rep') return '/rep-panel';
    return '/student-dashboard';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore any existing session on app launch.
    useEffect(() => {
        (async () => {
            try {
                const [storedToken, storedRole, id, fullName, email, indexNumber, referenceNumber, programme, level, classGroup] =
                    await Promise.all([
                        getItem('authToken'),
                        getItem('userRole'),
                        getItem('userId'),
                        getItem('userName'),
                        getItem('userEmail'),
                        getItem('indexNumber'),
                        getItem('referenceNumber'),
                        getItem('programme'),
                        getItem('level'),
                        getItem('classGroup'),
                    ]);
                setToken(storedToken);
                setRole(storedRole as UserRole | null);
                if (fullName && email && storedRole) {
                    setUser({
                        id: id ? Number(id) : 0,
                        fullName,
                        email,
                        role: storedRole as UserRole,
                        indexNumber: indexNumber ?? undefined,
                        referenceNumber: referenceNumber ?? undefined,
                        programme: programme ?? undefined,
                        level: level ?? undefined,
                        classGroup: classGroup ?? undefined,
                    });
                }
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        token,
        role,
        user,
        isLoading,
        signIn: async (data: LoginResponse) => {
            const { token: newToken, user: newUser } = data;
            await setItem('authToken', newToken);
            await setItem('userId', String(newUser.id));
            await setItem('userName', newUser.fullName);
            await setItem('userEmail', newUser.email);
            await setItem('userRole', newUser.role);
            if (newUser.indexNumber) await setItem('indexNumber', newUser.indexNumber);
            if (newUser.referenceNumber) await setItem('referenceNumber', newUser.referenceNumber);
            if (newUser.programme) await setItem('programme', newUser.programme);
            if (newUser.level) await setItem('level', newUser.level);
            if (newUser.classGroup) await setItem('classGroup', newUser.classGroup);

            setToken(newToken);
            setRole(newUser.role);
            setUser(newUser);
        },
        signOut: async () => {
            for (const key of SESSION_KEYS) {
                await deleteItem(key);
            }
            // Clear private per-student state + cached class data so the next
            // person to sign in on this device starts clean.
            for (const key of PRIVATE_STATE_KEYS) {
                await deleteItem(key);
            }
            await clearCachedData();
            setToken(null);
            setRole(null);
            setUser(null);
        },
        // Merges into the in-memory user immediately (so every mounted screen
        // reading `user` re-renders with the new values) and persists the
        // fields already tracked in storage so a restart doesn't lose them.
        updateUser: async (updates: Partial<AuthUser>) => {
            setUser((prev) => (prev ? { ...prev, ...updates } : prev));
            if (updates.fullName !== undefined) await setItem('userName', updates.fullName);
            if (updates.email !== undefined) await setItem('userEmail', updates.email);
            if (updates.programme !== undefined) await setItem('programme', updates.programme ?? '');
            if (updates.level !== undefined) await setItem('level', updates.level ?? '');
            if (updates.classGroup !== undefined) await setItem('classGroup', updates.classGroup ?? '');
        },
    }), [token, role, user, isLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
