ALTER TABLE reservas
    MODIFY id_empleado INT(11) NULL,
    ADD COLUMN monto_total DECIMAL(10,2) NULL AFTER observacion;

ALTER TABLE pagos
    MODIFY fecha_pago TIMESTAMP NULL DEFAULT NULL,
    ADD KEY idx_pagos_referencia_transaccion (referencia_transaccion);
