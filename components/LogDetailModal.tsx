import React from 'react';
import { LogEntry } from '../types';
import { X, Copy, Check } from 'lucide-react';
import { formatDate, getTraceLevelColor, cn } from '../utils';

interface LogDetailModalProps {
  log: LogEntry | null;
  onClose: () => void;
}

const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
             <span className={cn("px-2.5 py-1 rounded text-sm font-bold border", getTraceLevelColor(log.traceLevel))}>
                {log.traceLevel}
             </span>
             <div>
                <h3 className="text-lg font-semibold text-slate-800 leading-tight">{log.operationName || 'Operation'}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{formatDate(log.eventTimestamp)}</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-0">
          <div className="p-5 space-y-6">
            {/* Primary Message */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
               <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message</h4>
               <p className="text-slate-800 font-medium whitespace-pre-wrap font-mono text-sm">{log.message}</p>
            </div>

            {/* Key Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-3 rounded border border-slate-100">
                 <span className="text-xs text-slate-500 block">Component</span>
                 <span className="font-medium text-slate-900">{log.component}</span>
               </div>
               <div className="p-3 rounded border border-slate-100">
                 <span className="text-xs text-slate-500 block">Correlation ID</span>
                 <span className="font-mono text-xs text-slate-700">{log.correlationId}</span>
               </div>
               <div className="p-3 rounded border border-slate-100">
                 <span className="text-xs text-slate-500 block">Duration</span>
                 <span className="font-medium text-slate-900">{log.durationInMilliseconds} ms</span>
               </div>
               <div className="p-3 rounded border border-slate-100">
                 <span className="text-xs text-slate-500 block">Agent ID</span>
                 <span className="font-mono text-xs text-slate-700 truncate" title={log.agentClientId}>{log.agentClientId}</span>
               </div>
            </div>

            {/* Raw JSON */}
            <div>
               <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Event Data</h4>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy JSON"}
                  </button>
               </div>
               <pre className="bg-slate-900 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
                 {JSON.stringify(log, null, 2)}
               </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailModal;
