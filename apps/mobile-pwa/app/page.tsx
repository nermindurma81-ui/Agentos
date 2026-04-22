'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const DEFAULT_GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://10.0.2.2:8080';

function readGatewayUrl() {
  if (typeof window === 'undefined') return DEFAULT_GATEWAY;
  return localStorage.getItem('agentixos_gateway_url') || DEFAULT_GATEWAY;
}

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [heartbeat, setHeartbeat] = useState<'green' | 'amber' | 'red'>('red');
  const [gatewayUrl, setGatewayUrl] = useState(DEFAULT_GATEWAY);
  const [gatewayDraft, setGatewayDraft] = useState(DEFAULT_GATEWAY);
  const [status, setStatus] = useState('offline');
  const [showSettings, setShowSettings] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const baseApi = useMemo(() => gatewayUrl.replace(/\/$/, ''), [gatewayUrl]);

  const reconnect = async (url: string) => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    let terminal: any;
    try {
      const [{ Terminal }, { FitAddon }] = await Promise.all([import('xterm'), import('xterm-addon-fit')]);
      terminal = new Terminal({ cols: 80, rows: 10, theme: { background: '#111827' } });
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      if (termRef.current) {
        termRef.current.innerHTML = '';
        terminal.open(termRef.current);
        fit.fit();
        terminal.writeln('AgentixOS terminal connected');
      }

      const socket = io(url, { transports: ['websocket', 'polling'], timeout: 10000 });
      socketRef.current = socket;

      socket.on('connect', () => setStatus('connected'));
      socket.on('disconnect', () => setStatus('offline'));
      socket.on('connect_error', () => setStatus('offline'));
      socket.on('model_heartbeat', (d: any) => setHeartbeat(d.status || 'red'));
      socket.on('terminal:stdout', (data: any) => terminal?.write(String(data)));
      terminal.onData((data: string) => socket.emit('terminal:stdin', data));
    } catch {
      setStatus('offline');
    }
  };

  useEffect(() => {
    const url = readGatewayUrl();
    setGatewayUrl(url);
    setGatewayDraft(url);
    void reconnect(url);

    return () => {
      if (socketRef.current) socketRef.current.close();
    };
  }, []);

  const saveGateway = async () => {
    localStorage.setItem('agentixos_gateway_url', gatewayDraft);
    setGatewayUrl(gatewayDraft);
    await reconnect(gatewayDraft);
    setShowSettings(false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      const res = await fetch(`${baseApi}/api/v1/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'mobile-session', message: input }),
      });
      const json = await res.json();
      setMessages((m) => [...m, `${input} -> run:${json.run_id}`]);
      setInput('');
    } catch {
      setMessages((m) => [...m, `ERR: backend nedostupan na ${baseApi}`]);
    }
  };

  return (
    <main className="p-3 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-3">
        <button className="px-2 py-1 bg-zinc-800 rounded" onClick={() => setShowSettings((s) => !s)}>
          ☰
        </button>
        <div className="text-sm">AgentixOS</div>
        <div className="flex items-center gap-2">
          <span className={`text-xs ${status === 'connected' ? 'text-green-400' : 'text-red-400'}`}>{status}</span>
          <div
            className={`w-3 h-3 rounded-full ${
              heartbeat === 'green' ? 'bg-green-400' : heartbeat === 'amber' ? 'bg-yellow-400' : 'bg-red-400'
            }`}
          />
        </div>
      </header>

      {showSettings && (
        <section className="bg-zinc-900 border border-zinc-700 rounded p-2 mb-3 space-y-2">
          <div className="text-xs text-zinc-400">Gateway URL (telefon to server)</div>
          <input
            value={gatewayDraft}
            onChange={(e) => setGatewayDraft(e.target.value)}
            className="w-full bg-zinc-800 p-2 rounded text-sm"
            placeholder="http://192.168.1.10:8080"
          />
          <button onClick={saveGateway} className="w-full bg-green-600 rounded px-3 py-2 text-sm">
            Save + Reconnect
          </button>
          <p className="text-[11px] text-zinc-500">Za emulator koristi 10.0.2.2, za telefon koristi LAN IP servera.</p>
        </section>
      )}

      <section className="space-y-2 mb-3">
        {messages.map((m, idx) => (
          <div key={idx} className="bg-zinc-900 p-2 rounded text-sm break-all">
            {m}
          </div>
        ))}
      </section>

      <div className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-zinc-900 p-2 rounded"
          placeholder="Poruka..."
        />
        <button onClick={sendMessage} className="bg-blue-600 px-3 rounded">
          Send
        </button>
      </div>

      <section>
        <h2 className="text-xs text-zinc-400 mb-1">Live terminal</h2>
        <div ref={termRef} className="border border-zinc-700 rounded overflow-hidden" />
      </section>
    </main>
  );
}
