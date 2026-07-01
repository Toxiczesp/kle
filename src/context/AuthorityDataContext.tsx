import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AuthorityDossierEvaluation,
  AuthorityEvaluation,
  AuthorityObservationQuestionnaire,
  AuthorityPublishedProfile,
  AuthorityRequest,
  AuthoritySharedDocument,
} from '../types';
import { apiRequest, putJson } from '../lib/apiClient';
import { useAuth } from './AuthContext';

interface AuthorityDataPayload {
  requests: AuthorityRequest[];
  evaluations: AuthorityEvaluation[];
  publishedProfiles: AuthorityPublishedProfile[];
  sharedDocuments: AuthoritySharedDocument[];
  dossierEvaluations: AuthorityDossierEvaluation[];
  observationQuestionnaires: AuthorityObservationQuestionnaire[];
}

interface AuthorityDataContextValue extends AuthorityDataPayload {
  isLoaded: boolean;
  refresh: () => Promise<void>;
  saveRequests: (items: AuthorityRequest[]) => Promise<void>;
  saveEvaluations: (items: AuthorityEvaluation[]) => Promise<void>;
  savePublishedProfiles: (items: AuthorityPublishedProfile[]) => Promise<void>;
  saveSharedDocuments: (items: AuthoritySharedDocument[]) => Promise<void>;
  saveDossierEvaluations: (items: AuthorityDossierEvaluation[]) => Promise<void>;
  saveObservationQuestionnaires: (items: AuthorityObservationQuestionnaire[]) => Promise<void>;
}

const emptyPayload: AuthorityDataPayload = {
  requests: [],
  evaluations: [],
  publishedProfiles: [],
  sharedDocuments: [],
  dossierEvaluations: [],
  observationQuestionnaires: [],
};

const AuthorityDataContext = createContext<AuthorityDataContextValue | undefined>(undefined);

export function AuthorityDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<AuthorityDataPayload>(emptyPayload);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = async () => {
    if (!isAuthenticated) {
      setData(emptyPayload);
      setIsLoaded(true);
      return;
    }

    const nextData = await apiRequest<AuthorityDataPayload>('/api/authority-data');
    setData(nextData);
    setIsLoaded(true);
  };

  useEffect(() => {
    setIsLoaded(false);
    void refresh();
  }, [isAuthenticated]);

  const saveSection = async <T,>(section: string, items: T[]) => {
    const result = await putJson<{ ok: true; items: T[] }>(`/api/authority-data/${section}`, { items });
    setData((prev) => ({ ...prev, [section]: result.items }));
  };

  const value = useMemo<AuthorityDataContextValue>(() => ({
    ...data,
    isLoaded,
    refresh,
    saveRequests: (items) => saveSection('requests', items),
    saveEvaluations: (items) => saveSection('evaluations', items),
    savePublishedProfiles: (items) => saveSection('publishedProfiles', items),
    saveSharedDocuments: (items) => saveSection('sharedDocuments', items),
    saveDossierEvaluations: (items) => saveSection('dossierEvaluations', items),
    saveObservationQuestionnaires: (items) => saveSection('observationQuestionnaires', items),
  }), [data, isLoaded]);

  return <AuthorityDataContext.Provider value={value}>{children}</AuthorityDataContext.Provider>;
}

export function useAuthorityData() {
  const context = useContext(AuthorityDataContext);
  if (!context) {
    throw new Error('useAuthorityData debe usarse dentro de AuthorityDataProvider');
  }

  return context;
}
