import { mockInteractions } from './interactions';
import type {
  AuthorityDossierEvaluation,
  AuthorityEvaluation,
  AuthorityObservationQuestionnaire,
  AuthorityPublishedProfile,
  AuthorityRequest,
  AuthorityRequestStatus,
  AuthorityRequestType,
  AuthoritySharedDocument,
  InteractionRating,
  Objective,
  PriorityLevel,
} from '../types';

export const AUTHORITY_REQUESTS_KEY = 'kle-authority-requests';
export const AUTHORITY_EVALUATIONS_KEY = 'kle-authority-evaluations';
export const AUTHORITY_PUBLISHED_PROFILES_KEY = 'kle-authority-published-profiles';
export const AUTHORITY_SHARED_DOCUMENTS_KEY = 'kle-authority-shared-documents';
export const AUTHORITY_DOSSIER_EVALUATIONS_KEY = 'kle-authority-dossier-evaluations';
export const AUTHORITY_OBSERVATION_QUESTIONNAIRES_KEY = 'kle-authority-observation-questionnaires';

export const authorityRequestTypeLabels: Record<AuthorityRequestType, string> = {
  'new-report': 'Nuevo informe',
  'report-update': 'Actualizacion de informe existente',
  'sociocultural-update': 'Actualizacion sociocultural',
  'behavior-update': 'Actualizacion de comportamiento',
  'full-dossier': 'Dossier completo',
};

export const authorityRequestStatusLabels: Record<AuthorityRequestStatus, string> = {
  pending: 'Pendiente',
  drafting: 'En elaboracion',
  review: 'En revision',
  done: 'Finalizado',
};

export const ratingLabels: Record<InteractionRating, string> = {
  1: '1/10',
  2: '2/10',
  3: '3/10',
  4: '4/10',
  5: '5/10',
  6: '6/10',
  7: '7/10',
  8: '8/10',
  9: '9/10',
  10: '10/10',
};

export const priorityLabels: Record<PriorityLevel, string> = {
  critical: 'Critica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const initialRequests: AuthorityRequest[] = [
  {
    id: 'req-001',
    title: 'Actualizacion de comportamiento de Ahmed Al-Rashidi',
    description: 'Revisar cambios observados tras las dos ultimas reuniones y actualizar riesgos de comunicacion.',
    objectiveId: 'obj-001',
    priority: 'high',
    dueDate: '2026-07-05',
    type: 'behavior-update',
    status: 'review',
    createdAt: '2026-06-14T08:00:00Z',
    updatedAt: '2026-06-15T10:30:00Z',
    analystName: 'Analista Demo',
    analystResponse: 'Se ha revisado el perfil conductual y se han actualizado los riesgos de comunicacion pendientes de validacion final.',
  },
  {
    id: 'req-002',
    title: 'Dossier completo de Ibrahim Diouf',
    description: 'Necesitamos una vision integral previa a la proxima visita tecnica programada.',
    objectiveId: 'obj-003',
    priority: 'critical',
    dueDate: '2026-06-30',
    type: 'full-dossier',
    status: 'drafting',
    createdAt: '2026-06-18T10:30:00Z',
    updatedAt: '2026-06-21T09:00:00Z',
    analystName: 'Analista Demo',
    analystResponse: 'Dossier en elaboracion con foco en contexto relacional, intereses y ultimas interacciones.',
  },
  {
    id: 'req-003',
    title: 'Actualizacion sociocultural de Fatima Benkhouya',
    description: 'Incluir nuevos contactos institucionales y recomendaciones protocolarias para foro multilateral.',
    objectiveId: 'obj-002',
    priority: 'medium',
    dueDate: '2026-07-12',
    type: 'sociocultural-update',
    status: 'pending',
    createdAt: '2026-06-20T09:15:00Z',
  },
];

const initialEvaluations: AuthorityEvaluation[] = [
  {
    id: 'eval-001',
    objectiveId: 'obj-001',
    date: '2026-05-15',
    location: 'Embajada de Espana en Maravia',
    strategyFit: 8,
    trustAndCommunication: 8,
    objectiveProgress: 7,
    objectionHandling: 7,
    nextStepsClarity: 8,
    difficulties: 'La principal barrera fue el tiempo limitado disponible durante la reunion.',
    opportunities: 'Alta receptividad a una visita tecnica y buena disposicion a cooperacion bilateral.',
    futureChanges: 'Preparar con mayor antelacion documentacion tecnica resumida y reforzar seguimiento previo.',
    otherRelevantAspects: 'Buena sintonia personal y conveniencia de mantener seguimiento trimestral.',
    createdAt: '2026-05-15T19:10:00Z',
  },
  {
    id: 'eval-002',
    objectiveId: 'obj-005',
    date: '2026-06-01',
    location: 'Camara de Comercio de Madrid',
    strategyFit: 9,
    trustAndCommunication: 9,
    objectiveProgress: 8,
    objectionHandling: 8,
    nextStepsClarity: 9,
    difficulties: 'No surgieron resistencias relevantes, aunque hubo que concretar mejor el alcance temporal.',
    opportunities: 'Interes claro en energias renovables y desarrollo portuario; oportunidad de seguimiento economico.',
    futureChanges: 'Llevar propuestas aun mas ejecutivas y coordinadas con actores economicos institucionales.',
    otherRelevantAspects: 'Solicita dossier adicional y conviene coordinar con ICEX.',
    createdAt: '2026-06-01T13:30:00Z',
  },
];

const initialDossierEvaluations: AuthorityDossierEvaluation[] = [
  {
    id: 'dossier-eval-001',
    objectiveId: 'obj-001',
    date: '2026-05-14',
    profileUsefulness: 9,
    structureClarity: 8,
    psychologicalAdvantage: 8,
    biographyDepth: 7,
    behaviorGuidance: 8,
    conversationTopics: 9,
    socioculturalFramework: 8,
    geopoliticalAccuracy: 7,
    precisionAndReliability: 8,
    detailLevel: 8,
    additionalInformationNeeded: 'Habria sido util contar con escenarios de reaccion probables ante objeciones tecnicas y una guia de prioridades de cierre.',
    contentChanges: 'Reduciria algo la parte descriptiva inicial y pondria antes los mensajes clave, riesgos y recomendaciones accionables.',
    otherRelevantAspects: 'El dosier fue especialmente util para preparar la aproximacion y orientar bien el tono del encuentro.',
    globalContribution: 'Buena',
    createdAt: '2026-05-16T08:15:00Z',
  },
];

const initialObservationQuestionnaires: AuthorityObservationQuestionnaire[] = [
  {
    id: 'obs-001',
    objectiveId: 'obj-001',
    date: '2026-05-15',
    context: 'Reunion bilateral en entorno protocolario con presencia de dos asesores tecnicos.',
    positiveIndicators: 'Actitud abierta, escucha activa y buena disposicion a continuar el contacto tecnico.',
    alertIndicators: 'Sensibilidad ante cuestiones de plazos y necesidad de concretar mejor los retornos esperados.',
    recommendations: 'Mantener enfoque directo, documentacion muy sintetica y cierre con siguientes pasos definidos.',
    createdAt: '2026-05-15T18:40:00Z',
    observerName: 'Cnel. Ruiz',
    observerRankRole: 'Agregado de Defensa, Ejercito de Tierra',
    startTimeDuration: '10:00 - 11:30 (90 min)',
    cityLocation: 'Embajada de Espana, Maravia',
    interactionReason: 'Reunion Bilateral de Seguimiento',
    interactionLanguage: 'Español',
    targetOtherLanguages: 'Ingles (Alto), Frances (Medio)',
    usedInterpreters: 'no',
    companions: [
      { name: 'Tte. Coronel Martinez', rankArmy: 'Jefe de Seccion, Ejercito del Aire' }
    ],
    previousInteractions: [
      { date: '2026-03-12', location: 'Ministerio de Defensa', reason: 'Presentacion de credenciales' }
    ],
    qGeneral: [
      'Persona muy expresiva y abierta, mantiene contacto fisico natural.',
      'Habla pausada y clara, tono medio. Gesticula moderadamente al enfatizar puntos clave.',
      'Se rige principalmente por la planificacion y la razon, muy estructurado.',
      'Si, complexion atletica.',
      'No se percibio ninguna dificultad fisica.',
      'Uniforme de gala impecable, limpio y ordenado.',
      'Traje formal en reuniones no oficiales.',
      'No tomo notas el mismo; delego en sus asesores.'
    ],
    qInteraction: [
      'Trato muy cordial y respetuoso, pero exigente en los detalles tecnicos.',
      'Saludo formal con mano tendida, firme y prolongado. Trato similar a toda la comitiva.',
      'Persona muy culta. Hablo de geopolitica regional, historia local y aficiones deportivas.',
      'Mostro gusto por la comida local tradicional, prefiere platos especiados.',
      'Aficionado a la equitacion y lectura historica militar.',
      'Relacion formal y respetuosa con su conyuge; trato profesional con otras mujeres.',
      'Menciono de forma anecdotica su paso por la academia militar en España.',
      'Muestra gran respeto por las tradiciones españolas y conoce bien el idioma.'
    ],
    qTeam: [
      'Trato correcto y jerarquico pero cercano. Se dirigio por su empleo al Capitan Lopez.',
      'Mayor afinidad con el Tte. Coronel Benitez (asesor juridico). Menor interaccion con el secretario.',
      'Complicidad tecnica alta en la validacion de plazos con su asesor economico.',
      'El Tte. Coronel Benitez actua como lider de staff en su ausencia.',
      'Equipo muy cohesionado y de alta preparacion profesional.'
    ],
    qPersonality: [
      true, false, true, true, false, false, false, false, false, false,
      false, false, false, false, true, false, true, false, false, true,
      false, false, true, true, false, false, true, false, true, false
    ],
    qBehaviors: [
      true, false, true, true, false, false, false, false, false, true,
      false, false, false, false, false, false, false, false, false, false,
      false, false, false, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false, false, false,
      false, false, false, false, false, false
    ]
  },
];

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function readAuthorityRequests() {
  if (!canUseStorage()) return initialRequests;

  const raw = window.localStorage.getItem(AUTHORITY_REQUESTS_KEY);
  if (!raw) {
    window.localStorage.setItem(AUTHORITY_REQUESTS_KEY, JSON.stringify(initialRequests));
    return initialRequests;
  }

  try {
    const parsed = JSON.parse(raw) as AuthorityRequest[];
    return parsed.length > 0 ? parsed : initialRequests;
  } catch {
    window.localStorage.setItem(AUTHORITY_REQUESTS_KEY, JSON.stringify(initialRequests));
    return initialRequests;
  }
}

export function writeAuthorityRequests(requests: AuthorityRequest[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTHORITY_REQUESTS_KEY, JSON.stringify(requests));
}

export function readAuthorityEvaluations() {
  if (!canUseStorage()) return initialEvaluations;

  const raw = window.localStorage.getItem(AUTHORITY_EVALUATIONS_KEY);
  if (!raw) {
    window.localStorage.setItem(AUTHORITY_EVALUATIONS_KEY, JSON.stringify(initialEvaluations));
    return initialEvaluations;
  }

  try {
    const parsed = JSON.parse(raw) as AuthorityEvaluation[];
    return parsed.length > 0 ? parsed : initialEvaluations;
  } catch {
    window.localStorage.setItem(AUTHORITY_EVALUATIONS_KEY, JSON.stringify(initialEvaluations));
    return initialEvaluations;
  }
}

export function writeAuthorityEvaluations(evaluations: AuthorityEvaluation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTHORITY_EVALUATIONS_KEY, JSON.stringify(evaluations));
}

export function readAuthorityPublishedProfiles() {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(AUTHORITY_PUBLISHED_PROFILES_KEY);
  if (!raw) {
    window.localStorage.setItem(AUTHORITY_PUBLISHED_PROFILES_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AuthorityPublishedProfile[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.setItem(AUTHORITY_PUBLISHED_PROFILES_KEY, JSON.stringify([]));
    return [];
  }
}

export function writeAuthorityPublishedProfiles(profiles: AuthorityPublishedProfile[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTHORITY_PUBLISHED_PROFILES_KEY, JSON.stringify(profiles));
}

export function readAuthoritySharedDocuments() {
  if (!canUseStorage()) return [];

  const raw = window.localStorage.getItem(AUTHORITY_SHARED_DOCUMENTS_KEY);
  if (!raw) {
    window.localStorage.setItem(AUTHORITY_SHARED_DOCUMENTS_KEY, JSON.stringify([]));
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AuthoritySharedDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.localStorage.setItem(AUTHORITY_SHARED_DOCUMENTS_KEY, JSON.stringify([]));
    return [];
  }
}

export function writeAuthoritySharedDocuments(documents: AuthoritySharedDocument[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTHORITY_SHARED_DOCUMENTS_KEY, JSON.stringify(documents));
}

export function getSharedDocumentsForObjective(objectiveId: string) {
  return readAuthoritySharedDocuments()
    .filter((document) => document.objectiveId === objectiveId)
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export function readAuthorityDossierEvaluations() {
  if (!canUseStorage()) return initialDossierEvaluations;

  const raw = window.localStorage.getItem(AUTHORITY_DOSSIER_EVALUATIONS_KEY);
  if (!raw) {
    window.localStorage.setItem(
      AUTHORITY_DOSSIER_EVALUATIONS_KEY,
      JSON.stringify(initialDossierEvaluations)
    );
    return initialDossierEvaluations;
  }

  try {
    const parsed = JSON.parse(raw) as AuthorityDossierEvaluation[];
    return parsed.length > 0 ? parsed : initialDossierEvaluations;
  } catch {
    window.localStorage.setItem(
      AUTHORITY_DOSSIER_EVALUATIONS_KEY,
      JSON.stringify(initialDossierEvaluations)
    );
    return initialDossierEvaluations;
  }
}

export function writeAuthorityDossierEvaluations(evaluations: AuthorityDossierEvaluation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    AUTHORITY_DOSSIER_EVALUATIONS_KEY,
    JSON.stringify(evaluations)
  );
}

export function readAuthorityObservationQuestionnaires() {
  if (!canUseStorage()) return initialObservationQuestionnaires;

  const raw = window.localStorage.getItem(AUTHORITY_OBSERVATION_QUESTIONNAIRES_KEY);
  if (!raw) {
    window.localStorage.setItem(
      AUTHORITY_OBSERVATION_QUESTIONNAIRES_KEY,
      JSON.stringify(initialObservationQuestionnaires)
    );
    return initialObservationQuestionnaires;
  }

  try {
    const parsed = JSON.parse(raw) as AuthorityObservationQuestionnaire[];
    return parsed.length > 0 ? parsed : initialObservationQuestionnaires;
  } catch {
    window.localStorage.setItem(
      AUTHORITY_OBSERVATION_QUESTIONNAIRES_KEY,
      JSON.stringify(initialObservationQuestionnaires)
    );
    return initialObservationQuestionnaires;
  }
}

export function writeAuthorityObservationQuestionnaires(
  questionnaires: AuthorityObservationQuestionnaire[]
) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    AUTHORITY_OBSERVATION_QUESTIONNAIRES_KEY,
    JSON.stringify(questionnaires)
  );
}

export function getPublishedProfileForObjective(objectiveId: string) {
  return readAuthorityPublishedProfiles().find((profile) => profile.objectiveId === objectiveId);
}

export function getLastInteractionForObjective(objectiveId: string) {
  return [...mockInteractions]
    .filter((interaction) => interaction.objectiveId === objectiveId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
}

export function getAuthorityCountries(objectives: Objective[]) {
  return Array.from(new Set(objectives.map((objective) => objective.country))).sort();
}

export function buildAuthorityAiAnswer(params: {
  question: string;
  objective?: Objective;
  executiveSummary?: string;
  personalityProfile?: string;
  socioculturalInterests?: string;
  recommendations?: string;
  interactionsSummary: string[];
}) {
  const {
    question,
    objective,
    executiveSummary,
    personalityProfile,
    socioculturalInterests,
    recommendations,
    interactionsSummary,
  } = params;

  const normalized = question.toLowerCase();

  if (!objective) {
    return 'Selecciona una autoridad para que la IA pueda cruzar informes, interacciones y valoraciones disponibles.';
  }

  if (normalized.includes('interes')) {
    return `Los intereses principales de ${objective.fullName} combinan el plano profesional y el relacional. ${executiveSummary ?? ''} ${socioculturalInterests ?? ''}`.trim();
  }

  if (normalized.includes('riesgo')) {
    return `Riesgos a vigilar para una proxima interaccion con ${objective.fullName}: ${recommendations ?? personalityProfile ?? 'Conviene mantener un enfoque gradual, protocolario y basado en resultados verificables.'}`;
  }

  if (normalized.includes('reunion') || normalized.includes('ultimas') || normalized.includes('hablado')) {
    return interactionsSummary.length > 0
      ? `En las ultimas interacciones con ${objective.fullName} se ha tratado lo siguiente: ${interactionsSummary.join(' ')}`
      : `No hay interacciones recientes registradas para ${objective.fullName}.`;
  }

  if (normalized.includes('resume') || normalized.includes('resumen') || normalized.includes('toda la informacion')) {
    return `Resumen operativo sobre ${objective.fullName}: ${executiveSummary ?? objective.biography} ${recommendations ?? ''}`.trim();
  }

  if (normalized.includes('evolucion') || normalized.includes('relacion')) {
    return interactionsSummary.length > 1
      ? `La relacion con ${objective.fullName} muestra una evolucion progresiva. ${interactionsSummary.join(' ')} ${recommendations ?? ''}`.trim()
      : `La relacion con ${objective.fullName} aun dispone de pocas interacciones registradas. Conviene consolidar mas historial antes de extraer una tendencia robusta.`;
  }

  return `Con la informacion disponible sobre ${objective.fullName}, la recomendacion general es esta: ${recommendations ?? executiveSummary ?? objective.biography}`;
}
