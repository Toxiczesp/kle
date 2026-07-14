import type {
  DashboardReport,
  DashboardReportListItem,
  DashboardTemplate,
} from '../types';
import { apiRequest, deleteRequest, postJson, putJson } from './apiClient';

interface ReportPayload {
  title: string;
  reference: string;
  status: DashboardReport['status'];
  templateId: string;
  templateName?: string;
  classification: string;
  sourceDocumentHtml: string;
  sourceFile: DashboardReport['sourceFile'];
  sourceDocuments?: DashboardReport['sourceDocuments'];
  activeSourceDocumentId?: DashboardReport['activeSourceDocumentId'];
  sections: DashboardReport['sections'];
  autoSaved?: boolean;
}

export function listDashboardReports(filters?: { search?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) {
    params.set('search', filters.search);
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }
  const query = params.toString();
  return apiRequest<{ items: DashboardReportListItem[] }>(
    `/api/dashboard/reports${query ? `?${query}` : ''}`
  );
}

export function getDashboardReport(id: string) {
  return apiRequest<{ item: DashboardReport }>(`/api/dashboard/reports/${id}`);
}

export function createDashboardReport(payload: Partial<ReportPayload> & { templateId?: string; title?: string }) {
  return postJson<{ item: DashboardReport }>('/api/dashboard/reports', payload);
}

export function updateDashboardReport(id: string, payload: ReportPayload) {
  return putJson<{ item: DashboardReport }>(`/api/dashboard/reports/${id}`, payload);
}

export function deleteDashboardReport(id: string) {
  return deleteRequest<{ ok: true }>(`/api/dashboard/reports/${id}`);
}

export function duplicateDashboardReport(id: string) {
  return postJson<{ item: DashboardReport }>(`/api/dashboard/reports/${id}/duplicate`, {});
}

export function listDashboardTemplates() {
  return apiRequest<{ items: DashboardTemplate[] }>('/api/dashboard/templates');
}

export function createDashboardTemplate(payload: {
  name: string;
  description: string;
  sections: DashboardTemplate['sections'];
}) {
  return postJson<{ item: DashboardTemplate }>('/api/dashboard/templates', payload);
}

export function extractDashboardDocument(payload: {
  fileName: string;
  mimeType: string;
  size: number;
  contentBase64: string;
}) {
  return postJson<{
    html: string;
    text: string;
    warnings: string[];
    file: DashboardReport['sourceFile'];
  }>('/api/dashboard/extract-document', payload);
}

export async function downloadDashboardExport(reportId: string, format: 'pdf' | 'docx') {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  if (import.meta.env.PROD && import.meta.env.VERCEL && !baseUrl) {
    throw new Error('La app está desplegada en Vercel pero `VITE_API_BASE_URL` no está configurada. Debes apuntar el frontend a un backend publicado.');
  }
  const response = await fetch(`${baseUrl}/api/dashboard/reports/${reportId}/export?format=${format}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('kle-session-token') || ''}`,
    },
  });

  if (!response.ok) {
    let message = `No se pudo exportar el informe (${response.status}).`;
    try {
      const payload = await response.json() as { error?: string };
      message = payload.error || message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const fileName = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `informe.${format}`;
  return { blob, fileName };
}
