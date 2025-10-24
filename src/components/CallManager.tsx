import React, { useState, useEffect } from 'react';
import api from '../axios';
import { FileUploader } from './FileUploader';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SSEEvent {
  type: string;
  number?: string;
  status?: string;
  response?: any;
  error?: string;
}

interface CallManagerProps {
  externalSessionId?: string | null;
}

export const CallManager: React.FC<CallManagerProps> = ({ externalSessionId = null }) => {
  const [sessionId, setSessionId] = useState<string | null>(externalSessionId);
  const [events, setEvents] = useState<SSEEvent[]>([]);

  // Update internal sessionId when externalSessionId changes
  useEffect(() => {
    if (externalSessionId) {
      console.log('CallManager: received externalSessionId', externalSessionId);
      setSessionId(externalSessionId);
      setEvents((prev) => [...prev, { type: 'info', status: 'session_started', response: { sessionId: externalSessionId } }]);
    }
  }, [externalSessionId]);

  // No SSE: Twilio worker runs server-side. We display session info and logs here.
  const startSessionWithNumbers = async (numbers: string[]) => {
    if (!numbers || numbers.length === 0) return;
    try {
      setEvents([]);
      const resp = await api.post('/data/call', { numbers });
      if (resp.data && resp.data.sessionId) {
        setSessionId(resp.data.sessionId);
        setEvents((prev) => [...prev, { type: 'info', status: 'started', response: { total: numbers.length } }]);
      } else {
        console.error('No sessionId from server', resp.data);
        setEvents((prev) => [...prev, { type: 'error', error: 'No sessionId returned' }]);
      }
    } catch (err: any) {
      console.error('Failed to start session', err);
      setEvents((prev) => [...prev, { type: 'error', error: err?.message || String(err) }]);
    }
  };

  // note: session lifecycle is managed server-side; client stop is not implemented

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1">Batch Call Manager</h2>
          <p className="text-sm text-gray-500">Upload a file to call numbers one-by-one. Session runs on the server.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 text-right">
            <div>Session: <span className="font-mono text-xs text-gray-800">{sessionId || '—'}</span></div>
            <div className="mt-1">Status: <span className={`px-2 py-0.5 rounded text-xs font-medium ${sessionId ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>{sessionId ? 'Running' : 'Idle'}</span></div>
          </div>
        </div>
      </div>

      <div className="mt-4 border border-gray-100 rounded-md p-4 bg-gray-50">
        <FileUploader onUpload={startSessionWithNumbers} />
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Events</h3>
        <div className="max-h-48 overflow-y-auto divide-y rounded-md border border-gray-100">
          {events.length === 0 && (
            <div className="p-3 text-sm text-gray-500">No events yet. Start a session or upload a file.</div>
          )}
          {events.map((ev, idx) => (
            <div key={idx} className="p-3 flex items-start gap-3">
              <div className="mt-0.5">
                {ev.type === 'error' ? <AlertCircle className="w-5 h-5 text-red-600" /> : <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-800 font-medium truncate">{ev.number ?? (ev.response?.sessionId ? `Session ${ev.response.sessionId}` : ev.status)}</div>
                  <div className="text-xs text-gray-500">{ev.response?.total ? `${ev.response.total} numbers` : ''}</div>
                </div>
                {ev.error && <div className="text-xs text-red-600 mt-1">{ev.error}</div>}
                {ev.response && <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap max-h-20 overflow-y-auto">{JSON.stringify(ev.response)}</pre>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
