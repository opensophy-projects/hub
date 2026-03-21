import React, { useState, useRef, useCallback, useContext } from 'react';
import { bridge } from '../useDevBridge';
import { ThemeTokensContext } from '../DevPanel';
import { toast } from '../components/Toast';
import { Upload, Image, Star, Loader2, Check } from 'lucide-react';

interface UploadedAsset {
  filename: string;
  path: string;
  size: number;
  mimeType: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload  = () => resolve((r.result as string).split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Дропзона для загрузки файлов — поддерживает drag-and-drop и клик
function DropZone({ label, accept, onFiles, loading, hint, t }: Readonly<{
  label: string;
  accept: string;
  onFiles: (files: File[]) => void;
  loading: boolean;
  hint?: string;
  t: ReturnType<typeof import('../DevPanel').makeT>;
}>) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length) onFiles(files);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
  };

  const dzBg     = dragOver ? t.surfaceHov : t.surface;
  const dzBorder = dragOver ? t.borderStrong : t.border;

  return (
    <div>
      <button
        type="button"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          border: `1.5px dashed ${dzBorder}`,
          borderRadius: 10,
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dzBg,
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
        {loading
          ? <Loader2 size={22} style={{ color: t.fgMuted, animation: 'devSpin 1s linear infinite', margin: '0 auto 10px' }}/>
          : <Upload size={22} style={{ color: dragOver ? t.fg : t.fgMuted, margin: '0 auto 10px' }}/>
        }
        <div style={{ fontSize: 13, color: dragOver ? t.fg : t.fgMuted, fontWeight: 500, fontFamily: t.mono }}>
          {loading ? 'Загружаем...' : label}
        </div>
        <div style={{ fontSize: 11, color: t.fgSub, marginTop: 4 }}>
          {loading ? '' : 'Перетащи или кликни'}
        </div>
      </button>
      {hint && (
        <div style={{ fontSize: 10, color: t.fgSub, marginTop: 6, paddingLeft: 2 }}>{hint}</div>
      )}
    </div>
  );
}

// Элемент списка загруженного ассета с кнопкой копирования пути
function AssetItem({ asset, t }: Readonly<{
  asset: UploadedAsset;
  t: ReturnType<typeof import('../DevPanel').makeT>;
}>) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(asset.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Путь скопирован');
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '7px 10px', borderRadius: 7,
      border: `1px solid ${t.border}`, marginBottom: 6,
      background: t.surface,
    }}>
      {asset.mimeType.startsWith('image/') ? (
        <img src={asset.path} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}/>
      ) : (
        <Image size={24} style={{ color: t.fgMuted, flexShrink: 0 }}/>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: t.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: t.mono }}>
          {asset.filename}
        </div>
        <div style={{ fontSize: 10, color: t.fgSub, fontFamily: t.mono }}>
          {asset.path} · {formatBytes(asset.size)}
        </div>
      </div>
      <button
        onClick={copy}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 5,
          border: `1px solid ${copied ? t.success + '55' : t.border}`,
          background: copied ? t.bg : 'transparent',
          color: copied ? t.success : t.fgMuted,
          fontSize: 10, cursor: 'pointer', fontFamily: t.mono, whiteSpace: 'nowrap',
        }}
      >
        {copied ? <Check size={10}/> : null}
        {copied ? 'Скопировано' : 'Копировать путь'}
      </button>
    </div>
  );
}

export default function AssetsPanel() {
  const t = useContext(ThemeTokensContext);
  const [assets,         setAssets]         = useState<UploadedAsset[]>([]);
  const [faviconLoading, setFaviconLoading] = useState(false);
  const [assetsLoading,  setAssetsLoading]  = useState(false);
  const [error,          setError]          = useState('');
  const [faviconSaved,   setFaviconSaved]   = useState(false);

  const handleAssetsUpload = useCallback(async (files: File[]) => {
    setAssetsLoading(true);
    setError('');
    try {
      const uploaded: UploadedAsset[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        const result = await bridge.uploadAsset(file.name, base64, file.type);
        uploaded.push({ filename: file.name, path: result.path, size: file.size, mimeType: file.type });
      }
      setAssets(prev => [...uploaded, ...prev]);
      toast.success(`Загружено: ${uploaded.length} файл(ов)`);
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
      toast.success('Favicon обновлён');
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFaviconLoading(false);
    }
  }, []);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: t.bg }} className="adm-scroll">

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 700, color: t.fgSub,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
      }}>
        <Star size={10}/> FAVICON / ЛОГОТИП
      </div>

      <DropZone
        label={faviconSaved ? '✓ Favicon обновлён!' : 'Загрузить favicon'}
        accept="image/png,image/svg+xml,image/x-icon,image/webp"
        onFiles={handleFaviconUpload}
        loading={faviconLoading}
        hint="PNG, SVG, ICO · Сохраняется как public/favicon.png"
        t={t}
      />

      <div style={{ height: 1, background: t.border, margin: '16px 0' }}/>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 9, fontWeight: 700, color: t.fgSub,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
      }}>
        <Image size={10}/> ИЗОБРАЖЕНИЯ (PUBLIC/ASSETS/)
      </div>

      <DropZone
        label="Загрузить изображения"
        accept="image/*"
        onFiles={handleAssetsUpload}
        loading={assetsLoading}
        hint="Загруженные файлы доступны по пути /assets/filename"
        t={t}
      />

      {assets.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 10, color: t.fgSub, marginBottom: 8, fontFamily: t.mono }}>
            Загружено в этой сессии ({assets.length}):
          </div>
          {assets.map(a => <AssetItem key={a.filename} asset={a} t={t}/>)}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 6,
          background: t.bg, border: `1px solid ${t.danger}44`,
          color: t.danger, fontSize: 11,
          display: 'flex', gap: 6, alignItems: 'center',
        }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}