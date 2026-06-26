import { useEffect, useState } from 'react';
import {
  readAuthorityDossierEvaluations,
  readAuthorityEvaluations,
  readAuthorityObservationQuestionnaires,
  writeAuthorityDossierEvaluations,
  writeAuthorityEvaluations,
  writeAuthorityObservationQuestionnaires,
} from '../data/authorityPortal';
import { useObjectives } from '../context/ObjectivesContext';
import type {
  AuthorityDossierEvaluation,
  AuthorityEvaluation,
  AuthorityObservationQuestionnaire,
  InteractionRating,
} from '../types';

const likertQuestions = [
  {
    key: 'strategyFit',
    label: '1.1 La estrategia empleada durante la interaccion fue adecuada para las circunstancias y el perfil del interlocutor.',
  },
  {
    key: 'trustAndCommunication',
    label: '1.2 Se logro establecer un clima de confianza y comunicacion efectiva con la otra persona.',
  },
  {
    key: 'objectiveProgress',
    label: '1.3 La interaccion permitio avanzar hacia los objetivos previamente establecidos.',
  },
  {
    key: 'objectionHandling',
    label: '1.4 Durante la interaccion se gestionaron de forma adecuada las objeciones, desacuerdos o resistencias que surgieron.',
  },
  {
    key: 'nextStepsClarity',
    label: '1.5 Al finalizar la interaccion, se establecieron pasos concretos o compromisos que facilitan la consecucion de los objetivos.',
  },
] as const;

const dossierQuestions = [
  { key: 'overallScore', label: 'Valoracion global del dosier KLE.' },
  { key: 'clarityScore', label: 'Claridad y facilidad de lectura del dosier.' },
  { key: 'usefulnessScore', label: 'Utilidad operativa para preparar la interaccion.' },
  { key: 'targetFitScore', label: 'Adecuacion del contenido al objetivo y perfil de la autoridad.' },
] as const;

const evaluationSections = [
  {
    id: 'dossier',
    title: 'Valoracion del dosier KLE',
    description: 'Recoge feedback sobre utilidad, claridad y adecuacion de los dosieres recibidos.',
  },
  {
    id: 'interaction',
    title: 'Valoracion de la interaccion',
    description: 'Evalua la reunion realizada y registra aprendizajes para siguientes contactos.',
  },
  {
    id: 'observation',
    title: 'Cuestionario de observacion',
    description: 'Anota indicadores observados, alertas y recomendaciones para futuras interacciones.',
  },
] as const;

type EvaluationSection = (typeof evaluationSections)[number]['id'];

const personalityQuestions = [
  "1. ¿Considera usted que se trata de una persona que se pare a pensar las cosas antes de hacerlas?",
  "2. ¿Infiere usted que su estado de ánimo pudiera sufrir altibajos con frecuencia?",
  "3. ¿Considera usted que es una persona habladora?",
  "4. ¿Estima usted que se trate de una persona más bien animada o vital?",
  "5. ¿Observa usted que sea una persona irritable?",
  "6. ¿Cree usted que le importe poco lo que piensen los demás en general?",
  "7. ¿Infiere usted que pudiera tender a mantenerse apartado en situaciones sociales?",
  "8. ¿Considera usted que los límites entre lo que está bien y lo que está mal los tuviera menos claros que la mayoría de la gente?",
  "9. ¿Observa usted que tendiera a actuar como quiere sin seguir las normas sociales?",
  "10. ¿Estima que pudiera tener a menudo sentimientos de culpa?",
  "11. ¿Observa usted que sea una persona nerviosa?",
  "12. ¿Estima usted que sus deseos personales estuvieran por encima de las normas sociales?",
  "13. En general, ¿observa usted que suela estar callado cuando está con otras personas?",
  "14. ¿Considera usted que la mayoría de las cosas le resultan indiferentes?",
  "15. ¿Observa usted que le guste mezclarse con la gente?",
  "16. ¿Estima que con frecuencia tome decisiones sin pararse a reflexionar?",
  "17. ¿Considera usted que le guste el bullicio y la agitación de su alrededor?",
  "18. ¿Considera que es una persona que pudiera preocuparse a menudo por cosas que no debería haber dicho o hecho?",
  "19. ¿Observa usted que se sienta fácilmente herido en sus sentimientos?",
  "20. ¿Infiere usted que tenga muchos amigos?",
  "21. ¿Infiere usted que fuera más indulgente que la mayoría de las personas acerca del bien y del mal?",
  "22. ¿Observa usted que se sienta intranquilo por su salud?",
  "23. ¿Considera usted que se preocupe si hay errores en su trabajo?",
  "24. ¿Considera usted que casi siempre tenga una respuesta a punto cuando le hablan?",
  "25. ¿Infiere usted que le guste hacer cosas en las que tiene que actuar rápidamente?",
  "26. ¿Considera usted que le pudiera preocupar mucho su aspecto?",
  "27. ¿Observa usted que trate de no ser grosero con la gente?",
  "28. Después de una experiencia embarazosa, ¿considera usted que se encontraría preocupado durante mucho tiempo?",
  "29. ¿Observa usted que frecuentemente improvise decisiones en función de la situación?",
  "30. ¿Considera usted que cuando tuviera mal humor le costaría controlarse?"
];

const behaviorQuestions = [
  "1. ¿Gesticula?",
  "2. ¿Se mueve mucho?",
  "3. ¿Sonríe?",
  "4. ¿Mantiene la mirada?",
  "5. ¿Tono voz elevado?",
  "6. ¿Ropa llamativa?",
  "7. ¿Viajero? ¿Deportista?",
  "8. ¿Interrumpe?",
  "9. ¿Habla rápido?",
  "10. ¿Habla mucho?",
  "11. ¿Habla alto?",
  "12. ¿Es dominante al hablar?",
  "13. ¿Impone su punto de vista?",
  "14. ¿Se muerde las uñas?",
  "15. ¿Fuma?",
  "16. ¿Se rasca? ¿Suda? ¿Se sonroja?",
  "17. ¿Mira hacia todos los lados; desconfianza?",
  "18. ¿Impaciente, inquieto, irritable?",
  "19. ¿Toquetea cosas del ambiente?",
  "20. ¿Supersticioso? (amuletos)",
  "21. ¿Llanto?",
  "22. ¿Tartamudea?",
  "23. ¿Vuelve sobre el mismo tema insistentemente?",
  "24. ¿Se culpabiliza?",
  "25. ¿Se advierten miedos e inseguridades? ¿Expresa temores? ¿Repite: \"y si, y si\"?",
  "26. \"Yo primero, y luego los demás\"",
  "27. ¿Solitario?",
  "28. ¿Mirada desafiante / fija? ¿Sanpaku?",
  "29. ¿Frialdad? ¿Huraño? ¿Antipático?",
  "30. ¿Agresivo, frustrado, irritable?",
  "31. ¿Expresa preocupación por familiares / por alguien?",
  "32. ¿Trata de manipular o de seducir? ¿Busca su propio beneficio más que el de otros?",
  "33. ¿Egoísta? ¿Insolidario? ¿Quejoso? ¿Cizañero?",
  "34. ¿Desafiante? ¿Autoritario? ¿Presume?",
  "35. ¿No expresa sentimientos abiertamente?",
  "36. ¿Culpabiliza a otros? ¿Daña a otros?",
  "37. ¿Hiere los sentimientos de los demás?",
  "38. ¿Impulsivo? ¿Temerario?",
  "39. ¿Desorganizado? ¿Sucio? ¿Desaliñado? ¿Desordenado?",
  "40. ¿Se salta normas? ¿Le importa crear líos? ¿Laxo en el bien / mal?",
  "41. ¿Impuntual?",
  "42. ¿Despreocupado por su trabajo / estudios?",
  "43. ¿Chapucero? ¿No se esfuerza? ¿Vago? ¿Perezoso?",
  "44. ¿No se equivoca nunca?",
  "45. ¿Miente con con descaro?",
  "46. ¿Individualista, no cooperativo?"
];

const qGeneralLabels = [
  "1. ¿Considera a la Autoridad Objetivo como una persona expresiva y abierta con necesidad de mantener contacto físico o por el contrario la considera una persona que se siente incómoda en actividades sociales con numerosas personas?",
  "2. ¿Cómo calificaría su forma de hablar: rápida, lenta, voz baja, muy alta, etc.? ¿Suele gesticular mucho con las manos al hablar o poco?",
  "3. ¿Diría que la Autoridad Objetivo se rige más por la planificación y razón o por la espontaneidad o impulsividad?",
  "4. ¿Diría que es una persona deportista?",
  "5. ¿Se percibía alguna dificultad para caminar, coger cosas, hablar, etc.?",
  "6. ¿Llevaba el uniforme/ropa limpio, planchado y ordenado?",
  "7. Si no es de uniforme, ¿cómo es su forma de vestir? ¿colores neutros, llamativos, aspecto descuidado, uso de joyas...?",
  "8. ¿Tomo él mismo notas durante la interacción?"
];

const qInteractionLabels = [
  "1. ¿Cómo calificaría el trato con él? (Exigente, cordial…).",
  "2. Respecto al saludo, ¿cómo lo describiría? (mano tendida, fuerte, débil, abrazo…) ¿Fue distinto al realizado a otras personas de la comitiva?",
  "3. ¿Cree que es una persona culta? ¿De qué temas solía hablar? (Política, seguridad, familia, ocio...).",
  "4. ¿Considera que era una persona a quien le gusta comer? ¿Qué tipo: picante, salado, dulce...?",
  "5. ¿Qué intereses, costumbres, supersticiones, manías, hobbies, aficiones... mostró?",
  "6. Si se produjo la ocasión, ¿cómo describiría la relación de la Autoridad Objetivo con su mujer o pareja? ¿Y con otras mujeres?",
  "7. Indique alguna anécdota, curiosidad, anormalidad que considere oportuno resaltar.",
  "8. Indique cualquier otro aspecto que considere relevante destacar de la personalidad y comportamiento de la Autoridad Objetivo."
];

const qTeamLabels = [
  "1. ¿Cómo definiría el trato en general de la Autoridad Objetivo con los miembros de su equipo? (Indique, si es posible, el nombre o empleo de algunos de ellos).",
  "2. De entre todos los miembros del equipo de la Autoridad Objetivo, ¿con cuáles tenía la Autoridad Objetivo más afinidad/relación y con cuáles menos? Si había diferencias en el trato, indique en qué sentido o forma se veían reflejadas.",
  "3. ¿Resaltaría la complicidad con alguna en especial? Indique qué comportamientos de complicidad ha observado.",
  "4. ¿Alguna de estas personas se comportaba como líder? Identifíquelo e indique aspectos destacables de su comportamiento.",
  "5. Destaque cualquier otro aspecto que considere de interés respecto a las relaciones personales de la Autoridad Objetivo con las personas de que le acompañaban."
];

function averageInteractionEvaluation(evaluation: AuthorityEvaluation) {
  const values = [
    evaluation.strategyFit,
    evaluation.trustAndCommunication,
    evaluation.objectiveProgress,
    evaluation.objectionHandling,
    evaluation.nextStepsClarity,
  ];

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function averageDossierEvaluation(evaluation: AuthorityDossierEvaluation) {
  const values = [
    evaluation.overallScore,
    evaluation.clarityScore,
    evaluation.usefulnessScore,
    evaluation.targetFitScore,
  ];

  return (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1);
}

function ScoreSlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: InteractionRating;
  onChange: (value: InteractionRating) => void;
}) {
  return (
    <div className="authority-likert-card">
      <div className="authority-likert-head">
        <label className="form-label">{label}</label>
        <span className="authority-likert-value">{value}</span>
      </div>
      <input
        className="authority-likert-range"
        type="range"
        min="1"
        max="10"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as InteractionRating)}
      />
      <div className="authority-likert-scale" aria-hidden="true">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((scaleValue) => (
          <span key={scaleValue}>{scaleValue}</span>
        ))}
      </div>
    </div>
  );
}

export default function AuthorityEvaluations() {
  const { objectives } = useObjectives();
  const [activeSection, setActiveSection] = useState<EvaluationSection>('interaction');
  const [evaluations, setEvaluations] = useState<AuthorityEvaluation[]>([]);
  const [dossierEvaluations, setDossierEvaluations] = useState<AuthorityDossierEvaluation[]>([]);
  const [observationQuestionnaires, setObservationQuestionnaires] = useState<AuthorityObservationQuestionnaire[]>([]);

  const [subTab, setSubTab] = useState<'q1' | 'q2' | 'q3'>('q1');
  const [expandedSec, setExpandedSec] = useState<'general' | 'interaction' | 'team' | null>('general');
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<AuthorityObservationQuestionnaire | null>(null);
  const [modalTab, setModalTab] = useState<'q1' | 'q2' | 'q3'>('q1');

  const [interactionForm, setInteractionForm] = useState({
    objectiveId: objectives[0]?.id ?? '',
    date: '',
    location: '',
    strategyFit: 5 as InteractionRating,
    trustAndCommunication: 5 as InteractionRating,
    objectiveProgress: 5 as InteractionRating,
    objectionHandling: 5 as InteractionRating,
    nextStepsClarity: 5 as InteractionRating,
    difficulties: '',
    opportunities: '',
    futureChanges: '',
    otherRelevantAspects: '',
  });

  const [dossierForm, setDossierForm] = useState({
    objectiveId: objectives[0]?.id ?? '',
    date: '',
    overallScore: 5 as InteractionRating,
    clarityScore: 5 as InteractionRating,
    usefulnessScore: 5 as InteractionRating,
    targetFitScore: 5 as InteractionRating,
    strengths: '',
    improvements: '',
    additionalComments: '',
  });

  const [observationForm, setObservationForm] = useState({
    objectiveId: objectives[0]?.id ?? '',
    date: '',
    context: '',
    positiveIndicators: '',
    alertIndicators: '',
    recommendations: '',
    // Cuestionario 1 Datos
    observerName: '',
    observerRankRole: '',
    startTimeDuration: '',
    cityLocation: '',
    interactionReason: '',
    interactionLanguage: '',
    targetOtherLanguages: '',
    usedInterpreters: '',
    // Companions & Previous
    companions: [] as { name: string; rankArmy: string }[],
    previousInteractions: [] as { date: string; location: string; reason: string }[],
    // Q1 descriptive arrays (8, 8, 5 entries)
    qGeneral: Array(8).fill(''),
    qInteraction: Array(8).fill(''),
    qTeam: Array(5).fill(''),
    // Q2 & Q3 SI/NO arrays (30, 46 entries)
    qPersonality: Array(30).fill(null as boolean | null),
    qBehaviors: Array(46).fill(null as boolean | null),
  });

  useEffect(() => {
    setEvaluations(readAuthorityEvaluations());
    setDossierEvaluations(readAuthorityDossierEvaluations());
    setObservationQuestionnaires(readAuthorityObservationQuestionnaires());
  }, []);

  useEffect(() => {
    if (!objectives[0]?.id) return;

    setInteractionForm((prev) => (
      prev.objectiveId ? prev : { ...prev, objectiveId: objectives[0].id }
    ));
    setDossierForm((prev) => (
      prev.objectiveId ? prev : { ...prev, objectiveId: objectives[0].id }
    ));
    setObservationForm((prev) => (
      prev.objectiveId ? prev : { ...prev, objectiveId: objectives[0].id }
    ));
  }, [objectives]);

  const handleInteractionSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const created: AuthorityEvaluation = {
      id: `eval-${Date.now()}`,
      objectiveId: interactionForm.objectiveId,
      date: interactionForm.date,
      location: interactionForm.location,
      strategyFit: interactionForm.strategyFit,
      trustAndCommunication: interactionForm.trustAndCommunication,
      objectiveProgress: interactionForm.objectiveProgress,
      objectionHandling: interactionForm.objectionHandling,
      nextStepsClarity: interactionForm.nextStepsClarity,
      difficulties: interactionForm.difficulties,
      opportunities: interactionForm.opportunities,
      futureChanges: interactionForm.futureChanges,
      otherRelevantAspects: interactionForm.otherRelevantAspects,
      createdAt: new Date().toISOString(),
    };

    const next = [created, ...evaluations];
    setEvaluations(next);
    writeAuthorityEvaluations(next);
    setInteractionForm({
      objectiveId: objectives[0]?.id ?? '',
      date: '',
      location: '',
      strategyFit: 5,
      trustAndCommunication: 5,
      objectiveProgress: 5,
      objectionHandling: 5,
      nextStepsClarity: 5,
      difficulties: '',
      opportunities: '',
      futureChanges: '',
      otherRelevantAspects: '',
    });
  };

  const handleDossierSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const created: AuthorityDossierEvaluation = {
      id: `dossier-eval-${Date.now()}`,
      objectiveId: dossierForm.objectiveId,
      date: dossierForm.date,
      overallScore: dossierForm.overallScore,
      clarityScore: dossierForm.clarityScore,
      usefulnessScore: dossierForm.usefulnessScore,
      targetFitScore: dossierForm.targetFitScore,
      strengths: dossierForm.strengths,
      improvements: dossierForm.improvements,
      additionalComments: dossierForm.additionalComments,
      createdAt: new Date().toISOString(),
    };

    const next = [created, ...dossierEvaluations];
    setDossierEvaluations(next);
    writeAuthorityDossierEvaluations(next);
    setDossierForm({
      objectiveId: objectives[0]?.id ?? '',
      date: '',
      overallScore: 5,
      clarityScore: 5,
      usefulnessScore: 5,
      targetFitScore: 5,
      strengths: '',
      improvements: '',
      additionalComments: '',
    });
  };

  const handleObservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const created: AuthorityObservationQuestionnaire = {
      id: `obs-${Date.now()}`,
      objectiveId: observationForm.objectiveId,
      date: observationForm.date,
      context: observationForm.context,
      positiveIndicators: observationForm.positiveIndicators,
      alertIndicators: observationForm.alertIndicators,
      recommendations: observationForm.recommendations,
      createdAt: new Date().toISOString(),
      observerName: observationForm.observerName,
      observerRankRole: observationForm.observerRankRole,
      startTimeDuration: observationForm.startTimeDuration,
      cityLocation: observationForm.cityLocation,
      interactionReason: observationForm.interactionReason,
      interactionLanguage: observationForm.interactionLanguage,
      targetOtherLanguages: observationForm.targetOtherLanguages,
      usedInterpreters: observationForm.usedInterpreters,
      companions: observationForm.companions,
      previousInteractions: observationForm.previousInteractions,
      qGeneral: observationForm.qGeneral,
      qInteraction: observationForm.qInteraction,
      qTeam: observationForm.qTeam,
      qPersonality: observationForm.qPersonality,
      qBehaviors: observationForm.qBehaviors,
    };

    const next = [created, ...observationQuestionnaires];
    setObservationQuestionnaires(next);
    writeAuthorityObservationQuestionnaires(next);
    setObservationForm({
      objectiveId: objectives[0]?.id ?? '',
      date: '',
      context: '',
      positiveIndicators: '',
      alertIndicators: '',
      recommendations: '',
      observerName: '',
      observerRankRole: '',
      startTimeDuration: '',
      cityLocation: '',
      interactionReason: '',
      interactionLanguage: '',
      targetOtherLanguages: '',
      usedInterpreters: '',
      companions: [],
      previousInteractions: [],
      qGeneral: Array(8).fill(''),
      qInteraction: Array(8).fill(''),
      qTeam: Array(5).fill(''),
      qPersonality: Array(30).fill(null),
      qBehaviors: Array(46).fill(null),
    });
    setSubTab('q1');
  };

  return (
    <div className="authority-shell">
      <section className="authority-panel authority-evaluations-nav-panel">
        <div className="authority-panel-header">
          <div>
            <h2>Valoraciones</h2>
            <p>Selecciona el apartado en el que quieres trabajar dentro de la cuenta de autoridad.</p>
          </div>
        </div>

        <div className="authority-evaluations-nav">
          {evaluationSections.map((section) => (
            <button
              key={section.id}
              className={`authority-evaluations-nav-card${activeSection === section.id ? ' active' : ''}`}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              <strong>{section.title}</strong>
              <span>{section.description}</span>
            </button>
          ))}
        </div>
      </section>

      {activeSection === 'interaction' && (
        <section className="authority-grid authority-grid-2">
          <form className="authority-panel" onSubmit={handleInteractionSubmit}>
            <div className="authority-panel-header">
              <div>
                <h2>Valoracion de la interaccion</h2>
                <p>Registra la evaluacion de cada reunion y deja trazabilidad para siguientes contactos.</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Autoridad</label>
                <select
                  className="form-select"
                  value={interactionForm.objectiveId}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
                >
                  {objectives.map((objective) => (
                    <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  className="form-input"
                  type="date"
                  value={interactionForm.date}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lugar</label>
              <input
                className="form-input"
                value={interactionForm.location}
                onChange={(e) => setInteractionForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Lugar de la interaccion"
                required
              />
            </div>

            <div className="authority-rich-content" style={{ marginBottom: 'var(--space-5)' }}>
              <h3>1. En relacion al KLE realizado, valore las siguientes afirmaciones en una escala del 1 al 10, donde 1 es la puntuacion mas baja y 10 es la puntuacion mas alta.</h3>
              {likertQuestions.map((question) => (
                <ScoreSlider
                  key={question.key}
                  label={question.label}
                  value={interactionForm[question.key]}
                  onChange={(value) => setInteractionForm((prev) => ({ ...prev, [question.key]: value }))}
                />
              ))}
            </div>

            <div className="authority-rich-content">
              <h3>2. De forma general, indique</h3>

              <div className="form-group">
                <label className="form-label">Que dificultades o barreras surgieron durante la interaccion?</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={interactionForm.difficulties}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, difficulties: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Que oportunidades, intereses comunes u otros indicadores ha identificado como relevantes y considera deberian ser tenidos en cuenta en futuras interacciones?</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={interactionForm.opportunities}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, opportunities: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Que cambios introduciria en futuras interacciones para aumentar las probabilidades de exito y consecucion de sus objetivos?</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={interactionForm.futureChanges}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, futureChanges: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senale cualquier otro aspecto acaecido durante la interaccion que considere deba ser tenido en cuenta en futuras interacciones.</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={interactionForm.otherRelevantAspects}
                  onChange={(e) => setInteractionForm((prev) => ({ ...prev, otherRelevantAspects: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button className="btn btn-primary" type="submit">Guardar valoracion</button>
          </form>

          <div className="authority-panel">
            <div className="authority-panel-header">
              <div>
                <h2>Historico de interacciones valoradas</h2>
                <p>Consulta el seguimiento de reuniones ya evaluadas por la autoridad.</p>
              </div>
            </div>
            <div className="authority-status-stack">
              {evaluations.map((evaluation) => {
                const objective = objectives.find((item) => item.id === evaluation.objectiveId);
                return (
                  <div key={evaluation.id} className="authority-history-card">
                    <div className="authority-request-top">
                      <strong>{objective?.fullName ?? '-'}</strong>
                      <span className="authority-status-pill">Media {averageInteractionEvaluation(evaluation)}/10</span>
                    </div>
                    <p><strong>Fecha:</strong> {evaluation.date} · <strong>Lugar:</strong> {evaluation.location}</p>
                    <p><strong>1.1 Estrategia adecuada:</strong> {evaluation.strategyFit}/10</p>
                    <p><strong>1.2 Confianza y comunicacion:</strong> {evaluation.trustAndCommunication}/10</p>
                    <p><strong>1.3 Avance hacia objetivos:</strong> {evaluation.objectiveProgress}/10</p>
                    <p><strong>1.4 Gestion de objeciones:</strong> {evaluation.objectionHandling}/10</p>
                    <p><strong>1.5 Pasos concretos:</strong> {evaluation.nextStepsClarity}/10</p>
                    <p><strong>Dificultades:</strong> {evaluation.difficulties}</p>
                    <p><strong>Oportunidades:</strong> {evaluation.opportunities}</p>
                    <p><strong>Cambios futuros:</strong> {evaluation.futureChanges}</p>
                    <p><strong>Otros aspectos:</strong> {evaluation.otherRelevantAspects}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'dossier' && (
        <section className="authority-grid authority-grid-2">
          <form className="authority-panel" onSubmit={handleDossierSubmit}>
            <div className="authority-panel-header">
              <div>
                <h2>Valoracion del dosier KLE</h2>
                <p>Evalua la calidad del dosier recibido y deja feedback util para el equipo de analisis.</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Autoridad</label>
                <select
                  className="form-select"
                  value={dossierForm.objectiveId}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
                >
                  {objectives.map((objective) => (
                    <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  className="form-input"
                  type="date"
                  value={dossierForm.date}
                  onChange={(e) => setDossierForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="authority-rich-content" style={{ marginBottom: 'var(--space-5)' }}>
              <h3>Valora el dosier en una escala del 1 al 10.</h3>
              {dossierQuestions.map((question) => (
                <ScoreSlider
                  key={question.key}
                  label={question.label}
                  value={dossierForm[question.key]}
                  onChange={(value) => setDossierForm((prev) => ({ ...prev, [question.key]: value }))}
                />
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Puntos fuertes del dosier</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={dossierForm.strengths}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, strengths: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Aspectos a mejorar</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={dossierForm.improvements}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, improvements: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Comentarios adicionales</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={dossierForm.additionalComments}
                onChange={(e) => setDossierForm((prev) => ({ ...prev, additionalComments: e.target.value }))}
              />
            </div>

            <button className="btn btn-primary" type="submit">Guardar valoracion del dosier</button>
          </form>

          <div className="authority-panel">
            <div className="authority-panel-header">
              <div>
                <h2>Historico de valoraciones de dosier</h2>
                <p>Revisa el feedback ya registrado sobre los dosieres KLE preparados.</p>
              </div>
            </div>
            <div className="authority-status-stack">
              {dossierEvaluations.map((evaluation) => {
                const objective = objectives.find((item) => item.id === evaluation.objectiveId);
                return (
                  <div key={evaluation.id} className="authority-history-card">
                    <div className="authority-request-top">
                      <strong>{objective?.fullName ?? '-'}</strong>
                      <span className="authority-status-pill">Media {averageDossierEvaluation(evaluation)}/10</span>
                    </div>
                    <p><strong>Fecha:</strong> {evaluation.date}</p>
                    <p><strong>Valoracion global:</strong> {evaluation.overallScore}/10</p>
                    <p><strong>Claridad:</strong> {evaluation.clarityScore}/10</p>
                    <p><strong>Utilidad operativa:</strong> {evaluation.usefulnessScore}/10</p>
                    <p><strong>Adecuacion al objetivo:</strong> {evaluation.targetFitScore}/10</p>
                    <p><strong>Puntos fuertes:</strong> {evaluation.strengths}</p>
                    <p><strong>Aspectos a mejorar:</strong> {evaluation.improvements}</p>
                    <p><strong>Comentarios adicionales:</strong> {evaluation.additionalComments || 'Sin comentarios adicionales.'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activeSection === 'observation' && (
        <section className="authority-grid authority-grid-2">
          <form className="authority-panel" onSubmit={handleObservationSubmit}>
            <div className="authority-panel-header">
              <div>
                <h2>Cuestionario de observacion</h2>
                <p>Registra lo observado durante o despues de la interaccion para alimentar el seguimiento.</p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Autoridad</label>
                <select
                  className="form-select"
                  value={observationForm.objectiveId}
                  onChange={(e) => setObservationForm((prev) => ({ ...prev, objectiveId: e.target.value }))}
                >
                  {objectives.map((objective) => (
                    <option key={objective.id} value={objective.id}>{objective.fullName}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Fecha</label>
                <input
                  className="form-input"
                  type="date"
                  value={observationForm.date}
                  onChange={(e) => setObservationForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Sub-tabs selector */}
            <div className="form-group" style={{ marginBottom: 'var(--space-6)', marginTop: 'var(--space-4)' }}>
              <div className="authority-subtabs">
                <button
                  type="button"
                  className={`authority-subtab${subTab === 'q1' ? ' active' : ''}`}
                  onClick={() => setSubTab('q1')}
                >
                  Cuestionario 1
                </button>
                <button
                  type="button"
                  className={`authority-subtab${subTab === 'q2' ? ' active' : ''}`}
                  onClick={() => setSubTab('q2')}
                >
                  Cuestionario 2
                </button>
                <button
                  type="button"
                  className={`authority-subtab${subTab === 'q3' ? ' active' : ''}`}
                  onClick={() => setSubTab('q3')}
                >
                  Cuestionario 3
                </button>
              </div>
            </div>

            {/* Sub-tab 1 Content: Cuestionario 1 */}
            {subTab === 'q1' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 1: CUESTIONARIO GENERAL DE INTERACCION CON LA AUTORIDAD OBJETIVO.</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                    Este cuestionario tiene como objetivo complementar la información necesaria para mejorar el proceso de interacción personal KLE con la Autoridad Objetivo. Esta información será recogida por personas presentes en el encuentro, recomendándose su cumplimentación a la mayor brevedad posible para evitar la posible pérdida de información ocasionada por el olvido. Si en alguno de los ítems necesitase un mayor espacio para su respuesta, continúe en otro lugar indicando el número del ítem. Si en alguno de ellos no tiene la información o no sabe cómo responder, simplemente déjelo en blanco.
                  </p>
                </div>

                {/* Datos del Observador e Interacción */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <h3 style={{ fontSize: '1rem', color: '#f6cf58', borderBottom: '1px solid rgba(112, 138, 180, 0.18)', paddingBottom: '6px', margin: 'var(--space-2) 0 var(--space-1) 0' }}>
                    Datos de las personas que realizan la observación.
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Nombre y apellidos del observador</label>
                      <input
                        className="form-input"
                        value={observationForm.observerName}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, observerName: e.target.value }))}
                        placeholder="Ej: Coronel Ruiz"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Empleo, puesto y ejército</label>
                      <input
                        className="form-input"
                        value={observationForm.observerRankRole}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, observerRankRole: e.target.value }))}
                        placeholder="Ej: Agregado de Defensa, Ejército de Tierra"
                      />
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1rem', color: '#f6cf58', borderBottom: '1px solid rgba(112, 138, 180, 0.18)', paddingBottom: '6px', margin: 'var(--space-4) 0 var(--space-1) 0' }}>
                    Datos de la interacción con la Autoridad Objetivo.
                  </h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Fecha, hora de inicio y duración</label>
                      <input
                        className="form-input"
                        value={observationForm.startTimeDuration}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, startTimeDuration: e.target.value }))}
                        placeholder="Ej: 10:00 - 11:30 (90 min)"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Ciudad y ubicación</label>
                      <input
                        className="form-input"
                        value={observationForm.cityLocation}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, cityLocation: e.target.value }))}
                        placeholder="Ej: Embajada de España, Maravia"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Motivo de la interacción</label>
                      <input
                        className="form-input"
                        value={observationForm.interactionReason}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, interactionReason: e.target.value }))}
                        placeholder="Ej: Reunión de seguimiento"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Idioma de la interacción</label>
                      <input
                        className="form-input"
                        value={observationForm.interactionLanguage}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, interactionLanguage: e.target.value }))}
                        placeholder="Ej: Español / Inglés"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Otros idiomas (y nivel) de la Autoridad</label>
                      <input
                        className="form-input"
                        value={observationForm.targetOtherLanguages}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, targetOtherLanguages: e.target.value }))}
                        placeholder="Ej: Francés (medio)"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">¿Se utilizaron intérpretes?</label>
                      <select
                        className="form-select"
                        value={observationForm.usedInterpreters}
                        onChange={(e) => setObservationForm((prev) => ({ ...prev, usedInterpreters: e.target.value }))}
                      >
                        <option value="">Selecciona...</option>
                        <option value="si">Sí</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Acompañantes Dinámico */}
                <div style={{ border: '1px solid rgba(112, 138, 180, 0.18)', padding: 'var(--space-4)', borderRadius: '12px', background: 'rgba(8, 17, 31, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Datos de los acompañantes</label>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#f6cf58' }}
                      onClick={() => setObservationForm(prev => ({ ...prev, companions: [...prev.companions, { name: '', rankArmy: '' }] }))}
                    >
                      <span>+ Añadir acompañante</span>
                    </button>
                  </div>
                  {observationForm.companions.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(222, 231, 245, 0.6)', margin: 0 }}>No se han registrado acompañantes en esta sesión.</p>
                  ) : (
                    observationForm.companions.map((comp, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={comp.name}
                          placeholder="Nombre y apellidos"
                          onChange={(e) => {
                            const nextComps = [...observationForm.companions];
                            nextComps[idx] = { ...nextComps[idx], name: e.target.value };
                            setObservationForm(prev => ({ ...prev, companions: nextComps }));
                          }}
                        />
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={comp.rankArmy}
                          placeholder="Empleo y ejército"
                          onChange={(e) => {
                            const nextComps = [...observationForm.companions];
                            nextComps[idx] = { ...nextComps[idx], rankArmy: e.target.value };
                            setObservationForm(prev => ({ ...prev, companions: nextComps }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ color: '#e74c3c', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setObservationForm(prev => ({ ...prev, companions: prev.companions.filter((_, i) => i !== idx) }));
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Interacciones Previas Dinámico */}
                <div style={{ border: '1px solid rgba(112, 138, 180, 0.18)', padding: 'var(--space-4)', borderRadius: '12px', background: 'rgba(8, 17, 31, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>Otras interacciones previas</label>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#f6cf58' }}
                      onClick={() => setObservationForm(prev => ({ ...prev, previousInteractions: [...prev.previousInteractions, { date: '', location: '', reason: '' }] }))}
                    >
                      <span>+ Añadir interacción previa</span>
                    </button>
                  </div>
                  {observationForm.previousInteractions.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'rgba(222, 231, 245, 0.6)', margin: 0 }}>No se han registrado interacciones previas.</p>
                  ) : (
                    observationForm.previousInteractions.map((prevInt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', alignItems: 'center' }}>
                        <input
                          className="form-input"
                          type="date"
                          style={{ width: '130px' }}
                          value={prevInt.date}
                          onChange={(e) => {
                            const nextInts = [...observationForm.previousInteractions];
                            nextInts[idx] = { ...nextInts[idx], date: e.target.value };
                            setObservationForm(prev => ({ ...prev, previousInteractions: nextInts }));
                          }}
                        />
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={prevInt.location}
                          placeholder="Lugar"
                          onChange={(e) => {
                            const nextInts = [...observationForm.previousInteractions];
                            nextInts[idx] = { ...nextInts[idx], location: e.target.value };
                            setObservationForm(prev => ({ ...prev, previousInteractions: nextInts }));
                          }}
                        />
                        <input
                          className="form-input"
                          style={{ flex: 1 }}
                          value={prevInt.reason}
                          placeholder="Motivo"
                          onChange={(e) => {
                            const nextInts = [...observationForm.previousInteractions];
                            nextInts[idx] = { ...nextInts[idx], reason: e.target.value };
                            setObservationForm(prev => ({ ...prev, previousInteractions: nextInts }));
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          style={{ color: '#e74c3c', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            setObservationForm(prev => ({ ...prev, previousInteractions: prev.previousInteractions.filter((_, i) => i !== idx) }));
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Acordeón para Descripción General de la Autoridad */}
                <div style={{ border: '1px solid rgba(112, 138, 180, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    style={{ width: '100%', padding: '12px var(--space-4)', display: 'flex', justifyContent: 'space-between', background: 'rgba(8, 17, 31, 0.4)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => setExpandedSec(expandedSec === 'general' ? null : 'general')}
                  >
                    <span>Descripción General de la Autoridad (8 preguntas)</span>
                    <span>{expandedSec === 'general' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSec === 'general' && (
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(8, 17, 31, 0.15)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {qGeneralLabels.map((lbl, idx) => (
                        <div key={idx} className="form-group">
                          <label className="form-label">{lbl}</label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={observationForm.qGeneral[idx] || ''}
                            onChange={(e) => {
                              const nextGeneral = [...observationForm.qGeneral];
                              nextGeneral[idx] = e.target.value;
                              setObservationForm((prev) => ({ ...prev, qGeneral: nextGeneral }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acordeón para Descripción de la Interacción con la Autoridad */}
                <div style={{ border: '1px solid rgba(112, 138, 180, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    style={{ width: '100%', padding: '12px var(--space-4)', display: 'flex', justifyContent: 'space-between', background: 'rgba(8, 17, 31, 0.4)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => setExpandedSec(expandedSec === 'interaction' ? null : 'interaction')}
                  >
                    <span>Descripción de la Interacción (8 preguntas)</span>
                    <span>{expandedSec === 'interaction' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSec === 'interaction' && (
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(8, 17, 31, 0.15)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {qInteractionLabels.map((lbl, idx) => (
                        <div key={idx} className="form-group">
                          <label className="form-label">{lbl}</label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={observationForm.qInteraction[idx] || ''}
                            onChange={(e) => {
                              const nextInteraction = [...observationForm.qInteraction];
                              nextInteraction[idx] = e.target.value;
                              setObservationForm((prev) => ({ ...prev, qInteraction: nextInteraction }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Acordeón para Relación de la Autoridad con su Equipo */}
                <div style={{ border: '1px solid rgba(112, 138, 180, 0.18)', borderRadius: '12px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    style={{ width: '100%', padding: '12px var(--space-4)', display: 'flex', justifyContent: 'space-between', background: 'rgba(8, 17, 31, 0.4)', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}
                    onClick={() => setExpandedSec(expandedSec === 'team' ? null : 'team')}
                  >
                    <span>Relación de la Autoridad con su Equipo (5 preguntas)</span>
                    <span>{expandedSec === 'team' ? '▲' : '▼'}</span>
                  </button>
                  {expandedSec === 'team' && (
                    <div style={{ padding: 'var(--space-4)', background: 'rgba(8, 17, 31, 0.15)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {qTeamLabels.map((lbl, idx) => (
                        <div key={idx} className="form-group">
                          <label className="form-label">{lbl}</label>
                          <textarea
                            className="form-textarea"
                            rows={2}
                            value={observationForm.qTeam[idx] || ''}
                            onChange={(e) => {
                              const nextTeam = [...observationForm.qTeam];
                              nextTeam[idx] = e.target.value;
                              setObservationForm((prev) => ({ ...prev, qTeam: nextTeam }));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sub-tab 2 Content: Cuestionario 2 */}
            {subTab === 'q2' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 2: INFERENCIAS SOBRE PERSONALIDAD DE LA AUTORIDAD OBJETIVO.</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                    Indique el ajuste o no -en términos generales- de los siguientes planteamientos a la forma de ser, sentir y actuar de la Autoridad Objetivo.
                  </p>
                  <div style={{ marginTop: '10px', color: '#f6cf58', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span>
                    <span>POR FAVOR, NO DEJE NINGUNA PREGUNTA SIN RESPONDER</span>
                  </div>
                </div>
                {personalityQuestions.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid rgba(112, 138, 180, 0.12)', borderRadius: '8px', background: 'rgba(8, 17, 31, 0.2)' }}>
                    <span style={{ fontSize: '0.85rem', flex: 1, paddingRight: 'var(--space-3)' }}>{q}</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          minWidth: '45px',
                          background: observationForm.qPersonality[idx] === true ? 'rgba(46, 204, 113, 0.25)' : 'transparent',
                          borderColor: observationForm.qPersonality[idx] === true ? '#2ecc71' : 'rgba(112, 138, 180, 0.3)',
                          color: observationForm.qPersonality[idx] === true ? '#2ecc71' : '#e6edf7'
                        }}
                        onClick={() => {
                          const nextPersonality = [...observationForm.qPersonality];
                          nextPersonality[idx] = nextPersonality[idx] === true ? null : true;
                          setObservationForm(prev => ({ ...prev, qPersonality: nextPersonality }));
                        }}
                      >
                        SÍ
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{
                          padding: '4px 12px',
                          fontSize: '0.8rem',
                          minWidth: '45px',
                          background: observationForm.qPersonality[idx] === false ? 'rgba(231, 76, 60, 0.25)' : 'transparent',
                          borderColor: observationForm.qPersonality[idx] === false ? '#e74c3c' : 'rgba(112, 138, 180, 0.3)',
                          color: observationForm.qPersonality[idx] === false ? '#e74c3c' : '#e6edf7'
                        }}
                        onClick={() => {
                          const nextPersonality = [...observationForm.qPersonality];
                          nextPersonality[idx] = nextPersonality[idx] === false ? null : false;
                          setObservationForm(prev => ({ ...prev, qPersonality: nextPersonality }));
                        }}
                      >
                        NO
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-tab 3 Content: Cuestionario 3 */}
            {subTab === 'q3' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ marginBottom: 'var(--space-2)', padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 3: COMPORTAMIENTOS OBSERVABLES DE LA AUTORIDAD OBJETIVO.</h3>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                    Por favor, indique el ajuste o no -en términos generales- de los siguientes planteamientos a la forma de actuar de la Autoridad Objetivo.
                  </p>
                  <div style={{ marginTop: '10px', color: '#f6cf58', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚠️</span>
                    <span>POR FAVOR, NO DEJE NINGUNA PREGUNTA SIN RESPONDER</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-2)' }}>
                  {behaviorQuestions.map((q, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid rgba(112, 138, 180, 0.12)', borderRadius: '8px', background: 'rgba(8, 17, 31, 0.2)' }}>
                      <span style={{ fontSize: '0.8rem', flex: 1, paddingRight: 'var(--space-2)' }}>{q}</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            minWidth: '36px',
                            background: observationForm.qBehaviors[idx] === true ? 'rgba(46, 204, 113, 0.25)' : 'transparent',
                            borderColor: observationForm.qBehaviors[idx] === true ? '#2ecc71' : 'rgba(112, 138, 180, 0.3)',
                            color: observationForm.qBehaviors[idx] === true ? '#2ecc71' : '#e6edf7'
                          }}
                          onClick={() => {
                            const nextBehaviors = [...observationForm.qBehaviors];
                            nextBehaviors[idx] = nextBehaviors[idx] === true ? null : true;
                            setObservationForm(prev => ({ ...prev, qBehaviors: nextBehaviors }));
                          }}
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          className="btn"
                          style={{
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            minWidth: '36px',
                            background: observationForm.qBehaviors[idx] === false ? 'rgba(231, 76, 60, 0.25)' : 'transparent',
                            borderColor: observationForm.qBehaviors[idx] === false ? '#e74c3c' : 'rgba(112, 138, 180, 0.3)',
                            color: observationForm.qBehaviors[idx] === false ? '#e74c3c' : '#e6edf7'
                          }}
                          onClick={() => {
                            const nextBehaviors = [...observationForm.qBehaviors];
                            nextBehaviors[idx] = nextBehaviors[idx] === false ? null : false;
                            setObservationForm(prev => ({ ...prev, qBehaviors: nextBehaviors }));
                          }}
                        >
                          NO
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-primary" type="submit" style={{ marginTop: 'var(--space-5)' }}>Guardar cuestionario</button>
          </form>

          {/* Historial */}
          <div className="authority-panel">
            <div className="authority-panel-header">
              <div>
                <h2>Historico de cuestionarios</h2>
                <p>Consulta rapidamente los cuestionarios de observacion ya completados.</p>
              </div>
            </div>
            <div className="authority-status-stack">
              {observationQuestionnaires.map((questionnaire) => {
                const objective = objectives.find((item) => item.id === questionnaire.objectiveId);
                return (
                  <div key={questionnaire.id} className="authority-history-card" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="authority-request-top">
                      <strong>{objective?.fullName ?? '-'}</strong>
                      <span className="authority-status-pill">{questionnaire.date}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Observador:</strong> {questionnaire.observerName || '-'}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Motivo:</strong> {questionnaire.interactionReason || '-'}</p>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ alignSelf: 'flex-start', padding: '0.35rem 0.5rem', fontSize: '0.85rem', color: '#f6cf58', marginTop: '4px' }}
                      onClick={() => {
                        setSelectedQuestionnaire(questionnaire);
                        setModalTab('q1');
                      }}
                    >
                      Ver cuestionario completo →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* MODAL DETALLADO DE HISTÓRICO */}
      {selectedQuestionnaire && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(4, 8, 16, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'radial-gradient(circle at top right, rgba(80, 122, 197, 0.15), transparent 35%), linear-gradient(180deg, rgba(17, 28, 48, 0.98), rgba(10, 18, 33, 0.98))',
            border: '1px solid rgba(125, 148, 186, 0.25)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '960px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            color: '#e6edf7'
          }}>
            {/* Cabecera */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid rgba(112, 138, 180, 0.18)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fbff' }}>Respuestas Completas del Observador</h2>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(222, 231, 245, 0.7)' }}>
                  Autoridad: <strong>{objectives.find(o => o.id === selectedQuestionnaire.objectiveId)?.fullName ?? '-'}</strong> · Fecha: <strong>{selectedQuestionnaire.date}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '1.6rem', color: 'rgba(222, 231, 245, 0.6)', padding: '0.2rem 0.6rem' }}
                onClick={() => setSelectedQuestionnaire(null)}
              >
                ×
              </button>
            </div>

            {/* Pestañas del Modal */}
            <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid rgba(112, 138, 180, 0.12)', padding: '0.75rem 1.5rem', background: 'rgba(8, 17, 31, 0.3)' }}>
              <button
                type="button"
                className={`btn ${modalTab === 'q1' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setModalTab('q1')}
              >
                Cuestionario 1
              </button>
              <button
                type="button"
                className={`btn ${modalTab === 'q2' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setModalTab('q2')}
              >
                Cuestionario 2
              </button>
              <button
                type="button"
                className={`btn ${modalTab === 'q3' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}
                onClick={() => setModalTab('q3')}
              >
                Cuestionario 3
              </button>
            </div>

            {/* Cuerpo Scrollable */}
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-5)'
            }}>
              {modalTab === 'q1' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 1: CUESTIONARIO GENERAL DE INTERACCION CON LA AUTORIDAD OBJETIVO.</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                      Este cuestionario tiene como objetivo complementar la información necesaria para mejorar el proceso de interacción personal KLE con la Autoridad Objetivo. Esta información será recogida por personas presentes en el encuentro, recomendándose su cumplimentación a la mayor brevedad posible para evitar la posible pérdida de información ocasionada por el olvido. Si en alguno de los ítems necesitase un mayor espacio para su respuesta, continúe en otro lugar indicando el número del ítem. Si en alguno de ellos no tiene la información o no sabe cómo responder, simplemente déjelo en blanco.
                    </p>
                  </div>
                  <div>
                    <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>1. Datos Generales de la Interacción</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px 16px', fontSize: '0.85rem', marginTop: 'var(--space-2)' }}>
                      <p><strong>Observador:</strong> {selectedQuestionnaire.observerName || '-'}</p>
                      <p><strong>Empleo/Ejército:</strong> {selectedQuestionnaire.observerRankRole || '-'}</p>
                      <p><strong>Fecha/Duración:</strong> {selectedQuestionnaire.startTimeDuration || '-'}</p>
                      <p><strong>Ciudad/Lugar:</strong> {selectedQuestionnaire.cityLocation || '-'}</p>
                      <p><strong>Motivo:</strong> {selectedQuestionnaire.interactionReason || '-'}</p>
                      <p><strong>Idioma principal:</strong> {selectedQuestionnaire.interactionLanguage || '-'}</p>
                      <p><strong>Otros idiomas de la autoridad:</strong> {selectedQuestionnaire.targetOtherLanguages || '-'}</p>
                      <p><strong>¿Uso intérpretes?:</strong> {selectedQuestionnaire.usedInterpreters === 'si' ? 'Sí' : 'No'}</p>
                    </div>
                  </div>

                  {selectedQuestionnaire.companions && selectedQuestionnaire.companions.length > 0 && (
                    <div>
                      <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>2. Acompañantes</h3>
                      <ul style={{ paddingLeft: 'var(--space-4)', margin: 'var(--space-2) 0 0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedQuestionnaire.companions.map((c, i) => (
                          <li key={i}><strong>{c.name}</strong> · {c.rankArmy}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedQuestionnaire.previousInteractions && selectedQuestionnaire.previousInteractions.length > 0 && (
                    <div>
                      <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>3. Otras Interacciones Previas</h3>
                      <ul style={{ paddingLeft: 'var(--space-4)', margin: 'var(--space-2) 0 0', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {selectedQuestionnaire.previousInteractions.map((prev, i) => (
                          <li key={i}><strong>{prev.date}</strong> · En {prev.location} (Motivo: {prev.reason})</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>4. Descripción General de la Autoridad Objetivo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--space-2)' }}>
                      {qGeneralLabels.map((lbl, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 4px 0', color: 'rgba(222, 231, 245, 0.7)', fontWeight: 600 }}>{lbl}</p>
                          <p style={{ margin: 0, padding: '6px 12px', background: 'rgba(8, 17, 31, 0.3)', borderLeft: '3px solid #f6cf58', borderRadius: '0 6px 6px 0' }}>
                            {selectedQuestionnaire.qGeneral?.[idx] || 'Sin respuesta.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>5. Descripción de la Interacción con la Autoridad</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--space-2)' }}>
                      {qInteractionLabels.map((lbl, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 4px 0', color: 'rgba(222, 231, 245, 0.7)', fontWeight: 600 }}>{lbl}</p>
                          <p style={{ margin: 0, padding: '6px 12px', background: 'rgba(8, 17, 31, 0.3)', borderLeft: '3px solid #f6cf58', borderRadius: '0 6px 6px 0' }}>
                            {selectedQuestionnaire.qInteraction?.[idx] || 'Sin respuesta.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 style={{ borderBottom: '1px solid rgba(112, 138, 180, 0.15)', paddingBottom: '4px', fontSize: '1rem', color: '#f6cf58', textTransform: 'uppercase', letterSpacing: '0.05em' }}>6. Relación de la Autoridad con su Equipo</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'var(--space-2)' }}>
                      {qTeamLabels.map((lbl, idx) => (
                        <div key={idx} style={{ fontSize: '0.85rem' }}>
                          <p style={{ margin: '0 0 4px 0', color: 'rgba(222, 231, 245, 0.7)', fontWeight: 600 }}>{lbl}</p>
                          <p style={{ margin: 0, padding: '6px 12px', background: 'rgba(8, 17, 31, 0.3)', borderLeft: '3px solid #f6cf58', borderRadius: '0 6px 6px 0' }}>
                            {selectedQuestionnaire.qTeam?.[idx] || 'Sin respuesta.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'q2' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 2: INFERENCIAS SOBRE PERSONALIDAD DE LA AUTORIDAD OBJETIVO.</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                      Indique el ajuste o no -en términos generales- de los siguientes planteamientos a la forma de ser, sentir y actuar de la Autoridad Objetivo.
                    </p>
                    <div style={{ marginTop: '10px', color: '#f6cf58', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️</span>
                      <span>POR FAVOR, NO DEJE NINGUNA PREGUNTA SIN RESPONDER</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '8px 12px' }}>
                    {personalityQuestions.map((q, idx) => {
                      const ans = selectedQuestionnaire.qPersonality?.[idx];
                      let badgeColor = 'rgba(222, 231, 245, 0.08)';
                      let badgeText = 'N/A';
                      let textColor = 'rgba(222, 231, 245, 0.5)';
                      if (ans === true) {
                        badgeColor = 'rgba(46, 204, 113, 0.18)';
                        badgeText = 'SÍ';
                        textColor = '#2ecc71';
                      } else if (ans === false) {
                        badgeColor = 'rgba(231, 76, 60, 0.18)';
                        badgeText = 'NO';
                        textColor = '#e74c3c';
                      }
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid rgba(112, 138, 180, 0.08)', borderRadius: '8px', background: 'rgba(8, 17, 31, 0.25)', fontSize: '0.8rem' }}>
                          <span style={{ flex: 1, paddingRight: '8px', color: 'rgba(222, 231, 245, 0.95)' }}>{q}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: badgeColor,
                            color: textColor,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            minWidth: '32px',
                            textAlign: 'center'
                          }}>{badgeText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {modalTab === 'q3' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ padding: 'var(--space-4)', border: '1px solid rgba(242, 194, 48, 0.25)', borderRadius: '12px', background: 'rgba(242, 194, 48, 0.05)' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#f6cf58', fontWeight: 800 }}>CUESTIONARIO 3: COMPORTAMIENTOS OBSERVABLES DE LA AUTORIDAD OBJETIVO.</h3>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.82rem', color: 'rgba(222, 231, 245, 0.8)', lineHeight: '1.4' }}>
                      Por favor, indique el ajuste o no -en términos generales- de los siguientes planteamientos a la forma de actuar de la Autoridad Objetivo.
                    </p>
                    <div style={{ marginTop: '10px', color: '#f6cf58', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚠️</span>
                      <span>POR FAVOR, NO DEJE NINGUNA PREGUNTA SIN RESPONDER</span>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '8px 12px' }}>
                    {behaviorQuestions.map((q, idx) => {
                      const ans = selectedQuestionnaire.qBehaviors?.[idx];
                      let badgeColor = 'rgba(222, 231, 245, 0.08)';
                      let badgeText = 'N/A';
                      let textColor = 'rgba(222, 231, 245, 0.5)';
                      if (ans === true) {
                        badgeColor = 'rgba(46, 204, 113, 0.18)';
                        badgeText = 'SÍ';
                        textColor = '#2ecc71';
                      } else if (ans === false) {
                        badgeColor = 'rgba(231, 76, 60, 0.18)';
                        badgeText = 'NO';
                        textColor = '#e74c3c';
                      }
                      return (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid rgba(112, 138, 180, 0.08)', borderRadius: '8px', background: 'rgba(8, 17, 31, 0.25)', fontSize: '0.8rem' }}>
                          <span style={{ flex: 1, paddingRight: '8px', color: 'rgba(222, 231, 245, 0.95)' }}>{q}</span>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: badgeColor,
                            color: textColor,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            minWidth: '32px',
                            textAlign: 'center'
                          }}>{badgeText}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pie */}
            <div style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid rgba(112, 138, 180, 0.18)',
              display: 'flex',
              justifyContent: 'flex-end',
              background: 'rgba(8, 17, 31, 0.3)'
            }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem' }}
                onClick={() => setSelectedQuestionnaire(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
