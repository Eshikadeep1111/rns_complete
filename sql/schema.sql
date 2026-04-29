CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    check_out_time TIMESTAMP WITH TIME ZONE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_emp_id ON sessions (emp_id);
CREATE INDEX idx_sessions_active ON sessions (is_active);

CREATE TABLE location_pings (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    emp_id VARCHAR(50) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    location_source VARCHAR(4) NOT NULL DEFAULT 'GPS',
    logged_at TIMESTAMP WITH TIME ZONE NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_pings_session_id ON location_pings (session_id);
CREATE INDEX idx_pings_synced ON location_pings (synced);
CREATE INDEX idx_pings_emp_id ON location_pings (emp_id);
CREATE INDEX idx_pings_logged_at ON location_pings (logged_at);

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    emp_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    required_action TEXT NOT NULL,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alerts_emp_id ON alerts (emp_id);
CREATE INDEX idx_alerts_sla_deadline ON alerts (sla_deadline);

CREATE TABLE alert_responses (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id),
    emp_id VARCHAR(50) NOT NULL,
    response_text VARCHAR(50) NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alert_responses_alert_id ON alert_responses (alert_id);
CREATE INDEX idx_alert_responses_emp_id ON alert_responses (emp_id);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    area_type VARCHAR(10) NOT NULL DEFAULT 'RADIUS',
    affected_lat DOUBLE PRECISION,
    affected_lng DOUBLE PRECISION,
    affected_radius_meters INTEGER,
    polygon_coordinates TEXT,
    response_deadline_seconds INTEGER NOT NULL DEFAULT 300,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    trigger_source VARCHAR(20) NOT NULL DEFAULT 'manual',
    created_by VARCHAR(50),
    sla_deadline TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_sla_deadline ON events (sla_deadline);

CREATE TABLE consent_logs (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    permission_type VARCHAR(50) NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    device_info TEXT,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_consent_logs_employee_id ON consent_logs (employee_id);
CREATE INDEX idx_consent_logs_synced ON consent_logs (synced);
