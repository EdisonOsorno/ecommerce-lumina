package com.lumina.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI luminaOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Lúmina Ecommerce API")
                        .description("API REST modular y transaccional para la tienda de cosméticos, belleza e higiene personal Lúmina.")
                        .version("0.1.0")
                        .contact(new Contact()
                                .name("Equipo de Desarrollo Lúmina")
                                .email("dev@luminacosmeticos.demo"))
                        .license(new License()
                                .name("Uso para Portafolio Profesional")));
    }
}
