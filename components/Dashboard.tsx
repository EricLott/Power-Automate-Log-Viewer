import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LogEntry, LogFilter } from '../types';
import Overview from './Overview';
import LogCharts from './LogCharts';
import LogTable from './LogTable';
import LogDetailModal from './LogDetailModal';
import { ArrowLeft, Camera, Download, Loader2 } from 'lucide-react';
// @ts-ignore
import html2canvas from 'html2canvas';

interface DashboardProps {
  logs: LogEntry[];
  fileName: string;
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, fileName, onBack }) => {
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [timeRange, setTimeRange] = useState<{start: number, end: number} | null>(null);
  const [filters, setFilters] = useState<LogFilter>({
    search: '',
    level: '',
    component: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Reset filter when a new file/dataset is loaded
  useEffect(() => {
    setTimeRange(null);
    setFilters({ search: '', level: '', component: '' });
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (!timeRange) return logs;
    return logs.filter(log => {
      const t = new Date(log.eventTimestamp).getTime();
      return t >= timeRange.start && t <= timeRange.end;
    });
  }, [logs, timeRange]);

  const handleExport = async () => {
    if (!dashboardRef.current) return;
    
    try {
      setIsExporting(true);
      
      // Wait a tick to ensure UI is ready (e.g. if we were hiding buttons, which we aren't here)
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2, // Retina resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // match bg-slate-50
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `PAD-Log-Report-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate image report.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="min-h-screen bg-slate-50 pb-10">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title="Upload different file"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">LogPulse Dashboard</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Analyzing: {fileName}</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-3">
             {timeRange && (
               <button 
                 onClick={() => setTimeRange(null)}
                 className="text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded transition-colors"
               >
                 Reset Zoom
               </button>
             )}
             
             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-70 disabled:cursor-wait"
             >
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                {isExporting ? 'Capturing...' : 'Save Report'}
             </button>

             <span className="ml-2 text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
               {filteredLogs.length.toLocaleString()} events
               {timeRange && <span className="text-slate-400 ml-1 text-xs">(filtered)</span>}
             </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Overview logs={filteredLogs} />
        <LogCharts 
          logs={logs} 
          filteredLogs={filteredLogs}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          onFilterChange={setFilters}
          onLogSelect={setSelectedLog}
        />
        <LogTable 
          logs={filteredLogs} 
          filters={filters}
          onFilterChange={setFilters}
          onLogClick={setSelectedLog} 
        />
      </main>

      {/* Modal */}
      {selectedLog && (
        <LogDetailModal 
          log={selectedLog} 
          onClose={() => setSelectedLog(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;