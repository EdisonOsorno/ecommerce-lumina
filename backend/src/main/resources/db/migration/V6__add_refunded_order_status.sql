-- ==========================================================
-- V6 (Fase 5F): el ciclo comercial incorpora devoluciones.
-- Reemplaza el CHECK nombrado chk_orders_status de la V4 para
-- admitir el nuevo estado REFUNDED (total: seis estados).
-- ==========================================================

ALTER TABLE orders DROP CONSTRAINT chk_orders_status;
ALTER TABLE orders ADD CONSTRAINT chk_orders_status
    CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'));
