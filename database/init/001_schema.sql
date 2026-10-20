
-- =========================================================
-- CampusRestrooms
-- Database: PostgreSQL / Amazon RDS
-- =========================================================

-- 1. USERS
-- No existen cuentas para estudiantes.
CREATE TABLE users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('admin', 'custodian')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CAMPUS MAPS
-- La imagen se almacena en S3; aquí guardamos su clave.
CREATE TABLE campus_maps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    image_key VARCHAR(500) NOT NULL,
    image_width INTEGER NOT NULL CHECK (image_width > 0),
    image_height INTEGER NOT NULL CHECK (image_height > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Como se utiliza un único plano activo, impedimos que
-- existan dos mapas activos simultáneamente.
CREATE UNIQUE INDEX uq_campus_maps_one_active
    ON campus_maps (is_active)
    WHERE is_active = TRUE;

-- 3. BUILDINGS
-- map_x y map_y representan un punto de referencia
-- en las coordenadas originales de la imagen.
CREATE TABLE buildings (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    map_id BIGINT NOT NULL
        REFERENCES campus_maps(id) ON DELETE RESTRICT,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    map_x NUMERIC(10, 2) NOT NULL CHECK (map_x >= 0),
    map_y NUMERIC(10, 2) NOT NULL CHECK (map_y >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, map_id)
);

-- 4. RESTROOMS
CREATE TABLE restrooms (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    building_id BIGINT NOT NULL
        REFERENCES buildings(id) ON DELETE RESTRICT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    map_x NUMERIC(10, 2) NOT NULL CHECK (map_x >= 0),
    map_y NUMERIC(10, 2) NOT NULL CHECK (map_y >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'available'
        CHECK (
            status IN (
                'available',
                'maintenance',
                'out_of_service'
            )
        ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. RESTROOM STATUS HISTORY
-- Guarda cada cambio de estado y quién lo realizó.
CREATE TABLE restroom_status_history (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    restroom_id BIGINT NOT NULL
        REFERENCES restrooms(id) ON DELETE RESTRICT,
    changed_by BIGINT
        REFERENCES users(id) ON DELETE SET NULL,
    previous_status VARCHAR(20)
        CHECK (
            previous_status IS NULL OR
            previous_status IN (
                'available',
                'maintenance',
                'out_of_service'
            )
        ),
    new_status VARCHAR(20) NOT NULL
        CHECK (
            new_status IN (
                'available',
                'maintenance',
                'out_of_service'
            )
        ),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 6. MAP NODES
-- Puntos de paso, entradas, cruces y destinos de rutas.
CREATE TABLE map_nodes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    map_id BIGINT NOT NULL
        REFERENCES campus_maps(id) ON DELETE RESTRICT,
    building_id BIGINT,
    restroom_id BIGINT UNIQUE,
    node_type VARCHAR(20) NOT NULL
        CHECK (
            node_type IN (
                'entrance',
                'corridor',
                'intersection',
                'restroom',
                'landmark'
            )
        ),
    name VARCHAR(120),
    map_x NUMERIC(10, 2) NOT NULL CHECK (map_x >= 0),
    map_y NUMERIC(10, 2) NOT NULL CHECK (map_y >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (building_id, map_id)
        REFERENCES buildings(id, map_id)
        ON DELETE RESTRICT,

    FOREIGN KEY (restroom_id)
        REFERENCES restrooms(id)
        ON DELETE RESTRICT,

    CHECK (
        (node_type = 'restroom' AND restroom_id IS NOT NULL)
        OR
        (node_type <> 'restroom' AND restroom_id IS NULL)
    )
);

-- 7. MAP EDGES
-- Una conexión desde from_node_id hasta to_node_id.
-- Si is_bidirectional = TRUE, puede recorrerse en ambos sentidos.
CREATE TABLE map_edges (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_node_id BIGINT NOT NULL
        REFERENCES map_nodes(id) ON DELETE CASCADE,
    to_node_id BIGINT NOT NULL
        REFERENCES map_nodes(id) ON DELETE CASCADE,
    distance NUMERIC(10, 2) NOT NULL CHECK (distance > 0),
    is_bidirectional BOOLEAN NOT NULL DEFAULT TRUE,
    is_accessible BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (from_node_id <> to_node_id),
    UNIQUE (from_node_id, to_node_id)
);

-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_buildings_map
    ON buildings(map_id);

CREATE INDEX idx_restrooms_building
    ON restrooms(building_id);

CREATE INDEX idx_restrooms_status_active
    ON restrooms(status)
    WHERE is_active = TRUE;

CREATE INDEX idx_history_restroom_date
    ON restroom_status_history(restroom_id, changed_at DESC);

CREATE INDEX idx_history_user
    ON restroom_status_history(changed_by);

CREATE INDEX idx_map_nodes_map
    ON map_nodes(map_id);

CREATE INDEX idx_map_nodes_building
    ON map_nodes(building_id);

CREATE INDEX idx_map_edges_from
    ON map_edges(from_node_id)
    WHERE is_active = TRUE;

CREATE INDEX idx_map_edges_to
    ON map_edges(to_node_id)
    WHERE is_active = TRUE;

-- =========================================================
-- AUTOMATIC updated_at MAINTENANCE
-- =========================================================

CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restrooms_updated_at
BEFORE UPDATE ON restrooms
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
