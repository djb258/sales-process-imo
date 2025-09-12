"""
Altitude Orchestration Runner for Garage-MCP
Executes altitude-based orchestration plans with HDO integration
"""

import json
import traceback
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple
import asyncio
import logging

from .orchestra import orchestra_invoke
from .error_sink import build_error_record

logger = logging.getLogger(__name__)

class OrchestrationRunner:
    """Executes altitude-based orchestration plans"""
    
    def __init__(self):
        self.current_hdo: Optional[Dict[str, Any]] = None
        self.current_plan: Optional[Dict[str, Any]] = None
        
    async def run_altitude_plan(
        self, 
        plan: Dict[str, Any], 
        hdo: Dict[str, Any],
        mcp_call_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute an altitude-based orchestration plan
        
        Args:
            plan: Orchestration plan (validated against altitude.plan.schema.json)
            hdo: Hierarchical Data Object (validated against hdo.schema.json) 
            mcp_call_context: MCP calling context for tool invocation
            
        Returns:
            Updated HDO with execution log and results
            
        Raises:
            RuntimeError: On orchestration failure with error_id
        """
        self.current_plan = plan
        self.current_hdo = hdo.copy()  # Work on a copy
        
        try:
            logger.info(f"Starting orchestration plan: {plan['plan_id']}")
            
            # Initialize execution tracking
            self._initialize_hdo_execution()
            
            # Execute steps in altitude order
            for step in plan.get('steps', []):
                await self._execute_step(step, mcp_call_context)
                
            # Mark orchestration complete
            self._complete_hdo_execution()
            
            logger.info(f"Orchestration plan completed: {plan['plan_id']}")
            return self.current_hdo
            
        except Exception as e:
            logger.error(f"Orchestration plan failed: {plan['plan_id']}, error: {str(e)}")
            
            # Build error record and insert to error log
            error_record = build_error_record(
                hdo=self.current_hdo,
                ctx=mcp_call_context or {},
                err=e
            )
            
            # Insert error record (handled by error_sink)
            await self._insert_error_record(error_record)
            
            # Update HDO with error context
            self._record_hdo_error(error_record)
            
            # Re-raise with error_id
            raise RuntimeError(
                f"Orchestration plan {plan['plan_id']} failed; error_id={error_record['error_id']}"
            )
    
    def _initialize_hdo_execution(self) -> None:
        """Initialize HDO for orchestration execution"""
        now = datetime.now(timezone.utc).isoformat()
        
        # Initialize log if not exists
        if 'log' not in self.current_hdo:
            self.current_hdo['log'] = []
            
        # Initialize altitude trace if not exists
        if 'altitude_trace' not in self.current_hdo.get('meta', {}):
            if 'meta' not in self.current_hdo:
                self.current_hdo['meta'] = {}
            self.current_hdo['meta']['altitude_trace'] = {}
            
        # Record orchestration start
        self.current_hdo['log'].append({
            'timestamp': now,
            'agent_id': 'orchestra-runner',
            'action': 'start_orchestration',
            'status': 'started',
            'details': {
                'plan_id': self.current_plan['plan_id'],
                'plan_version': self.current_plan['version'],
                'total_steps': len(self.current_plan.get('steps', []))
            }
        })
        
        self.current_hdo['timestamp_last_touched'] = now
    
    async def _execute_step(
        self, 
        step: Dict[str, Any], 
        mcp_call_context: Optional[Dict[str, Any]]
    ) -> None:
        """Execute a single orchestration step"""
        step_id = step['step_id']
        agent_id = step['agent_id']
        action = step['action']
        altitude = step['altitude']
        
        logger.debug(f"Executing step {step_id}: {agent_id}.{action} at altitude {altitude}")
        
        # Check step conditions
        if not self._should_execute_step(step):
            logger.debug(f"Skipping step {step_id} due to conditions")
            self._record_step_skipped(step)
            return
            
        start_time = datetime.now(timezone.utc)
        
        try:
            # Record step start
            self._record_step_start(step, start_time)
            
            # Execute step via orchestra.invoke
            step_result = await self._invoke_step(step, mcp_call_context)
            
            # Record step completion
            end_time = datetime.now(timezone.utc)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            self._record_step_completion(step, start_time, end_time, duration_ms, step_result)
            
            logger.debug(f"Step {step_id} completed in {duration_ms}ms")
            
        except Exception as e:
            # Record step failure
            end_time = datetime.now(timezone.utc)
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            self._record_step_failure(step, start_time, end_time, duration_ms, e)
            
            # Handle step retry if configured
            if await self._should_retry_step(step, e):
                logger.warning(f"Retrying step {step_id}")
                await asyncio.sleep(step.get('retry_policy', {}).get('backoff_seconds', 5))
                await self._execute_step(step, mcp_call_context)
                return
            
            # Re-raise if no retry or retries exhausted
            raise
    
    async def _invoke_step(
        self,
        step: Dict[str, Any],
        mcp_call_context: Optional[Dict[str, Any]]
    ) -> Any:
        """Invoke a step via the orchestra.invoke MCP tool"""
        
        # Prepare orchestra.invoke arguments
        invoke_args = {
            'agent_id': step['agent_id'],
            'action': step['action'],
            'parameters': step.get('parameters', {}),
            'step_id': step['step_id'],
            'altitude': step['altitude'],
            'timeout_seconds': step.get('timeout_seconds', 120)
        }
        
        # Add HDO context
        invoke_context = {
            'process_id': self.current_hdo['process_id'],
            'hdo': self.current_hdo,
            'plan': self.current_plan
        }
        if mcp_call_context:
            invoke_context.update(mcp_call_context)
        
        # Call orchestra.invoke
        result = await orchestra_invoke(invoke_args, invoke_context)
        
        # Update HDO with any changes from the invocation
        if isinstance(result, dict) and 'hdo_updates' in result:
            self._apply_hdo_updates(result['hdo_updates'])
        
        return result
    
    def _should_execute_step(self, step: Dict[str, Any]) -> bool:
        """Determine if step should be executed based on conditions"""
        when_config = step.get('when', {})
        condition = when_config.get('condition', 'always')
        
        if condition == 'always':
            return True
        elif condition == 'on_success':
            # Check if dependent steps completed successfully
            depends_on = when_config.get('depends_on', [])
            return self._all_dependencies_successful(depends_on)
        elif condition == 'on_failure':
            # Check if dependent steps failed
            depends_on = when_config.get('depends_on', [])
            return self._any_dependencies_failed(depends_on)
        elif condition == 'conditional':
            # Evaluate expression (simplified implementation)
            expression = when_config.get('expression', 'true')
            return self._evaluate_condition_expression(expression)
        
        return False
    
    def _all_dependencies_successful(self, step_ids: List[str]) -> bool:
        """Check if all dependency steps completed successfully"""
        if not step_ids:
            return True
            
        completed_steps = {
            entry['details']['step_id']: entry['status']
            for entry in self.current_hdo.get('log', [])
            if entry.get('details', {}).get('step_id') and entry['status'] in ['completed', 'failed']
        }
        
        return all(
            step_id in completed_steps and completed_steps[step_id] == 'completed'
            for step_id in step_ids
        )
    
    def _any_dependencies_failed(self, step_ids: List[str]) -> bool:
        """Check if any dependency steps failed"""
        if not step_ids:
            return False
            
        completed_steps = {
            entry['details']['step_id']: entry['status']
            for entry in self.current_hdo.get('log', [])
            if entry.get('details', {}).get('step_id') and entry['status'] in ['completed', 'failed']
        }
        
        return any(
            step_id in completed_steps and completed_steps[step_id] == 'failed'
            for step_id in step_ids
        )
    
    def _evaluate_condition_expression(self, expression: str) -> bool:
        """Evaluate conditional expression (simplified)"""
        # For now, implement basic expression evaluation
        # In production, use a proper expression evaluator
        if expression == 'true':
            return True
        elif expression == 'false':
            return False
        elif 'enforcer.promotion_decision == true' in expression:
            # Check if enforcer set promotion decision
            return self._check_promotion_decision()
        
        # Default to true for unknown expressions
        logger.warning(f"Unknown condition expression: {expression}, defaulting to true")
        return True
    
    def _check_promotion_decision(self) -> bool:
        """Check if enforcer made a promotion decision"""
        for entry in reversed(self.current_hdo.get('log', [])):
            if (entry.get('agent_id') == 'middle-subagent-enforcer' and
                entry.get('status') == 'completed' and
                entry.get('details', {}).get('promotion_decision') is not None):
                return entry['details']['promotion_decision']
        return False
    
    async def _should_retry_step(self, step: Dict[str, Any], error: Exception) -> bool:
        """Determine if step should be retried"""
        retry_policy = step.get('retry_policy', {})
        max_retries = retry_policy.get('max_retries', 0)
        retry_on = retry_policy.get('retry_on', [])
        
        if max_retries <= 0:
            return False
            
        # Check current retry count
        step_id = step['step_id']
        retry_count = self._get_step_retry_count(step_id)
        
        if retry_count >= max_retries:
            return False
            
        # Check if error type should trigger retry
        error_type = type(error).__name__.lower()
        if 'timeout' in str(error).lower() and 'timeout' in retry_on:
            return True
        elif 'agent_failure' in retry_on:
            return True
            
        return False
    
    def _get_step_retry_count(self, step_id: str) -> int:
        """Get current retry count for a step"""
        count = 0
        for entry in self.current_hdo.get('log', []):
            if (entry.get('details', {}).get('step_id') == step_id and
                entry.get('status') == 'failed'):
                count += 1
        return count
    
    def _record_step_start(self, step: Dict[str, Any], start_time: datetime) -> None:
        """Record step start in HDO log"""
        self.current_hdo['log'].append({
            'timestamp': start_time.isoformat(),
            'agent_id': step['agent_id'],
            'action': step['action'],
            'status': 'started',
            'details': {
                'step_id': step['step_id'],
                'altitude': step['altitude'],
                'parameters': step.get('parameters', {})
            }
        })
        self.current_hdo['timestamp_last_touched'] = start_time.isoformat()
    
    def _record_step_completion(
        self,
        step: Dict[str, Any], 
        start_time: datetime,
        end_time: datetime,
        duration_ms: int,
        result: Any
    ) -> None:
        """Record step completion in HDO log"""
        self.current_hdo['log'].append({
            'timestamp': end_time.isoformat(),
            'agent_id': step['agent_id'],
            'action': step['action'],
            'status': 'completed',
            'duration_ms': duration_ms,
            'details': {
                'step_id': step['step_id'],
                'altitude': step['altitude'],
                'result_summary': str(result)[:200] if result else None
            }
        })
        self.current_hdo['timestamp_last_touched'] = end_time.isoformat()
    
    def _record_step_failure(
        self,
        step: Dict[str, Any],
        start_time: datetime, 
        end_time: datetime,
        duration_ms: int,
        error: Exception
    ) -> None:
        """Record step failure in HDO log"""
        self.current_hdo['log'].append({
            'timestamp': end_time.isoformat(),
            'agent_id': step['agent_id'], 
            'action': step['action'],
            'status': 'failed',
            'duration_ms': duration_ms,
            'error_id': None,  # Will be set by error handling
            'details': {
                'step_id': step['step_id'],
                'altitude': step['altitude'],
                'error_message': str(error),
                'error_type': type(error).__name__
            }
        })
        self.current_hdo['timestamp_last_touched'] = end_time.isoformat()
    
    def _record_step_skipped(self, step: Dict[str, Any]) -> None:
        """Record step skip in HDO log"""
        now = datetime.now(timezone.utc).isoformat()
        self.current_hdo['log'].append({
            'timestamp': now,
            'agent_id': step['agent_id'],
            'action': step['action'], 
            'status': 'skipped',
            'details': {
                'step_id': step['step_id'],
                'altitude': step['altitude'],
                'skip_reason': 'condition_not_met'
            }
        })
        self.current_hdo['timestamp_last_touched'] = now
    
    def _complete_hdo_execution(self) -> None:
        """Mark HDO execution as complete"""
        now = datetime.now(timezone.utc).isoformat()
        self.current_hdo['log'].append({
            'timestamp': now,
            'agent_id': 'orchestra-runner',
            'action': 'complete_orchestration',
            'status': 'completed',
            'details': {
                'plan_id': self.current_plan['plan_id'],
                'total_steps_executed': len([
                    entry for entry in self.current_hdo['log']
                    if entry.get('details', {}).get('step_id')
                ])
            }
        })
        self.current_hdo['timestamp_last_touched'] = now
        self.current_hdo['stage'] = 'output'  # Final stage
        self.current_hdo['validated'] = True
    
    def _apply_hdo_updates(self, updates: Dict[str, Any]) -> None:
        """Apply updates to HDO from step execution"""
        if 'payload' in updates:
            self.current_hdo['payload'].update(updates['payload'])
        if 'meta' in updates:
            self.current_hdo['meta'].update(updates['meta'])
        if 'stage' in updates:
            self.current_hdo['stage'] = updates['stage']
        if 'validated' in updates:
            self.current_hdo['validated'] = updates['validated']
        if 'promoted_to' in updates:
            self.current_hdo['promoted_to'] = updates['promoted_to']
    
    async def _insert_error_record(self, error_record: Dict[str, Any]) -> None:
        """Insert error record into shq.master_error_log"""
        # This would interface with the database
        # For now, log the error record
        logger.error(f"Error record: {json.dumps(error_record, indent=2)}")
    
    def _record_hdo_error(self, error_record: Dict[str, Any]) -> None:
        """Record error context in HDO"""
        if 'meta' not in self.current_hdo:
            self.current_hdo['meta'] = {}
        if 'error_context' not in self.current_hdo['meta']:
            self.current_hdo['meta']['error_context'] = {
                'last_error_id': None,
                'error_count': 0,
                'retry_count': 0,
                'max_retries': 3
            }
        
        self.current_hdo['meta']['error_context']['last_error_id'] = error_record['error_id']
        self.current_hdo['meta']['error_context']['error_count'] += 1


# Global runner instance
orchestration_runner = OrchestrationRunner()


async def run_altitude_plan(
    plan: Dict[str, Any],
    hdo: Dict[str, Any], 
    mcp_call_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main entry point for executing altitude-based orchestration plans
    
    Args:
        plan: Orchestration plan (validated against altitude.plan.schema.json)
        hdo: Hierarchical Data Object (validated against hdo.schema.json)
        mcp_call_context: MCP calling context for tool invocation
        
    Returns:
        Updated HDO with execution results
        
    Raises:
        RuntimeError: On orchestration failure with error_id
    """
    return await orchestration_runner.run_altitude_plan(plan, hdo, mcp_call_context)