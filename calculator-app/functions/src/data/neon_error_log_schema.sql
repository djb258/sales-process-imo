-- Neon Error Log Table Schema
-- STAMPED compliant error logging for long-term audit and compliance
-- Database: shq (Sales HQ)
-- Created: 2025-10-01

-- Drop table if exists (for development only - comment out in production)
-- DROP TABLE IF EXISTS shq.error_log CASCADE;

-- Create error_log table
CREATE TABLE IF NOT EXISTS shq.error_log (
  -- Primary identifier
  error_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Context identifiers
  prospect_id TEXT,
  client_id TEXT,

  -- Error classification
  process TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Timestamps
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP,
  resolved_at TIMESTAMP,

  -- Doctrine compliance
  agent_execution_signature TEXT NOT NULL,
  blueprint_version_hash TEXT NOT NULL,

  -- Resolution tracking
  resolution_status TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (resolution_status IN ('unresolved', 'in_progress', 'resolved', 'wont_fix', 'archived')),
  resolution_notes TEXT DEFAULT '',

  -- Additional error details
  error_code TEXT,
  stack_trace TEXT,
  request_payload JSONB,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  function_name TEXT,
  environment TEXT,
  related_error_ids TEXT[] DEFAULT '{}',

  -- STAMPED metadata
  section_number INTEGER DEFAULT 6, -- Section 6: Error & Audit Logs
  column_number INTEGER,
  timestamp_last_touched BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_error_log_prospect_id ON shq.error_log(prospect_id) WHERE prospect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_log_client_id ON shq.error_log(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_log_severity ON shq.error_log(severity);
CREATE INDEX IF NOT EXISTS idx_error_log_resolution_status ON shq.error_log(resolution_status);
CREATE INDEX IF NOT EXISTS idx_error_log_process ON shq.error_log(process);
CREATE INDEX IF NOT EXISTS idx_error_log_timestamp ON shq.error_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_log_created_at ON shq.error_log(created_at DESC);

-- Create composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_error_log_severity_status ON shq.error_log(severity, resolution_status);
CREATE INDEX IF NOT EXISTS idx_error_log_prospect_timestamp ON shq.error_log(prospect_id, timestamp DESC) WHERE prospect_id IS NOT NULL;

-- Create GIN index for JSONB request_payload
CREATE INDEX IF NOT EXISTS idx_error_log_request_payload ON shq.error_log USING GIN(request_payload) WHERE request_payload IS NOT NULL;

-- Create text search index for message field
CREATE INDEX IF NOT EXISTS idx_error_log_message_search ON shq.error_log USING GIN(to_tsvector('english', message));

-- Add comment to table
COMMENT ON TABLE shq.error_log IS 'STAMPED compliant error log for IMO Calculator - mirrors high/critical errors from Firebase';

-- Add comments to key columns
COMMENT ON COLUMN shq.error_log.error_id IS 'Unique error identifier (UUID)';
COMMENT ON COLUMN shq.error_log.prospect_id IS 'Associated prospect ID from Firebase (if applicable)';
COMMENT ON COLUMN shq.error_log.client_id IS 'Associated client ID from Neon (if promoted)';
COMMENT ON COLUMN shq.error_log.process IS 'Process or function where error occurred (e.g., neon_promotion, activecampaign_sync)';
COMMENT ON COLUMN shq.error_log.message IS 'Sanitized error message (sensitive data removed)';
COMMENT ON COLUMN shq.error_log.severity IS 'Error severity level: low, medium, high, critical';
COMMENT ON COLUMN shq.error_log.timestamp IS 'When the error originally occurred';
COMMENT ON COLUMN shq.error_log.agent_execution_signature IS 'Agent or service that generated the error';
COMMENT ON COLUMN shq.error_log.blueprint_version_hash IS 'Blueprint configuration version at time of error';
COMMENT ON COLUMN shq.error_log.resolution_status IS 'Current resolution state: unresolved, in_progress, resolved, wont_fix, archived';
COMMENT ON COLUMN shq.error_log.resolution_notes IS 'Human/agent notes on resolution';
COMMENT ON COLUMN shq.error_log.error_code IS 'Generated error code for grouping similar errors';
COMMENT ON COLUMN shq.error_log.stack_trace IS 'Stack trace summary (first 3-4 frames)';
COMMENT ON COLUMN shq.error_log.request_payload IS 'Original request payload that caused error (JSONB)';
COMMENT ON COLUMN shq.error_log.retry_count IS 'Number of retry attempts before final failure';
COMMENT ON COLUMN shq.error_log.timestamp_last_touched IS 'STAMPED doctrine: Unix timestamp in milliseconds';

-- Create view for unresolved critical/high errors
CREATE OR REPLACE VIEW shq.critical_errors_unresolved AS
SELECT
  error_id,
  prospect_id,
  client_id,
  process,
  message,
  severity,
  timestamp,
  error_code,
  retry_count,
  created_at
FROM shq.error_log
WHERE severity IN ('high', 'critical')
  AND resolution_status = 'unresolved'
ORDER BY timestamp DESC;

COMMENT ON VIEW shq.critical_errors_unresolved IS 'View of unresolved high/critical errors requiring immediate attention';

-- Create view for error statistics by process
CREATE OR REPLACE VIEW shq.error_stats_by_process AS
SELECT
  process,
  COUNT(*) as total_errors,
  COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
  COUNT(*) FILTER (WHERE severity = 'high') as high_count,
  COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
  COUNT(*) FILTER (WHERE severity = 'low') as low_count,
  COUNT(*) FILTER (WHERE resolution_status = 'unresolved') as unresolved_count,
  COUNT(*) FILTER (WHERE resolution_status = 'resolved') as resolved_count,
  MAX(timestamp) as last_error_timestamp,
  AVG(retry_count) as avg_retry_count
FROM shq.error_log
GROUP BY process
ORDER BY total_errors DESC;

COMMENT ON VIEW shq.error_stats_by_process IS 'Aggregated error statistics grouped by process';

-- Create view for recent errors (last 24 hours)
CREATE OR REPLACE VIEW shq.errors_recent_24h AS
SELECT
  error_id,
  prospect_id,
  client_id,
  process,
  message,
  severity,
  timestamp,
  resolution_status,
  error_code
FROM shq.error_log
WHERE timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

COMMENT ON VIEW shq.errors_recent_24h IS 'Errors from the last 24 hours';

-- Create function to auto-update timestamp_last_touched
CREATE OR REPLACE FUNCTION shq.update_error_log_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp_last_touched := EXTRACT(EPOCH FROM NOW()) * 1000;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update timestamp on updates
CREATE TRIGGER trigger_update_error_log_timestamp
  BEFORE UPDATE ON shq.error_log
  FOR EACH ROW
  EXECUTE FUNCTION shq.update_error_log_timestamp();

COMMENT ON TRIGGER trigger_update_error_log_timestamp ON shq.error_log IS 'Auto-updates timestamp_last_touched and updated_at on row updates';

-- Create function to auto-set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION shq.set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolution_status = 'resolved' AND OLD.resolution_status != 'resolved' THEN
    NEW.resolved_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set resolved_at
CREATE TRIGGER trigger_set_resolved_at
  BEFORE UPDATE ON shq.error_log
  FOR EACH ROW
  WHEN (NEW.resolution_status = 'resolved')
  EXECUTE FUNCTION shq.set_resolved_at();

COMMENT ON TRIGGER trigger_set_resolved_at ON shq.error_log IS 'Auto-sets resolved_at timestamp when resolution_status changes to resolved';

-- Grant permissions (adjust as needed for your Neon setup)
-- GRANT SELECT, INSERT, UPDATE ON shq.error_log TO imo_calculator_service;
-- GRANT SELECT ON shq.critical_errors_unresolved TO imo_calculator_service;
-- GRANT SELECT ON shq.error_stats_by_process TO imo_calculator_service;
-- GRANT SELECT ON shq.errors_recent_24h TO imo_calculator_service;

-- Sample query: Get all unresolved high-severity errors
-- SELECT * FROM shq.error_log
-- WHERE severity = 'high' AND resolution_status = 'unresolved'
-- ORDER BY timestamp DESC;

-- Sample query: Error count by severity in last 7 days
-- SELECT severity, COUNT(*) as count
-- FROM shq.error_log
-- WHERE timestamp >= NOW() - INTERVAL '7 days'
-- GROUP BY severity
-- ORDER BY count DESC;

-- Sample query: Most common error messages
-- SELECT message, COUNT(*) as count
-- FROM shq.error_log
-- WHERE timestamp >= NOW() - INTERVAL '7 days'
-- GROUP BY message
-- ORDER BY count DESC
-- LIMIT 10;

-- Sample query: Errors for specific prospect
-- SELECT * FROM shq.error_log
-- WHERE prospect_id = 'test_prospect_001'
-- ORDER BY timestamp DESC;
