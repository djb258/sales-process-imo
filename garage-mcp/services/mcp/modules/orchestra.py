"""
Orchestra MCP Tool for Garage-MCP
Main entrypoint for orchestration invocation with error handling and HDO integration
"""

import json
import re
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import logging

from .error_sink import build_error_record

logger = logging.getLogger(__name__)

# Global tracking for error correlation
_active_orchestrations: Dict[str, Dict[str, Any]] = {}

async def orchestra_invoke(args: Dict[str, Any], ctx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main MCP tool for orchestration invocation
    
    Validates HEIR-aligned IDs, delegates to Claude sub-agents, handles errors
    
    Args:
        args: Tool arguments containing agent_id, action, parameters, etc.
        ctx: MCP calling context with process_id, hdo, etc.
        
    Returns:
        Updated HDO or execution results
        
    Raises:
        RuntimeError: On agent failure with error_id
    """
    
    # Extract and validate arguments
    agent_id = args.get('agent_id')
    action = args.get('action') 
    parameters = args.get('parameters', {})
    step_id = args.get('step_id')
    altitude = args.get('altitude')
    timeout_seconds = args.get('timeout_seconds', 120)
    
    # Extract context
    process_id = ctx.get('process_id')
    hdo = ctx.get('hdo', {})
    plan = ctx.get('plan', {})
    
    # Validate required fields
    if not agent_id:
        raise ValueError("agent_id is required")
    if not action:
        raise ValueError("action is required")
    if not process_id:
        raise ValueError("process_id is required in context")
    
    # Validate HEIR-aligned IDs
    _validate_heir_ids(process_id, hdo)
    
    # Create execution tracking
    execution_id = str(uuid.uuid4())
    execution_context = {
        'execution_id': execution_id,
        'agent_id': agent_id,
        'action': action,
        'step_id': step_id,
        'altitude': altitude,
        'process_id': process_id,
        'started_at': datetime.now(timezone.utc).isoformat(),
        'timeout_seconds': timeout_seconds
    }
    
    _active_orchestrations[execution_id] = execution_context
    
    try:
        logger.info(f"Starting orchestration: {agent_id}.{action} (step: {step_id})")
        
        # Post sidecar start event
        await _post_sidecar_event('orchestration_started', execution_context)
        
        # Delegate to Claude sub-agent
        result = await _delegate_to_agent(
            agent_id=agent_id,
            action=action,
            parameters=parameters,
            execution_context=execution_context,
            hdo=hdo,
            timeout_seconds=timeout_seconds
        )
        
        # Post sidecar success event
        await _post_sidecar_event('orchestration_completed', execution_context, result)
        
        logger.info(f"Orchestration completed: {agent_id}.{action}")
        
        return result
        
    except Exception as e:
        logger.error(f"Orchestration failed: {agent_id}.{action}, error: {str(e)}")
        
        # Build error record
        error_ctx = ctx.copy()
        error_ctx.update(execution_context)
        error_ctx['current_step'] = {
            'step_id': step_id,
            'agent_id': agent_id,
            'action': action,
            'altitude': altitude
        }
        
        error_record = build_error_record(hdo, error_ctx, e)
        
        # Insert into shq.master_error_log
        await _insert_error_record(error_record)
        
        # Post sidecar error event
        await _post_sidecar_event('orchestration_failed', execution_context, {
            'error_id': error_record['error_id'],
            'error_message': str(e),
            'error_type': type(e).__name__
        })
        
        # Re-raise concise error with error_id
        raise RuntimeError(f"Agent {agent_id} failed; error_id={error_record['error_id']}")
        
    finally:
        # Clean up tracking
        _active_orchestrations.pop(execution_id, None)


def _validate_heir_ids(process_id: str, hdo: Dict[str, Any]) -> None:
    """Validate HEIR-aligned ID patterns"""
    
    # Validate process_id pattern
    process_id_pattern = r'^PROC-[a-z0-9_]+-\d{8}-\d{6}-\d{3,6}$'
    if not re.match(process_id_pattern, process_id):
        raise ValueError(f"Invalid process_id format: {process_id}")
    
    # Validate idempotency_key if present
    idempotency_key = hdo.get('meta', {}).get('idempotency_key')
    if idempotency_key:
        idem_pattern = r'^IDEM-PROC-[a-z0-9_]+-\d{8}-\d{6}-\d{3,6}$'
        if not re.match(idem_pattern, idempotency_key):
            raise ValueError(f"Invalid idempotency_key format: {idempotency_key}")
        
        # Verify idempotency_key matches process_id
        expected_idem = f"IDEM-{process_id}"
        if idempotency_key != expected_idem:
            raise ValueError(f"idempotency_key {idempotency_key} does not match process_id {process_id}")


async def _delegate_to_agent(
    agent_id: str,
    action: str, 
    parameters: Dict[str, Any],
    execution_context: Dict[str, Any],
    hdo: Dict[str, Any],
    timeout_seconds: int
) -> Dict[str, Any]:
    """
    Delegate execution to Claude sub-agent by agent_id
    
    This is where the actual agent invocation would happen.
    In a real implementation, this would:
    1. Resolve agent_id to actual agent implementation path
    2. Load agent instructions/prompt
    3. Invoke Claude with agent context and action
    4. Return structured results
    """
    
    # For now, simulate agent execution
    # In production, this would use Claude API or MCP client
    
    logger.debug(f"Delegating to agent {agent_id}: {action}")
    
    # Simulate different agent behaviors
    if 'orchestrator' in agent_id:
        return await _simulate_orchestrator(agent_id, action, parameters, hdo)
    elif 'mapper' in agent_id:
        return await _simulate_mapper(agent_id, action, parameters, hdo)
    elif 'validator' in agent_id:
        return await _simulate_validator(agent_id, action, parameters, hdo)
    elif 'db' in agent_id:
        return await _simulate_db_agent(agent_id, action, parameters, hdo)
    elif 'enforcer' in agent_id:
        return await _simulate_enforcer(agent_id, action, parameters, hdo)
    elif 'notifier' in agent_id:
        return await _simulate_notifier(agent_id, action, parameters, hdo)
    elif 'reporter' in agent_id:
        return await _simulate_reporter(agent_id, action, parameters, hdo)
    else:
        # Generic agent simulation
        return await _simulate_generic_agent(agent_id, action, parameters, hdo)


async def _simulate_orchestrator(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate orchestrator agent (delegation only)"""
    
    # Orchestrators delegate only - they don't do IO directly
    result = {
        'status': 'delegated',
        'action_taken': f"Orchestrator {agent_id} coordinated {action}",
        'delegation_plan': parameters.get('subflow', 'default_subflow'),
        'hdo_updates': {
            'stage': _get_target_stage(agent_id),
            'validated': False  # Reset validation for new stage
        }
    }
    
    # Simulate some processing time
    await asyncio.sleep(0.1)
    
    return result


async def _simulate_mapper(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any] 
) -> Dict[str, Any]:
    """Simulate input mapper agent"""
    
    # Simulate data mapping operation
    mapping_schema = parameters.get('mapping_schema', 'default')
    
    result = {
        'status': 'completed',
        'action_taken': f"Mapped client data using schema {mapping_schema}",
        'mapped_records': 42,
        'normalization_applied': True,
        'hdo_updates': {
            'payload': {
                'mapped_data': f"normalized_data_from_{mapping_schema}",
                'mapping_metadata': {
                    'schema_version': '1.0.0',
                    'records_processed': 42
                }
            }
        }
    }
    
    await asyncio.sleep(0.5)  # Simulate processing time
    return result


async def _simulate_validator(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate input validator agent"""
    
    validation_schema = parameters.get('validation_schema', 'default')
    heir_compliance = parameters.get('heir_compliance', True)
    
    # Simulate validation results
    validation_passed = True  # For demo purposes
    
    result = {
        'status': 'completed',
        'action_taken': f"Validated data against schema {validation_schema}",
        'validation_passed': validation_passed,
        'heir_compliant': heir_compliance,
        'issues_found': 0,
        'hdo_updates': {
            'validated': validation_passed,
            'payload': {
                'validation_results': {
                    'schema': validation_schema,
                    'passed': validation_passed,
                    'heir_compliant': heir_compliance
                }
            }
        }
    }
    
    await asyncio.sleep(0.3)
    return result


async def _simulate_db_agent(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate database agent"""
    
    mode = parameters.get('mode', 'plan')
    
    if mode == 'plan':
        result = {
            'status': 'completed',
            'action_taken': 'Created database execution plan',
            'plan_created': True,
            'dry_run_successful': True,
            'rollback_plan_ready': True,
            'estimated_changes': 3,
            'hdo_updates': {
                'payload': {
                    'db_plan': {
                        'mode': 'plan',
                        'changes': ['INSERT client_record', 'UPDATE status', 'LOG transaction'],
                        'rollback_sql': 'DELETE FROM clients WHERE id = ?'
                    }
                }
            }
        }
    elif mode == 'apply':
        result = {
            'status': 'completed',
            'action_taken': 'Applied planned database changes',
            'transaction_committed': True,
            'records_affected': 3,
            'hdo_updates': {
                'payload': {
                    'db_result': {
                        'mode': 'apply',
                        'transaction_id': 'txn_12345',
                        'committed_at': datetime.now(timezone.utc).isoformat()
                    }
                }
            }
        }
    
    await asyncio.sleep(0.8)  # Database operations take longer
    return result


async def _simulate_enforcer(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate business logic enforcer"""
    
    rules_engine = parameters.get('rules_engine', 'default')
    
    # Simulate business rule evaluation
    promotion_decision = True  # For demo purposes
    
    result = {
        'status': 'completed',
        'action_taken': f"Applied business rules using {rules_engine}",
        'rules_evaluated': 5,
        'violations_found': 0,
        'promotion_decision': promotion_decision,
        'hdo_updates': {
            'promoted_to': 'output' if promotion_decision else None,
            'payload': {
                'enforcement_result': {
                    'rules_engine': rules_engine,
                    'promotion_approved': promotion_decision,
                    'evaluated_rules': ['client_eligibility', 'data_quality', 'business_hours']
                }
            }
        }
    }
    
    await asyncio.sleep(0.4)
    return result


async def _simulate_notifier(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate output notifier"""
    
    notification_type = parameters.get('notification_type', 'generic')
    channels = parameters.get('channels', ['email'])
    
    result = {
        'status': 'completed',
        'action_taken': f"Sent {notification_type} notifications",
        'notifications_sent': len(channels),
        'channels_used': channels,
        'hdo_updates': {
            'payload': {
                'notifications': {
                    'type': notification_type,
                    'channels': channels,
                    'sent_at': datetime.now(timezone.utc).isoformat()
                }
            }
        }
    }
    
    await asyncio.sleep(0.2)
    return result


async def _simulate_reporter(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate output reporter"""
    
    report_template = parameters.get('report_template', 'default')
    artifact_path = parameters.get('artifact_path', 'reports/')
    git_commit = parameters.get('git_commit', False)
    
    report_filename = f"{artifact_path}report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    result = {
        'status': 'completed',
        'action_taken': f"Generated report using {report_template}",
        'report_generated': True,
        'artifact_path': report_filename,
        'git_committed': git_commit,
        'hdo_updates': {
            'payload': {
                'report': {
                    'template': report_template,
                    'path': report_filename,
                    'generated_at': datetime.now(timezone.utc).isoformat()
                }
            }
        }
    }
    
    await asyncio.sleep(0.3)
    return result


async def _simulate_generic_agent(
    agent_id: str, action: str, parameters: Dict[str, Any], hdo: Dict[str, Any]
) -> Dict[str, Any]:
    """Simulate generic agent behavior"""
    
    result = {
        'status': 'completed',
        'action_taken': f"Agent {agent_id} performed {action}",
        'parameters_received': parameters,
        'hdo_updates': {
            'payload': {
                'generic_result': {
                    'agent_id': agent_id,
                    'action': action,
                    'completed_at': datetime.now(timezone.utc).isoformat()
                }
            }
        }
    }
    
    await asyncio.sleep(0.2)
    return result


def _get_target_stage(agent_id: str) -> str:
    """Map agent_id to target HDO stage"""
    if 'input' in agent_id:
        return 'input'
    elif 'middle' in agent_id:
        return 'middle'  
    elif 'output' in agent_id:
        return 'output'
    else:
        return 'input'  # Default


async def _post_sidecar_event(
    event_type: str, 
    execution_context: Dict[str, Any],
    event_data: Optional[Dict[str, Any]] = None
) -> None:
    """Post event to sidecar service for tracking"""
    
    event = {
        'event_type': event_type,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'execution_id': execution_context['execution_id'],
        'process_id': execution_context['process_id'],
        'agent_id': execution_context['agent_id'],
        'action': execution_context['action'],
        'data': event_data or {}
    }
    
    # In production, this would make HTTP call to sidecar service
    logger.debug(f"Sidecar event: {event_type} - {event}")


async def _insert_error_record(error_record: Dict[str, Any]) -> None:
    """Insert error record into shq.master_error_log"""
    
    # In production, this would execute SQL INSERT
    # For now, log the error record
    
    logger.error(f"ERROR RECORD FOR shq.master_error_log:")
    logger.error(json.dumps(error_record, indent=2, default=str))
    
    # TODO: Implement actual database insertion
    # await db.execute(INSERT_ERROR_RECORD_SQL, error_record)


def get_active_orchestrations() -> Dict[str, Dict[str, Any]]:
    """Get currently active orchestrations (for monitoring)"""
    return _active_orchestrations.copy()


def get_orchestration_stats() -> Dict[str, Any]:
    """Get orchestration statistics"""
    return {
        'active_count': len(_active_orchestrations),
        'active_agents': [ctx['agent_id'] for ctx in _active_orchestrations.values()],
        'oldest_execution': min(
            (ctx['started_at'] for ctx in _active_orchestrations.values()), 
            default=None
        )
    }