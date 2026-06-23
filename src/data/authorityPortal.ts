import { mockInteractions } from './interactions';
import type {
  AuthorityEvaluation,
  AuthorityRequest,
  AuthorityRequestStatus,
  AuthorityRequestType,
  InteractionRating,
  Objective,
  PriorityLevel,
} from '../types';

export const AUTHORITY_REQUESTS_KEY = 'kle-authority-requests';
export const AUTHORITY_EVALUATIONS_KEY = 'kle-authority-evaluations';

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
  1: 'Muy negativa',
  2: 'Negativa',
  3: 'Neutral',
  4: 'Positiva',
  5: 'Muy positiva',
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
    plannedObjective: 'Consolidar la invitacion oficial a una visita tecnica y medir receptividad a cooperacion bilateral.',
    actualResult: 'Alta receptividad. Acepta explorar una visita y solicita informacion tecnica adicional.',
    rating: 4,
    observations: 'Buena sintonia personal. Conviene mantener seguimiento trimestral y reforzar el componente cultural.',
    createdAt: '2026-05-15T19:10:00Z',
  },
  {
    id: 'eval-002',
    objectiveId: 'obj-005',
    date: '2026-06-01',
    location: 'Camara de Comercio de Madrid',
    plannedObjective: 'Explorar oportunidades de inversion y evaluar predisposicion a una agenda economica de largo plazo.',
    actualResult: 'Interes concreto en energias renovables y desarrollo portuario. Solicita dossier adicional.',
    rating: 5,
    observations: 'Conviene coordinar con ICEX y preparar siguiente contacto con enfoque muy ejecutivo.',
    createdAt: '2026-06-01T13:30:00Z',
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
