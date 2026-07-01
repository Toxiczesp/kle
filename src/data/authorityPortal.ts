import { mockInteractions } from './interactions';
import type {
  AuthorityRequestStatus,
  AuthorityRequestType,
  InteractionRating,
  Objective,
  PriorityLevel,
} from '../types';

export const authorityRequestTypeLabels: Record<AuthorityRequestType, string> = {
  'new-report': 'Nuevo informe',
  'report-update': 'Actualización de informe existente',
  'sociocultural-update': 'Actualización sociocultural',
  'behavior-update': 'Actualización de comportamiento',
  'full-dossier': 'Dosier completo',
};

export const authorityRequestStatusLabels: Record<AuthorityRequestStatus, string> = {
  pending: 'Pendiente',
  drafting: 'En elaboración',
  review: 'En revisión',
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
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

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
    return 'Seleccione una autoridad para que la IA pueda cruzar informes, interacciones y valoraciones disponibles.';
  }

  if (normalized.includes('interes')) {
    return `Los intereses principales de ${objective.fullName} combinan el plano profesional y el relacional. ${executiveSummary ?? ''} ${socioculturalInterests ?? ''}`.trim();
  }

  if (normalized.includes('riesgo')) {
    return `Riesgos a vigilar para una próxima interacción con ${objective.fullName}: ${recommendations ?? personalityProfile ?? 'Conviene mantener un enfoque gradual, protocolario y basado en resultados verificables.'}`;
  }

  if (
    normalized.includes('reunion') ||
    normalized.includes('últimas') ||
    normalized.includes('ultimas') ||
    normalized.includes('hablado')
  ) {
    return interactionsSummary.length > 0
      ? `En las últimas interacciones con ${objective.fullName} se ha tratado lo siguiente: ${interactionsSummary.join(' ')}`
      : `No hay interacciones recientes registradas para ${objective.fullName}.`;
  }

  if (
    normalized.includes('resume') ||
    normalized.includes('resumen') ||
    normalized.includes('toda la información') ||
    normalized.includes('toda la informacion')
  ) {
    return `Resumen operativo sobre ${objective.fullName}: ${executiveSummary ?? objective.biography} ${recommendations ?? ''}`.trim();
  }

  if (
    normalized.includes('evolución') ||
    normalized.includes('evolucion') ||
    normalized.includes('relación') ||
    normalized.includes('relacion')
  ) {
    return interactionsSummary.length > 1
      ? `La relación con ${objective.fullName} muestra una evolución progresiva. ${interactionsSummary.join(' ')} ${recommendations ?? ''}`.trim()
      : `La relación con ${objective.fullName} aún dispone de pocas interacciones registradas. Conviene consolidar más historial antes de extraer una tendencia robusta.`;
  }

  return `Con la información disponible sobre ${objective.fullName}, la recomendación general es esta: ${recommendations ?? executiveSummary ?? objective.biography}`;
}
