
import React, { useRef, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { downloadTemplate, parseCSV, exportToCSV } from '../utils/csvUtils';
import { Download, Upload, FileSpreadsheet, Trash2, AlertCircle, Users } from 'lucide-react';

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { fleet, importFleet, clearFleet, currentUser } = useFleet();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const items = parseCSV(event.target?.result as string);
        if (items.length === 0) {
            setMessage({ type: 'error', text: "No valid data found." });
            return;
        }
        importFleet(items);
        setMessage({ type: 'success', text: `Imported ${items.length} items!` });
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setMessage({ type: 'error', text: "Failed to parse CSV." });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>
      
      {/* Manager Only Section */}
      {currentUser?.role === 'manager' && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-bold text-amber-800 mb-4 flex items-center"><Users className="mr-2 h-5 w-5" /> User Access</h2>
            <div className="flex items-center justify-between">
                <p className="text-sm text-amber-700">Manage login accounts and permissions.</p>
                <button 
                  onClick={() => onNavigate('users')} 
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-amber-700 transition"
                >
                    Manage Users
                </button>
            </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><FileSpreadsheet className="mr-2 h-5 w-5 text-green-600" /> Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div><h3 className="font-semibold text-slate-700">1. Download Template</h3></div>
              <button onClick={downloadTemplate} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"><Download className="mr-2 h-4 w-4" /> Template</button>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div><h3 className="font-semibold text-slate-700">2. Import Data</h3></div>
              <div className="relative">
                <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" id="csv-upload" />
                <label htmlFor="csv-upload" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Import CSV</label>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div><h3 className="font-semibold text-slate-700">Export All Data</h3></div>
              <button onClick={() => exportToCSV(fleet)} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium"><Download className="mr-2 h-4 w-4" /> Export</button>
            </div>
          </div>
          {message && <div className={`mt-4 p-3 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{message.text}</div>}
        </div>
        
        {/* Manager Only Delete */}
        {currentUser?.role === 'manager' && (
            <div className="bg-white rounded-xl border border-red-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-red-600 mb-4 flex items-center"><AlertCircle className="mr-2 h-5 w-5" /> Danger Zone</h2>
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Delete all data.</p>
                <button onClick={clearFleet} className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium"><Trash2 className="mr-2 h-4 w-4" /> Reset App</button>
            </div>
            </div>
        )}
      </div>
    </div>
  );
};
