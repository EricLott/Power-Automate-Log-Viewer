import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, Loader2, ShieldCheck, Database, Zap, FileSearch, ArrowRight, Github, Linkedin } from 'lucide-react';
import { parseLogFile } from '../utils';
import { LogEntry } from '../types';

interface FileUploadProps {
  onDataLoaded: (logs: LogEntry[], fileName: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readFile = (file: File): Promise<LogEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // parseLogFile handles individual file parsing with schema validation
          const logs = parseLogFile(content);
          resolve(logs);
        } catch (err) {
          // If a specific file fails, we resolve with empty to allow others to succeed
          console.warn(`Failed to parse file ${file.name}`, err);
          resolve([]);
        }
      };
      reader.onerror = () => reject(new Error(`Error reading file: ${file.name}`));
      reader.readAsText(file);
    });
  };

  const processFiles = async (fileList: FileList) => {
    setIsLoading(true);
    setError(null);

    try {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const results = await Promise.all(files.map(async (file) => {
        const logs = await readFile(file);
        return { name: file.name, logs };
      }));
      
      // Filter out files that didn't match the schema (returned 0 valid logs)
      const validFileResults = results.filter(res => res.logs.length > 0);
      
      // Combine logs from all valid files
      let allLogs = validFileResults.flatMap(res => res.logs);
      
      if (allLogs.length === 0) {
        setError("No valid Power Automate Desktop logs found. Please check your file selection.");
      } else {
        // Master sequence sort: ensure all logs are ordered by timestamp regardless of file origin
        allLogs.sort((a, b) => 
          new Date(a.eventTimestamp).getTime() - new Date(b.eventTimestamp).getTime()
        );

        // Name the dataset based only on valid files
        const datasetName = validFileResults.length === 1 
          ? validFileResults[0].name 
          : `${validFileResults.length} Log Files Merged`;
          
        onDataLoaded(allLogs, datasetName);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to process files. Please ensure they contain valid line-delimited JSON.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 p-6 animate-in fade-in duration-500 pb-16">
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-5xl font-bold text-slate-900 tracking-tight mb-2">
          Power Automate Log Viewer
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          The fastest way to troubleshoot <span className="font-semibold text-slate-800">Power Automate Desktop</span> flows. 
          Simply drop your logs to visualize errors and performance instantly.
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% Local Processing
          </span>
           <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <Database className="w-3.5 h-3.5" />
            Bulk Import Support
          </span>
        </div>
      </div>

      {/* Drag Drop Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-16 text-center transition-all cursor-pointer group
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.01] shadow-lg' 
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept=".txt,.log,.json"
          multiple
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="flex flex-col items-center justify-center space-y-5">
          <div className={`p-5 rounded-full transition-colors ${isDragging ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
            {isLoading ? (
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            ) : (
              <Upload className={`w-10 h-10 ${isDragging ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
            )}
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-700">
              {isLoading ? 'Crunching your logs...' : 'Drop your Log files here'}
            </p>
            <div className="mt-3 inline-block text-left bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <p className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wide">Suggested Path</p>
              <code className="text-slate-700 text-sm font-mono break-all select-all">
                %LOCALAPPDATA%\Microsoft\Power Automate Desktop\Logs
              </code>
            </div>
            <p className="text-slate-400 text-sm mt-3">
              Tip: Select all files (Ctrl+A) in the folder and drop them. We'll filter out the noise.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* More visible documentation link - Moved here */}
      <div className="mt-12 flex justify-center">
         <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 w-full max-w-3xl text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <FileSearch className="w-24 h-24 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-800 mb-2">Need help finding your machine logs?</h4>
            <p className="text-slate-600 mb-6 max-w-lg mx-auto">Microsoft provides a comprehensive guide on how to locate and collect the necessary log files from your machine.</p>
            <a 
              href="https://learn.microsoft.com/en-us/power-automate/desktop-flows/troubleshoot#collect-machine-logs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <FileSearch className="w-4 h-4" />
              <span>Read the Troubleshooting Guide</span>
              <ArrowRight className="w-4 h-4" />
            </a>
         </div>
      </div>
      
      {/* Feature Blurbs */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
          <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">Massive Scale</h3>
          <p className="text-slate-600 leading-relaxed">
            Dropped 1,500 files? No problem. We automatically sift through gigabytes of data to find the relevant log entries, ignoring system junk files.
          </p>
        </div>

        <div className="space-y-3 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
           <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">Zero Data Leakage</h3>
          <p className="text-slate-600 leading-relaxed">
            Your automation data contains sensitive business logic. That's why <span className="font-medium text-slate-800">nothing is processed server-side</span>. Everything stays in your browser's memory.
          </p>
        </div>

        <div className="space-y-3 p-4 rounded-xl hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
           <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-slate-900 text-lg">Actionable Insights</h3>
          <p className="text-slate-600 leading-relaxed">
            Don't scroll through endless text files. See error spikes, performance metrics, and execution timelines in a beautiful interactive dashboard.
          </p>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-slate-200 flex flex-col items-center gap-10">
         {/* Author Credits */}
         <div className="flex flex-col items-center gap-3">
            <p className="text-slate-500 text-sm font-medium">
              Made by <span className="text-slate-800">Eric Lott</span>
            </p>
            <div className="flex items-center gap-4">
              <a 
                href="https://www.linkedin.com/in/eric-lott-bb040198/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-[#0077b5] transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <Linkedin className="w-4 h-4" />
                <span className="text-sm">LinkedIn</span>
              </a>
              <a 
                href="https://github.com/EricLott" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
              >
                <Github className="w-4 h-4" />
                <span className="text-sm">GitHub</span>
              </a>
            </div>
         </div>
      </div>
    </div>
  );
};

export default FileUpload;