package com.knust.classmate.dto.response;

public record LoginResponse(
    String token,
    UserResponse user
) {}
