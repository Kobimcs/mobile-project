package com.knust.classmate.auth;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory rate limiter for password-reset requests: max {@code MAX_REQUESTS}
 * per email within {@code WINDOW_MS}. Same shape as LoginAttemptService, but
 * counts every request (not just failures), since there's no pass/fail outcome
 * to react to at this stage — just "how many codes has this email been sent
 * recently". Per-instance (not distributed), same tradeoff as LoginAttemptService.
 */
@Service
public class PasswordResetRateLimiter {

    private static final int MAX_REQUESTS = 3;
    private static final long WINDOW_MS = 15 * 60 * 1000L; // 15 minutes

    private static class Window {
        final AtomicInteger count = new AtomicInteger(0);
        volatile long windowStart = System.currentTimeMillis();
    }

    private final ConcurrentHashMap<String, Window> windows = new ConcurrentHashMap<>();

    /** Returns true and records the attempt if under the limit; false (unrecorded) if already at it. */
    public boolean tryConsume(String email) {
        Window window = windows.computeIfAbsent(key(email), k -> new Window());
        synchronized (window) {
            if (isExpired(window)) {
                window.windowStart = System.currentTimeMillis();
                window.count.set(0);
            }
            if (window.count.get() >= MAX_REQUESTS) {
                return false;
            }
            window.count.incrementAndGet();
            return true;
        }
    }

    private boolean isExpired(Window window) {
        return System.currentTimeMillis() - window.windowStart > WINDOW_MS;
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
