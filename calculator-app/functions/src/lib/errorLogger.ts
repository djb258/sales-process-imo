/**
 * Unified Error Logger
 *
 * Centralized error logging system for IMO Calculator
 * Writes to Firebase error_log collection and mirrors critical errors to Neon
 */

import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import {
  ErrorLogEntry,
  LogErrorPayload,
  ErrorSeverity,
  ResolutionStatus,
  ResolveErrorPayload,
  NeonErrorLogSchema,
} from '../types/errorLog';
import { ErrorClassifier } from '../utils/errorClassifier';

const db = admin.firestore();

/**
 * Get blueprint version hash from environment or generate
 */
function getBlueprintVersionHash(): string {
  return (
    process.env.BLUEPRINT_VERSION_HASH ||
    crypto.createHash('sha256').update(new Date().toISOString()).digest('hex').substring(0, 16)
  );
}

/**
 * Get agent execution signature
 */
function getAgentSignature(): string {
  return process.env.AGENT_SIGNATURE || 'firebase_cloud_function:imo_calculator';
}

/**
 * Get environment name
 */
function getEnvironment(): string {
  return process.env.FUNCTION_TARGET || process.env.NODE_ENV || 'production';
}

/**
 * Main Error Logger Class
 */
export class ErrorLogger {
  /**
   * Log error to Firebase (and optionally Neon for high-severity errors)
   */
  static async logError(payload: LogErrorPayload): Promise<string> {
    const errorId = `err_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    // Classify severity
    const severity = ErrorClassifier.classifySeverity(
      payload.message,
      payload.process,
      payload.retry_count,
      payload.severity
    );

    // Generate error code
    const errorCode =
      payload.error_code || ErrorClassifier.generateErrorCode(payload.process, payload.message);

    // Sanitize message
    const sanitizedMessage = ErrorClassifier.sanitizeErrorMessage(payload.message);

    // Build error log entry
    const errorEntry: ErrorLogEntry = {
      error_id: errorId,
      prospect_id: payload.prospect_id || null,
      client_id: payload.client_id || null,
      process: payload.process,
      message: sanitizedMessage,
      severity,
      timestamp,
      agent_execution_signature: getAgentSignature(),
      blueprint_version_hash: getBlueprintVersionHash(),
      resolution_status: ResolutionStatus.UNRESOLVED,
      resolution_notes: '',
      error_code: errorCode,
      stack_trace: payload.stack_trace,
      request_payload: payload.request_payload,
      retry_count: payload.retry_count || 0,
      related_error_ids: payload.related_error_ids || [],
      function_name: payload.function_name,
      environment: getEnvironment(),
      created_at: timestamp,
    };

    try {
      // 1. Write to Firebase error_log collection
      await db.collection('error_log').doc(errorId).set(errorEntry);
      console.log(`[ErrorLogger] Logged error to Firebase: ${errorId} (${severity})`);

      // 2. Mirror to Neon if high/critical severity
      if (ErrorClassifier.shouldMirrorToNeon(severity)) {
        console.log(`[ErrorLogger] Mirroring ${severity} error to Neon...`);
        await this.mirrorToNeon(errorEntry);
      }

      // 3. Send notification if threshold met
      const shouldNotify = ErrorClassifier.shouldNotify(severity, ErrorSeverity.HIGH);
      if (shouldNotify) {
        console.log(`[ErrorLogger] Triggering notification for ${severity} error...`);
        await this.sendNotification(errorEntry);
      }

      return errorId;
    } catch (logError) {
      // Fallback: log to console if database write fails
      console.error('[ErrorLogger] CRITICAL: Failed to log error to Firebase:', logError);
      console.error('[ErrorLogger] Original error:', errorEntry);
      throw logError;
    }
  }

  /**
   * Mirror error to Neon error_log table (via MCP)
   */
  private static async mirrorToNeon(errorEntry: ErrorLogEntry): Promise<void> {
    try {
      // Transform to Neon schema
      const neonEntry: NeonErrorLogSchema = {
        error_id: errorEntry.error_id,
        prospect_id: errorEntry.prospect_id,
        client_id: errorEntry.client_id || null,
        process: errorEntry.process,
        message: errorEntry.message,
        severity: errorEntry.severity,
        timestamp: errorEntry.timestamp,
        agent_execution_signature: errorEntry.agent_execution_signature,
        blueprint_version_hash: errorEntry.blueprint_version_hash,
        resolution_status: errorEntry.resolution_status,
        resolution_notes: errorEntry.resolution_notes,
        error_code: errorEntry.error_code || null,
        stack_trace: errorEntry.stack_trace || null,
        request_payload: errorEntry.request_payload || null,
        retry_count: errorEntry.retry_count || 0,
        function_name: errorEntry.function_name || null,
        environment: errorEntry.environment || null,
        created_at: errorEntry.created_at,
        updated_at: errorEntry.updated_at || null,
        resolved_at: errorEntry.resolved_at || null,
      };

      // Call Neon MCP endpoint
      const mcpEndpoint = process.env.NEON_MCP_ENDPOINT || 'http://localhost:3001/neon/insert';
      const mcpPayload = {
        tool: 'neon_insert_error_log',
        data: {
          table: 'error_log',
          record: neonEntry,
        },
        unique_id: `HEIR-${new Date().toISOString().split('T')[0]}-ERROR-${errorEntry.error_id}`,
        process_id: `PRC-ERROR-${Date.now()}`,
        orbt_layer: 2,
        blueprint_version: '1.0',
      };

      const response = await fetch(mcpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpPayload),
      });

      if (!response.ok) {
        throw new Error(`Neon MCP returned ${response.status}: ${await response.text()}`);
      }

      console.log(`[ErrorLogger] ✅ Mirrored error ${errorEntry.error_id} to Neon`);
    } catch (neonError) {
      console.error('[ErrorLogger] Failed to mirror error to Neon:', neonError);
      // Don't throw - Neon mirroring failure shouldn't prevent Firebase logging
    }
  }

  /**
   * Send error notification (Slack/webhook)
   */
  private static async sendNotification(errorEntry: ErrorLogEntry): Promise<void> {
    try {
      const webhookUrl = process.env.ERROR_NOTIFICATION_WEBHOOK_URL;
      if (!webhookUrl) {
        console.log('[ErrorLogger] No webhook URL configured, skipping notification');
        return;
      }

      const notification = {
        text: `🚨 ${errorEntry.severity.toUpperCase()} Error Detected`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 ${errorEntry.severity.toUpperCase()} Error: ${errorEntry.process}`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Error ID:*\n${errorEntry.error_id}`,
              },
              {
                type: 'mrkdwn',
                text: `*Prospect ID:*\n${errorEntry.prospect_id || 'N/A'}`,
              },
              {
                type: 'mrkdwn',
                text: `*Process:*\n${errorEntry.process}`,
              },
              {
                type: 'mrkdwn',
                text: `*Severity:*\n${errorEntry.severity}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Message:*\n\`\`\`${errorEntry.message}\`\`\``,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Error Code: ${errorEntry.error_code} | Timestamp: ${errorEntry.timestamp}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}: ${await response.text()}`);
      }

      console.log(`[ErrorLogger] ✅ Notification sent for error ${errorEntry.error_id}`);
    } catch (notificationError) {
      console.error('[ErrorLogger] Failed to send notification:', notificationError);
      // Don't throw - notification failure shouldn't prevent error logging
    }
  }

  /**
   * Update error resolution status
   */
  static async resolveError(payload: ResolveErrorPayload): Promise<void> {
    const { error_id, resolution_status, resolution_notes, resolved_by } = payload;
    const timestamp = new Date().toISOString();

    const updateData: Partial<ErrorLogEntry> = {
      resolution_status,
      resolution_notes,
      updated_at: timestamp,
    };

    if (resolution_status === ResolutionStatus.RESOLVED) {
      updateData.resolved_at = timestamp;
    }

    try {
      // Update Firebase
      await db.collection('error_log').doc(error_id).update(updateData);
      console.log(`[ErrorLogger] Updated error ${error_id} status to ${resolution_status}`);

      // If resolved, archive to Neon
      if (resolution_status === ResolutionStatus.RESOLVED) {
        const errorDoc = await db.collection('error_log').doc(error_id).get();
        if (errorDoc.exists) {
          const errorData = errorDoc.data() as ErrorLogEntry;
          errorData.resolution_status = ResolutionStatus.ARCHIVED;
          await this.mirrorToNeon(errorData);
        }
      }
    } catch (updateError) {
      console.error(`[ErrorLogger] Failed to update error ${error_id}:`, updateError);
      throw updateError;
    }
  }

  /**
   * Get error by ID
   */
  static async getError(errorId: string): Promise<ErrorLogEntry | null> {
    const doc = await db.collection('error_log').doc(errorId).get();
    return doc.exists ? (doc.data() as ErrorLogEntry) : null;
  }

  /**
   * Get errors by prospect ID
   */
  static async getErrorsByProspect(prospectId: string): Promise<ErrorLogEntry[]> {
    const snapshot = await db
      .collection('error_log')
      .where('prospect_id', '==', prospectId)
      .orderBy('timestamp', 'desc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as ErrorLogEntry);
  }

  /**
   * Get unresolved errors
   */
  static async getUnresolvedErrors(limit: number = 50): Promise<ErrorLogEntry[]> {
    const snapshot = await db
      .collection('error_log')
      .where('resolution_status', '==', ResolutionStatus.UNRESOLVED)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as ErrorLogEntry);
  }

  /**
   * Get errors by severity
   */
  static async getErrorsBySeverity(
    severity: ErrorSeverity,
    limit: number = 50
  ): Promise<ErrorLogEntry[]> {
    const snapshot = await db
      .collection('error_log')
      .where('severity', '==', severity)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => doc.data() as ErrorLogEntry);
  }

  /**
   * Retry wrapper: executes function with automatic error logging
   */
  static async withErrorHandling<T>(
    process: string,
    fn: () => Promise<T>,
    options: {
      prospectId?: string;
      clientId?: string;
      maxRetries?: number;
      functionName?: string;
    } = {}
  ): Promise<T> {
    const { prospectId, clientId, maxRetries = 3, functionName } = options;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === maxRetries - 1;

        // Log error on last attempt or if non-transient
        const isTransient = ErrorClassifier.isTransientError(lastError.message);
        if (isLastAttempt || !isTransient) {
          await this.logError({
            prospect_id: prospectId,
            client_id: clientId,
            process,
            message: lastError.message,
            stack_trace: ErrorClassifier.extractStackTraceSummary(lastError),
            retry_count: attempt + 1,
            function_name: functionName,
          });
        }

        // Retry if transient and not last attempt
        if (!isLastAttempt && isTransient) {
          const retryStrategy = ErrorClassifier.suggestRetryStrategy(
            lastError.message,
            attempt + 1
          );
          if (retryStrategy.should_retry) {
            console.log(
              `[ErrorLogger] Retrying ${process} after ${retryStrategy.wait_time_ms}ms (attempt ${attempt + 1}/${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, retryStrategy.wait_time_ms));
            continue;
          }
        }

        // If last attempt or non-transient, throw
        if (isLastAttempt) {
          throw lastError;
        }
      }
    }

    throw lastError!;
  }
}
