import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Send, Sparkles, User, WandSparkles } from 'lucide-react';
import { getAIResponse } from '../data/aiResponses';
import type { AIMessage } from '../types';
import { useObjectives } from '../context/ObjectivesContext';

const suggestedQuestions = [
  'Como deberia preparar una reunion con esta persona?',
  'Que temas pueden generar confianza?',
  'Que riesgos debo evitar?',
  'Cuales son sus principales intereses?',
  'Resume toda la informacion disponible.',
];

const workflowHighlights = [
  'Cruza preguntas con el contexto de la autoridad objetivo seleccionada.',
  'Sirve como apoyo para preparar reuniones, informes y seguimiento.',
  'Mantiene la experiencia integrada dentro del portal del analista.',
];

export default function AIChat() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const [selectedObjective, setSelectedObjective] = useState(preselected || '');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const objective = objectives.find((item) => item.id === selectedObjective);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!selectedObjective && objectives[0]?.id) {
      setSelectedObjective(preselected || objectives[0].id);
    }
  }, [objectives, preselected, selectedObjective]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !objective) return;

    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
      objectiveId: selectedObjective,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text, objective.fullName);
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        objectiveId: selectedObjective,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }

      return part.split('\n').map((line, lineIndex) => (
        <span key={`${index}-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <div className="analyst-ai-page">
      <div className="section-header">
        <div>
          <h2 className="section-title">Asistente IA</h2>
          <p className="section-subtitle">
            Asistente integrado en el flujo del analista para preparar interacciones y consolidar
            informacion.
          </p>
        </div>
      </div>

      <section className="analyst-ai-hero">
        <div className="analyst-ai-hero-copy">
          <span className="analyst-empty-pill">
            <WandSparkles size={14} />
            Flujo asistido
          </span>
          <h3>Apoyo conversacional dentro del portal analista</h3>
          <p>
            Usa la IA como capa de apoyo para explorar contexto, preparar reuniones, resumir
            informacion y orientar el trabajo sobre cada autoridad objetivo.
          </p>
        </div>
        <div className="analyst-ai-highlight-list">
          {workflowHighlights.map((highlight) => (
            <div className="analyst-ai-highlight" key={highlight}>
              <Sparkles size={16} />
              <span>{highlight}</span>
            </div>
          ))}
        </div>
      </section>

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'flex-end',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
        }}
      >
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 280 }}>
          <label className="form-label">Autoridad objetivo seleccionada</label>
          <select
            className="form-select"
            value={selectedObjective}
            onChange={(event) => {
              setSelectedObjective(event.target.value);
              setMessages([]);
            }}
          >
            {objectives
              .filter((item) => item.status !== 'closed')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName}
                </option>
              ))}
          </select>
        </div>

        {objective && (
          <div className="analyst-ai-context">
            <strong>{objective.fullName}</strong>
            <span>
              {objective.title} · {objective.organization}
            </span>
          </div>
        )}
      </div>

      <div className="card chat-container" style={{ padding: 0 }}>
        <div className="chat-header">
          <div
            className="avatar"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
              width: 36,
              height: 36,
            }}
          >
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Asistente IA - KLE</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Analisis de {objective?.fullName ?? 'autoridad objetivo'}
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="analyst-ai-empty">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--color-accent-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <Bot size={32} style={{ color: 'var(--color-accent-500)' }} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
                Asistente de Inteligencia KLE
              </h3>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-muted)',
                  maxWidth: 480,
                  marginBottom: 'var(--space-6)',
                }}
              >
                Formula preguntas sobre {objective?.fullName ?? 'la autoridad objetivo seleccionada'}.
                El asistente te ayudara a sintetizar informacion y a preparar proximos pasos.
              </p>
              <div className="analyst-ai-suggestions">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    className="btn btn-secondary btn-sm"
                    style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.8rem' }}
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              <div
                className="avatar"
                style={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  ...(message.role === 'assistant'
                    ? {
                        background:
                          'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
                      }
                    : {}),
                }}
              >
                {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chat-message-bubble">{renderMessageContent(message.content)}</div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message assistant">
              <div
                className="avatar"
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
                }}
              >
                <Bot size={16} />
              </div>
              <div className="chat-message-bubble">
                <div className="typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-area" onSubmit={handleSubmit}>
          <input
            className="chat-input"
            type="text"
            placeholder={`Pregunta sobre ${objective?.fullName ?? 'la autoridad objetivo'}...`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={isTyping}
          />
          <button type="submit" className="chat-send-btn" disabled={!input.trim() || isTyping}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
