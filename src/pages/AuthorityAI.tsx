import { useMemo, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { useObjectives } from '../context/ObjectivesContext';
import { buildAuthorityAiAnswer } from '../data/authorityPortal';
import { mockAnalyses } from '../data/misc';
import { mockInteractions } from '../data/interactions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  '¿Cuáles son los intereses principales de esta autoridad?',
  '¿De qué ha hablado en las últimas reuniones?',
  '¿Cuál ha sido la evolución de nuestra relación con esta autoridad?',
  '¿Qué riesgos existen para una próxima interacción?',
  'Resume toda la información disponible sobre esta persona.',
];

export default function AuthorityAI() {
  const { objectives } = useObjectives();
  const [selectedObjectiveId, setSelectedObjectiveId] = useState(objectives[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      role: 'assistant',
      content:
        'Selecciona una autoridad y formula una pregunta. El asistente responderá con base en informes, interacciones y valoraciones disponibles.',
    },
  ]);

  const objective = objectives.find((item) => item.id === selectedObjectiveId);
  const analysis = selectedObjectiveId ? mockAnalyses[selectedObjectiveId] : undefined;
  const interactionsSummary = useMemo(
    () =>
      mockInteractions
        .filter((interaction) => interaction.objectiveId === selectedObjectiveId)
        .slice(0, 3)
        .map(
          (interaction) =>
            `${interaction.date} en ${interaction.location}: se trataron ${interaction.topicsDiscussed.join(', ')}.`
        ),
    [selectedObjectiveId]
  );

  const submitQuestion = (content: string) => {
    const question = content.trim();
    if (!question) return;

    const answer = buildAuthorityAiAnswer({
      question,
      objective,
      executiveSummary: analysis?.executiveSummary,
      personalityProfile: analysis?.personalityProfile,
      socioculturalInterests: analysis?.socioculturalInterests,
      recommendations: analysis?.recommendations,
      interactionsSummary,
    });

    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: question },
      { id: `a-${Date.now() + 1}`, role: 'assistant', content: answer },
    ]);
    setQuery('');
  };

  return (
    <div className="authority-shell">
      <section className="authority-panel">
        <div className="authority-panel-header">
          <div>
            <h2>Asistente IA</h2>
            <p>Asistente conversacional alimentado por informes, históricos e interacciones registradas.</p>
          </div>
        </div>

        <div className="form-group" style={{ maxWidth: 360 }}>
          <label className="form-label">Autoridad</label>
          <select
            className="form-select"
            value={selectedObjectiveId}
            onChange={(e) => setSelectedObjectiveId(e.target.value)}
          >
            {objectives.map((objectiveItem) => (
              <option key={objectiveItem.id} value={objectiveItem.id}>
                {objectiveItem.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="authority-ai-suggestions">
          {suggestedQuestions.map((question) => (
            <button
              key={question}
              className="authority-suggestion-chip"
              onClick={() => submitQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>

        <div className="authority-chat">
          {messages.map((message) => (
            <div key={message.id} className={`authority-chat-message ${message.role}`}>
              <div className="authority-chat-icon">
                {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="authority-chat-bubble">{message.content}</div>
            </div>
          ))}
        </div>

        <form
          className="authority-chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(query);
          }}
        >
          <input
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pregunta por riesgos, intereses, relaciones o recomendaciones..."
          />
          <button className="btn btn-primary" type="submit">
            <Send size={16} /> Enviar
          </button>
        </form>
      </section>
    </div>
  );
}
