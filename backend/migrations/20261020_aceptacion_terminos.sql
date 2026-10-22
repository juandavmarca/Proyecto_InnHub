CREATE TABLE IF NOT EXISTS aceptaciones_terminos (
    id_aceptacion BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    id_cliente INT NOT NULL,
    nombre VARCHAR(201) NOT NULL,
    email VARCHAR(254) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    version_terminos VARCHAR(32) NOT NULL,
    autorizacion_datos TINYINT(1) NOT NULL DEFAULT 1,
    fecha_aceptacion_utc DATETIME NOT NULL,
    PRIMARY KEY (id_aceptacion),
    KEY idx_aceptaciones_cliente (id_cliente),
    KEY idx_aceptaciones_version_fecha (version_terminos, fecha_aceptacion_utc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
