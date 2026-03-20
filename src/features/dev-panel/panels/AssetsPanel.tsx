/**
 * AssetsPanel — загрузка ассетов (изображения, favicon, og-image)
 * Drag & drop или file picker → base64 → WebSocket → публичная папка
 */

import React, { useState, useRef, useCallback } from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import { Upload, Image, Star, Loader2, Check, AlertCircle, X } from 'lucide-react';

interface UploadedAsset {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── DropZone ─────────────────────────────────────────────────────────────────

function DropZone({
  label,
  accept,
  onFiles,
  loading,
}: {
  label: string;
  accept: string;
  onFiles: (files: File[]) => void;
  loading: boolean;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${dragOver ? T.accent : T.border}`,
        borderRadius: 8, padding: '20px 16px',
        textAlign: 'center', cursor: 'pointer',
        background: dragOver ? T.accentSoft : T.bgHov,
        transition: 'all 0.15s',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = '';
        }}
      />
      {loading ? (
        <Loader2 size={20} style={{ color: T.accent, animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
      ) : (
        <Upload size={20} style={{ color: dragOver ? T.accent : T.fgMuted, margin: '0 auto 8px' }} />
      )}
      <div style={{ fontSize: 12, color: dragOver ? T.accent : T.fg, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 10, color: T.fgSub, marginTop: 4 }}>
        {loading ? 'Загружаем...' : 'Перетащи или кликни'}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Asset item ───────────────────────────────────────────────────────────────

function AssetItem({ asset, onCopy }: { asset: UploadedAsset; onCopy: (path: string) => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(asset.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy(asset.path);
  };

  const isImage = asset.mimeType.startsWith('image/');

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 6,
      border: `1px solid ${T.border}`, marginBottom: 6,
      background: T.bgHov,
    }}>
      {isImage ? (
        <img
          src={asset.path}
          alt=""
          style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
        />
      ) : (
        <Image size={24} style={{ color: T.fgMuted, flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: T.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {asset.filename}
        </div>
        <div style={{ fontSize: 10, color: T.fgSub, fontFamily: 'ui-monospace, monospace' }}>
          {asset.path} · {formatBytes(asset.size)}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 5,
          border: `1px solid ${copied ? T.success + '55' : T.border}`,
          background: copied ? 'rgba(34,197,94,0.1)' : 'transparent',
          color: copied ? T.success : T.fgMuted,
          fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {copied ? <Check size={10} /> : null}
        {copied ? 'Скопировано' : 'Копировать путь'}
      </button>
    </div>
  );
}

// ─── AssetsPanel ──────────────────────────────────────────────────────────────

export default function AssetsPanel() {
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [error, setError] = useState('');
  const [faviconSaved, setFaviconSaved] = useState(false);

  const handleAssetsUpload = useCallback(async (files: File[]) => {
    setAssetsLoading(true);
    setError('');
    try {
      const uploaded: UploadedAsset[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const result = await bridge.uploadAsset(file.name, base64, file.type);
        uploaded.push({
          filename: file.name,
          path: result.path,
          size: file.size,
          mimeType: file.type,
        });
      }
      setAssets(prev => [...uploaded, ...prev]);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setAssetsLoading(false);
    }
  }, []);

  const handleFaviconUpload = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setFaviconLoading(true);
    setError('');
    try {
      const base64 = await fileToBase64(file);
      await bridge.uploadFavicon(base64, file.type);
      setFaviconSaved(true);
      setTimeout(() => setFaviconSaved(false), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFaviconLoading(false);
    }
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', scrollbarWidth: 'thin' }}>
      {/* Favicon */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 700, color: T.fgSub,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          <Star size={11} />
          Favicon / Логотип
        </div>
        <DropZone
          label={faviconSaved ? '✓ Favicon обновлён!' : 'Загрузить favicon'}
          accept="image/png,image/svg+xml,image/x-icon,image/webp"
          onFiles={handleFaviconUpload}
          loading={faviconLoading}
        />
        <div style={{ fontSize: 10, color: T.fgSub, marginTop: 6, paddingLeft: 4 }}>
          Поддерживаются PNG, SVG, ICO · Сохраняется как public/favicon.png
        </div>
      </div>

      {/* General assets */}
      <div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 10, fontWeight: 700, color: T.fgSub,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          <Image size={11} />
          Изображения (public/assets/)
        </div>
        <DropZone
          label="Загрузить изображения"
          accept="image/*"
          onFiles={handleAssetsUpload}
          loading={assetsLoading}
        />

        {assets.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: T.fgSub, marginBottom: 8 }}>
              Загружено в этой сессии ({assets.length}):
            </div>
            {assets.map((a, i) => (
              <AssetItem key={i} asset={a} onCopy={() => {}} />
            ))}
          </div>
        )}
      </div>

      {/* OG Image */}
      <div style={{ marginTop: 20 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: T.fgSub,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          marginBottom: 8,
        }}>
          OG Image (Social preview)
        </div>
        <DropZone
          label="Загрузить og-image.png"
          accept="image/png,image/jpg,image/jpeg,image/webp"
          onFiles={async (files) => {
            const file = files[0];
            if (!file) return;
            const base64 = await fileToBase64(file);
            await bridge.uploadAsset('og-image.png', base64, file.type);
            setAssets(prev => [{
              filename: 'og-image.png',
              path: '/og-image.png',
              size: file.size,
              mimeType: file.type,
            }, ...prev]);
          }}
          loading={false}
        />
        <div style={{ fontSize: 10, color: T.fgSub, marginTop: 6, paddingLeft: 4 }}>
          Рекомендуется 1200×630 px для Open Graph
        </div>
      </div>

      {error && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 6,
          background: T.dangerSoft, color: T.danger, fontSize: 11,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}
    </div>
  );
}