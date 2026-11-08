package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * V4 (Fase 5A): la V3 creó orders.status con CHECK (status IN
 * ('PENDING_PAYMENT','PAID','CANCELLED')); el enum ampliado con SHIPPED y
 * DELIVERED sería rechazado por la BD al hacer UPDATE. Esta migración
 * descubre el nombre real del CHECK antiguo (difiere entre H2 INFORMATION_SCHEMA
 * y PostgreSQL pg_constraint) y lo reemplaza por el constraint nombrado
 * chk_orders_status con las cinco estados del ciclo de vida comercial.
 */
public class V4__normalize_orders_status_check extends BaseJavaMigration {

    private static final String NEW_CONSTRAINT_NAME = "chk_orders_status";
    private static final String NEW_CHECK_CLAUSE =
            "CHECK (status IN ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'))";

    @Override
    public void migrate(Context context) throws SQLException {
        Connection connection = context.getConnection();
        String productName = connection.getMetaData().getDatabaseProductName();

        boolean isH2 = productName != null && productName.contains("H2");
        String oldConstraintName = isH2
                ? findH2StatusCheckName(connection)
                : findPostgresStatusCheckName(connection);

        if (oldConstraintName != null) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE orders DROP CONSTRAINT \"" + oldConstraintName + "\"");
            }
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE orders ADD CONSTRAINT " + NEW_CONSTRAINT_NAME + " " + NEW_CHECK_CLAUSE);
        }
    }

    /**
     * H2: el CHECK original es unnamed, con nombre autogenerado (CONSTRAINT_xxx).
     * Se identifica de forma determinista porque su cláusula es la única que
     * menciona el literal PENDING_PAYMENT sobre la tabla orders.
     */
    private String findH2StatusCheckName(Connection connection) throws SQLException {
        String sql = "SELECT cc.CONSTRAINT_NAME FROM INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc "
                + "JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc "
                + "ON UPPER(tc.CONSTRAINT_NAME) = UPPER(cc.CONSTRAINT_NAME) "
                + "WHERE UPPER(tc.TABLE_NAME) = 'ORDERS' "
                + "AND UPPER(cc.CHECK_CLAUSE) LIKE '%PENDING_PAYMENT%'";
        return querySingleName(connection, sql);
    }

    /**
     * PostgreSQL: el CHECK unnamed autogenera nombre <tabla>_<columna>_check
     * (orders_status_check), pero se descubren dinámicamente por la definición.
     */
    private String findPostgresStatusCheckName(Connection connection) throws SQLException {
        String sql = "SELECT con.conname FROM pg_constraint con "
                + "JOIN pg_class tbl ON tbl.oid = con.conrelid "
                + "WHERE tbl.relname = 'orders' AND con.contype = 'c' "
                + "AND pg_get_constraintdef(con.oid) LIKE '%PENDING_PAYMENT%'";
        return querySingleName(connection, sql);
    }

    private String querySingleName(Connection connection, String sql) throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql);
             ResultSet resultSet = statement.executeQuery()) {
            return resultSet.next() ? resultSet.getString(1) : null;
        }
    }
}
