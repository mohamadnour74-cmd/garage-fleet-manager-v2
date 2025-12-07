
import React, { useEffect, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { FleetStatus, MaintenanceType, MaintenanceRecord, StatusHistoryRecord } from '../types';
import { db } from '../services/firebaseConfig';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { exportVehicleHistory } from '../utils/csvUtils';
import { ArrowLeft, Calendar, User, MapPin, Gauge, Plus, Wrench, AlertTriangle, CheckCircle2, ClipboardList, Trash2, Edit, Download, X, Clock, Timer, Fingerprint, Tag, FileText, Copy, Check } from 'lucide-react';

interface FleetDetailProps {
  itemId: string;
  onBack: () => void;
  onEdit: () => void;
  onAddMaintenance: (id: string, type: MaintenanceType) => void;
}

export const FleetDetail: React.FC<FleetDetailProps> = ({ itemId, onBack, onEdit, onAddMaintenance }) => {
  const { fleet, deleteFleetItem, isDemoMode, currentUser, demoRecords, demoStatusHistory } = useFleet();
  const [activeTab, setActiveTab] = useState<'REPAIRS' | 'ROUTINE' | 'STATUS'>('REPAIRS');
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copiedVin, setCopiedVin] = useState(false);
  
  const item = fleet.find(f => f.id === itemId);

  // Fetch Maintenance History
  useEffect(() => {
    if (!item || activeTab === 'STATUS') return;

    if (isDemoMode) {
        const records = demoRecords.filter(r => r.fleetItemId === item.id);
        const filtered = records.filter(r => activeTab === 'REPAIRS' ? r.type === 'REPAIR' : r.type !== 'REPAIR');
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setHistory(filtered);
        return;
    }

    setLoadingHistory(true);
    const colName = item.type === 'VEHICLE' ? 'vehicles' : 'equipment';
    const subColName = activeTab === 'REPAIRS' ? 'breakdowns_repairs' : 'routine_maintenance';
    
    const q = query(
        collection(db, colName, item.id, subColName),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
        setHistory(records);
        setLoadingHistory(false);
    }, (err) => {
        console.error("Failed to load history:", err);
        setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [item?.id, activeTab, item?.type, isDemoMode, demoRecords]);

  // Fetch Status History
  useEffect(() => {
    if (!item || activeTab !== 'STATUS') return;
    
    if (isDemoMode) {
        const logs = demoStatusHistory.filter(r => r.fleetItemId === item.id);
        logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setStatusHistory(logs);
        return;
    }

    setLoadingHistory(true);
    const colName = item.type === 'VEHICLE' ? 'vehicles' : 'equipment';
    const q = query(collection(db, colName, item.id, 'status_history'), orderBy('startTime', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StatusHistoryRecord));
        setStatusHistory(records);
        setLoadingHistory(false);
    }, (err) => {
        console.error("Failed status logs", err);
        setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [item?.id, activeTab, isDemoMode, demoStatusHistory]);

  if (!item) return <div>Item not found</div>;

  const getStatusColor = (status: FleetStatus) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50 border-green-200';
      case 'WORKSHOP': return 'text-red-600 bg-red-50 border-red-200';
      case 'OUT_OF_SERVICE': return 'text-slate-600 bg-slate-50 border-slate-200';
      case 'STANDBY': return 'text-amber-700 bg-amber-100 border-amber-200';
      default: return 'text-slate-500';
    }
  };

  const formatDuration = (hours?: number) => {
      if (!hours) return 'Ongoing';
      if (hours < 24) return `${hours.toFixed(1)} hrs`;
      const days = Math.floor(hours / 24);
      const remHours = Math.round(hours % 24);
      return `${days}d ${remHours}h`;
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${item.make} ${item.model} (${item.plateOrSerial})?`)) {
      await deleteFleetItem(item.id, item.type);
      onBack();
    }
  };

  const handleCopyVin = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (item?.technicalDetails?.vin) {
          navigator.clipboard.writeText(item.technicalDetails.vin);
          setCopiedVin(true);
          setTimeout(() => setCopiedVin(false), 2000);
      }
  };

  const handleExport = async (mode: 'REPAIRS' | 'ROUTINE' | 'ALL') => {
    setExporting(true);
    let recordsToExport: MaintenanceRecord[] = [];

    if (isDemoMode) {
        const records = demoRecords.filter(r => r.fleetItemId === item.id);
        if (mode === 'ALL') {
            recordsToExport = records;
        } else if (mode === 'REPAIRS') {
            recordsToExport = records.filter(r => r.type === 'REPAIR');
        } else {
            recordsToExport = records.filter(r => r.type !== 'REPAIR');
        }
    } else {
        const colName = item.type === 'VEHICLE' ? 'vehicles' : 'equipment';
        const promises = [];
        
        if (mode === 'ALL' || mode === 'REPAIRS') {
            promises.push(getDocs(query(collection(db, colName, item.id, 'breakdowns_repairs'), orderBy('date', 'desc'))));
        }
        if (mode === 'ALL' || mode === 'ROUTINE') {
            promises.push(getDocs(query(collection(db, colName, item.id, 'routine_maintenance'), orderBy('date', 'desc'))));
        }

        const snapshots = await Promise.all(promises);
        snapshots.forEach(snap => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceRecord));
            recordsToExport = [...recordsToExport, ...docs];
        });
        
        recordsToExport.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    exportVehicleHistory(item, recordsToExport, mode === 'ALL' ? 'FULL HISTORY' : mode);
    setExporting(false);
    setShowExportModal(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 pb-20 relative">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="font-semibold text-slate-800">Vehicle Details</span>
        <div className="flex gap-2">
          <button onClick={() => setShowExportModal(true)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-full" title="Export History">
             <Download className="h-5 w-5" />
          </button>
          
          {currentUser?.role === 'manager' && (
            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                <Trash2 className="h-5 w-5" />
            </button>
          )}

          <button onClick={onEdit} className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full">
            <Edit className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-white p-6 mb-4 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{item.make} {item.model}</h1>
              <p className="text-slate-500 font-mono text-lg">{item.plateOrSerial}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.status)}`}>
              {item.status.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center text-slate-600 text-sm">
              <Calendar className="h-4 w-4 mr-2 text-slate-400" />
              {item.year}
            </div>
            <div className="flex items-center text-slate-600 text-sm">
              <MapPin className="h-4 w-4 mr-2 text-slate-400" />
              {item.location}
            </div>
            <div className="flex items-center text-slate-600 text-sm">
              <Gauge className="h-4 w-4 mr-2 text-slate-400" />
              {item.currentMeter.toLocaleString()} {item.type === 'VEHICLE' ? 'km' : 'hrs'}
            </div>
            <div className="flex items-center text-slate-600 text-sm">
              <User className="h-4 w-4 mr-2 text-slate-400" />
              {item.assignedTo || 'Unassigned'}
            </div>
             <div className="flex items-center text-slate-600 text-sm col-span-2">
              <Fingerprint className="h-4 w-4 mr-2 text-slate-400" />
              <span className="mr-2">Chassis: {item.technicalDetails?.vin || 'N/A'}</span>
              {item.technicalDetails?.vin && (
                  <button 
                    onClick={handleCopyVin}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors flex items-center gap-1"
                    title="Copy Chassis Number"
                  >
                      {copiedVin ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-[10px] text-green-600 font-bold">Copied</span>
                          </>
                      ) : (
                          <Copy className="h-3.5 w-3.5" />
                      )}
                  </button>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <div className="flex p-1 bg-slate-200 rounded-xl">
            <button
              onClick={() => setActiveTab('REPAIRS')}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'REPAIRS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <AlertTriangle className="mr-2 h-4 w-4" /> Repairs
            </button>
            <button
              onClick={() => setActiveTab('ROUTINE')}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'ROUTINE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Routine
            </button>
            <button
              onClick={() => setActiveTab('STATUS')}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'STATUS' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Timer className="mr-2 h-4 w-4" /> Status Log
            </button>
          </div>
        </div>

        <div className="px-4 pb-10">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-slate-800">
                {activeTab === 'REPAIRS' ? 'Repair History' : activeTab === 'ROUTINE' ? 'Service Log' : 'Status Timeline'}
             </h3>
             {activeTab !== 'STATUS' && (
                 <button 
                   onClick={() => onAddMaintenance(item.id, activeTab === 'REPAIRS' ? 'REPAIR' : 'SERVICE')}
                   className={`flex items-center text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${activeTab === 'REPAIRS' ? 'bg-red-600 active:bg-red-700' : 'bg-blue-600 active:bg-blue-700'}`}
                 >
                   <Plus className="h-4 w-4 mr-1" /> Add Record
                 </button>
             )}
           </div>
           
           {loadingHistory ? (
               <p className="text-slate-400 text-center py-4">Loading data...</p>
           ) : (
            <div className="space-y-3">
                {activeTab === 'STATUS' ? (
                     // --- Status Log View ---
                     statusHistory.length === 0 ? (
                        <div className="text-center py-10 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                            <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">No status changes recorded.</p>
                        </div>
                     ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="p-3">Status</th>
                                        <th className="p-3">Start</th>
                                        <th className="p-3">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {statusHistory.map(rec => (
                                        <tr key={rec.id} className={rec.status === 'ACTIVE' ? 'bg-green-50/50' : ''}>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(rec.status)}`}>
                                                    {rec.status.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600">
                                                {new Date(rec.startTime).toLocaleDateString()} <span className="text-xs text-slate-400">{new Date(rec.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </td>
                                            <td className="p-3 font-mono font-medium text-slate-700">
                                                {formatDuration(rec.durationHours)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     )
                ) : (
                    // --- Maintenance Views ---
                    <>
                        {history.map((rec) => (
                        <div key={rec.id} className={`bg-white p-4 rounded-xl border shadow-sm relative overflow-hidden ${activeTab === 'REPAIRS' ? 'border-red-100' : 'border-blue-100'}`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${activeTab === 'REPAIRS' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                            <div className="flex justify-between items-start mb-2 pl-2">
                                <span className="text-base font-bold text-slate-500">{rec.date}</span>
                                <span className="text-2xl font-bold text-slate-900">${rec.totalCost.toLocaleString()}</span>
                            </div>
                            <div className="pl-2">
                                {/* COMPLAINT / ISSUE (Repair Only) */}
                                {activeTab === 'REPAIRS' && rec.complaint && (
                                    <div className="mb-3 bg-red-50 p-2 rounded-lg border border-red-100">
                                        <span className="text-xs font-bold text-red-500 uppercase flex items-center mb-1">
                                            <AlertTriangle className="w-3 h-3 mr-1" /> Reported Issue
                                        </span>
                                        <p className="text-base text-slate-800">{rec.complaint}</p>
                                    </div>
                                )}

                                {/* Maintenance Items Badges */}
                                {rec.maintenanceItems && rec.maintenanceItems.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {rec.maintenanceItems.map((item, i) => (
                                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 font-medium">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                
                                {rec.description && (
                                    <div className="mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                            {activeTab === 'REPAIRS' ? 'Job Done' : 'Description'}
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-xl">{rec.description}</h4>
                                    </div>
                                )}
                                
                                <p className="text-base text-slate-600 mt-1">Reading: {rec.meterReading.toLocaleString()}</p>
                                {rec.parts && rec.parts !== 'None' && <p className="text-base text-slate-600 mt-1">Parts: {rec.parts}</p>}
                                <div className="mt-3 flex items-center justify-end">
                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full flex items-center">
                                        <User className="w-3 h-3 mr-1" /> Logged by: {rec.createdBy || 'System'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        ))}
                        {history.length === 0 && (
                        <div className="text-center py-10 bg-slate-100 rounded-xl border border-dashed border-slate-300">
                            <Wrench className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">No records found.</p>
                        </div>
                        )}
                    </>
                )}
            </div>
           )}
        </div>
      </div>

      {showExportModal && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Export Vehicle Card</h3>
                      <button onClick={() => setShowExportModal(false)}><X className="text-slate-400" /></button>
                  </div>
                  <p className="text-slate-500 text-sm mb-6">Select the type of records you want to include in the Excel report.</p>
                  
                  <div className="space-y-3">
                      <button 
                        onClick={() => handleExport('REPAIRS')} 
                        disabled={exporting}
                        className="w-full py-3 bg-red-50 text-red-700 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition flex items-center justify-center"
                      >
                         <AlertTriangle className="mr-2 h-4 w-4" /> Breakdown History Only
                      </button>
                      <button 
                        onClick={() => handleExport('ROUTINE')}
                        disabled={exporting}
                        className="w-full py-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 hover:bg-blue-100 transition flex items-center justify-center"
                      >
                         <ClipboardList className="mr-2 h-4 w-4" /> Routine Maintenance Only
                      </button>
                      <button 
                        onClick={() => handleExport('ALL')}
                        disabled={exporting}
                        className="w-full py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition flex items-center justify-center"
                      >
                         {exporting ? 'Generating...' : 'Export Full History'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
