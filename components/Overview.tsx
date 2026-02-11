import React from 'react';
import { LogEntry } from '../types';
import { AlertOctagon, Activity, Clock, Layers } from 'lucide-react';

interface OverviewProps {
  logs: LogEntry[];
}

const Overview: React.FC<OverviewProps> = ({ logs }) => {
  const totalLogs = logs.length;
  const errors = logs.filter(l => l.traceLevel === 'Error' || l.traceLevel === 'Critical').length;
  const warnings = logs.filter(l => l.traceLevel === 'Warning').length;
  const components = new Set(logs.map(l => l.component)).size;
  
  const startTime = logs.length > 0 ? new Date(logs[0].eventTimestamp) : null;
  const endTime = logs.length > 0 ? new Date(logs[logs.length - 1].eventTimestamp) : null;
  
  let duration = 'N/A';
  if (startTime && endTime) {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    duration = `${diffMins}m ${diffSecs}s`;
  }

  const errorRate = totalLogs > 0 ? ((errors / totalLogs) * 100).toFixed(1) : '0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total Logs</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalLogs.toLocaleString()}</h3>
        </div>
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Error Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
             <h3 className="text-2xl font-bold text-slate-800">{errors.toLocaleString()}</h3>
             <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${Number(errorRate) > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
               {errorRate}%
             </span>
          </div>
        </div>
        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
          <AlertOctagon className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Time Range</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{duration}</h3>
        </div>
        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Components</p>
          <h3 className="text-2xl font-bold text-slate-800 mt-1">{components}</h3>
        </div>
        <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
          <Activity className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default Overview;
