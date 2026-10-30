-- ==========================================================
-- V2: Datos Semilla del Catálogo de Demostración (Cosméticos & Belleza)
-- ==========================================================

-- 1. Insertar Categorías (sin forzar id explícito para compatibilidad universal de secuencias)
INSERT INTO categories (name, slug, description, is_active, created_at, updated_at)
VALUES
('Cuidado Facial', 'cuidado-facial', 'Serums, hidratantes, protectores solares y limpiadores faciales dermatológicos.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Cuidado Capilar', 'cuidado-capilar', 'Champús botánicos, acondicionadores y mascarillas de reparación capilar.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Higiene Corporal', 'higiene-corporal', 'Geles de ducha, exfoliantes y lociones hidratantes enriquecidas.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Maquillaje Consciente', 'maquillaje-consciente', 'Fórmulas ligeras con activos nutritivos libres de ingredientes nocivos.', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Insertar Productos vinculados por slug de categoría
INSERT INTO products (category_id, name, slug, sku, description, image_url, price, compare_at_price, vat_rate, is_active, is_featured, created_at, updated_at)
VALUES
(
    (SELECT id FROM categories WHERE slug = 'cuidado-facial'),
    'Serum Facial Ácido Hialurónico + Vitamina B5', 'serum-facial-acido-hialuronico', 'LUM-FAC-001',
    'Hidratación profunda multicapa con ácido hialurónico de tres pesos moleculares y provitamina B5 para reparar la barrera cutánea. Apto para pieles sensibles.',
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
    68000.00, 85000.00, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'cuidado-facial'),
    'Crema Hidratante Ceramidas & Niacinamida', 'crema-hidratante-ceramidas-niacinamida', 'LUM-FAC-002',
    'Fórmula restauradora que fortalece la barrera de hidratación, reduce rojeces y equilibra la producción de sebo. Textura ligera de rápida absorción.',
    'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
    54000.00, NULL, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'cuidado-facial'),
    'Protector Solar Fluido Invisible FPS 50+', 'protector-solar-fluido-invisible-fps-50', 'LUM-FAC-003',
    'Protección de amplio espectro UVA/UVB con acabado mate invisible. No deja rastro blanco ni sensación grasosa. Resistente al agua.',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    72000.00, 90000.00, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'cuidado-facial'),
    'Limpiador Facial Suave en Gel pH Neutro', 'limpiador-facial-suave-gel', 'LUM-FAC-004',
    'Limpieza profunda sin tirantez a base de extracto de centella asiática y caléndula. Respeta el manto ácido natural de la piel.',
    'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=600&q=80',
    38000.00, NULL, 0.1900, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'cuidado-capilar'),
    'Champú Sólido Fortalecedor Romero & Menta', 'champu-solido-fortalecedor-romero-menta', 'LUM-CAP-001',
    'Elaborado artesanalmente con tensioactivos suaves derivados del coco, aceite esencial de romero para estimular el cuero cabelludo y mentol refrescante.',
    'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
    29000.00, NULL, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'cuidado-capilar'),
    'Mascarilla Capilar Nutrición Profunda Argán & Karité', 'mascarilla-capilar-nutricion-profunda', 'LUM-CAP-002',
    'Tratamiento intensivo reparador para cabello seco o maltratado por procesos térmicos. Aporta elasticidad, brillo y suavidad sedosa.',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80',
    46000.00, 58000.00, 0.1900, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'higiene-corporal'),
    'Gel de Ducha Exfoliante Avena & Almendras Dulces', 'gel-ducha-exfoliante-avena-almendras', 'LUM-COR-001',
    'Exfoliación suave con partículas biodegradables de semilla de albaricoque y leche de avena coloidal calmante. Deja la piel renovada.',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80',
    34000.00, NULL, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'higiene-corporal'),
    'Loción Corporal Hidratación 48H Manteca de Cacao', 'locion-corporal-hidratacion-48h', 'LUM-COR-002',
    'Emulsión corporal nutritiva de rápida absorción con manteca de cacao pura y vitamina E. Protege contra la resequedad ambiental.',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=600&q=80',
    42000.00, NULL, 0.1900, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'maquillaje-consciente'),
    'Bálsamo Labial Reparador Cera de Candelilla & Coco', 'balsamo-labial-reparador-candelilla', 'LUM-MAQ-001',
    'Tratamiento labial emoliente 100% vegano enriquecido con manteca de karité orgánica y aceite de coco virgen. Alivia labios resecos.',
    'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
    18000.00, NULL, 0.1900, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
),
(
    (SELECT id FROM categories WHERE slug = 'maquillaje-consciente'),
    'Tinta Labial y Mejillas Tono Rosa Silvestre', 'tinta-labial-mejillas-rosa-silvestre', 'LUM-MAQ-002',
    'Color modulable de larga duración con ácido hialurónico y agua de rosas. Proporciona un rubor natural saludable no pegajoso.',
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80',
    32000.00, 40000.00, 0.1900, TRUE, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

-- 3. Insertar Inventario Inicial para cada Producto por SKU
INSERT INTO inventory_items (product_id, available_quantity, reserved_quantity, min_stock_alert, updated_at)
VALUES
((SELECT id FROM products WHERE sku = 'LUM-FAC-001'), 25, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-FAC-002'), 30, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-FAC-003'), 40, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-FAC-004'), 50, 0, 8, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-CAP-001'), 35, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-CAP-002'), 20, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-COR-001'), 28, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-COR-002'), 22, 0, 5, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-MAQ-001'), 60, 0, 10, CURRENT_TIMESTAMP),
((SELECT id FROM products WHERE sku = 'LUM-MAQ-002'), 15, 0, 5, CURRENT_TIMESTAMP);

-- 4. Registrar Movimiento Inicial de Inventario
INSERT INTO stock_movements (product_id, movement_type, quantity, balance_after, reason, reference_id, created_at)
SELECT p.id, 'IN_INITIAL_SEED', i.available_quantity, i.available_quantity,
       'Carga inicial de inventario de demostración Lúmina', 'SEED-2026', CURRENT_TIMESTAMP
FROM products p
JOIN inventory_items i ON i.product_id = p.id;
