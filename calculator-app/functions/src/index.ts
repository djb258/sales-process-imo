import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Import engine logic (you'll need to share these with the functions folder)
import { runMonteCarloSimulation } from './engines/monteCarlo';
import { calculateInsuranceSplit } from './engines/insuranceSplit';
import { matchComplianceRequirements } from './engines/compliance';
import { calculateSavingsImpact } from './engines/savingsVehicle';

// Import error handling
import { ErrorLogger } from './lib/errorLogger';
import { ErrorProcess } from './types/errorLog';

/**
 * Cloud Function triggered when factfinder.validated = true
 * Processes the factfinder data and generates all calculations
 */
export const processFactfinder = functions.firestore
  .document('factfinder/{prospectId}')
  .onWrite(async (change, context) => {
    const prospectId = context.params.prospectId;
    const newData = change.after.exists ? change.after.data() : null;
    const oldData = change.before.exists ? change.before.data() : null;

    // Only process if validated changed from false to true
    if (!newData || !newData.validated) {
      return null;
    }

    if (oldData && oldData.validated === true) {
      // Already processed
      return null;
    }

    console.log(`Processing factfinder for prospect: ${prospectId}`);

    try {
      const factfinder = newData;

      // 1. Run Enhanced Monte Carlo Simulation (10,000 iterations)
      await ErrorLogger.withErrorHandling(
        ErrorProcess.MONTE_CARLO,
        async () => {
          const monteCarloData = runMonteCarloSimulation({
            baseline: factfinder.claims.totalAnnualCost,
            volatility: 0.2, // 20% volatility as default
            simulations: 10000, // Enhanced: 10k iterations for accuracy
          });

          await db.collection('montecarlo').doc(prospectId).set({
            prospect_id: prospectId,
            ...monteCarloData,
            timestamp: Date.now(),
          });

          console.log(`✅ Monte Carlo simulation (10k iterations) saved for ${prospectId}`);
        },
        { prospectId, functionName: 'processFactfinder:monteCarlo' }
      );

      // 2. Calculate Enhanced Insurance Split (10/85 rule)
      await ErrorLogger.withErrorHandling(
        ErrorProcess.INSURANCE_SPLIT,
        async () => {
          const insuranceSplitData = calculateInsuranceSplit({
            totalEmployees: factfinder.company.employeeCount,
            totalAnnualCost: factfinder.claims.totalAnnualCost,
          });

          await db.collection('insurance_split').doc(prospectId).set({
            prospect_id: prospectId,
            ...insuranceSplitData,
            timestamp: Date.now(),
          });

          console.log(`✅ Enhanced insurance split saved for ${prospectId}`);
        },
        { prospectId, functionName: 'processFactfinder:insuranceSplit' }
      );

      // 3. Match Compliance Requirements (using JSON dataset)
      await ErrorLogger.withErrorHandling(
        ErrorProcess.COMPLIANCE_MATCHING,
        async () => {
          const complianceData = matchComplianceRequirements({
            employeeCount: factfinder.company.employeeCount,
            state: factfinder.company.state,
          });

          await db.collection('compliance').doc(prospectId).set({
            prospect_id: prospectId,
            ...complianceData,
            timestamp: Date.now(),
          });

          console.log(`✅ Compliance requirements (from dataset) saved for ${prospectId}`);
        },
        { prospectId, functionName: 'processFactfinder:compliance' }
      );

      // 4. Calculate Enhanced Savings Vehicle Impact
      await ErrorLogger.withErrorHandling(
        ErrorProcess.SAVINGS_CALCULATION,
        async () => {
          const savingsData = calculateSavingsImpact({
            actualCost: factfinder.claims.totalAnnualCost,
          });

          await db.collection('savings_scenarios').doc(prospectId).set({
            prospect_id: prospectId,
            ...savingsData,
            timestamp: Date.now(),
          });

          console.log(`✅ Enhanced savings scenarios saved for ${prospectId}`);
        },
        { prospectId, functionName: 'processFactfinder:savings' }
      );

      // 5. Create Presentation Record
      await db.collection('presentations').doc(prospectId).set({
        prospect_id: prospectId,
        dashboardUrl: `/dashboard/${prospectId}`,
        generatedAt: Date.now(),
        sections: {
          factfinder: true,
          monteCarlo: true,
          compliance: true,
          sniperMarketing: false, // Placeholder for future feature
        },
        timestamp: Date.now(),
      });

      console.log(`✅ Presentation record created for ${prospectId}`);

      return { success: true, prospectId };
    } catch (error) {
      console.error(`❌ Error processing factfinder for ${prospectId}:`, error);

      // Log to unified error system
      await ErrorLogger.logError({
        prospect_id: prospectId,
        process: 'factfinder_processing',
        message: (error as Error).message,
        stack_trace: (error as Error).stack,
        function_name: 'processFactfinder',
      });

      throw new functions.https.HttpsError('internal', 'Failed to process factfinder');
    }
  });

/**
 * HTTP Cloud Function to generate PDF export
 * Called from the dashboard export button
 */
export const generatePdf = functions
  .runWith({ memory: '1GB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    const { prospectId } = data;

    if (!prospectId) {
      throw new functions.https.HttpsError('invalid-argument', 'prospectId is required');
    }

    console.log(`Generating PDF for prospect: ${prospectId}`);

    return ErrorLogger.withErrorHandling(
      ErrorProcess.PDF_GENERATION,
      async () => {
        // Fetch all data for the prospect
        const [factfinder, montecarlo, insuranceSplit, compliance, savings] = await Promise.all([
          db.collection('factfinder').doc(prospectId).get(),
          db.collection('montecarlo').doc(prospectId).get(),
          db.collection('insurance_split').doc(prospectId).get(),
          db.collection('compliance').doc(prospectId).get(),
          db.collection('savings_scenarios').doc(prospectId).get(),
        ]);

        if (!factfinder.exists) {
          throw new functions.https.HttpsError('not-found', 'Factfinder not found');
        }

      // Import enhanced PDF template generator
      const { generateEnhancedPdfHtml } = await import('./templates/pdfTemplateEnhanced');

      // Generate HTML content
      const html = generateEnhancedPdfHtml({
        prospectId,
        factfinder: factfinder.data() as any,
        monteCarlo: montecarlo.exists ? (montecarlo.data() as any) : undefined,
        insuranceSplit: insuranceSplit.exists ? (insuranceSplit.data() as any) : undefined,
        compliance: compliance.exists ? (compliance.data() as any) : undefined,
        savings: savings.exists ? (savings.data() as any) : undefined,
        generatedDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });

      // Generate PDF using Puppeteer
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
      });

      await browser.close();

      // Upload PDF to Firebase Storage
      const bucket = admin.storage().bucket();
      const fileName = `pdfs/${prospectId}_${Date.now()}.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            prospect_id: prospectId,
            generated_by: 'IMO Calculator',
            generated_at: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await file.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Save PDF metadata to Firestore
      const pdfRecord = {
        prospect_id: prospectId,
        downloadUrl: publicUrl,
        storagePath: fileName,
        generatedAt: Date.now(),
        fileSize: pdfBuffer.length,
        timestamp: Date.now(),
        generated_by: 'Cloud Function',
      };

      await db.collection('pdfs').doc(prospectId).set(pdfRecord);

        console.log(`✅ PDF generated and uploaded for ${prospectId}`);

        return {
          success: true,
          downloadUrl: publicUrl,
          prospectId,
          fileSize: pdfBuffer.length,
        };
      },
      { prospectId, functionName: 'generatePdf', maxRetries: 1 }
    );
  });

/**
 * HTTP endpoint to manually trigger factfinder processing
 * Useful for testing
 */
export const triggerProcessing = functions.https.onCall(async (data, context) => {
  const { prospectId } = data;

  if (!prospectId) {
    throw new functions.https.HttpsError('invalid-argument', 'prospectId is required');
  }

  try {
    const factfinderDoc = await db.collection('factfinder').doc(prospectId).get();

    if (!factfinderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Factfinder not found');
    }

    // Trigger processing by updating the document
    await db.collection('factfinder').doc(prospectId).update({
      validated: true,
      timestamp: Date.now(),
    });

    return { success: true, message: 'Processing triggered' };
  } catch (error) {
    console.error(`Error triggering processing for ${prospectId}:`, error);
    throw new functions.https.HttpsError('internal', 'Failed to trigger processing');
  }
});

// Export Neon promotion functions
export { promoteToNeon, triggerPromotion } from './promoteToNeon';
