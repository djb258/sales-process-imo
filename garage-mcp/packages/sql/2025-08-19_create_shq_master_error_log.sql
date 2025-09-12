-- Create SHQ Master Error Log Table for Garage-MCP Orchestration
-- This migration is idempotent and can be run multiple times safely

-- Create shq schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS shq;

-- Create master error log table
CREATE TABLE IF NOT EXISTS shq.master_error_log (
    -- Primary identification
    error_id UUID PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- HEIR-aligned identifiers
    process_id TEXT NOT NULL,
    blueprint_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_version TEXT NOT NULL,
    
    -- Execution context
    agent_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    
    -- Error classification
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    error_type TEXT NOT NULL,
    message TEXT NOT NULL,
    stacktrace TEXT,
    
    -- Contextual data
    hdo_snapshot JSONB,
    context JSONB,
    metadata JSONB,
    
    -- Resolution tracking
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_notes TEXT,
    
    -- Audit timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_master_error_log_process_id 
ON shq.master_error_log(process_id);

CREATE INDEX IF NOT EXISTS idx_master_error_log_occurred_at 
ON shq.master_error_log(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_master_error_log_severity 
ON shq.master_error_log(severity);

CREATE INDEX IF NOT EXISTS idx_master_error_log_agent_id 
ON shq.master_error_log(agent_id);

CREATE INDEX IF NOT EXISTS idx_master_error_log_stage 
ON shq.master_error_log(stage);

CREATE INDEX IF NOT EXISTS idx_master_error_log_plan_id 
ON shq.master_error_log(plan_id);

CREATE INDEX IF NOT EXISTS idx_master_error_log_unresolved 
ON shq.master_error_log(resolved_at) 
WHERE resolved_at IS NULL;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_master_error_log_composite
ON shq.master_error_log(process_id, occurred_at DESC, severity);

-- Create JSONB indexes for context queries
CREATE INDEX IF NOT EXISTS idx_master_error_log_hdo_snapshot_gin
ON shq.master_error_log USING GIN (hdo_snapshot);

CREATE INDEX IF NOT EXISTS idx_master_error_log_context_gin
ON shq.master_error_log USING GIN (context);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION shq.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_master_error_log_updated_at ON shq.master_error_log;
CREATE TRIGGER update_master_error_log_updated_at
    BEFORE UPDATE ON shq.master_error_log
    FOR EACH ROW
    EXECUTE FUNCTION shq.update_updated_at_column();

-- Create view for recent unresolved errors
CREATE OR REPLACE VIEW shq.recent_unresolved_errors AS
SELECT 
    error_id,
    occurred_at,
    process_id,
    agent_id,
    severity,
    error_type,
    message,
    (context->>'step_id') AS step_id,
    (context->>'step_duration_seconds')::NUMERIC AS step_duration_seconds
FROM shq.master_error_log
WHERE resolved_at IS NULL
    AND occurred_at >= NOW() - INTERVAL '24 hours'
ORDER BY occurred_at DESC;

-- Create view for error summary by agent
CREATE OR REPLACE VIEW shq.error_summary_by_agent AS
SELECT 
    agent_id,
    COUNT(*) AS total_errors,
    COUNT(CASE WHEN severity = 'critical' THEN 1 END) AS critical_errors,
    COUNT(CASE WHEN severity = 'high' THEN 1 END) AS high_errors,
    COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) AS unresolved_errors,
    MIN(occurred_at) AS first_error_at,
    MAX(occurred_at) AS last_error_at
FROM shq.master_error_log
GROUP BY agent_id
ORDER BY total_errors DESC;

-- Create function to insert error records (used by orchestra.py)
CREATE OR REPLACE FUNCTION shq.insert_error_record(
    p_error_id UUID,
    p_process_id TEXT,
    p_blueprint_id TEXT,
    p_plan_id TEXT,
    p_plan_version TEXT,
    p_agent_id TEXT,
    p_stage TEXT,
    p_severity TEXT,
    p_error_type TEXT,
    p_message TEXT,
    p_stacktrace TEXT DEFAULT NULL,
    p_hdo_snapshot JSONB DEFAULT NULL,
    p_context JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
BEGIN
    INSERT INTO shq.master_error_log (
        error_id, process_id, blueprint_id, plan_id, plan_version,
        agent_id, stage, severity, error_type, message,
        stacktrace, hdo_snapshot, context, metadata
    ) VALUES (
        p_error_id, p_process_id, p_blueprint_id, p_plan_id, p_plan_version,
        p_agent_id, p_stage, p_severity, p_error_type, p_message,
        p_stacktrace, p_hdo_snapshot, p_context, p_metadata
    );
    
    RETURN p_error_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to resolve errors
CREATE OR REPLACE FUNCTION shq.resolve_error(
    p_error_id UUID,
    p_resolved_by TEXT,
    p_resolution_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE shq.master_error_log
    SET 
        resolved_at = NOW(),
        resolved_by = p_resolved_by,
        resolution_notes = p_resolution_notes,
        updated_at = NOW()
    WHERE error_id = p_error_id
        AND resolved_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function for error statistics
CREATE OR REPLACE FUNCTION shq.get_error_stats(
    p_hours_back INTEGER DEFAULT 24
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_errors', COUNT(*),
        'critical_errors', COUNT(CASE WHEN severity = 'critical' THEN 1 END),
        'high_errors', COUNT(CASE WHEN severity = 'high' THEN 1 END),
        'medium_errors', COUNT(CASE WHEN severity = 'medium' THEN 1 END),
        'low_errors', COUNT(CASE WHEN severity = 'low' THEN 1 END),
        'unresolved_errors', COUNT(CASE WHEN resolved_at IS NULL THEN 1 END),
        'resolution_rate', ROUND(
            COUNT(CASE WHEN resolved_at IS NOT NULL THEN 1 END)::NUMERIC / 
            NULLIF(COUNT(*), 0) * 100, 2
        ),
        'avg_resolution_time_minutes', ROUND(
            AVG(EXTRACT(EPOCH FROM (resolved_at - occurred_at)) / 60), 2
        ),
        'top_error_agents', (
            SELECT jsonb_agg(jsonb_build_object('agent_id', agent_id, 'count', error_count))
            FROM (
                SELECT agent_id, COUNT(*) as error_count
                FROM shq.master_error_log
                WHERE occurred_at >= NOW() - (p_hours_back || ' hours')::INTERVAL
                GROUP BY agent_id
                ORDER BY error_count DESC
                LIMIT 5
            ) t
        )
    ) INTO result
    FROM shq.master_error_log
    WHERE occurred_at >= NOW() - (p_hours_back || ' hours')::INTERVAL;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to application role (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON shq.master_error_log TO garage_mcp_app;
-- GRANT USAGE ON SCHEMA shq TO garage_mcp_app;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA shq TO garage_mcp_app;

-- Add migration tracking
INSERT INTO shq.migration_log (
    migration_file,
    applied_at,
    description
) VALUES (
    '2025-08-19_create_shq_master_error_log.sql',
    NOW(),
    'Create SHQ master error log table with HEIR-aligned structure'
) ON CONFLICT (migration_file) DO NOTHING;

COMMENT ON TABLE shq.master_error_log IS 'Master error log for Garage-MCP orchestration system with HEIR alignment';
COMMENT ON COLUMN shq.master_error_log.error_id IS 'Unique error identifier (UUID)';
COMMENT ON COLUMN shq.master_error_log.process_id IS 'HEIR process ID (PROC-<plan_id>-<YYYYMMDD>-<HHMMSS>-<seq>)';
COMMENT ON COLUMN shq.master_error_log.blueprint_id IS 'Associated blueprint/plan identifier';
COMMENT ON COLUMN shq.master_error_log.agent_id IS 'Agent or orchestrator that failed';
COMMENT ON COLUMN shq.master_error_log.stage IS 'Orchestration stage (input/middle/output)';
COMMENT ON COLUMN shq.master_error_log.severity IS 'Error severity level (low/medium/high/critical)';
COMMENT ON COLUMN shq.master_error_log.hdo_snapshot IS 'HDO state at time of error (JSON)';
COMMENT ON COLUMN shq.master_error_log.context IS 'Execution context and step information (JSON)';

-- Print migration status
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: 2025-08-19_create_shq_master_error_log.sql';
    RAISE NOTICE 'Created table: shq.master_error_log';
    RAISE NOTICE 'Created indexes: 8 indexes for efficient querying';
    RAISE NOTICE 'Created views: recent_unresolved_errors, error_summary_by_agent';
    RAISE NOTICE 'Created functions: insert_error_record, resolve_error, get_error_stats';
END $$;