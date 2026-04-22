'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';

const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:8080';

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [heartbeat, setHeartbeat] = useState<'green'|'amber'|'red'>('red');
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io(gateway);
    socket.on('model_heartbeat', (d) => setHeartbeat(d.status || 'red'));
    socket.on('terminal:stdout', (data) => terminal?.write(String(data)));

    const terminal = new Terminal({ cols: 80, rows: 10, theme: { background: '#111827' } });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    if (termRef.current) {
      terminal.open(termRef.current);
      fit.fit();
      terminal.writeln('AgentixOS terminal connected');
    }
    terminal.onData((data) => socket.emit('terminal:stdin', data));

    return () => {
      socket.close();
      terminal.dispose();
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const res = await fetch(`${gateway}/api/v1/agents/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'mobile-session', message: input }),
    });
    const json = await res.json();
    setMessages((m) => [...m, `${input} -> run:${json.run_id}`]);
    setInput('');
  };

  return (
    <main className="p-3 max-w-md mx-auto">
      <header className="flex items-center justify-between mb-3">
        <button className="px-2 py-1 bg-zinc-800 rounded">☰</button>
        <div className="text-sm">AgentixOS</div>
        <div className={`w-3 h-3 rounded-full ${heartbeat === 'green' ? 'bg-green-400' : heartbeat === 'amber' ? 'bg-yellow-400' : 'bg-red-400'}`} />
      </header>

      <section className="space-y-2 mb-3">
        {messages.map((m, idx) => (
          <div key={idx} className="bg-zinc-900 p-2 rounded text-sm break-all">{m}</div>
        ))}
      </section>

      <div className="flex gap-2 mb-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 bg-zinc-900 p-2 rounded" placeholder="Poruka..." />
        <button onClick={sendMessage} className="bg-blue-600 px-3 rounded">Send</button>
      </div>

      <section>
        <h2 className="text-xs text-zinc-400 mb-1">Live terminal</h2>
        <div ref={termRef} className="border border-zinc-700 rounded overflow-hidden" />
      </section>
    </main>
  );
}
