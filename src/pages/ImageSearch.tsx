import { useState, useRef, useCallback } from 'react';
import {
  Search,
  Download,
  CheckSquare,
  Square,
  Loader2,
  ImageOff,
  Camera,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Images,
} from 'lucide-react';
import { postJson } from '../lib/apiClient';
import '../styles/workspace-image-search.css';

interface ImageResult {
  url: string;
  originalUrl?: string;
  description: string;
}

export default function ImageSearch() {
  const [query, setQuery] = useState('');
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [downloading, setDownloading] = useState<Set<number>>(new Set());
  const [downloadSuccess, setDownloadSuccess] = useState<Set<number>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [downloadingLocal, setDownloadingLocal] = useState(false);
  const [localSuccess, setLocalSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError('');
    setImages([]);
    setSearched(true);
    setSelected(new Set());
    setDownloadSuccess(new Set());
    setFailedImages(new Set());
    setLocalSuccess('');

    try {
      const result = await postJson<{ ok: boolean; images: ImageResult[] }>(
        '/api/image-search',
        { query: trimmed }
      );
      setImages(result.images || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error buscando imágenes.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleSelect = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const selectAll = () => {
    const validIndexes = images
      .map((_, i) => i)
      .filter((i) => !failedImages.has(i));
    setSelected(new Set(validIndexes));
  };

  const deselectAll = () => {
    setSelected(new Set());
  };

  const downloadSingle = async (url: string, index: number) => {
    setDownloading((prev) => new Set(prev).add(index));
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      // Try extracting a useful filename
      const urlPath = new URL(url).pathname;
      const fileName = urlPath.split('/').pop() || `imagen-${index + 1}.jpg`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setDownloadSuccess((prev) => new Set(prev).add(index));
      setTimeout(() => {
        setDownloadSuccess((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 2000);
    } catch {
      // fallback: open in new tab
      window.open(url, '_blank');
    } finally {
      setDownloading((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const downloadSelectedLocal = async () => {
    const urlsToDownload = Array.from(selected)
      .filter((idx) => !failedImages.has(idx))
      .map((idx) => images[idx].originalUrl || images[idx].url);

    if (urlsToDownload.length === 0) return;

    setDownloadingLocal(true);
    setError('');
    setLocalSuccess('');

    try {
      const response = await postJson<{ ok: boolean; folderPath: string; successfulCount: number }>(
        '/api/download-images',
        { query: query.trim(), urls: urlsToDownload }
      );
      if (response.ok) {
        setLocalSuccess(
          `¡Descarga completada! Se descargaron con éxito ${response.successfulCount} de ${urlsToDownload.length} imágenes. Se ha abierto la carpeta en tu explorador de archivos.`
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al descargar las imágenes en la carpeta del servidor.'
      );
    } finally {
      setDownloadingLocal(false);
    }
  };

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set(prev).add(index));
  };

  const validImages = images.filter((_, i) => !failedImages.has(i));
  const selectedCount = Array.from(selected).filter((i) => !failedImages.has(i)).length;

  return (
    <div className="imgsearch-page">
      {/* ─── Search Header ─── */}
      <div className="imgsearch-hero">
        <div className="imgsearch-hero-icon">
          <Camera size={32} />
        </div>
        <h2 className="imgsearch-hero-title">Buscador de Imágenes</h2>
        <p className="imgsearch-hero-subtitle">
          Busca fotos de cualquier persona. Escribe el nombre completo para obtener mejores resultados.
        </p>

        <div className="imgsearch-search-bar">
          <div className="imgsearch-search-input-wrapper">
            <Search size={18} className="imgsearch-search-icon" />
            <input
              ref={inputRef}
              className="imgsearch-search-input"
              type="text"
              placeholder="Ej: Pedro Sánchez, Emmanuel Macron..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            {query && !loading && (
              <button
                className="imgsearch-search-clear"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                title="Limpiar"
              >
                <XCircle size={16} />
              </button>
            )}
          </div>
          <button
            className="imgsearch-search-btn"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="imgsearch-spinner" />
                Buscando…
              </>
            ) : (
              <>
                <Search size={16} />
                Buscar fotos
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Error Banner ─── */}
      {error && (
        <div className="imgsearch-error">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Local Download Success Banner ─── */}
      {localSuccess && (
        <div className="imgsearch-success-banner">
          <CheckCircle2 size={18} className="imgsearch-success-icon" />
          <div className="imgsearch-success-text">
            <span>{localSuccess}</span>
          </div>
          <button className="imgsearch-success-close" onClick={() => setLocalSuccess('')}>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* ─── Loading Skeleton ─── */}
      {loading && (
        <div className="imgsearch-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="imgsearch-card imgsearch-skeleton">
              <div className="imgsearch-skeleton-img" />
              <div className="imgsearch-skeleton-text" />
              <div className="imgsearch-skeleton-text short" />
            </div>
          ))}
        </div>
      )}

      {/* ─── Results Toolbar ─── */}
      {!loading && searched && validImages.length > 0 && (
        <div className="imgsearch-toolbar">
          <div className="imgsearch-toolbar-left">
            <span className="imgsearch-results-count">
              <Images size={16} />
              {validImages.length} imagen{validImages.length !== 1 ? 'es' : ''} encontrada{validImages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="imgsearch-toolbar-right">
            <button
              className="imgsearch-tool-btn"
              onClick={selectedCount === validImages.length ? deselectAll : selectAll}
            >
              {selectedCount === validImages.length ? (
                <><CheckSquare size={15} /> Deseleccionar</>
              ) : (
                <><Square size={15} /> Seleccionar todo</>
              )}
            </button>
            {selectedCount > 0 && (
              <button
                className="imgsearch-tool-btn primary"
                onClick={downloadSelectedLocal}
                disabled={downloadingLocal}
              >
                {downloadingLocal ? (
                  <>
                    <Loader2 size={15} className="imgsearch-spinner" />
                    Descargando...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Descargar {selectedCount} {selectedCount !== 1 ? 'imágenes' : 'imagen'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Image Grid ─── */}
      {!loading && searched && images.length > 0 && (
        <div className="imgsearch-grid">
          {images.map((img, index) => {
            if (failedImages.has(index)) return null;
            const isSelected = selected.has(index);
            const isDownloading = downloading.has(index);
            const isDownloaded = downloadSuccess.has(index);

            return (
              <div
                key={index}
                className={`imgsearch-card ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelect(index)}
              >
                <div className="imgsearch-card-img-wrapper">
                  <img
                    src={img.url}
                    alt={img.description || `Resultado ${index + 1}`}
                    className="imgsearch-card-img"
                    loading="lazy"
                    onError={() => handleImageError(index)}
                  />
                  <div className="imgsearch-card-overlay">
                    <button
                      className="imgsearch-card-action"
                      title="Abrir en nueva pestaña"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(img.url, '_blank');
                      }}
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      className="imgsearch-card-action"
                      title="Descargar imagen"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadSingle(img.url, index);
                      }}
                      disabled={isDownloading}
                    >
                      {isDownloaded ? (
                        <CheckCircle2 size={16} />
                      ) : isDownloading ? (
                        <Loader2 size={16} className="imgsearch-spinner" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                  </div>
                  <div className={`imgsearch-card-check ${isSelected ? 'visible' : ''}`}>
                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                  </div>
                </div>
                {img.description && (
                  <p className="imgsearch-card-desc">{img.description}</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Empty State ─── */}
      {!loading && searched && validImages.length === 0 && !error && (
        <div className="imgsearch-empty">
          <div className="imgsearch-empty-icon">
            <ImageOff size={48} />
          </div>
          <h3 className="imgsearch-empty-title">No se encontraron imágenes</h3>
          <p className="imgsearch-empty-subtitle">
            Intenta con otro nombre o añade más detalles (ej: cargo, país).
          </p>
        </div>
      )}
    </div>
  );
}
