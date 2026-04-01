package com.erp.manufacturing.api.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final SecretKey secretKey;

    public JwtAuthenticationFilter(@Value("${app.jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = Jwts.parser()
                    .verifyWith(secretKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.getSubject();
            String tenantId = claims.get("tenant_id", String.class);
            // org_id falls back to tenant_id for backward compatibility
            String orgIdRaw = claims.get("org_id", String.class);
            String orgId = (orgIdRaw != null && !orgIdRaw.isEmpty()) ? orgIdRaw : tenantId;
            String orgRole = claims.get("org_role", String.class);

            if (userId == null || tenantId == null) {
                filterChain.doFilter(request, response);
                return;
            }

            Map<String, Object> details = new HashMap<>();
            details.put("user_id", UUID.fromString(userId));
            details.put("tenant_id", UUID.fromString(tenantId));
            details.put("org_id", UUID.fromString(orgId));
            details.put("org_role", orgRole);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, Collections.emptyList());
            authentication.setDetails(details);

            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (Exception e) {
            log.warn("JWT validation failed: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/docs") || path.startsWith("/api-docs")
                || path.startsWith("/swagger-ui") || path.startsWith("/actuator");
    }
}
