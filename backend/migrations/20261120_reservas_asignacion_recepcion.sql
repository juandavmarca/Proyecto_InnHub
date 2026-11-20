ALTER TABLE reservas
    MODIFY habitaciones_id_habitacion INT(11) NULL,
    ADD COLUMN tipo_habitacion_solicitada VARCHAR(50) NULL AFTER habitaciones_id_habitacion;

UPDATE reservas r
INNER JOIN habitaciones h ON h.id_habitacion = r.habitaciones_id_habitacion
SET r.tipo_habitacion_solicitada = h.tipo
WHERE r.tipo_habitacion_solicitada IS NULL;
