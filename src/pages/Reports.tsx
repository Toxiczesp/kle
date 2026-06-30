import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  FileStack,
  Globe,
  MessageSquare,
  BookOpen,
  Printer,
  Download,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Target,
} from 'lucide-react';
import { mockInteractions } from '../data/interactions';
import { mockAnalyses, mockReportTemplates } from '../data/misc';
import {
  getPublishedProfileForObjective,
  readAuthorityPublishedProfiles,
  readAuthoritySharedDocuments,
  getSharedDocumentsForObjective,
  writeAuthorityPublishedProfiles,
  writeAuthoritySharedDocuments,
} from '../data/authorityPortal';
import type { AuthorityPublishedProfile, AuthoritySharedDocument, InteractionType } from '../types';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { useObjectives } from '../context/ObjectivesContext';

const templateIcons: Record<string, React.ReactNode> = {
  FileText: <FileText size={22} />,
  FileStack: <FileStack size={22} />,
  Globe: <Globe size={22} />,
  MessageSquare: <MessageSquare size={22} />,
  BookOpen: <BookOpen size={22} />,
};

const interactionTypeLabels: Record<InteractionType, string> = {
  meeting: 'Reunion',
  call: 'Llamada',
  event: 'Evento',
  interview: 'Entrevista',
  informal: 'Contacto informal',
};

const areaLabels: Record<string, string> = {
  personality: 'Info Autoridad Objetivo',
  'psychological-profile': 'Perfilado Personalidad',
  sociocultural: 'Area Sociocultural',
};

export default function Reports() {
  const { user } = useAuth();
  const { objectives } = useObjectives();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('obj') || '';
  const activeArea = searchParams.get('area') || 'personality';
  const [selectedObjective, setSelectedObjective] = useState(preselected || '');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [publishedProfile, setPublishedProfile] = useState<AuthorityPublishedProfile | null>(null);
  const [sharedDocuments, setSharedDocuments] = useState<AuthoritySharedDocument[]>([]);
  const [authorityDraft, setAuthorityDraft] = useState({
    generalInfo: '',
    executiveSummary: '',
    behaviorAnalysis: '',
    socioculturalAnalysis: '',
    fullReport: '',
  });
  const [documentDraft, setDocumentDraft] = useState({
    name: '',
    description: '',
    category: 'PDF KLE',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const objective = objectives.find((o) => o.id === selectedObjective);
  const analysis = mockAnalyses[selectedObjective];
  const interactions = mockInteractions.filter((i) => i.objectiveId === selectedObjective);

  useEffect(() => {
    if (!selectedObjective && objectives[0]?.id) {
      setSelectedObjective(preselected || objectives[0].id);
    }
  }, [objectives, preselected, selectedObjective]);

  useEffect(() => {
    if (!selectedObjective) return;

    const existingProfile = getPublishedProfileForObjective(selectedObjective) ?? null;
    setSharedDocuments(getSharedDocumentsForObjective(selectedObjective));
    setPublishedProfile(existingProfile);
    setAuthorityDraft({
      generalInfo: existingProfile?.generalInfo ?? objective?.biography ?? '',
      executiveSummary: existingProfile?.executiveSummary ?? analysis?.executiveSummary ?? '',
      behaviorAnalysis: existingProfile?.behaviorAnalysis ?? analysis?.personalityProfile ?? '',
      socioculturalAnalysis: existingProfile?.socioculturalAnalysis ?? analysis?.socioculturalInterests ?? '',
      fullReport:
        existingProfile?.fullReport ??
        [analysis?.executiveSummary, analysis?.personalityProfile, analysis?.socioculturalInterests]
          .filter(Boolean)
          .join('\n\n'),
    });
  }, [analysis, objective, selectedObjective]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado.'));
      reader.readAsDataURL(file);
    });

  const handlePublishAuthorityProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjective || !user) return;

    const now = new Date().toISOString();
    const nextProfile: AuthorityPublishedProfile = {
      objectiveId: selectedObjective,
      generalInfo: authorityDraft.generalInfo.trim(),
      executiveSummary: authorityDraft.executiveSummary.trim(),
      behaviorAnalysis: authorityDraft.behaviorAnalysis.trim(),
      socioculturalAnalysis: authorityDraft.socioculturalAnalysis.trim(),
      fullReport: authorityDraft.fullReport.trim(),
      publishedAt: publishedProfile?.publishedAt ?? now,
      updatedAt: now,
      analystName: user.name,
    };

    const others = readAuthorityPublishedProfiles().filter((profile) => profile.objectiveId !== selectedObjective);
    const nextProfiles = [nextProfile, ...others];
    writeAuthorityPublishedProfiles(nextProfiles);
    setPublishedProfile(nextProfile);
    showToast('Contenido publicado para el portal de autoridad.');
  };

  const handleUploadSharedDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjective || !user || !selectedFile) {
      showToast('Selecciona un PDF antes de subirlo al portal de autoridad.');
      return;
    }

    try {
      const fileDataUrl = await readFileAsDataUrl(selectedFile);
      const created: AuthoritySharedDocument = {
        id: `shared-doc-${Date.now()}`,
        objectiveId: selectedObjective,
        name: documentDraft.name.trim() || selectedFile.name,
        description: documentDraft.description.trim(),
        category: documentDraft.category.trim() || 'PDF KLE',
        mimeType: selectedFile.type || 'application/pdf',
        fileDataUrl,
        uploadedAt: new Date().toISOString(),
        analystName: user.name,
      };

      const nextDocuments = [
        created,
        ...readAuthoritySharedDocuments(),
      ];
      writeAuthoritySharedDocuments(nextDocuments);
      setSharedDocuments(getSharedDocumentsForObjective(selectedObjective));
      setDocumentDraft({
        name: '',
        description: '',
        category: 'PDF KLE',
      });
      setSelectedFile(null);
      showToast('Documento sincronizado con la ficha de autoridad.');
    } catch {
      showToast('No se pudo procesar el documento seleccionado.');
    }
  };

  const getCurrentTemplateName = () =>
    mockReportTemplates.find((template) => template.id === selectedTemplate)?.name ?? 'Informe';

  const getCurrentReportText = () => {
    const reportElement = document.getElementById('report-content');
    return reportElement?.innerText?.trim() ?? '';
  };

  const handleExportPdf = () => {
    if (!objective || !selectedTemplate) return;

    const reportElement = document.getElementById('report-content');
    if (!reportElement) {
      showToast('No se pudo localizar el informe para exportar.');
      return;
    }

    const popup = window.open('', '_blank', 'width=920,height=1200');
    if (!popup) {
      showToast('El navegador bloqueo la ventana de exportacion.');
      return;
    }

    const title = `${getCurrentTemplateName()} - ${objective.fullName}`;
    popup.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8" />
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1f2d4d; line-height: 1.6; }
            h1, h2, h3 { color: #243a6b; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            td { border: 1px solid #c7d1e0; padding: 8px 10px; vertical-align: top; }
            ul { padding-left: 20px; }
            hr { border: none; border-top: 1px solid #c7d1e0; margin: 24px 0; }
            @media print { body { margin: 18px; } }
          </style>
        </head>
        <body>
          ${reportElement.innerHTML}
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    showToast('Informe preparado para guardar como PDF.');
  };

  const handleSendEmail = () => {
    if (!objective || !selectedTemplate) return;

    const subject = encodeURIComponent(`${getCurrentTemplateName()} - ${objective.fullName}`);
    const reportText = getCurrentReportText();
    const snippet = reportText
      ? reportText.slice(0, 1600)
      : `Comparto el informe ${getCurrentTemplateName()} de la autoridad objetivo ${objective.fullName}.`;
    const body = encodeURIComponent(
      `Comparto el informe "${getCurrentTemplateName()}" de la autoridad objetivo ${objective.fullName}.\n\n${snippet}`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    showToast('Se ha preparado el correo con el informe.');
  };

  const renderReport = () => {
    if (!objective || !selectedTemplate) return null;
    const template = mockReportTemplates.find((t) => t.id === selectedTemplate);
    if (!template) return null;

    const now = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div>
        <button className="back-link" onClick={() => setSelectedTemplate(null)}>
          <ArrowLeft size={16} /> Volver a plantillas
        </button>

        <div className="report-preview" id="report-content">
          <div className="report-meta">
            <div>
              <div className="report-meta-label">Clasificacion</div>
              <div style={{ fontWeight: 700, color: 'var(--color-warning)' }}>
                CONFIDENCIAL - USO INTERNO
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="report-meta-label">Fecha de generacion</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{now}</div>
            </div>
          </div>

          <h1>{template.name}</h1>
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Autoridad objetivo: {objective.fullName} - {objective.organization}
          </p>

          {(selectedTemplate === 'rpt-summary' || selectedTemplate === 'rpt-consolidated') && (
            <>
              <h2>1. Datos Basicos</h2>
              <table className="table" style={{ marginBottom: 'var(--space-4)' }}>
                <tbody>
                  <tr><td style={{ fontWeight: 600, width: 200 }}>Nombre completo</td><td>{objective.fullName}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Cargo</td><td>{objective.title}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Organizacion</td><td>{objective.organization}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Pais</td><td>{objective.country}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Proyecto</td><td>{objective.project}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Prioridad</td><td style={{ textTransform: 'uppercase' }}>{objective.priority}</td></tr>
                  <tr><td style={{ fontWeight: 600 }}>Estado</td><td style={{ textTransform: 'uppercase' }}>{objective.status}</td></tr>
                </tbody>
              </table>

              {analysis && (
                <>
                  <h2>2. Resumen Ejecutivo</h2>
                  <p>{analysis.executiveSummary}</p>
                </>
              )}

              <h2>{analysis ? '3' : '2'}. Estado de la relación</h2>
              <p>
                Se han registrado <strong>{interactions.length}</strong> interacciones con esta autoridad objetivo.
                {interactions.length > 0 && (
                  <> La última interacción fue el {interactions[0]?.date} en {interactions[0]?.location}.</>
                )}
              </p>

              {analysis && (
                <>
                  <h2>4. Recomendaciones</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}
            </>
          )}

          {selectedTemplate === 'rpt-complete' && (
            <>
              <h2>1. Datos biográficos</h2>
              <p>{objective.biography}</p>

              {analysis && (
                <>
                  <h2>2. Perfilado Personalidad</h2>
                  <p>{analysis.personalityProfile}</p>

                  <h2>3. Motivaciones</h2>
                  <p>{analysis.motivations}</p>

                  <h2>4. Puntos de conexión</h2>
                  <p>{analysis.connectionPoints}</p>

                  <h2>5. Riesgos de comunicación</h2>
                  <p>{analysis.communicationRisks}</p>

                  <h2>6. Recomendaciones</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}

              <h2>{analysis ? '7' : '2'}. Historial de Interacciones</h2>
              {interactions.length > 0 ? (
                interactions.map((inter, idx) => (
                  <div key={inter.id} style={{ marginBottom: 'var(--space-4)' }}>
                    <h3>{idx + 1}. {interactionTypeLabels[inter.type]} - {inter.date}</h3>
                    <p><strong>Lugar:</strong> {inter.location}</p>
                    <p><strong>Analista:</strong> {inter.analyst}</p>
                    <p><strong>Observaciones:</strong> {inter.observations}</p>
                  </div>
                ))
              ) : (
                <p>No hay interacciones registradas.</p>
              )}
            </>
          )}

          {selectedTemplate === 'rpt-sociocultural' && (
            <>
              <h2>1. Intereses Personales</h2>
              <ul>
                {objective.personalInterests.map((i) => <li key={i}>{i}</li>)}
              </ul>

              <h2>2. Intereses Profesionales</h2>
              <ul>
                {objective.professionalInterests.map((i) => <li key={i}>{i}</li>)}
              </ul>

              {analysis && (
                <>
                  <h2>3. Contexto Sociocultural</h2>
                  <p>{analysis.socioculturalInterests}</p>

                  <h2>4. Puntos de conexión</h2>
                  <p>{analysis.connectionPoints}</p>

                  <h2>5. Recomendaciones Culturales</h2>
                  <p>{analysis.recommendations}</p>
                </>
              )}
            </>
          )}

          {selectedTemplate === 'rpt-interaction' && (
            <>
              {interactions.length > 0 ? (
                interactions.map((inter, idx) => (
                  <div key={inter.id}>
                    <h2>{idx + 1}. {interactionTypeLabels[inter.type]} - {inter.date}</h2>
                    <h3>Datos de la interacción</h3>
                    <p><strong>Fecha:</strong> {inter.date}</p>
                    <p><strong>Lugar:</strong> {inter.location}</p>
                    <p><strong>Analista:</strong> {inter.analyst}</p>
                    <p><strong>Tipo:</strong> {interactionTypeLabels[inter.type]}</p>

                    <h3>Temas Tratados</h3>
                    <ul>
                      {inter.topicsDiscussed.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>

                    <h3>Evaluación</h3>
                    <p><strong>Actitud:</strong> {inter.attitude}</p>
                    <p><strong>Receptividad:</strong> {inter.receptivity}</p>

                    <h3>Intereses Detectados</h3>
                    <ul>
                      {inter.detectedInterests.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>

                    <h3>Riesgos</h3>
                    <ul>
                      {inter.risksAlerts.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>

                    <h3>Próximos pasos</h3>
                    <ul>
                      {inter.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>

                    <h3>Observaciones</h3>
                    <p>{inter.observations}</p>

                    {idx < interactions.length - 1 && (
                      <hr
                        style={{
                          border: 'none',
                          borderTop: '1px solid var(--color-border)',
                          margin: 'var(--space-6) 0',
                        }}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p>No hay interacciones registradas para esta autoridad objetivo.</p>
              )}
            </>
          )}

          {selectedTemplate === 'rpt-consolidated' && analysis && (
            <>
              <h2>5. Perfilado Personalidad</h2>
              <p>{analysis.personalityProfile}</p>

              <h2>6. Intereses Socioculturales</h2>
              <p>{analysis.socioculturalInterests}</p>

              <h2>7. Motivaciones</h2>
              <p>{analysis.motivations}</p>

              <h2>8. Evaluación de riesgos</h2>
              <p>{analysis.communicationRisks}</p>

              <h2>9. Historial de Interacciones</h2>
              {interactions.map((inter, idx) => (
                <div key={inter.id} style={{ marginBottom: 'var(--space-3)' }}>
                  <p><strong>{idx + 1}. {interactionTypeLabels[inter.type]}</strong> - {inter.date}, {inter.location}</p>
                  <p style={{ fontSize: '0.8rem' }}>{inter.observations}</p>
                </div>
              ))}

              <h2>10. Recomendaciones Finales</h2>
              <p>{analysis.recommendations}</p>
            </>
          )}

          <div
            style={{
              marginTop: 'var(--space-8)',
              paddingTop: 'var(--space-4)',
              borderTop: '2px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Documento generado automáticamente por KLE Platform - {now}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
              Este documento contiene información clasificada. Distribución restringida.
            </p>
          </div>
        </div>

        <div className="report-actions" style={{ maxWidth: 800, margin: '0 auto' }}>
          <button className="btn btn-primary" onClick={handleExportPdf}>
            <Download size={16} /> Exportar PDF
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Imprimir
          </button>
          <button className="btn btn-secondary" onClick={handleSendEmail}>
            <Mail size={16} /> Enviar por Email
          </button>
        </div>
      </div>
    );
  };

  if (selectedTemplate) {
    return <div>{renderReport()}</div>;
  }

  return (
    <div>
      <BackButton />
      <div className="section-header">
        <div>
          <h2 className="section-title">Generación de informes</h2>
        </div>
        <div className="section-header-side">
          <div className={`area-context-badge ${activeArea}`}>
            <span className="area-context-dot" />
            <span className="area-context-label">Área actual</span>
            <strong>{areaLabels[activeArea] ?? areaLabels.personality}</strong>
          </div>
        </div>
      </div>

      <div
        className="card"
        style={{
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div
          className="avatar"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent-500), var(--color-primary-400))',
          }}
        >
          <Target size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ margin: 0 }}>
            Autoridad objetivo para el informe
          </label>
          <select
            className="form-select"
            value={selectedObjective}
            onChange={(e) => setSelectedObjective(e.target.value)}
            style={{ marginTop: 4 }}
          >
            {objectives.map((o) => (
              <option key={o.id} value={o.id}>
                {o.fullName} - {o.organization}
              </option>
            ))}
          </select>
        </div>
      </div>

      <form
        className="card"
        onSubmit={handlePublishAuthorityProfile}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 4 }}>Contenido para portal de autoridad</h3>
            <p className="section-subtitle">
              El analista rellena este contenido y la autoridad lo verá en su ficha cuando quede publicado.
            </p>
          </div>
          <div className="section-header-side" style={{ textAlign: 'right' }}>
            <div className="badge badge-active">
              {publishedProfile ? 'Publicado' : 'Pendiente'}
            </div>
            {publishedProfile && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>
                Última actualización: {new Date(publishedProfile.updatedAt).toLocaleString('es-ES')}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Información general</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={authorityDraft.generalInfo}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, generalInfo: e.target.value }))}
            placeholder="Contexto general que podrá consultar la autoridad..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Resumen ejecutivo</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={authorityDraft.executiveSummary}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, executiveSummary: e.target.value }))}
            placeholder="Resumen ejecutivo preparado por el analista..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Análisis de comportamiento</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={authorityDraft.behaviorAnalysis}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, behaviorAnalysis: e.target.value }))}
            placeholder="Patrones, forma de comunicación, riesgos y oportunidades..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Análisis sociocultural</label>
          <textarea
            className="form-textarea"
            rows={4}
            value={authorityDraft.socioculturalAnalysis}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, socioculturalAnalysis: e.target.value }))}
            placeholder="Contexto sociocultural y consideraciones protocolarias..."
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Documento completo</label>
          <textarea
            className="form-textarea"
            rows={8}
            value={authorityDraft.fullReport}
            onChange={(e) => setAuthorityDraft((prev) => ({ ...prev, fullReport: e.target.value }))}
            placeholder="Versión completa que se mostrará en el portal de autoridad..."
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {publishedProfile
              ? `Publicado por ${publishedProfile.analystName}.`
              : 'Todavía no hay contenido publicado para esta autoridad.'}
          </div>
          <button className="btn btn-primary" type="submit">
            Publicar para autoridad
          </button>
        </div>
      </form>

      <form
        className="card"
        onSubmit={handleUploadSharedDocument}
        style={{ marginBottom: 'var(--space-6)' }}
      >
        <div className="section-header" style={{ marginBottom: 'var(--space-4)' }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 4 }}>Documentos para autoridad</h3>
            <p className="section-subtitle">
              Los PDF y documentos que suba el analista aparecerán en la ficha de la autoridad.
            </p>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Nombre del documento</label>
            <input
              className="form-input"
              value={documentDraft.name}
              onChange={(e) => setDocumentDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Ej. Dosier actualizado junio 2026"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Categoría</label>
            <input
              className="form-input"
              value={documentDraft.category}
              onChange={(e) => setDocumentDraft((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="PDF KLE"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea
            className="form-textarea"
            rows={3}
            value={documentDraft.description}
            onChange={(e) => setDocumentDraft((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Indica qué contiene el documento y por qué es relevante para la autoridad"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Archivo PDF</label>
          <input
            className="form-input"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            {sharedDocuments.length > 0
              ? `${sharedDocuments.length} documento(s) visible(s) ya en la ficha de autoridad.`
              : 'Todavia no hay documentos sincronizados con la ficha de autoridad.'}
          </div>
          <button className="btn btn-primary" type="submit">
            Subir documento al portal
          </button>
        </div>
      </form>

      <div className="grid-3" style={{ marginBottom: 'var(--space-6)' }}>
        {mockReportTemplates.map((template) => (
          <div
            key={template.id}
            className="report-card"
            onClick={() => setSelectedTemplate(template.id)}
          >
            <div className="report-card-icon">{templateIcons[template.icon]}</div>
            <div className="report-card-title">{template.name}</div>
            <div className="report-card-desc">{template.description}</div>
            <div>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                Secciones incluidas
              </p>
              <div className="tag-list">
                {template.sections.map((s) => (
                  <span className="tag" key={s} style={{ fontSize: '0.65rem' }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="toast">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}




