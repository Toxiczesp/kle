import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, MutableRefObject } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardPlus,
  Copy,
  Eye,
  FileDown,
  FileInput,
  FilePlus2,
  FileSearch,
  GripVertical,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createDashboardReport,
  createDashboardTemplate,
  deleteDashboardReport,
  downloadDashboardExport,
  duplicateDashboardReport,
  extractDashboardDocument,
  getDashboardReport,
  listDashboardReports,
  listDashboardTemplates,
  updateDashboardReport,
} from '../lib/dashboardApi';
import type {
  DashboardReport,
  DashboardReportBlock,
  DashboardReportListItem,
  DashboardReportSection,
  DashboardReportStatus,
  DashboardTemplate,
  DashboardTemplateSection,
} from '../types';

type SaveState = 'saved' | 'unsaved' | 'saving' | 'error' | 'offline';
type MobileTab = 'source' | 'final';
type SourceViewMode = 'pdf' | 'text';

interface PendingTransfer {
  html: string;
  text: string;
}

const DEFAULT_SECTIONS: DashboardTemplateSection[] = [
  { id: 'cover-title', title: 'PORTADA – TÍTULO.', required: true, renamable: false, collapsed: false, order: 0 },
  { id: 'first-page', title: 'PRIMERA PÁGINA.', required: true, renamable: false, collapsed: false, order: 1 },
  { id: 'objective', title: 'OBJETIVO.', required: true, renamable: false, collapsed: false, order: 2 },
  { id: 'executive-summary', title: 'RESUMEN EJECUTIVO.', required: true, renamable: false, collapsed: false, order: 3 },
  { id: 'country-profile', title: 'PERFIL DE PAÍS U ORGANISMO: ASPECTOS SOCIOLÓGICOS.', required: true, renamable: false, collapsed: false, order: 4 },
  { id: 'target-authority-profile', title: 'PERFIL DE LA AUTORIDAD OBJETIVO.', required: true, renamable: false, collapsed: false, order: 5 },
  { id: 'biography', title: 'Biografía personal y profesional.', required: true, renamable: false, collapsed: false, order: 6 },
  { id: 'influential-people', title: 'Personas influyentes.', required: true, renamable: false, collapsed: false, order: 7 },
  { id: 'expected-behavior', title: 'Comportamiento esperado de la autoridad objetivo.', required: true, renamable: false, collapsed: false, order: 8 },
  { id: 'miscellaneous', title: 'Miscelánea.', required: false, renamable: false, collapsed: false, order: 9 },
  { id: 'kle-guidance', title: 'ORIENTACIONES PARA LA EJECUCIÓN DEL KLE.', required: true, renamable: false, collapsed: false, order: 10 },
  { id: 'supported-authority-behavior', title: 'Comportamiento recomendado de la autoridad apoyada.', required: true, renamable: false, collapsed: false, order: 11 },
  { id: 'physical-human-environment', title: 'Entorno físico y humano.', required: true, renamable: false, collapsed: false, order: 12 },
  { id: 'communication-deployment', title: 'Despliegue de la comunicación.', required: true, renamable: false, collapsed: false, order: 13 },
  { id: 'social-program-protocol', title: 'Programa social y protocolo.', required: true, renamable: false, collapsed: false, order: 14 },
  { id: 'previous-activities', title: 'Descripción de actividades previas.', required: false, renamable: false, collapsed: false, order: 15 },
  { id: 'other-interesting-aspects', title: 'Otros aspectos de interés.', required: false, renamable: false, collapsed: false, order: 16 },
];

const AUTOSAVE_DELAY_MS = 2200;
const LOCAL_BACKUP_KEY = 'kle-dashboard-local-backup';

function sanitizeHtmlClient(input: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${input || ''}</div>`, 'text/html');
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'A', 'H1', 'H2', 'H3', 'BLOCKQUOTE', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD']);
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT);
  const nodesToRemove: Element[] = [];

  while (walker.nextNode()) {
    const element = walker.currentNode as HTMLElement;
    if (!allowed.has(element.tagName)) {
      if (element.parentElement) {
        element.replaceWith(...Array.from(element.childNodes));
      } else {
        nodesToRemove.push(element);
      }
      continue;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on')) {
        element.removeAttribute(attribute.name);
      }
      if (attribute.name === 'href' && attribute.value.trim().toLowerCase().startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    });
  }

  for (const node of nodesToRemove) {
    node.remove();
  }

  return doc.body.innerHTML.trim();
}

function htmlToText(html: string) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return (doc.body.textContent || '').trim();
}

function createBlock(html: string, sectionId: string): DashboardReportBlock {
  const now = new Date().toISOString();
  return {
    id: `blk-${crypto.randomUUID()}`,
    html: sanitizeHtmlClient(html),
    text: htmlToText(html),
    sourceHash: `${sectionId}-${htmlToText(html).slice(0, 120)}`,
    createdAt: now,
    updatedAt: now,
    sectionId,
    order: 0,
  };
}

function reorderSectionBlocks(section: DashboardReportSection) {
  return {
    ...section,
    blocks: section.blocks.map((block, index) => ({ ...block, order: index, sectionId: section.id })),
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-ES');
}

function isPdfDocumentLike(document: { mimeType?: string; name?: string } | null | undefined) {
  const mimeType = String(document?.mimeType || '').toLowerCase();
  const name = String(document?.name || '').toLowerCase();
  return mimeType.includes('pdf') || name.endsWith('.pdf');
}

function createBackupSafeReport(report: DashboardReport): DashboardReport {
  return {
    ...report,
    sourceDocuments: report.sourceDocuments?.map((document) => ({
      ...document,
      contentBase64: undefined,
    })),
  };
}

interface RichTextEditorProps {
  value: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel: string;
  editorRef?: MutableRefObject<HTMLDivElement | null>;
  dataBlockId?: string;
  dataSectionId?: string;
  onFocus?: (element: HTMLDivElement) => void;
  onInput: (html: string) => void;
  onMouseUp?: () => void;
  onKeyUp?: () => void;
  onScroll?: () => void;
}

function RichTextEditor({
  value,
  className = 'analyst-rich-editor',
  style,
  ariaLabel,
  editorRef,
  dataBlockId,
  dataSectionId,
  onFocus,
  onInput,
  onMouseUp,
  onKeyUp,
  onScroll,
}: RichTextEditorProps) {
  const localRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = localRef.current;
    if (!element) {
      return;
    }

    if (editorRef) {
      editorRef.current = element;
    }

    if (element.innerHTML !== value) {
      element.innerHTML = value;
    }
  }, [editorRef, value]);

  return (
    <div
      ref={localRef}
      className={className}
      style={style}
      contentEditable
      dir="ltr"
      suppressContentEditableWarning
      data-block-id={dataBlockId}
      data-section-id={dataSectionId}
      onFocus={(event) => {
        onFocus?.(event.currentTarget);
      }}
      onInput={(event) => onInput(event.currentTarget.innerHTML)}
      onMouseUp={onMouseUp}
      onKeyUp={onKeyUp}
      onScroll={onScroll}
      aria-label={ariaLabel}
    />
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const sourceEditorRef = useRef<HTMLDivElement | null>(null);
  const sourcePageViewportRef = useRef<HTMLDivElement | null>(null);
  const sourceFileInputRef = useRef<HTMLInputElement | null>(null);
  const activeEditableRef = useRef<HTMLElement | null>(null);
  const pendingSelectionRangeRef = useRef<Range | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const lastTransferSignatureRef = useRef<string>('');
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [reports, setReports] = useState<DashboardReportListItem[]>([]);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [toast, setToast] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reportFilter, setReportFilter] = useState('');
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransfer | null>(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState(DEFAULT_SECTIONS[0].id);
  const [moveAfterTransfer, setMoveAfterTransfer] = useState(false);
  const [selectionLabel, setSelectionLabel] = useState('');
  const [processingFile, setProcessingFile] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourceSearchResult, setSourceSearchResult] = useState<string>('');
  const [sourceViewMode, setSourceViewMode] = useState<SourceViewMode>('text');
  const [sourceCurrentPage, setSourceCurrentPage] = useState(1);
  const [sourceTotalPages, setSourceTotalPages] = useState(1);
  const [historySnapshot, setHistorySnapshot] = useState<DashboardReport | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('source');
  const [dragBlock, setDragBlock] = useState<{ blockId: string; sectionId: string } | null>(null);
  const [dragSelectionActive, setDragSelectionActive] = useState(false);
  const [dropTargetSectionId, setDropTargetSectionId] = useState<string | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const { sourceDocs, activeSourceDocId, activeSourceDoc } = useMemo(() => {
    const docs = report?.sourceDocuments ? [...report.sourceDocuments] : [];
    if (docs.length === 0 && report?.sourceFile && report?.sourceDocumentHtml) {
      docs.push({
        id: 'legacy-doc',
        name: report.sourceFile.name,
        mimeType: report.sourceFile.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: report.sourceFile.size,
        lastModified: report.sourceFile.lastModified || Date.now(),
        uploadedAt: report.sourceFile.uploadedAt || new Date().toISOString(),
        contentHtml: report.sourceDocumentHtml,
        contentText: report.sourceDocumentText || '',
        pageCount: report.sourceFile.pageCount,
        extractionWarnings: report.sourceFile.extractionWarnings || [],
      });
    }
    const activeId = report?.activeSourceDocumentId || docs[0]?.id || null;
    const active = docs.find((d) => d.id === activeId) || docs[0] || null;
    return { sourceDocs: docs, activeSourceDocId: activeId, activeSourceDoc: active };
  }, [report]);

  const canPreviewPdf = Boolean(
    activeSourceDoc &&
    isPdfDocumentLike(activeSourceDoc) &&
    activeSourceDoc.contentBase64
  );
  const isLegacyPdfTextOnly = Boolean(
    activeSourceDoc &&
    isPdfDocumentLike(activeSourceDoc) &&
    !activeSourceDoc.contentBase64
  );
  const sourcePdfSrc = useMemo(() => {
    if (!canPreviewPdf || !activeSourceDoc?.contentBase64) {
      return '';
    }
    return `data:application/pdf;base64,${activeSourceDoc.contentBase64}#page=${sourceCurrentPage}&view=FitH`;
  }, [activeSourceDoc?.contentBase64, canPreviewPdf, sourceCurrentPage]);

  const filteredReports = useMemo(() => {
    const needle = reportFilter.trim().toLowerCase();
    return reports.filter((item) => {
      if (!needle) {
        return true;
      }
      return [item.title, item.reference, item.templateName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle));
    });
  }, [reportFilter, reports]);

  const refreshReportList = useCallback(async () => {
    const result = await listDashboardReports();
    setReports(result.items);
  }, []);

  const handleSave = useCallback(async (autoSaved = false) => {
    if (!report || !report.id) {
      return;
    }

    try {
      setSaveState('saving');
      const result = await updateDashboardReport(report.id, {
        title: report.title,
        reference: report.reference,
        status: report.status,
        templateId: report.templateId,
        templateName: report.templateName,
        classification: report.classification,
        sourceDocumentHtml: report.sourceDocumentHtml,
        sourceFile: report.sourceFile,
        sourceDocuments: report.sourceDocuments,
        activeSourceDocumentId: report.activeSourceDocumentId,
        sections: report.sections.map(reorderSectionBlocks),
        autoSaved,
      });
      setReport({
        ...result.item,
        sourceDocuments: result.item.sourceDocuments || report.sourceDocuments,
        activeSourceDocumentId: result.item.activeSourceDocumentId || report.activeSourceDocumentId,
      });
      setSaveState('saved');
      localStorage.removeItem(LOCAL_BACKUP_KEY);
      await refreshReportList();
      if (!autoSaved) {
        setToast('Borrador guardado.');
      }
    } catch (error) {
      setSaveState(navigator.onLine ? 'error' : 'offline');
      setToast(error instanceof Error ? error.message : 'No se pudo guardar el informe.');
    }
  }, [refreshReportList, report]);

  const statusLabel = useMemo(() => {
    if (saveState === 'saving') return 'Guardando';
    if (saveState === 'saved') return 'Guardado';
    if (saveState === 'error') return 'Error al guardar';
    if (saveState === 'offline') return 'Sin conexión';
    return 'Sin guardar';
  }, [saveState]);

  useEffect(() => {
    if (!user || user.role !== 'analista') {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const [templatesResult, reportsResult] = await Promise.all([
          listDashboardTemplates(),
          listDashboardReports(),
        ]);

        if (cancelled) {
          return;
        }

        setTemplates(templatesResult.items);
        setReports(reportsResult.items);

        if (reportsResult.items.length > 0) {
          const first = await getDashboardReport(reportsResult.items[0].id);
          if (!cancelled) {
            setReport(restoreLocalBackup(first.item));
            setTransferTargetId(first.item.sections[0]?.id || DEFAULT_SECTIONS[0].id);
          }
        } else {
          await handleCreateReport(templatesResult.items[0]?.id || 'tpl-standard');
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'No se pudo cargar el dashboard.');
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!report || !report.id) {
      return;
    }

    if (saveState === 'unsaved' || saveState === 'error' || saveState === 'offline') {
      try {
        localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify({
          reportId: report.id,
          updatedAt: report.updatedAt,
          report: createBackupSafeReport(report),
        }));
      } catch {
        // Skip local backup when the payload is too large.
      }
    }
  }, [handleSave, report, saveState]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState === 'unsaved' || saveState === 'saving') {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [saveState]);

  useEffect(() => {
    if (!report || !report.id || saveState !== 'unsaved') {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      void handleSave(true);
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [handleSave, report, saveState]);

  const updateSourcePagination = useCallback(() => {
    if (sourceViewMode === 'pdf') {
      const totalPages = Math.max(1, activeSourceDoc?.pageCount || 1);
      setSourceTotalPages(totalPages);
      setSourceCurrentPage((current) => Math.min(totalPages, Math.max(1, current)));
      return;
    }

    const element = sourceEditorRef.current;
    const viewport = sourcePageViewportRef.current;
    if (!element || !viewport) {
      setSourceCurrentPage(1);
      setSourceTotalPages(1);
      return;
    }

    const pageHeight = Math.max(viewport.clientHeight, 1);
    const totalPages = Math.max(1, Math.ceil(element.scrollHeight / pageHeight));
    const currentPage = Math.min(
      totalPages,
      Math.max(1, Math.round(viewport.scrollTop / pageHeight) + 1)
    );

    setSourceTotalPages(totalPages);
    setSourceCurrentPage(currentPage);
  }, [activeSourceDoc?.pageCount, sourceViewMode]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      updateSourcePagination();
    });

    const handleResize = () => updateSourcePagination();
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
    };
  }, [report?.sourceDocumentHtml, sourceViewMode, updateSourcePagination]);

  useEffect(() => {
    setSourceCurrentPage(1);
  }, [report?.id]);

  useEffect(() => {
    if (canPreviewPdf) {
      setSourceViewMode('pdf');
      setSourceCurrentPage(1);
      setSourceTotalPages(Math.max(1, activeSourceDoc?.pageCount || 1));
      return;
    }

    setSourceViewMode('text');
  }, [activeSourceDoc?.id, activeSourceDoc?.pageCount, canPreviewPdf]);

  function restoreLocalBackup(serverReport: DashboardReport) {
    const backupRaw = localStorage.getItem(LOCAL_BACKUP_KEY);
    if (!backupRaw) {
      return serverReport;
    }

    try {
      const parsed = JSON.parse(backupRaw) as { reportId: string; updatedAt: string; report: DashboardReport };
      if (parsed.reportId === serverReport.id && new Date(parsed.updatedAt) > new Date(serverReport.updatedAt)) {
        setToast('Se ha restaurado una copia local pendiente de guardar.');
        setSaveState('unsaved');
        return parsed.report;
      }
    } catch {
      // no-op
    }

    return serverReport;
  }

  async function handleCreateReport(templateId?: string) {
    if (!user) {
      return;
    }

    try {
      setIsBusy(true);
      const created = await createDashboardReport({
        title: 'Nuevo informe',
        templateId: templateId || templates[0]?.id || 'tpl-standard',
      });
      setReport(created.item);
      setTransferTargetId(created.item.sections[0]?.id || DEFAULT_SECTIONS[0].id);
      setSaveState('saved');
      setReportsModalOpen(false);
      setHistorySnapshot(null);
      await refreshReportList();
      setToast('Nuevo informe creado.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo crear el informe.');
    } finally {
      setIsBusy(false);
    }
  }

  function markDirty(nextReport: DashboardReport) {
    setReport({
      ...nextReport,
      sourceDocumentText: htmlToText(nextReport.sourceDocumentHtml),
    });
    setSaveState('unsaved');
  }

  async function openReport(reportId: string) {
    try {
      setIsBusy(true);
      const result = await getDashboardReport(reportId);
      setReport(restoreLocalBackup(result.item));
      setTransferTargetId(result.item.sections[0]?.id || DEFAULT_SECTIONS[0].id);
      setSaveState('saved');
      setReportsModalOpen(false);
      setHistorySnapshot(null);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo abrir el informe.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteReport(reportId: string) {
    const confirmed = window.confirm('¿Eliminar este informe? Esta acción no se puede deshacer.');
    if (!confirmed) {
      return;
    }

    try {
      await deleteDashboardReport(reportId);
      await refreshReportList();
      if (report?.id === reportId) {
        setReport(null);
      }
      setToast('Informe eliminado.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo eliminar el informe.');
    }
  }

  async function handleDuplicateReport(reportId: string) {
    try {
      const result = await duplicateDashboardReport(reportId);
      setReport(result.item);
      await refreshReportList();
      setReportsModalOpen(false);
      setToast('Informe duplicado.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo duplicar el informe.');
    }
  }

  function handleSourceInput(html: string) {
    if (!report || !activeSourceDocId) {
      return;
    }
    setPendingTransfer(null);
    setSelectionLabel('');
    const sanitized = sanitizeHtmlClient(html);
    const nextDocs = sourceDocs.map((doc) =>
      doc.id === activeSourceDocId ? { ...doc, contentHtml: sanitized } : doc
    );
    markDirty({
      ...report,
      sourceDocuments: nextDocs,
      sourceDocumentHtml: sanitized,
    });
  }

  function updateSection(sectionId: string, updater: (section: DashboardReportSection) => DashboardReportSection) {
    if (!report) {
      return;
    }

    const nextSections = report.sections.map((section) => (
      section.id === sectionId ? reorderSectionBlocks(updater(section)) : reorderSectionBlocks(section)
    ));
    markDirty({ ...report, sections: nextSections });
  }

  function addManualBlock(sectionId: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: [...section.blocks, createBlock('<p></p>', sectionId)],
    }));
  }

  function updateBlock(sectionId: string, blockId: string, html: string) {
    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.map((block) => (
        block.id === blockId
          ? { ...block, html: sanitizeHtmlClient(html), text: htmlToText(html), updatedAt: new Date().toISOString() }
          : block
      )),
    }));
  }

  function removeBlock(sectionId: string, blockId: string) {
    const confirmed = window.confirm('¿Eliminar este fragmento del informe final?');
    if (!confirmed) {
      return;
    }

    updateSection(sectionId, (section) => ({
      ...section,
      blocks: section.blocks.filter((block) => block.id !== blockId),
    }));
  }

  function moveBlock(sectionId: string, blockId: string, direction: -1 | 1) {
    updateSection(sectionId, (section) => {
      const index = section.blocks.findIndex((block) => block.id === blockId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= section.blocks.length) {
        return section;
      }
      const nextBlocks = [...section.blocks];
      [nextBlocks[index], nextBlocks[target]] = [nextBlocks[target], nextBlocks[index]];
      return { ...section, blocks: nextBlocks };
    });
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    if (!report) return;
    const index = report.sections.findIndex((s) => s.id === sectionId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= report.sections.length) {
      return;
    }
    const nextSections = [...report.sections];
    [nextSections[index], nextSections[target]] = [nextSections[target], nextSections[index]];
    const updatedSections = nextSections.map((s, idx) => ({ ...s, order: idx }));
    markDirty({ ...report, sections: updatedSections });
  }

  function toggleSection(sectionId: string) {
    updateSection(sectionId, (section) => ({ ...section, collapsed: !section.collapsed }));
  }

  function addCustomSection() {
    if (!report) {
      return;
    }
    const sectionId = `custom-${crypto.randomUUID()}`;
    markDirty({
      ...report,
      sections: [
        ...report.sections,
        {
          id: sectionId,
          title: 'Nuevo apartado',
          required: false,
          renamable: true,
          collapsed: false,
          order: report.sections.length,
          blocks: [],
        },
      ],
    });
  }

  function handleSourceSelectionCapture() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setPendingTransfer(null);
      setSelectionLabel('');
      return;
    }

    const range = selection.getRangeAt(0);
    if (!sourceEditorRef.current?.contains(range.commonAncestorContainer)) {
      setPendingTransfer(null);
      setSelectionLabel('');
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.append(range.cloneContents());
    const html = sanitizeHtmlClient(wrapper.innerHTML);
    const text = selection.toString().trim();
    if (!text) {
      setPendingTransfer(null);
      setSelectionLabel('');
      return;
    }

    pendingSelectionRangeRef.current = range.cloneRange();
    setPendingTransfer({ html: html || `<p>${text}</p>`, text });
    setSelectionLabel(text.length > 90 ? `${text.slice(0, 90)}…` : text);
  }

  function openTransferModal() {
    if (!pendingTransfer) {
      setToast('Selecciona primero un fragmento del documento fuente.');
      return;
    }
    setTransferModalOpen(true);
  }

  function handleSelectionDragStart(event: DragEvent<HTMLDivElement>) {
    if (!pendingTransfer) {
      return;
    }

    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData('text/plain', pendingTransfer.text);
    setDragSelectionActive(true);
  }

  function handleSelectionDragEnd() {
    setDragSelectionActive(false);
    setDropTargetSectionId(null);
  }

  function applyTransfer(sectionId: string, transfer: PendingTransfer, shouldMove: boolean) {
    if (!report) {
      return;
    }

    const signature = `${sectionId}:${transfer.text}`;
    if (lastTransferSignatureRef.current === signature) {
      setToast('Se ha evitado un duplicado accidental del mismo fragmento.');
      return;
    }

    setHistorySnapshot(report);

    const nextSections = report.sections.map((section) => {
      if (section.id !== sectionId) {
        return section;
      }
      return reorderSectionBlocks({
        ...section,
        blocks: [...section.blocks, createBlock(transfer.html, sectionId)],
      });
    });

    let nextSourceHtml = report.sourceDocumentHtml;
    if (shouldMove && pendingSelectionRangeRef.current) {
      pendingSelectionRangeRef.current.deleteContents();
      nextSourceHtml = sanitizeHtmlClient(sourceEditorRef.current?.innerHTML || '');
    }

    markDirty({
      ...report,
      sections: nextSections,
      sourceDocumentHtml: nextSourceHtml,
    });

    lastTransferSignatureRef.current = signature;
    window.setTimeout(() => {
      lastTransferSignatureRef.current = '';
    }, 1600);

    setPendingTransfer(null);
    setSelectionLabel('');
    setDropTargetSectionId(null);
    setTransferModalOpen(false);
    setMoveAfterTransfer(false);
    setToast('Fragmento añadido al informe final.');
  }

  function undoLastTransfer() {
    if (!historySnapshot) {
      setToast('No hay una transferencia reciente para deshacer.');
      return;
    }
    setReport(historySnapshot);
    setHistorySnapshot(null);
    setSaveState('unsaved');
    setToast('Se ha deshecho la última transferencia.');
  }

  async function handleLoadFile(file: File) {
    try {
      setProcessingFile(true);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      bytes.forEach((value) => {
        binary += String.fromCharCode(value);
      });
      const contentBase64 = btoa(binary);
      const extracted = await extractDashboardDocument({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        contentBase64,
      });
      const isPdfUpload = file.name.toLowerCase().endsWith('.pdf') || file.type.toLowerCase().includes('pdf');
      const resolvedMimeType = extracted.file?.mimeType || file.type || (isPdfUpload ? 'application/pdf' : '');
      const resolvedContentBase64 = extracted.contentBase64 || (isPdfUpload ? contentBase64 : undefined);

      const newDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: extracted.file ? extracted.file.name : file.name,
        mimeType: resolvedMimeType,
        size: extracted.file ? extracted.file.size : file.size,
        lastModified: file.lastModified,
        uploadedAt: extracted.file ? extracted.file.uploadedAt : new Date().toISOString(),
        contentHtml: extracted.html,
        contentText: extracted.text,
        contentBase64: resolvedContentBase64,
        pageCount: extracted.pageCount ?? extracted.file?.pageCount,
        extractionWarnings: extracted.warnings,
      };

      setReport((prevReport) => {
        if (!prevReport) return null;
        
        const currentDocs = prevReport.sourceDocuments ? [...prevReport.sourceDocuments] : [];
        if (currentDocs.length === 0 && prevReport.sourceFile && prevReport.sourceDocumentHtml) {
          currentDocs.push({
            id: 'legacy-doc',
            name: prevReport.sourceFile.name,
            mimeType: prevReport.sourceFile.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            size: prevReport.sourceFile.size,
            lastModified: prevReport.sourceFile.lastModified || Date.now(),
            uploadedAt: prevReport.sourceFile.uploadedAt || new Date().toISOString(),
            contentHtml: prevReport.sourceDocumentHtml,
            contentText: prevReport.sourceDocumentText || '',
            pageCount: prevReport.sourceFile.pageCount,
            extractionWarnings: prevReport.sourceFile.extractionWarnings || [],
          });
        }
        
        const nextDocs = [...currentDocs, newDoc];
        
        return {
          ...prevReport,
          sourceDocuments: nextDocs,
          activeSourceDocumentId: newDoc.id,
          sourceDocumentHtml: newDoc.contentHtml,
          sourceDocumentText: htmlToText(newDoc.contentHtml),
          sourceFile: extracted.file,
        };
      });
      setSaveState('unsaved');

      setToast(extracted.warnings.length > 0
        ? `Documento cargado con avisos: ${extracted.warnings.join(' ')}`
        : 'Documento cargado correctamente.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo procesar el archivo.');
    } finally {
      setProcessingFile(false);
      if (sourceFileInputRef.current) {
        sourceFileInputRef.current.value = '';
      }
    }
  }

  function clearSourceDocument() {
    const confirmed = window.confirm('¿Limpiar el contenido del documento fuente actual?');
    if (!confirmed || !report || !activeSourceDocId) {
      return;
    }
    setReport((prevReport) => {
      if (!prevReport) return null;
      const currentDocs = prevReport.sourceDocuments ? [...prevReport.sourceDocuments] : [];
      if (currentDocs.length === 0 && prevReport.sourceFile && prevReport.sourceDocumentHtml) {
        currentDocs.push({
          id: 'legacy-doc',
          name: prevReport.sourceFile.name,
          mimeType: prevReport.sourceFile.mimeType || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: prevReport.sourceFile.size,
          lastModified: prevReport.sourceFile.lastModified || Date.now(),
          uploadedAt: prevReport.sourceFile.uploadedAt || new Date().toISOString(),
          contentHtml: prevReport.sourceDocumentHtml,
          contentText: prevReport.sourceDocumentText || '',
          pageCount: prevReport.sourceFile.pageCount,
          extractionWarnings: prevReport.sourceFile.extractionWarnings || [],
        });
      }
      const nextDocs = currentDocs.map((d) =>
        d.id === activeSourceDocId ? { ...d, contentHtml: '', contentText: '' } : d
      );
      const updatedDoc = nextDocs.find((d) => d.id === activeSourceDocId);
      return {
        ...prevReport,
        sourceDocuments: nextDocs,
        sourceDocumentHtml: updatedDoc ? updatedDoc.contentHtml : '',
        sourceDocumentText: '',
      };
    });
    setSaveState('unsaved');
    setPendingTransfer(null);
    setSelectionLabel('');
  }

  function handleSourceSearch() {
    if (!report || !activeSourceDoc) {
      return;
    }
    const sourceText = htmlToText(activeSourceDoc.contentHtml).toLowerCase();
    const needle = sourceSearch.trim().toLowerCase();
    if (!needle) {
      setSourceSearchResult('');
      return;
    }
    const hits = sourceText.split(needle).length - 1;
    setSourceSearchResult(hits > 0 ? `${hits} coincidencia(s) en el documento fuente.` : 'Sin coincidencias.');
  }

  function goToSourcePage(direction: -1 | 1) {
    if (sourceViewMode === 'pdf') {
      setSourceCurrentPage((current) => Math.min(sourceTotalPages, Math.max(1, current + direction)));
      return;
    }

    const viewport = sourcePageViewportRef.current;
    if (!viewport) {
      return;
    }

    const pageHeight = Math.max(viewport.clientHeight, 1);
    const nextPage = Math.min(sourceTotalPages, Math.max(1, sourceCurrentPage + direction));
    viewport.scrollTo({
      top: (nextPage - 1) * pageHeight,
      behavior: 'smooth',
    });

    window.setTimeout(() => {
      updateSourcePagination();
    }, 220);
  }

  async function handleCreateTemplateFromCurrent() {
    if (!report) {
      return;
    }
    try {
      const result = await createDashboardTemplate({
        name: templateName.trim() || `Plantilla ${report.title}`,
        description: templateDescription.trim(),
        sections: report.sections.map((section, index) => ({
          id: section.id,
          title: section.title,
          required: section.required,
          renamable: section.renamable,
          collapsed: false,
          order: index,
        })),
      });
      const nextTemplates = [...templates, result.item];
      setTemplates(nextTemplates);
      setTemplateModalOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      setToast('Plantilla guardada.');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo guardar la plantilla.');
    }
  }

  async function handleApplyTemplate(templateId: string) {
    if (!report) {
      return;
    }
    const selectedTemplate = templates.find((item) => item.id === templateId);
    if (!selectedTemplate) {
      return;
    }

    const nextSections = selectedTemplate.sections.length > 0
      ? selectedTemplate.sections.map((section) => ({ ...section, blocks: [] }))
      : [];

    markDirty({
      ...report,
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      sections: nextSections,
    });
    setTemplateModalOpen(false);
    setToast(`Plantilla aplicada: ${selectedTemplate.name}.`);
  }

  async function handleExport(format: 'pdf' | 'docx') {
    if (!report?.id) {
      return;
    }
    try {
      const { blob, fileName } = await downloadDashboardExport(report.id, format);
      downloadBlob(blob, fileName);
      setToast(`Exportación ${format.toUpperCase()} completada.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'No se pudo exportar el informe.');
    }
  }

  function handleDropOnSection(targetSectionId: string) {
    if (!report) {
      return;
    }

    if (dragSelectionActive && pendingTransfer) {
      applyTransfer(targetSectionId, pendingTransfer, false);
      setDragSelectionActive(false);
      setDropTargetSectionId(null);
      return;
    }

    if (dragSectionId) {
      if (dragSectionId === targetSectionId) {
        setDragSectionId(null);
        setDropTargetSectionId(null);
        return;
      }
      const sourceIndex = report.sections.findIndex((s) => s.id === dragSectionId);
      const targetIndex = report.sections.findIndex((s) => s.id === targetSectionId);
      if (sourceIndex >= 0 && targetIndex >= 0) {
        const nextSections = [...report.sections];
        const [movedSection] = nextSections.splice(sourceIndex, 1);
        nextSections.splice(targetIndex, 0, movedSection);
        const updatedSections = nextSections.map((s, idx) => ({ ...s, order: idx }));
        markDirty({ ...report, sections: updatedSections });
      }
      setDragSectionId(null);
      setDropTargetSectionId(null);
      return;
    }

    if (!dragBlock) {
      return;
    }

    if (dragBlock.sectionId === targetSectionId) {
      setDragBlock(null);
      return;
    }

    const sourceSection = report.sections.find((section) => section.id === dragBlock.sectionId);
    const movingBlock = sourceSection?.blocks.find((block) => block.id === dragBlock.blockId);
    if (!movingBlock) {
      setDragBlock(null);
      return;
    }

    const nextSections = report.sections.map((section) => {
      if (section.id === dragBlock.sectionId) {
        return reorderSectionBlocks({
          ...section,
          blocks: section.blocks.filter((block) => block.id !== dragBlock.blockId),
        });
      }
      if (section.id === targetSectionId) {
        return reorderSectionBlocks({
          ...section,
          blocks: [...section.blocks, { ...movingBlock, id: `blk-${crypto.randomUUID()}`, sectionId: targetSectionId }],
        });
      }
      return section;
    });

    markDirty({ ...report, sections: nextSections });
    setDragBlock(null);
    setDropTargetSectionId(null);
  }

  function handleSectionDragEnter(targetSectionId: string) {
    if (!dragSelectionActive && !dragBlock && !dragSectionId) {
      return;
    }
    setDropTargetSectionId(targetSectionId);
  }

  function handleSectionDragLeave(targetSectionId: string) {
    if (dropTargetSectionId === targetSectionId) {
      setDropTargetSectionId(null);
    }
  }

  function handleQuickTransfer(sectionId: string) {
    if (!pendingTransfer) {
      setToast('Selecciona un fragmento para enviarlo a un apartado.');
      return;
    }
    applyTransfer(sectionId, pendingTransfer, false);
  }

  if (isBootstrapping) {
    return (
      <div className="analyst-dashboard-page">
        <div className="analyst-empty-hero">
          <div className="analyst-empty-icon"><LoaderCircle size={28} className="spin" /></div>
          <h3 className="analyst-empty-title">Cargando editor de informes</h3>
          <p className="analyst-empty-text">Estamos preparando los informes, plantillas y el documento de trabajo.</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'analista') {
    return (
      <div className="analyst-dashboard-page">
        <div className="empty-state">
          <div className="empty-state-icon"><AlertCircle size={24} /></div>
          <h3 className="empty-state-title">Sin permisos</h3>
          <p className="empty-state-text">Esta funcionalidad está disponible únicamente para usuarios con perfil de analista.</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="analyst-dashboard-page">
        <div className="empty-state">
          <div className="empty-state-icon"><AlertCircle size={24} /></div>
          <h3 className="empty-state-title">No se pudo cargar el Dashboard</h3>
          <p className="empty-state-text">{loadError}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="analyst-dashboard-page">
        <div className="empty-state">
          <div className="empty-state-icon"><FileSearch size={24} /></div>
          <h3 className="empty-state-title">Sin informe abierto</h3>
          <p className="empty-state-text">Crea un informe nuevo o abre un borrador existente para empezar a trabajar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analyst-dashboard-page analyst-dashboard-editor-page">
      <div className="section-header analyst-dashboard-header">
        <div>
          <h2 className="section-title">Portal Analista</h2>
          <p className="section-subtitle">Editor de informes de doble panel con persistencia real, plantillas y autoguardado.</p>
        </div>
        <div className="analyst-dashboard-actions">
          <button type="button" className="btn btn-secondary" onClick={() => void handleCreateReport()} disabled={isBusy}>
            <FilePlus2 size={18} />
            Nuevo informe
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => sourceFileInputRef.current?.click()} disabled={processingFile}>
            <FileInput size={18} />
            Cargar documento
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setTemplateModalOpen(true)}>
            <Sparkles size={18} />
            Seleccionar plantilla
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void handleSave(false)} disabled={saveState === 'saving'}>
            <Save size={18} />
            Guardar borrador
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setPreviewOpen(true)}>
            <Eye size={18} />
            Vista previa
          </button>
          <button type="button" className="btn btn-primary" onClick={() => void handleExport('pdf')}>
            <FileDown size={18} />
            Exportar PDF
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => void handleExport('docx')}>
            <FileDown size={18} />
            Exportar DOCX
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setReportsModalOpen(true)}>
            <FileSearch size={18} />
            Informes
          </button>
          <div className={`analyst-save-pill ${saveState}`}>
            {saveState === 'saving' ? <LoaderCircle size={14} className="spin" /> : saveState === 'saved' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {statusLabel}
          </div>
        </div>
      </div>

      <div className="analyst-mobile-tabs">
        <button type="button" className={`tab ${mobileTab === 'source' ? 'active' : ''}`} onClick={() => setMobileTab('source')}>Informe fuente</button>
        <button type="button" className={`tab ${mobileTab === 'final' ? 'active' : ''}`} onClick={() => setMobileTab('final')}>Informe final</button>
      </div>

      <section className="card analyst-dashboard-meta">
        <div className="form-row-3 analyst-dashboard-meta-grid">
          <label className="form-group">
            <span className="form-label">Título del informe</span>
            <input className="form-input" value={report.title} onChange={(event) => markDirty({ ...report, title: event.target.value })} />
          </label>
          <label className="form-group">
            <span className="form-label">Referencia o código</span>
            <input className="form-input" value={report.reference} onChange={(event) => markDirty({ ...report, reference: event.target.value })} />
          </label>
          <label className="form-group">
            <span className="form-label">Estado</span>
            <select className="form-select" value={report.status} onChange={(event) => markDirty({ ...report, status: event.target.value as DashboardReportStatus })}>
              <option value="draft">Borrador</option>
              <option value="review">En revisión</option>
              <option value="final">Finalizado</option>
            </select>
          </label>
        </div>
        <div className="analyst-dashboard-meta-line">
          <span><strong>Autor:</strong> {report.authorName}</span>
          <span><strong>Creado:</strong> {formatDate(report.createdAt)}</span>
          <span><strong>Última modificación:</strong> {formatDate(report.updatedAt)}</span>
          <span><strong>Plantilla:</strong> {report.templateName}</span>
        </div>
      </section>

      <div className="analyst-dashboard-workspace">
        <section className={`card analyst-dashboard-panel analyst-dashboard-source ${mobileTab !== 'source' ? 'mobile-hidden' : ''}`}>
          <div className="analyst-dashboard-panel-header">
            <div>
              <h3>Informe fuente</h3>
              <p>Escribe, pega o carga un documento y selecciona fragmentos para incorporarlos al informe final.</p>
            </div>
          </div>

          <div className="analyst-source-controls">
            <div className="search-bar analyst-dashboard-search">
              <Search size={18} />
              <input value={sourceSearch} onChange={(event) => setSourceSearch(event.target.value)} placeholder="Buscar dentro del documento fuente" />
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleSourceSearch}>
              <Search size={16} />
              Buscar
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={openTransferModal} disabled={!pendingTransfer}>
              <ClipboardPlus size={16} />
              Añadir al informe final
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearSourceDocument}>
              <Trash2 size={16} />
              Limpiar
            </button>
          </div>

          {activeSourceDoc && (
            <div className="analyst-loaded-file">
              <span><strong>Archivo:</strong> {activeSourceDoc.name}</span>
              <span>{Math.round(activeSourceDoc.size / 1024)} KB</span>
            </div>
          )}

          {processingFile && (
            <div className="analyst-inline-status">
              <LoaderCircle size={16} className="spin" />
              Procesando documento...
            </div>
          )}

          {sourceSearchResult && <div className="analyst-inline-status">{sourceSearchResult}</div>}

          {isLegacyPdfTextOnly && (
            <div className="analyst-inline-status analyst-inline-status-warning">
              Este PDF se guardo antes de activar la vista visual. Ahora mismo solo existe el texto extraido.
              Para ver fotos, sellos y maquetacion real, vuelve a subir ese PDF.
            </div>
          )}

          {canPreviewPdf && sourceViewMode === 'pdf' && (
            <div className="analyst-source-selection-helper">
              <div>
                <strong>Seleccion en PDF</strong>
                <p>En la vista PDF del navegador no podemos capturar la seleccion para arrastrarla al informe. Usa "Texto extraido" para que aparezca la tarjeta de anadir y arrastrar.</p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSourceViewMode('text')}
              >
                <ClipboardPlus size={16} />
                Ir a Texto extraido
              </button>
            </div>
          )}

          {pendingTransfer && (
            <div className="analyst-selection-card">
              <div className="analyst-selection-card-top">
                <div
                  className="analyst-selection-chip"
                  draggable
                  onDragStart={handleSelectionDragStart}
                  onDragEnd={handleSelectionDragEnd}
                >
                  <Copy size={16} />
                  Arrastra este fragmento
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={openTransferModal}>
                  <ClipboardPlus size={16} />
                  Elegir apartado
                </button>
              </div>
              <p className="analyst-selection-preview">{selectionLabel}</p>
              <div className="analyst-selection-shortcuts">
                {report.sections.slice(0, 4).map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    className="btn btn-ghost btn-sm analyst-selection-shortcut"
                    onClick={() => handleQuickTransfer(section.id)}
                  >
                    {section.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="analyst-source-pdf-shell">
            <div className="analyst-source-pdf-toolbar">
              <div className="analyst-source-pdf-chip-group">
                <div className="analyst-source-pdf-chip">Documento fuente</div>
                {sourceDocs.length > 0 && (
                  <select
                    className="analyst-source-doc-select"
                    value={activeSourceDocId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedDoc = sourceDocs.find((d) => d.id === selectedId);
                      markDirty({
                        ...report,
                        activeSourceDocumentId: selectedId,
                        sourceDocumentHtml: selectedDoc ? selectedDoc.contentHtml : '',
                        sourceFile: selectedDoc ? {
                          name: selectedDoc.name,
                          mimeType: selectedDoc.mimeType,
                          size: selectedDoc.size,
                          lastModified: selectedDoc.lastModified,
                          uploadedAt: selectedDoc.uploadedAt,
                          pageCount: selectedDoc.pageCount,
                          extractionWarnings: selectedDoc.extractionWarnings,
                        } : null,
                      });
                    }}
                  >
                    {sourceDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                )}
                {sourceDocs.length > 0 && (
                  <button
                    type="button"
                    className="btn-delete-doc"
                    title="Eliminar documento actual"
                    onClick={() => {
                      const confirmed = window.confirm(`¿Eliminar el documento "${activeSourceDoc?.name}"?`);
                      if (!confirmed) return;
                      const nextDocs = sourceDocs.filter((d) => d.id !== activeSourceDocId);
                      const nextActiveId = nextDocs[0]?.id || null;
                      const nextActiveDoc = nextDocs[0] || null;
                      markDirty({
                        ...report,
                        sourceDocuments: nextDocs,
                        activeSourceDocumentId: nextActiveId,
                        sourceDocumentHtml: nextActiveDoc ? nextActiveDoc.contentHtml : '',
                        sourceFile: nextActiveDoc ? {
                          name: nextActiveDoc.name,
                          mimeType: nextActiveDoc.mimeType,
                          size: nextActiveDoc.size,
                          lastModified: nextActiveDoc.lastModified,
                          uploadedAt: nextActiveDoc.uploadedAt,
                          pageCount: nextActiveDoc.pageCount,
                          extractionWarnings: nextActiveDoc.extractionWarnings,
                        } : null,
                      });
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="analyst-source-pdf-meta">
                {canPreviewPdf && (
                  <div className="analyst-source-view-toggle" role="tablist" aria-label="Modo de vista del PDF">
                    <button
                      type="button"
                      className={`analyst-source-view-btn ${sourceViewMode === 'pdf' ? 'active' : ''}`}
                      onClick={() => setSourceViewMode('pdf')}
                    >
                      Vista PDF
                    </button>
                    <button
                      type="button"
                      className={`analyst-source-view-btn ${sourceViewMode === 'text' ? 'active' : ''}`}
                      onClick={() => setSourceViewMode('text')}
                    >
                      Texto extraido
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="analyst-source-page-btn"
                  onClick={() => goToSourcePage(-1)}
                  disabled={sourceCurrentPage <= 1}
                >
                  <ArrowLeft size={14} />
                  Anterior
                </button>
                <span>Pagina {sourceCurrentPage} de {sourceTotalPages}</span>
                <button
                  type="button"
                  className="analyst-source-page-btn"
                  onClick={() => goToSourcePage(1)}
                  disabled={sourceCurrentPage >= sourceTotalPages}
                >
                  Siguiente
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="analyst-source-pdf-page">
              <div
                ref={sourcePageViewportRef}
                className={`analyst-source-pdf-viewport ${sourceViewMode === 'pdf' ? 'is-pdf-preview' : ''}`}
                onScroll={sourceViewMode === 'text' ? updateSourcePagination : undefined}
              >
                {canPreviewPdf && sourceViewMode === 'pdf' ? (
                  <div className="analyst-source-pdf-frame-wrap">
                    <iframe
                      key={sourcePdfSrc}
                      src={sourcePdfSrc}
                      className="analyst-source-pdf-frame"
                      title={activeSourceDoc?.name || 'Vista previa del PDF'}
                    />
                  </div>
                ) : (
                  <RichTextEditor
                    className="analyst-rich-editor analyst-source-pdf-editor"
                    editorRef={sourceEditorRef}
                    value={activeSourceDoc ? activeSourceDoc.contentHtml : ''}
                    ariaLabel="Documento fuente editable"
                    onFocus={(element) => {
                      activeEditableRef.current = element;
                    }}
                    onInput={handleSourceInput}
                    onMouseUp={handleSourceSelectionCapture}
                    onKeyUp={handleSourceSelectionCapture}
                  />
                )}
              </div>
            </div>
            {canPreviewPdf && sourceViewMode === 'pdf' && (
              <div className="analyst-inline-status">
                La vista PDF muestra imagenes, sellos y maquetacion reales. Para seleccionar texto y pasarlo al informe, cambia a "Texto extraido".
              </div>
            )}
          </div>
          <input
            ref={sourceFileInputRef}
            type="file"
            hidden
            accept=".txt,.docx,.pdf,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleLoadFile(file);
              }
            }}
          />
        </section>

        <section className={`card analyst-dashboard-panel analyst-dashboard-final ${mobileTab !== 'final' ? 'mobile-hidden' : ''}`}>
          <div className="analyst-dashboard-panel-header">
            <div>
              <h3>Informe final estructurado</h3>
            </div>
            <div className="btn-group analyst-panel-head-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCustomSection}>
                <Plus size={16} />
                Nuevo apartado
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={undoLastTransfer}>
                <Undo2 size={16} />
                Deshacer transferencia
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleSave(false)}>
                <RefreshCcw size={16} />
                Guardar ahora
              </button>
            </div>
          </div>

          <div className="analyst-final-sections">
            {report.sections.map((section) => (
              <article
                key={section.id}
                className={`analyst-final-section${
                  dropTargetSectionId === section.id ? ' drag-target' : ''
                }${pendingTransfer ? ' can-receive-transfer' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDragEnter={() => handleSectionDragEnter(section.id)}
                onDragLeave={() => handleSectionDragLeave(section.id)}
                onDrop={() => handleDropOnSection(section.id)}
              >
                <div className="analyst-final-section-head">
                  <div className="analyst-section-title-row">
                    <span
                      className="analyst-section-drag-handle"
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDragSectionId(section.id);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', section.id);
                      }}
                      onDragEnd={() => {
                        setDragSectionId(null);
                      }}
                    >
                      <GripVertical size={16} />
                    </span>
                    <button type="button" className="analyst-section-toggle" onClick={() => toggleSection(section.id)}>
                      {section.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      {section.renamable ? (
                        <input
                          className="analyst-section-title-input"
                          value={section.title}
                          onChange={(event) => updateSection(section.id, (current) => ({ ...current, title: event.target.value }))}
                        />
                      ) : (
                        <strong>{section.title}</strong>
                      )}
                    </button>
                  </div>
                  <div className="analyst-section-actions-row">
                    <div className="analyst-section-reorder-group">
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, -1)}
                        title="Subir sección"
                        aria-label="Subir sección"
                      >
                        <ArrowUp size={14} /> Subir
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(section.id, 1)}
                        title="Bajar sección"
                        aria-label="Bajar sección"
                      >
                        <ArrowDown size={14} /> Bajar
                      </button>
                    </div>
                    <button
                      type="button"
                      className="analyst-section-add-btn"
                      onClick={() => addManualBlock(section.id)}
                    >
                      <Plus size={14} /> Añadir bloque
                    </button>
                  </div>
                </div>

                {pendingTransfer && (
                  <div className="analyst-section-transfer-bar">
                    <span>Suelta aqui el fragmento o insertalo con un clic.</span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleQuickTransfer(section.id)}
                    >
                      <ClipboardPlus size={16} />
                      Anadir seleccion aqui
                    </button>
                  </div>
                )}

                {!section.collapsed && (
                  <div className="analyst-final-section-body">
                    {section.blocks.length === 0 && (
                      <div className="analyst-section-empty">Sin contenido todavía. Puedes añadir texto manualmente o soltar aquí un fragmento del documento fuente.</div>
                    )}

                    {section.blocks.map((block) => (
                      <div
                        key={block.id}
                        className="analyst-final-block"
                        draggable
                        onDragStart={() => setDragBlock({ blockId: block.id, sectionId: section.id })}
                        onDragEnd={() => setDragBlock(null)}
                      >
                        <div className="analyst-final-block-actions">
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveBlock(section.id, block.id, -1)} aria-label="Subir bloque">
                            <ArrowUp size={16} />
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => moveBlock(section.id, block.id, 1)} aria-label="Bajar bloque">
                            <ArrowDown size={16} />
                          </button>
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeBlock(section.id, block.id)} aria-label="Eliminar bloque">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <RichTextEditor
                          className="analyst-rich-editor analyst-block-editor"
                          value={block.html}
                          dataBlockId={block.id}
                          dataSectionId={section.id}
                          ariaLabel={`Contenido editable del apartado ${section.title}`}
                          onFocus={(element) => {
                            activeEditableRef.current = element;
                          }}
                          onInput={(html) => updateBlock(section.id, block.id, html)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>

      {reportsModalOpen && (
        <div className="modal-overlay" onClick={() => setReportsModalOpen(false)}>
          <div className="modal analyst-dashboard-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Gestión de informes</h3>
              <button className="modal-close" onClick={() => setReportsModalOpen(false)}>✕</button>
            </div>
            <div className="search-bar">
              <Search size={18} />
              <input value={reportFilter} onChange={(event) => setReportFilter(event.target.value)} placeholder="Buscar por título o referencia" />
            </div>
            <div className="analyst-report-library">
              {filteredReports.map((item) => (
                <div key={item.id} className={`analyst-report-library-item ${report.id === item.id ? 'active' : ''}`}>
                  <button type="button" className="analyst-report-library-main" onClick={() => void openReport(item.id)}>
                    <strong>{item.title}</strong>
                    <span>{item.reference || 'Sin referencia'} · {item.templateName}</span>
                    <small>{formatDate(item.updatedAt)}</small>
                  </button>
                  <div className="btn-group">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDuplicateReport(item.id)}>Duplicar</button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => void handleDeleteReport(item.id)}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {templateModalOpen && (
        <div className="modal-overlay" onClick={() => setTemplateModalOpen(false)}>
          <div className="modal analyst-dashboard-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Plantillas</h3>
              <button className="modal-close" onClick={() => setTemplateModalOpen(false)}>✕</button>
            </div>
            <div className="analyst-template-grid">
              {templates.map((template) => (
                <button key={template.id} type="button" className="report-card analyst-template-card" onClick={() => void handleApplyTemplate(template.id)}>
                  <div className="report-card-icon"><Sparkles size={18} /></div>
                  <div className="report-card-title">{template.name}</div>
                  <div className="report-card-desc">{template.description || 'Sin descripción.'}</div>
                </button>
              ))}
            </div>
            <div className="analyst-template-builder">
              <h4>Guardar estructura actual como plantilla</h4>
              <label className="form-group">
                <span className="form-label">Nombre</span>
                <input className="form-input" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
              </label>
              <label className="form-group">
                <span className="form-label">Descripción</span>
                <textarea className="form-textarea" value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} />
              </label>
              <button type="button" className="btn btn-primary" onClick={() => void handleCreateTemplateFromCurrent()}>
                <Save size={18} />
                Guardar plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {transferModalOpen && pendingTransfer && (
        <div className="modal-overlay" onClick={() => setTransferModalOpen(false)}>
          <div className="modal analyst-dashboard-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Añadir al informe final</h3>
              <button className="modal-close" onClick={() => setTransferModalOpen(false)}>✕</button>
            </div>
            <p className="analyst-transfer-preview">{selectionLabel}</p>
            <label className="form-group">
              <span className="form-label">Apartado de destino</span>
              <select className="form-select" value={transferTargetId} onChange={(event) => setTransferTargetId(event.target.value)}>
                {report.sections.map((section) => (
                  <option key={section.id} value={section.id}>{section.title}</option>
                ))}
              </select>
            </label>
            <label className="analyst-checkbox-row">
              <input type="checkbox" checked={moveAfterTransfer} onChange={(event) => setMoveAfterTransfer(event.target.checked)} />
              Mover y eliminar del origen
            </label>
            <button type="button" className="btn btn-primary" onClick={() => applyTransfer(transferTargetId, pendingTransfer, moveAfterTransfer)}>
              <ClipboardPlus size={18} />
              Confirmar inserción
            </button>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="modal-overlay" onClick={() => setPreviewOpen(false)}>
          <div className="modal analyst-preview-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Vista previa del informe</h3>
              <button className="modal-close" onClick={() => setPreviewOpen(false)}>✕</button>
            </div>
            <div className="report-preview">
              <div className="report-meta">
                <div>
                  <div className="report-meta-label">Informe</div>
                  <strong>{report.title}</strong>
                </div>
                <div>
                  <div className="report-meta-label">Autor</div>
                  <strong>{report.authorName}</strong>
                </div>
              </div>
              {report.sections.map((section, index) => (
                <div key={section.id}>
                  <h2>{index + 1}. {section.title}</h2>
                  {section.blocks.length === 0 ? (
                    <p>Sin contenido.</p>
                  ) : (
                    section.blocks.map((block) => (
                      <div key={block.id} dangerouslySetInnerHTML={{ __html: block.html }} />
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast" role="status" onAnimationEnd={() => setToast(null)}>
          {toast}
        </div>
      )}
    </div>
  );
}
