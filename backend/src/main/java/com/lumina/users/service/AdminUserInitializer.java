package com.lumina.users.service;

import com.lumina.users.domain.User;
import com.lumina.users.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Semillero del administrador del backoffice (Fase 5A).
 *
 * - Si el usuario app.admin.email no existe, lo crea con ROLE_ADMIN al arrancar.
 * - Si ya existe y app.admin.override-password=true, re-escribe su passwordHash
 *   con la contraseña configurada (mecanismo de rescate por servidor en caso
 *   de olvido; usado con moderación ya que invalida la sesión previa).
 *
 * No hardcoded SQL: el hash se genera con el PasswordEncoder real (BCrypt 12),
 * la misma política del registro de clientes. El registro público siempre crea
 * ROLE_CUSTOMER; el único camino a ROLE_ADMIN es este inicializador.
 */
@Component
public class AdminUserInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.override-password}")
    private boolean overridePassword;

    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String normalizedEmail = adminEmail.trim().toLowerCase();

        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresentOrElse(existing -> {
            if (overridePassword) {
                existing.setPasswordHash(passwordEncoder.encode(adminPassword));
                userRepository.save(existing);
                log.info("Contraseña del administrador {} restablecida desde configuración (override-password=true).",
                        normalizedEmail);
            } else {
                log.info("El administrador {} ya existe; no se modifica (override-password=false).",
                        normalizedEmail);
            }
        }, () -> {
            User admin = new User();
            admin.setEmail(normalizedEmail);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFirstName("Administrador");
            admin.setLastName("Lúmina");
            admin.setRole("ROLE_ADMIN");
            admin.setActive(true);
            admin.setPhone("3001234567");
            userRepository.save(admin);
            log.info("Administrador del backoffice creado: {}", normalizedEmail);
        });
    }
}
