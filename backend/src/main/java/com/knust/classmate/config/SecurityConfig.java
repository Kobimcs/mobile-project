package com.knust.classmate.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:8081,http://localhost:8082,http://10.0.2.2:8080}")
    private String allowedOrigins;

    @Autowired
    public SecurityConfig(JwtAuthFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/health").permitAll()
                .requestMatchers(HttpMethod.POST, "/auth/login", "/auth/register",
                        "/auth/forgot-password", "/auth/verify-reset-code", "/auth/reset-password")
                    .permitAll()
                .requestMatchers(HttpMethod.GET, "/exam-venues/search").permitAll()
                // Paystack sends no JWT — the HMAC signature in PaymentController.webhook()
                // IS the authentication for this one route. The callback page is just
                // where the checkout browser redirects to; it carries no auth either.
                .requestMatchers(HttpMethod.POST, "/payments/webhook").permitAll()
                .requestMatchers(HttpMethod.GET, "/payments/callback").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Only course reps and admins can create academic records; students are read-only.
                .requestMatchers(HttpMethod.POST, "/announcements", "/assignments", "/timetable",
                        "/exam-venues", "/exam-venues/bulk", "/scores", "/scores/bulk",
                        "/timetable/document")
                    .hasAnyRole("COURSE_REP", "ADMIN")
                // Attaching a document to an assignment is rep/admin only.
                .requestMatchers(HttpMethod.POST, "/assignments/*/document").hasAnyRole("COURSE_REP", "ADMIN")
                // Editing/removing a class (e.g. cancelling it) is rep/admin only too.
                .requestMatchers(HttpMethod.PUT, "/timetable/**").hasAnyRole("COURSE_REP", "ADMIN")
                // Any signed-in user (including students) may un-mark their own
                // completed assignment; must be matched before the broader
                // rep/admin-only DELETE rule below.
                .requestMatchers(HttpMethod.DELETE, "/assignments/*/complete").authenticated()
                // Deleting posts is rep/admin only; per-record ownership is enforced in the controllers.
                .requestMatchers(HttpMethod.DELETE, "/timetable/**", "/announcements/**", "/assignments/**")
                    .hasAnyRole("COURSE_REP", "ADMIN")
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}