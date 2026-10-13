ALTER TABLE reservas
    DROP FOREIGN KEY reserva_ibfk_1;

ALTER TABLE clientes
    DROP PRIMARY KEY,
    ADD COLUMN id_cliente INT NOT NULL AUTO_INCREMENT FIRST,
    ADD PRIMARY KEY (id_cliente),
    MODIFY documento INT(11) NULL,
    MODIFY tipo_documento VARCHAR(50) NULL,
    MODIFY telefono VARCHAR(20) NOT NULL,
    MODIFY ciudad_re VARCHAR(45) NULL,
    ADD UNIQUE KEY uq_clientes_documento (documento),
    ADD KEY idx_clientes_telefono (telefono);

ALTER TABLE reservas
    ADD CONSTRAINT reserva_ibfk_1
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente);
