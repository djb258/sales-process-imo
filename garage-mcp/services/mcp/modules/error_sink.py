"""
Error Sink for Garage-MCP Orchestration
Builds error records for shq.master_error_log with HEIR-aligned structure
"""

import uuid
import traceback
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import json

def build_error_record(
    hdo: Dict[str, Any],
    ctx: Dict[str, Any], 
    err: Exception
) -> Dict[str, Any]:
    """
    Build standardized error record for shq.master_error_log
    
    Args:
        hdo: Current Hierarchical Data Object state
        ctx: Execution context (MCP call context, etc.)
        err: Exception that occurred
        
    Returns:
        Error record dict with all required fields for database insertion
    """
    
    # Generate unique error ID
    error_id = str(uuid.uuid4())
    
    # Extract key identifiers from HDO
    process_id = hdo.get('process_id', 'unknown')
    blueprint_id = hdo.get('blueprint_id', 'unknown')
    
    # Extract plan information
    plan_id = hdo.get('meta', {}).get('plan_id', 'unknown')
    plan_version = hdo.get('meta', {}).get('plan_version', 'unknown')
    
    # Determine agent/stage context
    agent_id = ctx.get('current_agent_id', 'unknown')
    stage = hdo.get('stage', 'unknown')
    
    # Extract current step context if available
    current_step = ctx.get('current_step')
    if current_step:
        agent_id = current_step.get('agent_id', agent_id)
        stage = _map_altitude_to_stage(current_step.get('altitude'))
    
    # Determine error severity
    severity = _determine_error_severity(err, ctx)
    
    # Build error record
    error_record = {
        'error_id': error_id,
        'occurred_at': datetime.now(timezone.utc).isoformat(),
        'process_id': process_id,
        'blueprint_id': blueprint_id,
        'plan_id': plan_id,
        'plan_version': plan_version,
        'agent_id': agent_id,
        'stage': stage,
        'severity': severity,
        'message': str(err),
        'error_type': type(err).__name__,
        'stacktrace': ''.join(traceback.format_exception(type(err), err, err.__traceback__)),
        'hdo_snapshot': _create_hdo_snapshot(hdo),
        'context': _extract_error_context(ctx, err),
        'metadata': {
            'python_version': _get_python_version(),
            'orchestration_runner_version': '1.0.0',
            'heir_compliant': True
        }
    }
    
    return error_record


def _map_altitude_to_stage(altitude: Optional[int]) -> str:
    """Map altitude level to stage name"""
    if altitude is None:
        return 'unknown'
    
    altitude_map = {
        30000: 'overall',
        20000: 'input', 
        10000: 'middle',
        5000: 'output'
    }
    
    return altitude_map.get(altitude, f'altitude_{altitude}')


def _determine_error_severity(err: Exception, ctx: Dict[str, Any]) -> str:
    """Determine error severity level"""
    error_type = type(err).__name__
    error_message = str(err).lower()
    
    # Critical errors that require immediate attention
    if any(keyword in error_message for keyword in [
        'database connection', 'authentication failed', 'permission denied',
        'out of memory', 'disk full'
    ]):
        return 'critical'
    
    # High severity errors
    if any(keyword in error_message for keyword in [
        'timeout', 'network error', 'service unavailable', 
        'invalid data', 'validation failed'
    ]):
        return 'high'
    
    # Medium severity errors
    if error_type in ['ValueError', 'KeyError', 'AttributeError']:
        return 'medium'
    
    # Low severity errors
    if error_type in ['Warning', 'UserWarning']:
        return 'low'
    
    # Default to high for unknown errors
    return 'high'


def _create_hdo_snapshot(hdo: Dict[str, Any]) -> Dict[str, Any]:
    """Create a sanitized snapshot of HDO for error logging"""
    
    # Create shallow copy and sanitize sensitive data
    snapshot = {}
    
    # Include key identifiers
    for key in ['process_id', 'blueprint_id', 'stage', 'validated', 'promoted_to', 'timestamp_last_touched']:
        if key in hdo:
            snapshot[key] = hdo[key]
    
    # Include meta information (sanitized)
    if 'meta' in hdo:
        snapshot['meta'] = {}
        safe_meta_keys = ['plan_id', 'plan_version', 'plan_hash', 'idempotency_key', 'error_context']
        for key in safe_meta_keys:
            if key in hdo['meta']:
                snapshot['meta'][key] = hdo['meta'][key]
    
    # Include recent log entries (last 10)
    if 'log' in hdo and isinstance(hdo['log'], list):
        snapshot['log'] = hdo['log'][-10:]  # Last 10 entries
    
    # Include payload summary (without sensitive data)
    if 'payload' in hdo:
        snapshot['payload_summary'] = {
            'keys': list(hdo['payload'].keys()) if isinstance(hdo['payload'], dict) else 'non_dict',
            'size': len(str(hdo['payload']))
        }
    
    return snapshot


def _extract_error_context(ctx: Dict[str, Any], err: Exception) -> Dict[str, Any]:
    """Extract relevant context information for error analysis"""
    
    context = {}
    
    # MCP context information
    if 'mcp_session_id' in ctx:
        context['mcp_session_id'] = ctx['mcp_session_id']
    
    if 'mcp_tool_name' in ctx:
        context['mcp_tool_name'] = ctx['mcp_tool_name']
    
    # Current step information
    if 'current_step' in ctx:
        step = ctx['current_step']
        context['current_step'] = {
            'step_id': step.get('step_id'),
            'agent_id': step.get('agent_id'),
            'action': step.get('action'),
            'altitude': step.get('altitude'),
            'timeout_seconds': step.get('timeout_seconds')
        }
    
    # Execution environment
    context['execution_environment'] = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'error_occurred_during': ctx.get('current_operation', 'unknown')
    }
    
    # Retry information
    if 'retry_count' in ctx:
        context['retry_count'] = ctx['retry_count']
        context['max_retries'] = ctx.get('max_retries', 0)
    
    # Performance metrics
    if 'step_start_time' in ctx:
        try:
            start_time = datetime.fromisoformat(ctx['step_start_time'].replace('Z', '+00:00'))
            duration = (datetime.now(timezone.utc) - start_time).total_seconds()
            context['step_duration_seconds'] = round(duration, 3)
        except:
            pass  # Ignore datetime parsing errors
    
    return context


def _get_python_version() -> str:
    """Get Python version information"""
    import sys
    return f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"


# Database schema for shq.master_error_log reference
MASTER_ERROR_LOG_SCHEMA = """
CREATE TABLE IF NOT EXISTS shq.master_error_log (
    error_id UUID PRIMARY KEY,
    occurred_at TIMESTAMPTZ NOT NULL,
    process_id TEXT NOT NULL,
    blueprint_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_version TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    stage TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    error_type TEXT NOT NULL,
    stacktrace TEXT,
    hdo_snapshot JSONB,
    context JSONB,
    metadata JSONB,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_master_error_log_process_id ON shq.master_error_log(process_id);
CREATE INDEX IF NOT EXISTS idx_master_error_log_occurred_at ON shq.master_error_log(occurred_at);
CREATE INDEX IF NOT EXISTS idx_master_error_log_severity ON shq.master_error_log(severity);
CREATE INDEX IF NOT EXISTS idx_master_error_log_agent_id ON shq.master_error_log(agent_id);
CREATE INDEX IF NOT EXISTS idx_master_error_log_stage ON shq.master_error_log(stage);
"""