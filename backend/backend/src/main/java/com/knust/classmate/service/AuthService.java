package com.knust.classmate.service;

import com.knust.classmate.dto.request.LoginRequest;
import com.knust.classmate.dto.request.RegisterRequest;
import com.knust.classmate.dto.response.LoginResponse;
import com.knust.classmate.dto.response.UserResponse;
import com.knust.classmate.entity.User;
import com.knust.classmate.enums.UserRole;
import com.knust.classmate.exception.UserAlreadyExistsException;
import com.knust.classmate.repository.UserRepository;
import com.knust.classmate.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    @Autowired
    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager,
                       UserDetailsService userDetailsService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("An account with this email already exists.");
        }
        if (userRepository.existsByIndexNumber(request.indexNumber())) {
            throw new UserAlreadyExistsException("An account with this index number already exists.");
        }
        if (userRepository.existsByReferenceNumber(request.referenceNumber())) {
            throw new UserAlreadyExistsException("An account with this reference number already exists.");
        }
        User user = User.builder()
            .fullName(request.fullName())
            .indexNumber(request.indexNumber().toUpperCase())
            .referenceNumber(request.referenceNumber().toUpperCase())
            .email(request.email().toLowerCase())
            .password(passwordEncoder.encode(request.password()))
            .programme(request.programme())
            .level(request.level())
            .role(UserRole.STUDENT)
            .build();
        return UserResponse.from(userRepository.save(user));
    }

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByIdentifier(request.identifier())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(user.getEmail(), request.password()));
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtil.generateToken(userDetails);
        return new LoginResponse(token, UserResponse.from(user));
    }
}
