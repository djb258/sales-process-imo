/**
 * Error Severity Classifier
 *
 * Automatically determines error severity based on process type, error message, and context
 * Provides intelligent classification to reduce manual triage
 */

import { ErrorSeverity, ErrorProcess } from '../types/errorLog';

/**
 * Critical error keywords that always trigger CRITICAL severity
 */
const CRITICAL_KEYWORDS = [
  'data loss',
  'corruption',
  'security breach',
  'unauthorized access',
  'sql injection',
  'authentication failure',
  'system crash',
  'out of memory',
];

/**
 * High severity keywords
 */
const HIGH_KEYWORDS = [
  'promotion failed',
  'compliance violation',
  'validation failed',
  'schema mismatch',
  'data integrity',
  'foreign key constraint',
  'duplicate key',
  'transaction failed',
  'rollback',
];

/**
 * Medium severity keywords
 */
const MEDIUM_KEYWORDS = [
  'retry exceeded',
  'timeout',
  'connection refused',
  'service unavailable',
  'rate limit',
  'network error',
  'api error',
];

/**
 * Process-based severity mapping (default if no keywords match)
 */
const PROCESS_SEVERITY_MAP: Record<string, ErrorSeverity> = {
  // High severity processes (affect data integrity or compliance)
  [ErrorProcess.NEON_PROMOTION]: ErrorSeverity.HIGH,
  [ErrorProcess.COMPLIANCE_MATCHING]: ErrorSeverity.HIGH,
  [ErrorProcess.SCHEMA_TRANSFORMATION]: ErrorSeverity.HIGH,
  [ErrorProcess.GATEKEEPER_VALIDATION]: ErrorSeverity.HIGH,

  // Medium severity processes (affect user experience)
  [ErrorProcess.ACTIVECAMPAIGN_SYNC]: ErrorSeverity.MEDIUM,
  [ErrorProcess.PDF_GENERATION]: ErrorSeverity.MEDIUM,
  [ErrorProcess.MONTE_CARLO]: ErrorSeverity.MEDIUM,
  [ErrorProcess.INSURANCE_SPLIT]: ErrorSeverity.MEDIUM,
  [ErrorProcess.SAVINGS_CALCULATION]: ErrorSeverity.MEDIUM,

  // Low severity processes (non-critical issues)
  [ErrorProcess.DASHBOARD_RENDERING]: ErrorSeverity.LOW,
  [ErrorProcess.FACTFINDER_VALIDATION]: ErrorSeverity.LOW,
};

/**
 * Error Classifier Class
 */
export class ErrorClassifier {
  /**
   * Classify error severity based on message content
   */
  private static classifyByMessage(message: string): ErrorSeverity | null {
    const lowerMessage = message.toLowerCase();

    // Check for critical keywords
    if (CRITICAL_KEYWORDS.some((keyword) => lowerMessage.includes(keyword))) {
      return ErrorSeverity.CRITICAL;
    }

    // Check for high severity keywords
    if (HIGH_KEYWORDS.some((keyword) => lowerMessage.includes(keyword))) {
      return ErrorSeverity.HIGH;
    }

    // Check for medium severity keywords
    if (MEDIUM_KEYWORDS.some((keyword) => lowerMessage.includes(keyword))) {
      return ErrorSeverity.MEDIUM;
    }

    return null; // No keyword match
  }

  /**
   * Classify error severity based on process type
   */
  private static classifyByProcess(process: ErrorProcess | string): ErrorSeverity {
    return PROCESS_SEVERITY_MAP[process] || ErrorSeverity.LOW;
  }

  /**
   * Classify error severity based on retry count
   */
  private static classifyByRetryCount(retryCount?: number): ErrorSeverity | null {
    if (!retryCount) return null;

    if (retryCount >= 5) {
      return ErrorSeverity.HIGH; // Persistent failures are high severity
    } else if (retryCount >= 3) {
      return ErrorSeverity.MEDIUM;
    }

    return null;
  }

  /**
   * Main classification function
   * Uses multiple heuristics to determine appropriate severity
   */
  static classifySeverity(
    message: string,
    process: ErrorProcess | string,
    retryCount?: number,
    explicitSeverity?: ErrorSeverity
  ): ErrorSeverity {
    // 1. If explicit severity provided, use it
    if (explicitSeverity) {
      return explicitSeverity;
    }

    // 2. Check message keywords (highest priority)
    const messageSeverity = this.classifyByMessage(message);
    if (messageSeverity) {
      return messageSeverity;
    }

    // 3. Check retry count (escalate on repeated failures)
    const retrySeverity = this.classifyByRetryCount(retryCount);
    if (retrySeverity) {
      return retrySeverity;
    }

    // 4. Fall back to process-based classification
    return this.classifyByProcess(process);
  }

  /**
   * Determine if error should be mirrored to Neon
   * Only HIGH and CRITICAL errors go to Neon for long-term audit
   */
  static shouldMirrorToNeon(severity: ErrorSeverity): boolean {
    return severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL;
  }

  /**
   * Determine if error should trigger notification
   */
  static shouldNotify(
    severity: ErrorSeverity,
    severityThreshold: ErrorSeverity = ErrorSeverity.HIGH
  ): boolean {
    const severityOrder = [
      ErrorSeverity.LOW,
      ErrorSeverity.MEDIUM,
      ErrorSeverity.HIGH,
      ErrorSeverity.CRITICAL,
    ];

    const errorLevel = severityOrder.indexOf(severity);
    const thresholdLevel = severityOrder.indexOf(severityThreshold);

    return errorLevel >= thresholdLevel;
  }

  /**
   * Generate error code from process and message
   */
  static generateErrorCode(process: ErrorProcess | string, message: string): string {
    // Create a short hash from message
    const messageHash = this.hashString(message).substring(0, 6).toUpperCase();

    // Extract process prefix
    const processPrefix = process.split('_')[0].substring(0, 3).toUpperCase();

    return `ERR-${processPrefix}-${messageHash}`;
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Extract stack trace summary (first 3 lines)
   */
  static extractStackTraceSummary(error: Error): string {
    if (!error.stack) return 'No stack trace available';

    const lines = error.stack.split('\n').slice(0, 4); // First 4 lines (error message + 3 stack frames)
    return lines.join('\n');
  }

  /**
   * Sanitize error message for logging (remove sensitive data)
   */
  static sanitizeErrorMessage(message: string): string {
    // Remove potential API keys, tokens, passwords
    const patterns = [
      /api[_-]?key[=:]\s*[a-zA-Z0-9_-]+/gi,
      /token[=:]\s*[a-zA-Z0-9_.-]+/gi,
      /password[=:]\s*\S+/gi,
      /secret[=:]\s*\S+/gi,
      /Bearer\s+[a-zA-Z0-9_.-]+/gi,
    ];

    let sanitized = message;
    patterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });

    return sanitized;
  }

  /**
   * Check if error is transient (can be retried)
   */
  static isTransientError(message: string): boolean {
    const transientKeywords = [
      'timeout',
      'connection refused',
      'network error',
      'service unavailable',
      'rate limit',
      'temporarily unavailable',
      'try again',
    ];

    const lowerMessage = message.toLowerCase();
    return transientKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Suggest retry strategy based on error type
   */
  static suggestRetryStrategy(
    message: string,
    retryCount?: number
  ): {
    should_retry: boolean;
    wait_time_ms: number;
    max_retries: number;
  } {
    if (!this.isTransientError(message)) {
      return { should_retry: false, wait_time_ms: 0, max_retries: 0 };
    }

    const currentRetry = retryCount || 0;
    const maxRetries = 5;

    if (currentRetry >= maxRetries) {
      return { should_retry: false, wait_time_ms: 0, max_retries: maxRetries };
    }

    // Exponential backoff: 2^retry * 1000ms (1s, 2s, 4s, 8s, 16s)
    const waitTime = Math.pow(2, currentRetry) * 1000;

    return {
      should_retry: true,
      wait_time_ms: waitTime,
      max_retries: maxRetries,
    };
  }
}
