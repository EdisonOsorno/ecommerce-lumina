package com.lumina.catalog.repository;

import com.lumina.catalog.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByActiveTrueOrderByNameAsc();

    Optional<Category> findBySlugAndActiveTrue(String slug);
}
