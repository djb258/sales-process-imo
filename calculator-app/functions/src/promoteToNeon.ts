/**
 * Firebase Cloud Function: promoteToNeon
 *
 * Triggered when factfinder.status = "client"
 * Promotes prospect data from Firebase (SPVPET) → Neon (STAMPED)
 *
 * Workflow:
 * 1. Trigger: Watch for status change to "client"
 * 2. Validate: Gatekeeper checks all requirements
 * 3. Transform: Map SPVPET → STAMPED
 * 4. Insert: Write to Neon via MCP
 * 5. Confirm: Update Firestore with promotion status + Neon client_id
 * 6. Audit: Log promotion event to promotion_log
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { GatekeeperValidator } from './utils/gatekeeperValidator';
import { StampedTransformer } from './utils/stampedTransformer';
import { NeonMcpClient } from './utils/neonMcpClient';
import { PromotionLog } from './types/stamped';
import { ErrorLogger } from './lib/errorLogger';
import { ErrorProcess } from './types/errorLog';

const db = admin.firestore();

/**
 * Generate blueprint version hash from current configuration
 */
function generateBlueprintHash(): string {
  // In production, this would hash actual blueprint config files
  // For now, use schema version + timestamp as pseudo-hash
  const schemaVersion = '1.0.0';
  const timestamp = Date.now().toString();
  return crypto
    .createHash('sha256')
    .update(`${schemaVersion}-${timestamp}`)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Main Cloud Function: Promote Prospect to Client in Neon
 *
 * Trigger: Firestore document update on /factfinder/{prospectId}
 * When: status field changes to "client"
 */
export const promoteToNeon = functions.firestore
  .document('factfinder/{prospectId}')
  .onUpdate(async (change, context) => {
    const prospectId = context.params.prospectId;
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only trigger when status changes to "client"
    if (newData.status !== 'client') {
      return null;
    }

    if (oldData.status === 'client') {
      // Already promoted
      console.log(`[PromoteToNeon] Prospect ${prospectId} already promoted, skipping`);
      return null;
    }

    console.log(`[PromoteToNeon] Starting promotion for prospect: ${prospectId}`);

    // Initialize promotion log
    const promotionId = `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const blueprintHash = generateBlueprintHash();

    try {
      // STEP 1: Fetch all required data from Firebase
      console.log(`[PromoteToNeon] Step 1: Fetching Firebase data...`);
      const [factfinderDoc, montecarloDoc, insuranceSplitDoc, complianceDoc, savingsDoc] =
        await Promise.all([
          db.collection('factfinder').doc(prospectId).get(),
          db.collection('montecarlo').doc(prospectId).get(),
          db.collection('insurance_split').doc(prospectId).get(),
          db.collection('compliance').doc(prospectId).get(),
          db.collection('savings_scenarios').doc(prospectId).get(),
        ]);

      if (!factfinderDoc.exists) {
        throw new Error('Factfinder document not found');
      }

      const firebaseData = {
        factfinder: factfinderDoc.data(),
        montecarlo: montecarloDoc.exists ? montecarloDoc.data() : null,
        insuranceSplit: insuranceSplitDoc.exists ? insuranceSplitDoc.data() : null,
        compliance: complianceDoc.exists ? complianceDoc.data() : null,
        savings: savingsDoc.exists ? savingsDoc.data() : null,
      };

      // STEP 2: Validate with Gatekeeper
      console.log(`[PromoteToNeon] Step 2: Running gatekeeper validation...`);
      const validationResult = await GatekeeperValidator.validatePromotion(
        prospectId,
        firebaseData
      );

      if (!validationResult.isValid) {
        const errorMsg = `Gatekeeper validation failed: ${validationResult.errors.join(', ')}`;
        console.error(`[PromoteToNeon] ${errorMsg}`);

        // Update factfinder with validation failure
        await db.collection('factfinder').doc(prospectId).update({
          promotion_status: 'validation_failed',
          promotion_errors: validationResult.errors,
          promotion_timestamp: Date.now(),
        });

        // Log failed promotion attempt
        await logPromotionAttempt(
          promotionId,
          prospectId,
          prospectId, // Use prospect_id as fallback client_id
          'failed',
          blueprintHash,
          errorMsg,
          null
        );

        throw new functions.https.HttpsError('failed-precondition', errorMsg);
      }

      console.log(
        `[PromoteToNeon] Gatekeeper validation passed (warnings: ${validationResult.warnings.length})`
      );

      // STEP 3: Transform SPVPET → STAMPED
      console.log(`[PromoteToNeon] Step 3: Transforming SPVPET → STAMPED...`);
      const stampedPayload = await StampedTransformer.transformFirebaseToNeon(
        prospectId,
        firebaseData,
        blueprintHash
      );

      // STEP 4: Insert into Neon via MCP
      console.log(`[PromoteToNeon] Step 4: Inserting into Neon via MCP...`);
      const insertResult = await NeonMcpClient.insertStampedPayload(stampedPayload);

      if (!insertResult.success) {
        const errorMsg = `Neon insert failed: ${insertResult.errors.join(', ')}`;
        console.error(`[PromoteToNeon] ${errorMsg}`);

        // Update factfinder with insert failure
        await db.collection('factfinder').doc(prospectId).update({
          promotion_status: 'insert_failed',
          promotion_errors: insertResult.errors,
          promotion_timestamp: Date.now(),
        });

        // Log failed promotion
        await logPromotionAttempt(
          promotionId,
          prospectId,
          stampedPayload.client.client_id,
          'failed',
          blueprintHash,
          errorMsg,
          insertResult.records_inserted
        );

        throw new functions.https.HttpsError('internal', errorMsg);
      }

      console.log(`[PromoteToNeon] Neon insert successful:`, insertResult.records_inserted);

      // STEP 5: Update Firestore with success status
      console.log(`[PromoteToNeon] Step 5: Updating Firestore with promotion status...`);
      await db.collection('factfinder').doc(prospectId).update({
        promotion_status: 'completed',
        neon_client_id: stampedPayload.client.client_id,
        promotion_timestamp: Date.now(),
        promotion_id: promotionId,
        records_inserted: insertResult.records_inserted,
      });

      // STEP 6: Log successful promotion to Neon
      console.log(`[PromoteToNeon] Step 6: Logging promotion to Neon audit log...`);
      await logPromotionAttempt(
        promotionId,
        prospectId,
        stampedPayload.client.client_id,
        'completed',
        blueprintHash,
        null,
        insertResult.records_inserted
      );

      console.log(`[PromoteToNeon] ✅ Promotion completed successfully for ${prospectId}`);

      return {
        success: true,
        promotion_id: promotionId,
        prospect_id: prospectId,
        client_id: stampedPayload.client.client_id,
        records_inserted: insertResult.records_inserted,
      };
    } catch (error) {
      console.error(`[PromoteToNeon] ❌ Error during promotion:`, error);

      // Log to unified error system
      await ErrorLogger.logError({
        prospect_id: prospectId,
        process: ErrorProcess.NEON_PROMOTION,
        message: (error as Error).message,
        stack_trace: (error as Error).stack,
        function_name: 'promoteToNeon',
      });

      // Log failed promotion
      await logPromotionAttempt(
        promotionId,
        prospectId,
        prospectId,
        'failed',
        blueprintHash,
        (error as Error).message,
        null
      );

      // Re-throw to trigger Cloud Function error handling
      throw error;
    }
  });

/**
 * Helper: Log promotion attempt to Neon promotion_log table
 */
async function logPromotionAttempt(
  promotionId: string,
  prospectId: string,
  clientId: string,
  status: 'pending' | 'completed' | 'failed' | 'rolled_back',
  blueprintHash: string,
  errorMessage: string | null,
  recordsInserted: any
): Promise<void> {
  const promotionLog: PromotionLog = {
    promotion_id: promotionId,
    prospect_id: prospectId,
    client_id: clientId,
    promotion_timestamp: Date.now(),
    agent_execution_signature: 'firebase_cloud_function:promoteToNeon',
    schema_version: '1.0.0',
    blueprint_version_hash: blueprintHash,
    status,
    error_message: errorMessage || undefined,
    records_inserted: recordsInserted,
    created_at: new Date().toISOString(),
  };

  try {
    await NeonMcpClient.insertPromotionLog(promotionLog);
    console.log(`[PromoteToNeon] Promotion log entry created: ${promotionId}`);
  } catch (logError) {
    console.error('[PromoteToNeon] Failed to log promotion attempt:', logError);
    // Don't throw - logging failure shouldn't break promotion workflow
  }
}

/**
 * HTTP Cloud Function: Manual promotion trigger (for testing)
 */
export const triggerPromotion = functions.https.onCall(async (data, context) => {
  const { prospectId } = data;

  if (!prospectId) {
    throw new functions.https.HttpsError('invalid-argument', 'prospectId is required');
  }

  try {
    // Check if prospect exists
    const factfinderDoc = await db.collection('factfinder').doc(prospectId).get();

    if (!factfinderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Factfinder not found');
    }

    // Trigger promotion by updating status to "client"
    await db.collection('factfinder').doc(prospectId).update({
      status: 'client',
      timestamp: Date.now(),
    });

    return {
      success: true,
      message: `Promotion triggered for prospect ${prospectId}`,
      note: 'The promoteToNeon function will process this asynchronously',
    };
  } catch (error) {
    console.error(`Error triggering promotion for ${prospectId}:`, error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to trigger promotion: ${(error as Error).message}`
    );
  }
});
