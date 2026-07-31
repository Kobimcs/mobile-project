package com.knust.classmate.auth;

import com.knust.classmate.audit.AuditService;
import com.knust.classmate.config.JwtUtil;
import com.knust.classmate.exception.ApiException;
import com.knust.classmate.user.User;
import com.knust.classmate.user.UserRepository;
import com.knust.classmate.user.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
public class AuthService {

    // Class group only applies to this programme; matched case-insensitively
    // and trimmed since "programme" is free text on the registration form.
    private static final String COMPUTER_SCIENCE_PROGRAMME = "Computer Science";
    private static final Set<String> VALID_CLASS_GROUPS = Set.of("Group 1", "Group 2");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final LoginAttemptService loginAttemptService;
    private final AuditService auditService;

    @Autowired
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil,
                       AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService,
                       LoginAttemptService loginAttemptService,
                       AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.loginAttemptService = loginAttemptService;
        this.auditService = auditService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email().toLowerCase()))
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        if (userRepository.existsByIndexNumber(request.indexNumber().toUpperCase()))
            throw new ApiException(HttpStatus.CONFLICT, "An account with this index number already exists.");
        if (userRepository.existsByReferenceNumber(request.referenceNumber().toUpperCase()))
            throw new ApiException(HttpStatus.CONFLICT, "An account with this reference number already exists.");

        boolean isComputerScience = request.programme() != null
            && request.programme().trim().equalsIgnoreCase(COMPUTER_SCIENCE_PROGRAMME);

        String classGroup = null;
        if (isComputerScience) {
            String submitted = request.classGroup() == null ? null : request.classGroup().trim();
            if (submitted == null || submitted.isEmpty())
                throw new ApiException(HttpStatus.BAD_REQUEST, "Class group is required for Computer Science students.");
            if (!VALID_CLASS_GROUPS.contains(submitted))
                throw new ApiException(HttpStatus.BAD_REQUEST, "Class group must be either \"Group 1\" or \"Group 2\".");
            classGroup = submitted;
        }
        // Non-CS students never get a class group, even if one was sent.

        // Everyone registers as a student. Only an admin can promote a student
        // to course rep afterwards — self-selecting a role is not allowed.
        User user = User.builder()
            .fullName(request.fullName())
            .indexNumber(request.indexNumber().toUpperCase())
            .referenceNumber(request.referenceNumber().toUpperCase())
            .email(request.email().toLowerCase())
            .password(passwordEncoder.encode(request.password()))
            .programme(request.programme())
            .level(request.level())
            .classGroup(classGroup)
            .role(UserRole.STUDENT)
            .status("ACTIVE")
            .build();

        User saved = userRepository.save(user);
        auditService.log("REGISTER", "New account: " + saved.getEmail(), saved.getFullName(), "STUDENT");
        return UserResponse.from(saved);
    }

    public LoginResponse login(LoginRequest request) {
        String identifier = request.identifier();

        // Block brute-force: too many recent failures for this identifier are refused.
        if (loginAttemptService.isBlocked(identifier)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                "Too many failed login attempts. Please wait a few minutes and try again.");
        }

        User user = userRepository.findByIdentifier(identifier).orElse(null);
        if (user == null) {
            loginAttemptService.recordFailure(identifier);
            throw new BadCredentialsException("Invalid credentials");
        }

        // Verify the password first so account status cannot be probed without valid credentials.
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.password()));
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(identifier);
            throw ex;
        }

        if ("PENDING".equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Your course rep request is pending admin approval.");
        if ("REJECTED".equals(user.getStatus()))
            throw new ApiException(HttpStatus.FORBIDDEN, "Your course rep request was rejected. Contact admin.");

        loginAttemptService.reset(identifier);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);

        auditService.log("LOGIN", "Signed in", user.getFullName(), user.getRole().name());
        return new LoginResponse(token, UserResponse.from(user));
    }
}
