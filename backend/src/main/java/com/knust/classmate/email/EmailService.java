package com.knust.classmate.email;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.knust.classmate.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;

/**
 * Sends transactional email via Resend's REST API. Uses the same plain
 * java.net.http.HttpClient approach as PushService/PaystackClient (this
 * project has no RestTemplate/WebClient dependency). The API key never leaves
 * this class, and failures never leak provider-specific details to the caller
 * — only a generic message, with the real cause logged server-side.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String RESEND_URL = "https://api.resend.com/emails";
    private static final String GENERIC_FAILURE_MESSAGE = "Unable to send email right now. Please try again later.";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${resend.api-key:}")
    private String apiKey;

    // No domain verification needed for onboarding@resend.dev; swap this for a
    // verified sender once a custom domain is set up with Resend.
    @Value("${resend.from-address:onboarding@resend.dev}")
    private String fromAddress;

    public void sendPasswordResetCode(String email, String code) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("RESEND_API_KEY is not configured; cannot send password reset email");
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, GENERIC_FAILURE_MESSAGE);
        }

        // The code is only ever interpolated into the outgoing email body — never
        // logged, and never present in any exception message thrown from here.
        String html = "<p>Your ClassMate password reset code is:</p>"
            + "<h2 style=\"letter-spacing:4px;\">" + code + "</h2>"
            + "<p>This code expires in 15 minutes. If you didn't request this, you can safely ignore this email.</p>";

        Map<String, Object> body = Map.of(
            "from", fromAddress,
            "to", List.of(email),
            "subject", "Your ClassMate password reset code",
            "html", html
        );

        try {
            String json = objectMapper.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder(URI.create(RESEND_URL))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Resend returned {} sending a password reset email", response.statusCode());
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, GENERIC_FAILURE_MESSAGE);
            }
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to send password reset email", e);
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, GENERIC_FAILURE_MESSAGE);
        }
    }
}
