import React, { useEffect, useState, useMemo } from 'react';
import api from '../axios';
import { Phone, Calendar, CheckCircle, AlertCircle, Clock, Search } from 'lucide-react';

export const CallHistory: React.FC = () => {
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const fetchCallLogs = async () => {
      try {
        setLoading(true);
        const resp = await api.get('/vapi/calls/me');
        setCallLogs(resp.data.data || []);
      } catch (err: any) {
        console.error('Failed to fetch call logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCallLogs();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'failed':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const filteredCallLogs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return callLogs;
    return callLogs.filter((c) => {
      const phone = (c.phone || '').toString();
      const transcript = (c.transcript || '').toString().toLowerCase();
      return phone.includes(q) || transcript.includes(q) || (c.vapiCallId || '').toLowerCase().includes(q);
    });
  }, [callLogs, query]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <p className="text-gray-500">Loading call history...</p>
      </div>
    );
  }

  if (callLogs.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <Phone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No calls yet. Upload a file to start.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Call List */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Call History</h3>
              <p className="text-sm text-gray-500">{callLogs.length} total • {filteredCallLogs.length} shown</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by phone, transcript or id"
                  className="pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm w-64 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredCallLogs.map((call) => (
              <div
                key={call._id}
                onClick={() => setSelectedCall(call)}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedCall?._id === call._id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(call.status)}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{call.phone}</p>
                      <p className="text-sm text-gray-500 truncate">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(call.createdAt)}
                      </p>
                      {call.transcript && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{call.transcript.slice(0, 140)}{call.transcript.length > 140 ? '...' : ''}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      call.status === 'completed' ? 'bg-green-100 text-green-800' :
                      call.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      call.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {call.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call Details */}
        <div className="lg:col-span-1">
          {selectedCall ? (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Phone</h4>
                <p className="text-lg font-mono text-gray-900">{selectedCall.phone}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Status</h4>
                <p className={`text-sm font-medium ${
                  selectedCall.status === 'completed' ? 'text-green-600' :
                  selectedCall.status === 'in-progress' ? 'text-blue-600' :
                  selectedCall.status === 'failed' ? 'text-red-600' :
                  'text-gray-600'
                }`}>
                  {selectedCall.status}
                </p>
              </div>

              {selectedCall.vapiCallId && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">VAPI Call ID</h4>
                  <p className="text-xs font-mono text-gray-600 break-all">{selectedCall.vapiCallId}</p>
                </div>
              )}

              {selectedCall.twilioCallSid && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Twilio Call SID</h4>
                  <p className="text-xs font-mono text-gray-600 break-all">{selectedCall.twilioCallSid}</p>
                </div>
              )}

              {selectedCall.error && (
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <h4 className="text-sm font-semibold text-red-700 mb-1">Error</h4>
                  <p className="text-xs text-red-600">{selectedCall.error}</p>
                </div>
              )}

              {selectedCall.createdAt && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Created</h4>
                  <p className="text-xs text-gray-600">{formatDate(selectedCall.createdAt)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a call to view details
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {selectedCall?.transcript && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Transcript</h4>
          <div className="bg-gray-50 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap text-sm text-gray-700">
            {selectedCall.transcript}
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedCall?.summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Summary</h4>
          <p className="text-gray-700">{selectedCall.summary}</p>
        </div>
      )}
    </div>
  );
};

export default CallHistory;
