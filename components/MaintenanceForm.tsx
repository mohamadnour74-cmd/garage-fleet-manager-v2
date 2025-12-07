
import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { MaintenanceRecord, MaintenanceType } from '../types';
import { MAINTENANCE_CHECKLIST } from '../constants';
import { ArrowLeft, Save, Sparkles, Loader2, User, CheckSquare, Square, AlertTriangle, PenTool } from 'lucide-react';

interface MaintenanceFormProps {
  itemId: string;
  initialType: MaintenanceType;
  onBack: () => void;
  onSuccess: () => void;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ itemId, initialType, onBack, onSuccess }) => {
  const { fleet, addRecord, currentUser } = useFleet();
  const vehicle = fleet.find(f => f.id === itemId);
  const [isSaving, setIsSaving] = useState(false);
  
  // Checklist state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [otherItem, setOtherItem] = useState('');

  const [formData, setFormData] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    meterReading: vehicle?.currentMeter || 0,
    type: initialType === 'INSPECTION' ? 'SERVICE' : initialType,
    description: '',
    complaint: '', // Initialize complaint
    parts: '',
    laborCost: 0,
    partsCost: 0,
    technician: ''
  });

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicle) return;
    setIsSaving(true);

    // Combine checklist items with the custom "Other" item
    const finalMaintenanceItems = [...selectedItems];
    if (otherItem.trim()) {
        finalMaintenanceItems.push(otherItem.trim());
    }

    const totalCost = Number(formData.laborCost) + Number(formData.partsCost);
    const newRecord: MaintenanceRecord = {
      id: '', 
      fleetItemId: vehicle.id,
      date: formData.date!,
      meterReading: Number(formData.meterReading),
      type: formData.type as MaintenanceType,
      description: formData.description!,
      complaint: formData.type === 'REPAIR' ? formData.complaint : undefined, // Only save complaint if repair
      parts: formData.parts || 'None',
      laborCost: Number(formData.laborCost),
      partsCost: Number(formData.partsCost),
      totalCost,
      technician: formData.technician,
      createdBy: currentUser?.name || 'Unknown', 
      maintenanceItems: finalMaintenanceItems, // Save the array
      nextDueMeter: formData.type === 'REPAIR' ? undefined : Number(formData.meterReading) + (vehicle.type === 'VEHICLE' ? 10000 : 500),
      nextDueDate: formData.type === 'REPAIR' ? undefined : new Date(new Date(formData.date!).setFullYear(new Date(formData.date!).getFullYear() + 1)).toISOString().split('T')[0]
    };

    try {
        await addRecord(newRecord, vehicle.type);
        onSuccess();
    } catch (err) {
        alert("Failed to save record. Please check connection.");
    } finally {
        setIsSaving(false);
    }
  };

  if (!vehicle) return <div>Vehicle not found</div>;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600"><ArrowLeft className="h-6 w-6" /></button>
        <span className="font-semibold text-slate-800">{formData.type === 'REPAIR' ? 'Report Breakdown' : 'Log Maintenance'}</span>
        <div className="w-6" /> 
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        {/* Basic Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-700">{vehicle.make} {vehicle.model}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
              <input type="date" required className="w-full p-2 border rounded-lg" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Current Reading</label>
              <input type="number" required className="w-full p-2 border rounded-lg" value={formData.meterReading} onChange={e => setFormData({...formData, meterReading: Number(e.target.value)})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Job Type</label>
            <select className="w-full p-2 border rounded-lg" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as MaintenanceType})}>
              <option value="SERVICE">Routine Service</option>
              <option value="REPAIR">Repair (Breakdown)</option>
            </select>
          </div>
        </div>

        {/* COMPLAINT FIELD - REPAIR ONLY */}
        {formData.type === 'REPAIR' && (
           <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
              <h3 className="font-bold text-red-700 mb-3 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Issue Details
              </h3>
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Complaint / Reported Issue</label>
                      <textarea 
                          required
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm bg-red-50 focus:bg-white focus:ring-2 focus:ring-red-200 outline-none transition" 
                          rows={2}
                          placeholder="Describe the problem (e.g., Engine overheating, hydraulic leak...)"
                          value={formData.complaint} 
                          onChange={e => setFormData({...formData, complaint: e.target.value})}
                      />
                  </div>
              </div>
           </div>
        )}

        {/* JOB DESCRIPTION */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                  <PenTool className="w-4 h-4 mr-2 text-blue-600" />
                  {formData.type === 'REPAIR' ? 'Work Performed' : 'Service Details'}
              </h3>
             <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {formData.type === 'REPAIR' ? 'Job Done / Action Taken' : 'Service Description'}
                </label>
                <textarea 
                    className="w-full p-3 border rounded-lg" 
                    rows={3}
                    placeholder={formData.type === 'REPAIR' ? "What did you do to fix it?" : "Describe service (e.g. 40k km Service)"}
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                />
            </div>
        </div>

        {/* Maintenance Checklist Section - ONLY SHOW IF SERVICE */}
        {formData.type === 'SERVICE' && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-blue-600" />
                Maintenance Items
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {MAINTENANCE_CHECKLIST.map((item) => {
                    const isSelected = selectedItems.includes(item);
                    return (
                        <button
                            key={item}
                            type="button"
                            onClick={() => toggleItem(item)}
                            className={`flex items-center text-left p-3 rounded-lg border text-sm transition ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        >
                            {isSelected ? <CheckSquare className="w-4 h-4 mr-2 flex-shrink-0" /> : <Square className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />}
                            {item}
                        </button>
                    )
                })}
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Other / Custom Item</label>
                <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="Type here to add custom item..."
                    value={otherItem}
                    onChange={(e) => setOtherItem(e.target.value)}
                />
            </div>
            </div>
        )}

        {/* Technician */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Technician Name</label>
              <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input 
                    type="text" 
                    className="w-full pl-9 p-2 border rounded-lg" 
                    value={formData.technician || ''} 
                    onChange={e => setFormData({...formData, technician: e.target.value})}
                    placeholder="Who performed the job?"
                  />
              </div>
          </div>
        </div>

        {/* Costs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Parts Cost</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={formData.partsCost} onChange={e => setFormData({...formData, partsCost: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Labor Cost</label>
              <input type="number" className="w-full p-2 border rounded-lg" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: Number(e.target.value)})} />
            </div>
          </div>
           <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Parts Used (Summary)</label>
              <input type="text" className="w-full p-2 border rounded-lg" value={formData.parts} onChange={e => setFormData({...formData, parts: e.target.value})} placeholder="e.g. Filters, Oil (Optional)" />
            </div>
        </div>

        <button type="submit" disabled={isSaving} className={`w-full py-4 rounded-xl font-bold shadow-lg text-white ${formData.type === 'REPAIR' ? 'bg-red-600' : 'bg-blue-600'}`}>
          {isSaving ? 'Saving...' : 'Save Record'}
        </button>
      </form>
    </div>
  );
};
