package com.projecttracker.security.oauth2;

import com.projecttracker.entity.AuthProvider;
import com.projecttracker.entity.User;
import com.projecttracker.entity.UserRole;
import com.projecttracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepo;
    private final GithubEmailService githubEmailService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String registrationId = request.getClientRegistration().getRegistrationId();
        Map<String, Object> attributes = new HashMap<>(oAuth2User.getAttributes());

        // Normalise email for GitHub private email setup
        if (registrationId.equalsIgnoreCase("github") && attributes.get("email") == null) {
            String accessToken = request.getAccessToken().getTokenValue();
            String email = githubEmailService.getPrimaryEmail(accessToken);
            attributes.put("email", email);
        }

        OAuth2UserInfo userInfo = OAuth2UserInfoFactory.getOAuth2UserInfo(registrationId, attributes);

        if (!StringUtils.hasText(userInfo.getEmail())) {
            throw new OAuth2AuthenticationException("Email not returned from OAuth2 provider.");
        }

        User user = userRepo.findByEmail(userInfo.getEmail())
                .map(existing -> updateExistingUser(existing, userInfo))
                .orElseGet(() -> registerNewUser(request, userInfo));

        user.setAttributes(attributes);
        return user;
    }

    private User registerNewUser(OAuth2UserRequest request, OAuth2UserInfo info) {
        AuthProvider provider = AuthProvider.valueOf(
                request.getClientRegistration().getRegistrationId().toUpperCase()
        );
        User user = new User();
        user.setAuthProvider(provider);
        user.setProviderId(info.getId());
        user.setName(info.getName() != null ? info.getName() : info.getEmail().split("@")[0]);
        user.setEmail(info.getEmail());
        user.setAvatar(info.getImageUrl());
        user.setEmailVerified(true);
        user.setRole(UserRole.MEMBER); // default role for social logins
        user.setCreatedAt(Instant.now());
        return userRepo.save(user);
    }

    private User updateExistingUser(User user, OAuth2UserInfo info) {
        user.setName(info.getName() != null ? info.getName() : user.getName());
        user.setAvatar(info.getImageUrl() != null ? info.getImageUrl() : user.getAvatar());
        return userRepo.save(user);
    }
}
