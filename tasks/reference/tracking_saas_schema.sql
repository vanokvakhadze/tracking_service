-- ============================================================================
-- TRACKING SaaS — Multi-Tenant Database Schema
-- ============================================================================
-- PostgreSQL 14+ with PostGIS 3+
-- Tenancy model: Shared database, shared schema with tenant_id + Row-Level Security
-- 
-- Run order:
--   1. Extensions
--   2. Enums
--   3. Tables (in order — foreign keys depend on it)
--   4. Indexes
--   5. Triggers
--   6. RLS policies
--   7. Seed data
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";    -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";     -- geographic types
CREATE EXTENSION IF NOT EXISTS "btree_gist";  -- composite spatial+btree indexes

-- ============================================================================
-- 2. ENUMS
-- ============================================================================
CREATE TYPE tenant_status        AS ENUM ('trial', 'active', 'past_due', 'suspended', 'cancelled');
CREATE TYPE user_role             AS ENUM ('super_admin', 'tenant_admin', 'manager', 'user');
CREATE TYPE invitation_status     AS ENUM ('pending', 'accepted', 'expired', 'revoked');
CREATE TYPE shift_status          AS ENUM ('active', 'completed', 'auto_closed', 'invalid');
CREATE TYPE geofence_event_type   AS ENUM ('enter', 'exit');
CREATE TYPE location_category     AS ENUM ('office', 'client_site', 'warehouse', 'checkpoint', 'other');

-- ============================================================================
-- 3. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 TENANT LAYER (multi-tenancy core)
-- ----------------------------------------------------------------------------

CREATE TABLE subscription_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT NOT NULL UNIQUE,        -- 'free', 'basic', 'pro', 'enterprise'
    name                TEXT NOT NULL,
    max_users           INTEGER,                     -- NULL = unlimited
    max_locations       INTEGER,                     -- NULL = unlimited
    price_per_user      DECIMAL(10, 2),
    currency            CHAR(3) DEFAULT 'GEL',
    features            JSONB DEFAULT '{}'::jsonb,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenants (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                        TEXT NOT NULL,
    subdomain                   TEXT NOT NULL UNIQUE,   -- companyA -> companyA.yourdomain.ge
    plan_id                     UUID REFERENCES subscription_plans(id),
    status                      tenant_status NOT NULL DEFAULT 'trial',
    timezone                    TEXT NOT NULL DEFAULT 'Asia/Tbilisi',
    default_language            CHAR(2) DEFAULT 'ka',
    default_geofence_radius_m   INTEGER DEFAULT 100,
    logo_url                    TEXT,
    trial_ends_at               TIMESTAMPTZ,
    subscription_ends_at        TIMESTAMPTZ,
    stripe_customer_id          TEXT,                   -- sync with billing provider
    settings                    JSONB DEFAULT '{}'::jsonb,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW(),
    deleted_at                  TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 3.2 USERS & MEMBERSHIP
-- ----------------------------------------------------------------------------
-- Users are GLOBAL (not tenant-scoped) so the same person can theoretically
-- belong to multiple tenants. Membership table connects them with a role.

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL UNIQUE,
    phone               TEXT,
    password_hash       TEXT,                        -- argon2 / bcrypt
    first_name          TEXT,
    last_name           TEXT,
    avatar_url          TEXT,
    is_super_admin      BOOLEAN DEFAULT FALSE,       -- YOUR (platform owner) access
    email_verified_at   TIMESTAMPTZ,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

CREATE TABLE tenant_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role                user_role NOT NULL DEFAULT 'user',
    employee_code       TEXT,                        -- internal employee ID
    hire_date           DATE,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

CREATE TABLE invitations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email               TEXT NOT NULL,
    role                user_role NOT NULL DEFAULT 'user',
    token               TEXT NOT NULL UNIQUE,        -- secure random, send by email
    status              invitation_status DEFAULT 'pending',
    invited_by_user_id  UUID REFERENCES users(id),
    expires_at          TIMESTAMPTZ NOT NULL,
    accepted_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3.3 GROUPS (teams within a tenant)
-- ----------------------------------------------------------------------------

CREATE TABLE groups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    color               TEXT,                        -- hex color for UI badges
    created_by_user_id  UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    UNIQUE (tenant_id, name)
);

CREATE TABLE group_memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_manager          BOOLEAN DEFAULT FALSE,       -- can manage this group
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (group_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 3.4 LOCATIONS / GEOFENCES
-- ----------------------------------------------------------------------------

CREATE TABLE locations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL,
    category                location_category DEFAULT 'other',
    address                 TEXT,
    center                  GEOGRAPHY(POINT, 4326) NOT NULL,  -- GPS center point
    radius_m                INTEGER NOT NULL DEFAULT 100,     -- geofence radius
    is_active               BOOLEAN DEFAULT TRUE,
    metadata                JSONB DEFAULT '{}'::jsonb,        -- contacts, notes, etc.
    expected_dwell_minutes  INTEGER,                          -- recommended visit time
    created_by_user_id      UUID REFERENCES users(id),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ
);

-- Optional restriction: which groups can access which locations
CREATE TABLE location_groups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    group_id            UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    UNIQUE (location_id, group_id)
);

-- ----------------------------------------------------------------------------
-- 3.5 TRACKING DATA
-- ----------------------------------------------------------------------------

-- A work session
CREATE TABLE shifts (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status                  shift_status NOT NULL DEFAULT 'active',
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at                TIMESTAMPTZ,
    start_location          GEOGRAPHY(POINT, 4326),
    end_location            GEOGRAPHY(POINT, 4326),
    total_distance_m        DECIMAL(12, 2),                   -- computed on close
    total_dwell_minutes     INTEGER,                          -- sum of time in geofences
    locations_visited       INTEGER DEFAULT 0,
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Raw GPS pings — high-volume table.
-- For production scale, partition by month (see PARTITIONING note at bottom).
CREATE TABLE location_pings (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    user_id             UUID NOT NULL,
    shift_id            UUID,                                -- nullable
    recorded_at         TIMESTAMPTZ NOT NULL,                -- device timestamp
    received_at         TIMESTAMPTZ DEFAULT NOW(),           -- server timestamp
    coords              GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy_m          REAL,                                -- GPS accuracy radius
    speed_mps           REAL,
    heading             REAL,                                -- 0-360 degrees
    altitude_m          REAL,
    is_mock             BOOLEAN DEFAULT FALSE,               -- anti-fraud: fake GPS detected
    battery_percent     SMALLINT,
    activity            TEXT                                 -- 'still','walking','running','in_vehicle'
);

-- Geofence enter/exit events
CREATE TABLE geofence_events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id            UUID REFERENCES shifts(id) ON DELETE SET NULL,
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    event_type          geofence_event_type NOT NULL,
    occurred_at         TIMESTAMPTZ NOT NULL,
    coords              GEOGRAPHY(POINT, 4326) NOT NULL,
    accuracy_m          REAL,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated dwell time (entered + exited pair)
CREATE TABLE dwell_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shift_id            UUID REFERENCES shifts(id) ON DELETE SET NULL,
    location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    enter_event_id      UUID REFERENCES geofence_events(id),
    exit_event_id       UUID REFERENCES geofence_events(id),
    entered_at          TIMESTAMPTZ NOT NULL,
    exited_at           TIMESTAMPTZ,                         -- NULL = still inside
    duration_seconds    INTEGER,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Device heartbeat & status — your anti-fraud feed
CREATE TABLE device_status_logs (
    id                          BIGSERIAL PRIMARY KEY,
    tenant_id                   UUID NOT NULL,
    user_id                     UUID NOT NULL,
    shift_id                    UUID,
    reported_at                 TIMESTAMPTZ NOT NULL,
    battery_percent             SMALLINT,
    is_charging                 BOOLEAN,
    network_type                TEXT,                        -- 'wifi','cellular','none'
    has_location_permission     BOOLEAN,
    is_location_enabled         BOOLEAN,
    is_mock_location_installed  BOOLEAN,
    app_version                 TEXT,
    os_version                  TEXT,
    device_model                TEXT
);

-- ----------------------------------------------------------------------------
-- 3.6 AUDIT LOG
-- ----------------------------------------------------------------------------

CREATE TABLE audit_logs (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           UUID,                                -- NULL for super-admin actions
    actor_user_id       UUID REFERENCES users(id),
    action              TEXT NOT NULL,                       -- 'location.created', 'user.role_changed'
    entity_type         TEXT,
    entity_id           UUID,
    metadata            JSONB DEFAULT '{}'::jsonb,
    ip_address          INET,
    user_agent          TEXT,
    occurred_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES
-- ============================================================================
-- Rule: every tenant-scoped query starts with tenant_id, so composite indexes
-- MUST lead with tenant_id. Time-series tables get BRIN for cheap scans.

CREATE INDEX idx_tenants_subdomain          ON tenants(subdomain) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_status             ON tenants(status)    WHERE deleted_at IS NULL;

CREATE INDEX idx_users_email                ON users(email)       WHERE deleted_at IS NULL;

CREATE INDEX idx_memberships_tenant         ON tenant_memberships(tenant_id, is_active);
CREATE INDEX idx_memberships_user           ON tenant_memberships(user_id);

CREATE INDEX idx_invitations_token          ON invitations(token);
CREATE INDEX idx_invitations_tenant         ON invitations(tenant_id, status);

CREATE INDEX idx_groups_tenant              ON groups(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_group_memberships_tu       ON group_memberships(tenant_id, user_id);
CREATE INDEX idx_group_memberships_group    ON group_memberships(group_id);

CREATE INDEX idx_locations_tenant           ON locations(tenant_id) WHERE deleted_at IS NULL;
-- Spatial index — critical for "which geofence is this point in?" queries
CREATE INDEX idx_locations_center_gist      ON locations USING GIST(center) WHERE deleted_at IS NULL;
CREATE INDEX idx_location_groups_tenant     ON location_groups(tenant_id);

CREATE INDEX idx_shifts_tenant_user_time    ON shifts(tenant_id, user_id, started_at DESC);
CREATE INDEX idx_shifts_active              ON shifts(tenant_id, status) WHERE status = 'active';

CREATE INDEX idx_pings_tenant_user_time     ON location_pings(tenant_id, user_id, recorded_at DESC);
CREATE INDEX idx_pings_shift                ON location_pings(shift_id, recorded_at) WHERE shift_id IS NOT NULL;
CREATE INDEX idx_pings_mock                 ON location_pings(tenant_id, recorded_at) WHERE is_mock = TRUE;
CREATE INDEX idx_pings_time_brin            ON location_pings USING BRIN(recorded_at);

CREATE INDEX idx_geofence_events_tu         ON geofence_events(tenant_id, user_id, occurred_at DESC);
CREATE INDEX idx_geofence_events_location   ON geofence_events(location_id, occurred_at DESC);
CREATE INDEX idx_geofence_events_shift      ON geofence_events(shift_id);

CREATE INDEX idx_dwell_tenant_user          ON dwell_records(tenant_id, user_id, entered_at DESC);
CREATE INDEX idx_dwell_location             ON dwell_records(location_id, entered_at DESC);
CREATE INDEX idx_dwell_shift                ON dwell_records(shift_id);

CREATE INDEX idx_device_status_tu           ON device_status_logs(tenant_id, user_id, reported_at DESC);
CREATE INDEX idx_device_status_time_brin    ON device_status_logs USING BRIN(reported_at);

CREATE INDEX idx_audit_tenant_time          ON audit_logs(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_actor                ON audit_logs(actor_user_id, occurred_at DESC);

-- ============================================================================
-- 5. TRIGGERS — auto-maintain updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at       BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER users_updated_at         BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER memberships_updated_at   BEFORE UPDATE ON tenant_memberships
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER groups_updated_at        BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER locations_updated_at     BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();
CREATE TRIGGER shifts_updated_at        BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- ============================================================================
-- 6. ROW-LEVEL SECURITY — tenant isolation guarantee
-- ============================================================================
-- HOW TO USE in your app:
--   After authenticating the request and resolving the tenant from subdomain/JWT:
--     await db.query("SET app.current_tenant = $1", [tenantId]);
--   Then all queries on RLS tables automatically filter by tenant.
--   For super-admin platform operations, run with a privileged role that BYPASSES RLS.

ALTER TABLE tenant_memberships    ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups                ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_pings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE dwell_records         ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_status_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations           ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON tenant_memberships
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON groups
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON group_memberships
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON locations
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON location_groups
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON shifts
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON location_pings
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON geofence_events
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON dwell_records
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON device_status_logs
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));
CREATE POLICY tenant_isolation ON invitations
    USING (tenant_id::text = current_setting('app.current_tenant', TRUE));

-- ============================================================================
-- 7. SEED DATA — Subscription plans (Georgia / Lari)
-- ============================================================================

INSERT INTO subscription_plans (code, name, max_users, max_locations, price_per_user, currency, features) VALUES
('free',       'Free',       3,    5,    0.00,  'GEL', '{"reports": false, "api": false}'::jsonb),
('basic',      'Basic',      10,   50,   5.00,  'GEL', '{"reports": true,  "api": false}'::jsonb),
('pro',        'Pro',        NULL, NULL, 12.00, 'GEL', '{"reports": true,  "api": true,  "white_label": false}'::jsonb),
('enterprise', 'Enterprise', NULL, NULL, 25.00, 'GEL', '{"reports": true,  "api": true,  "white_label": true, "sla": true}'::jsonb);

-- ============================================================================
-- USEFUL EXAMPLE QUERIES
-- ============================================================================

-- Set tenant context (run after authenticating the request):
-- SET app.current_tenant = 'a1b2c3d4-...';

-- 1) Find which geofence contains a given point (used on every ping):
-- SELECT id, name FROM locations
-- WHERE is_active = TRUE
--   AND ST_DWithin(center, ST_GeogFromText('SRID=4326;POINT(44.7833 41.7167)'), radius_m);

-- 2) Total distance a user moved today:
-- SELECT user_id,
--        ST_Length(ST_MakeLine(coords::geometry ORDER BY recorded_at)::geography) AS distance_m
-- FROM location_pings
-- WHERE user_id = '...' AND recorded_at >= CURRENT_DATE
-- GROUP BY user_id;

-- 3) Active shifts right now (for the dashboard):
-- SELECT s.*, u.first_name, u.last_name
-- FROM shifts s
-- JOIN users u ON u.id = s.user_id
-- WHERE s.status = 'active';

-- 4) Total time a user spent at each location this week:
-- SELECT location_id, SUM(duration_seconds)/60 AS minutes
-- FROM dwell_records
-- WHERE user_id = '...' AND entered_at >= date_trunc('week', NOW())
-- GROUP BY location_id;

-- 5) Anti-fraud: how many mock-GPS pings did this user have this month?
-- SELECT user_id, COUNT(*) AS mock_pings
-- FROM location_pings
-- WHERE is_mock = TRUE AND recorded_at >= date_trunc('month', NOW())
-- GROUP BY user_id;

-- ============================================================================
-- PARTITIONING NOTE (do this WHEN, not IF)
-- ============================================================================
-- `location_pings` and `device_status_logs` are append-only and grow fast.
-- At ~100 users sending pings every 30s, you generate ~280K rows/day.
-- 
-- When the table approaches 50-100M rows, convert to monthly partitions:
--
--   CREATE TABLE location_pings (...) PARTITION BY RANGE (recorded_at);
--   CREATE TABLE location_pings_2026_05 PARTITION OF location_pings
--       FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
--
-- Even better: use the TimescaleDB extension (PostgreSQL-compatible time-series DB)
-- with `SELECT create_hypertable('location_pings', 'recorded_at');`
-- It handles partitioning automatically + adds compression for old data.

-- ============================================================================
-- WHAT'S NOT IN THIS SCHEMA (intentionally)
-- ============================================================================
-- - Sessions / refresh tokens — let auth provider (Supabase, Clerk, Auth0) handle
-- - Detailed billing — Stripe / Paddle handles invoices, just sync subscription status
-- - Notifications — separate table when you build push/email notifications
-- - File uploads / photo verification — add later when you implement that feature
-- - i18n strings — keep in app code, not DB
