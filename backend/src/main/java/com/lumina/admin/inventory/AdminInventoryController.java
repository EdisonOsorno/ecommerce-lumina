package com.lumina.admin.inventory;

import com.lumina.inventory.dto.AdminInventoryResponse;
import com.lumina.inventory.dto.InventoryAdjustRequest;
import com.lumina.inventory.service.AdminInventoryService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Backoffice de inventario (Fase 5A). Protegido por /api/admin/** →
 * hasRole("ADMIN") en SecurityConfig. Permite ver el stock completo y
 * hacer ajustes manuales auditados (reabastecimiento, mermas, salidas).
 */
@RestController
@RequestMapping(path = "/api/admin/inventory", produces = MediaType.APPLICATION_JSON_VALUE)
public class AdminInventoryController {

    private final AdminInventoryService adminInventoryService;

    public AdminInventoryController(AdminInventoryService adminInventoryService) {
        this.adminInventoryService = adminInventoryService;
    }

    /** Listado de todos los productos con su stock y alerta mínima. */
    @GetMapping
    public List<AdminInventoryResponse> listInventory() {
        return adminInventoryService.listInventoryForAdmin();
    }

    /**
     * Ajuste manual de stock: delta positivo = entrada (reabastecimiento),
     * negativo = salida (merma/baja). El movimiento queda auditado como
     * IN_ADJUSTMENT / OUT_ADJUSTMENT con referenceId "ADMIN_MANUAL".
     */
    @PostMapping("/adjust")
    public AdminInventoryResponse adjustInventory(@Valid @RequestBody InventoryAdjustRequest request) {
        return adminInventoryService.adjustInventory(request);
    }
}
