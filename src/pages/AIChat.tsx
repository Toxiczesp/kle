import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { getAIResponse } from '../data/aiResponses';
import type { AIMessage } from '../types';
import BackButton from '../components/BackButton';
import { useObjectives } from '../context/ObjectivesContext';

const suggestedQuestions = [
  'Cómo debería preparar una reunión con esta persona?',
  'Qué temas pueden generar confianza?',
  'Qué riesgos debo evitar?',
  'Cuáles son sus principales intereses?',
  'Resume toda la información disponible.',
];

const areaLabels: Record<string, string> = {
  personality: 'Info Autoridad Objetivo',
  'psychological-profile': 'Perfilado Personalidad',
  sociocultural: 'Área sociocultural',
};

export default function AIChat() {
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const activeArea = searchParams.get('area') || 'personality';
  const [selectedObjective, setSelectedObjective] = useState(preselected || '');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const objective = objectives.find((o) => o.id === selectedObjective);

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

    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
      objectiveId: selectedObjective,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text, objective.fullName);
      const aiMsg: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        objectiveId: selectedObjective,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }

      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ));
    });
  };

  return (
    <div>
      <BackButton />
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-4)',
          alignItems: 'flex-end',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div className="form-group" style={{ margin: 0, flex: 1, maxWidth: 400 }}>
          <label className="form-label">Autoridad objetivo seleccionada</label>
          <select
            className="form-select"
            value={selectedObjective}
            onChange={(e) => {
              setSelectedObjective(e.target.value);
              setMessages([]);
            }}
          >
            {objectives
              .filter((o) => o.status !== 'closed')
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.fullName}
                </option>
              ))}
          </select>
        </div>
        {objective && (
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', paddingBottom: 8 }}>
            {objective.title} - {objective.organization} · {areaLabels[activeArea] ?? areaLabels.personality}
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
              Análisis de {objective?.fullName ?? 'autoridad objetivo'}
            </div>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: 'var(--space-8)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
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
                  maxWidth: 400,
                  marginBottom: 'var(--space-6)',
                }}
              >
                Haz preguntas sobre {objective?.fullName ?? 'la autoridad objetivo seleccionada'}.
                El asistente analizará toda la información disponible para generar respuestas relevantes.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                  width: '100%',
                  maxWidth: 450,
                }}
              >
                <p
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  Preguntas sugeridas
                </p>
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    className="btn btn-secondary btn-sm"
                    style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '0.8rem' }}
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div
                className="avatar"
                style={{
                  width: 32,
                  height: 32,
                  fontSize: '0.75rem',
                  ...(msg.role === 'assistant'
                    ? {
                        background:
                          'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
                      }
                    : {}),
                }}
              >
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className="chat-message-bubble">{renderMessageContent(msg.content)}</div>
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
            onChange={(e) => setInput(e.target.value)}
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
