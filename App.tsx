import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { LogEntry } from './types';

function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [hasData, setHasData] = useState(false);

  const handleDataLoaded = (parsedLogs: LogEntry[], name: string) => {
    setLogs(parsedLogs);
    setFileName(name);
    setHasData(true);
  };

  const handleReset = () => {
    setLogs([]);
    setFileName('');
    setHasData(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {!hasData ? (
        <FileUpload onDataLoaded={handleDataLoaded} />
      ) : (
        <Dashboard 
          logs={logs} 
          fileName={fileName} 
          onBack={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
