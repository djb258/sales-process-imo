/**
 * Error Log Type Definitions
 *
 * Unified error schema for Firebase and Neon error logging
 * Provides structured error tracking across all IMO Calculator processes
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',           // UI bugs, validation warnings, non-critical issues
  MEDIUM = 'medium',     // Failed retries, degraded functionality
  HIGH = 'high',         // Promotion failures, compliance issues, data integrity
  CRITICAL = 'critical', // System-wide failures, data loss, security breaches
}

/**
 * Resolution status for error tracking
 */
export enum ResolutionStatus {
  UNRESOLVED = 'unresolved',     // Error not yet addressed
  IN_PROGRESS = 'in_progress',   // Under investigation
  RESOLVED = 'resolved',         // Fixed and verified
  WONT_FIX = 'wont_fix',        // Acknowledged but not actionable
  ARCHIVED = 'archived',         // Resolved and moved to long-term storage
}

/**
 * Process identifiers for error context
 */
export enum ErrorProcess {
  // Engine processes
  MONTE_CARLO = 'monte_carlo_simulation',
  INSURANCE_SPLIT = 'insurance_split_calculation',
  COMPLIANCE_MATCHING = 'compliance_matching',
  SAVINGS_CALCULATION = 'savings_calculation',

  // Output processes
  PDF_GENERATION = 'pdf_generation',
  DASHBOARD_RENDERING = 'dashboard_rendering',

  // Integration processes
  ACTIVECAMPAIGN_SYNC = 'activecampaign_sync',
  NEON_PROMOTION = 'neon_promotion',

  // Validation processes
  FACTFINDER_VALIDATION = 'factfinder_validation',
  GATEKEEPER_VALIDATION = 'gatekeeper_validation',

  // Data transformation
  SCHEMA_TRANSFORMATION = 'schema_transformation',
  DATA_MAPPING = 'data_mapping',

  // Infrastructure
  MCP_CLIENT = 'mcp_client',
  FIREBASE_OPERATION = 'firebase_operation',
  NEON_OPERATION = 'neon_operation',
}

/**
 * Main error log entry structure (Firebase + Neon)
 */
export interface ErrorLogEntry {
  error_id: string;
  prospect_id: string | null;
  client_id?: string | null;
  process: ErrorProcess | string;
  message: string;
  severity: ErrorSeverity;
  timestamp: string; // ISO 8601 format
  agent_execution_signature: string;
  blueprint_version_hash: string;
  resolution_status: ResolutionStatus;
  resolution_notes: string;

  // Additional context
  error_code?: string;
  stack_trace?: string;
  request_payload?: any;
  retry_count?: number;
  related_error_ids?: string[];

  // Metadata
  function_name?: string;
  environment?: string;

  // Timestamps
  created_at: string;
  updated_at?: string;
  resolved_at?: string;
}

/**
 * Error log write payload (for logError function)
 */
export interface LogErrorPayload {
  prospect_id?: string | null;
  client_id?: string | null;
  process: ErrorProcess | string;
  message: string;
  severity?: ErrorSeverity;
  error_code?: string;
  stack_trace?: string;
  request_payload?: any;
  function_name?: string;
  retry_count?: number;
  related_error_ids?: string[];
}

/**
 * Error resolution update payload
 */
export interface ResolveErrorPayload {
  error_id: string;
  resolution_status: ResolutionStatus;
  resolution_notes: string;
  resolved_by?: string;
}

/**
 * Error statistics aggregation
 */
export interface ErrorStatistics {
  total_errors: number;
  by_severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  by_status: {
    unresolved: number;
    in_progress: number;
    resolved: number;
    wont_fix: number;
    archived: number;
  };
  by_process: Record<string, number>;
  recent_critical_errors: ErrorLogEntry[];
  top_error_messages: Array<{ message: string; count: number }>;
}

/**
 * Neon error_log table schema (for SQL CREATE TABLE)
 */
export interface NeonErrorLogSchema {
  error_id: string; // UUID PRIMARY KEY
  prospect_id: string | null;
  client_id: string | null;
  process: string;
  message: string;
  severity: string;
  timestamp: string; // TIMESTAMP
  agent_execution_signature: string;
  blueprint_version_hash: string;
  resolution_status: string;
  resolution_notes: string;
  error_code: string | null;
  stack_trace: string | null;
  request_payload: any; // JSONB
  retry_count: number;
  function_name: string | null;
  environment: string | null;
  created_at: string; // TIMESTAMP
  updated_at: string | null; // TIMESTAMP
  resolved_at: string | null; // TIMESTAMP
}

/**
 * Error notification configuration
 */
export interface ErrorNotificationConfig {
  enabled: boolean;
  severity_threshold: ErrorSeverity;
  webhook_url?: string;
  slack_channel?: string;
  email_recipients?: string[];
  notification_template?: string;
}
