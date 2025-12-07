
import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { FleetItem, FleetStatus, FleetType } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

interface AddFleetItemProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const AddFleetItem: React.FC<AddFleetItemProps> = ({ onBack, onSuccess }) => {
  const { addFleetItem } = useFleet();
  const [formData, setFormData] = useState<Partial<FleetItem>>({
    type: 'VEHICLE',
    status: 'ACTIVE',
    year: new Date().getFullYear(),
    currentMeter: 0,
    category: 'General',
    location: 'Main HQ',
    technicalDetails: { vin: '' }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.make && formData.model && formData.plateOrSerial) {
        await addFleetItem({
            id: '', // Handled by context
            ...formData as FleetItem
        });
        onSuccess();
    }
  };

  const handleChange = (field: keyof FleetItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTechChange = (field: string, value: string) => {
      setFormData(prev => ({
          ...prev,
          technicalDetails: { ...prev.technicalDetails, [field]: value }
      }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white p-4 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onBack} className="text-slate-600">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="font-semibold text-slate-800">Add New Item</span>
        <div className="w-6" />
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2">Basic Information</h3>
            
            <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button 
                        type="button"
                        onClick={() => handleChange('type', 'VEHICLE')}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${formData.type === 'VEHICLE' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >Vehicle</button>
                    <button 
                         type="button"
                         onClick={() => handleChange('type', 'EQUIPMENT')}
                        className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${formData.type === 'EQUIPMENT' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >Equipment</button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Make</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.make || ''} onChange={e => handleChange('make', e.target.value)} required placeholder="e.g. Toyota" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Model</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.model || ''} onChange={e => handleChange('model', e.target.value)} required placeholder="e.g. Hilux" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Year</label>
                    <input type="number" className="w-full p-2 border rounded-lg" value={formData.year} onChange={e => handleChange('year', parseInt(e.target.value))} required />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Plate / Serial</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.plateOrSerial || ''} onChange={e => handleChange('plateOrSerial', e.target.value)} required />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Chassis Number (VIN)</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.technicalDetails?.vin || ''} onChange={e => handleTechChange('vin', e.target.value)} placeholder="Enter Chassis Number" />
                </div>
            </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2">Status & Location</h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                    <select className="w-full p-2 border rounded-lg" value={formData.status} onChange={e => handleChange('status', e.target.value as FleetStatus)}>
                        <option value="ACTIVE">Active</option>
                        <option value="WORKSHOP">In Workshop</option>
                        <option value="STANDBY">Standby</option>
                        <option value="OUT_OF_SERVICE">Out of Service</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Current Meter</label>
                    <input type="number" className="w-full p-2 border rounded-lg" value={formData.currentMeter} onChange={e => handleChange('currentMeter', parseInt(e.target.value))} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Location</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.location || ''} onChange={e => handleChange('location', e.target.value)} />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <input className="w-full p-2 border rounded-lg" value={formData.category || ''} onChange={e => handleChange('category', e.target.value)} />
                </div>
            </div>
        </div>

        <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition flex items-center justify-center">
            <Save className="h-5 w-5 mr-2" /> Add {formData.type === 'VEHICLE' ? 'Vehicle' : 'Equipment'}
        </button>
      </form>
    </div>
  );
};
