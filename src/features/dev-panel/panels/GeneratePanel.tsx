/**
 * GeneratePanel — запуск скриптов генерации, просмотр лога
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { bridge } from '../useDevBridge';
import { T } from '../DevPanel';
import { Terminal, Play, RefreshCw, CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react';

interface LogLine {
  text: string;
  type: 'out' | 'err' | 'info' | 'success' | 'cmd';
  ts: number;
}

// ─── Анимированная строка лога ────────────────────────────────────────────────

function LogEntry({ line }: { line: LogLine }) {
  const color = {
    out:     T.fg,
    err:     T.danger,
    info:    T.fgSub,
    success: T.success,
    cmd:     T.accent,
  }[line.type];

  return (
    <div style={{ display: 'flex', gap: 8, padding: '1px 0', lineHeight: 1.6 }}>
      <span style={{ fontSize: 9, color: T.fgSub, whiteSpace: 'nowrap', paddingTop: 2 }}>
        {new Date(line.ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
      <span style={{ fontSize: 11, color, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {line.text}
      </span>
    </div>
  );
}

// ─── GeneratePanel ────────────────────────────────────────────────────────────

export default function GeneratePanel() {
  const [logs, setLogs] = useState<LogLine[]>([
    { text: 'Hub Dev Panel — Generate', type: 'info', ts: Date.now() },
    { text: 'Нажми кнопку чтобы запустить генерацию', type: 'info', ts: Date.now() },
  ]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<'ok' | 'fail' | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: LogLine['type'] = 'out') => {
    setLogs(prev => [...prev, { text, type, ts: Date.now() }]);
  };

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const runGenerate = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setLastResult(null);
    addLog('$ node scripts/generate.mjs', 'cmd');

    try {
      const result = await bridge.runGenerate();
      if (result.stdout) {
        result.stdout.split('\n').filter(Boolean).forEach(line => addLog(line, 'out'));
      }
      if (result.stderr) {
        result.stderr.split('\n').filter(Boolean).forEach(line => addLog(line, 'err'));
      }
      if (result.ok) {
        addLog('✓ Генерация завершена успешно', 'success');
        setLastResult('ok');
      } else {
        addLog('✗ Ошибка при генерации', 'err');
        setLastResult('fail');
      }
    } catch (e: unknown) {
      addLog(`✗ ${(e as Error).message}`, 'err');
      setLastResult('fail');
    } finally {
      setRunning(false);
    }
  }, [running]);

  const clearLogs = () => {
    setLogs([]);
    setLastResult(null);
  };

  // Быстрые команды
  const quickActions = [
    {
      label: 'generate.mjs',
      desc: 'Docs → manifest.json + sitemap',
      icon: <Terminal size={12} />,
      action: runGenerate,
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px', borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
      }}>
        <button
          onClick={runGenerate}
          disabled={running}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 6,
            border: `1px solid ${T.accent}55`,
            background: T.accentSoft, color: T.accent,
            fontSize: 12, fontWeight: 700, cursor: running ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {running
            ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
            : <Play size={13} />
          }
          {running ? 'Выполняется...' : 'Запустить generate'}
        </button>

        <div style={{ flex: 1 }} />

        {lastResult === 'ok' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.success }}>
            <CheckCircle size={12} /> OK
          </div>
        )}
        {lastResult === 'fail' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.danger }}>
            <XCircle size={12} /> Error
          </div>
        )}

        <button
          onClick={clearLogs}
          style={{
            display: 'flex', padding: '5px 8px', borderRadius: 5,
            border: `1px solid ${T.border}`,
            background: 'transparent', color: T.fgSub,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Info */}
      <div style={{
        padding: '8px 12px', background: T.bgPanel,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, color: T.fgSub, lineHeight: 1.7 }}>
          <div>• <span style={{ color: T.fg }}>generate.mjs</span> → сканирует Docs/, создаёт manifest.json и sitemap.xml</div>
          <div>• После изменения файлов через панель запускается автоматически</div>
          <div>• Можно запустить вручную если что-то пошло не так</div>
        </div>
      </div>

      {/* Log terminal */}
      <div
        ref={logRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '10px 12px',
          fontFamily: 'ui-monospace, monospace',
          background: '#080810',
          scrollbarWidth: 'thin',
        }}
      >
        {logs.map((line, i) => <LogEntry key={i} line={line} />)}
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
            <Loader2 size={11} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: T.fgSub }}>Выполняется...</span>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}