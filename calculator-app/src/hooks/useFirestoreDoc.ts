/**
 * Custom React Hooks for Firestore Data Binding
 * Used by Builder.io components to fetch real-time data
 */

import { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type {
  FactfinderData,
  MonteCarloData,
  InsuranceSplitData,
  ComplianceData,
  SavingsScenarioData,
  SniperMarketingData,
  PresentationData,
} from '../schemas/firestore';

// ============================================================================
// GENERIC FIRESTORE HOOK
// ============================================================================

export interface FirestoreHookResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  exists: boolean;
}

/**
 * Generic hook for fetching a single Firestore document
 * Auto-subscribes to real-time updates
 *
 * @param collection - Firestore collection name
 * @param documentId - Document ID
 * @returns Real-time document data with loading/error states
 */
export function useFirestoreDoc<T = DocumentData>(
  collection: string,
  documentId: string | null
): FirestoreHookResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [exists, setExists] = useState<boolean>(false);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      setData(null);
      setExists(false);
      return;
    }

    setLoading(true);
    setError(null);

    const docRef = doc(db, collection, documentId);

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as T);
          setExists(true);
        } else {
          setData(null);
          setExists(false);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`Error fetching ${collection}/${documentId}:`, err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [collection, documentId]);

  return { data, loading, error, exists };
}

// ============================================================================
// TYPED HOOKS FOR EACH COLLECTION
// ============================================================================

/**
 * Fetches Factfinder data for a prospect
 */
export function useFactfinder(prospectId: string | null): FirestoreHookResult<FactfinderData> {
  return useFirestoreDoc<FactfinderData>('factfinder', prospectId);
}

/**
 * Fetches Monte Carlo simulation data
 */
export function useMonteCarlo(prospectId: string | null): FirestoreHookResult<MonteCarloData> {
  return useFirestoreDoc<MonteCarloData>('montecarlo', prospectId);
}

/**
 * Fetches Insurance Split data (10/85 rule)
 */
export function useInsuranceSplit(
  prospectId: string | null
): FirestoreHookResult<InsuranceSplitData> {
  return useFirestoreDoc<InsuranceSplitData>('insurance_split', prospectId);
}

/**
 * Fetches Compliance requirements
 */
export function useCompliance(prospectId: string | null): FirestoreHookResult<ComplianceData> {
  return useFirestoreDoc<ComplianceData>('compliance', prospectId);
}

/**
 * Fetches Savings Vehicle scenarios
 */
export function useSavingsScenario(
  prospectId: string | null
): FirestoreHookResult<SavingsScenarioData> {
  return useFirestoreDoc<SavingsScenarioData>('savings_scenarios', prospectId);
}

/**
 * Fetches Sniper Marketing narratives
 */
export function useSniperMarketing(
  prospectId: string | null
): FirestoreHookResult<SniperMarketingData> {
  return useFirestoreDoc<SniperMarketingData>('sniper_marketing', prospectId);
}

/**
 * Fetches Presentation metadata
 */
export function usePresentation(prospectId: string | null): FirestoreHookResult<PresentationData> {
  return useFirestoreDoc<PresentationData>('presentations', prospectId);
}

// ============================================================================
// COMPOSITE HOOK - FETCH ALL DATA AT ONCE
// ============================================================================

export interface DashboardData {
  factfinder: FactfinderData | null;
  monteCarlo: MonteCarloData | null;
  insuranceSplit: InsuranceSplitData | null;
  compliance: ComplianceData | null;
  savings: SavingsScenarioData | null;
  marketing: SniperMarketingData | null;
  presentation: PresentationData | null;
}

export interface DashboardHookResult {
  data: DashboardData;
  loading: boolean;
  error: Error | null;
  allLoaded: boolean;
}

/**
 * Fetches all dashboard data for a prospect
 * Useful for Builder.io dashboard pages
 */
export function useDashboardData(prospectId: string | null): DashboardHookResult {
  const factfinder = useFactfinder(prospectId);
  const monteCarlo = useMonteCarlo(prospectId);
  const insuranceSplit = useInsuranceSplit(prospectId);
  const compliance = useCompliance(prospectId);
  const savings = useSavingsScenario(prospectId);
  const marketing = useSniperMarketing(prospectId);
  const presentation = usePresentation(prospectId);

  const loading =
    factfinder.loading ||
    monteCarlo.loading ||
    insuranceSplit.loading ||
    compliance.loading ||
    savings.loading ||
    marketing.loading ||
    presentation.loading;

  const error =
    factfinder.error ||
    monteCarlo.error ||
    insuranceSplit.error ||
    compliance.error ||
    savings.error ||
    marketing.error ||
    presentation.error;

  const allLoaded =
    factfinder.exists &&
    monteCarlo.exists &&
    insuranceSplit.exists &&
    compliance.exists &&
    savings.exists;

  return {
    data: {
      factfinder: factfinder.data,
      monteCarlo: monteCarlo.data,
      insuranceSplit: insuranceSplit.data,
      compliance: compliance.data,
      savings: savings.data,
      marketing: marketing.data,
      presentation: presentation.data,
    },
    loading,
    error,
    allLoaded,
  };
}

// ============================================================================
// WRITE HOOKS (WITH VALIDATION)
// ============================================================================

/**
 * Hook for saving Factfinder data with validation
 */
export function useSaveFactfinder() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveFactfinder = async (prospectId: string, data: Partial<FactfinderData>) => {
    setSaving(true);
    setError(null);

    try {
      // Import validation on-demand to avoid circular dependencies
      const { validateFactfinder } = await import('../schemas/firestore');

      // Add metadata
      const fullData = {
        ...data,
        prospect_id: prospectId,
        timestamp: Date.now(),
      };

      // Validate before saving
      const validated = validateFactfinder(fullData);

      // Save to Firestore
      const docRef = doc(db, 'factfinder', prospectId);
      await setDoc(docRef, validated, { merge: true });

      setSaving(false);
      return { success: true };
    } catch (err) {
      console.error('Error saving factfinder:', err);
      setError(err as Error);
      setSaving(false);
      return { success: false, error: err };
    }
  };

  return { saveFactfinder, saving, error };
}

/**
 * Hook for saving Sniper Marketing data with validation
 */
export function useSaveSniperMarketing() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const saveMarketing = async (prospectId: string, data: Partial<SniperMarketingData>) => {
    setSaving(true);
    setError(null);

    try {
      const { validateSniperMarketing } = await import('../schemas/firestore');

      const fullData = {
        ...data,
        prospect_id: prospectId,
        timestamp: Date.now(),
      };

      const validated = validateSniperMarketing(fullData);

      const docRef = doc(db, 'sniper_marketing', prospectId);
      await setDoc(docRef, validated, { merge: true });

      setSaving(false);
      return { success: true };
    } catch (err) {
      console.error('Error saving sniper marketing:', err);
      setError(err as Error);
      setSaving(false);
      return { success: false, error: err };
    }
  };

  return { saveMarketing, saving, error };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if prospect data is fully processed
 */
export function useProspectReady(prospectId: string | null): boolean {
  const { allLoaded } = useDashboardData(prospectId);
  return allLoaded;
}

/**
 * Hook to get prospect processing status
 */
export interface ProcessingStatus {
  factfinderComplete: boolean;
  calculationsComplete: boolean;
  readyForDashboard: boolean;
  readyForPdf: boolean;
}

export function useProcessingStatus(prospectId: string | null): ProcessingStatus {
  const factfinder = useFactfinder(prospectId);
  const monteCarlo = useMonteCarlo(prospectId);
  const insuranceSplit = useInsuranceSplit(prospectId);
  const compliance = useCompliance(prospectId);
  const savings = useSavingsScenario(prospectId);

  return {
    factfinderComplete: factfinder.exists && factfinder.data?.validated === true,
    calculationsComplete:
      monteCarlo.exists && insuranceSplit.exists && compliance.exists && savings.exists,
    readyForDashboard: factfinder.exists && monteCarlo.exists,
    readyForPdf:
      factfinder.exists &&
      monteCarlo.exists &&
      insuranceSplit.exists &&
      compliance.exists &&
      savings.exists,
  };
}
