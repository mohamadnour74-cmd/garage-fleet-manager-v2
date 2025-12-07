
import React from 'react';
import { useFleet } from '../context/FleetContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface RemindersProps {
  onBack: () => void;
}

export const Reminders: React.FC<RemindersProps> = ({ onBack }) => {
  const { fleet } = useFleet();

  const reminderList = fleet.map(vehicle => {
    let isOverdue = false;
    let dueText = 'Not Scheduled';
    if (vehicle.nextServiceDate) {
      const today = new Date();
      const due = new Date(vehicle.nextServiceDate);
      if (today > due) isOverdue = true;
      dueText = due.toLocaleDateString();
    }
    if (vehicle.nextServiceMeter && vehicle.currentMeter >= vehicle.nextServiceMeter) {
      isOverdue = true;
      dueText = `${vehicle.nextServiceMeter.toLocaleString()} km/hrs`;
    }
    return { vehicle, status: isOverdue ? 'OVERDUE' : 'OK', due: dueText, lastService: vehicle.lastServiceDate || 'Never' };
  }).sort((a, b) => (a.status === 'OVERDUE' ? -1 : 1));

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-blue-600 font-semibold">Back</button>
        <h1 className="text-2xl font-bold text-slate-800">Reminders</h1>
      </div>
      <div className="space-y-4 overflow-y-auto">
        {reminderList.map((item, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
             <div className="flex items-center">
               {item.status === 'OVERDUE' ? <AlertCircle className="text-red-500 h-8 w-8 mr-4" /> : <CheckCircle className="text-green-500 h-8 w-8 mr-4" />}
               <div>
                 <h3 className="font-bold text-slate-800">{item.vehicle.make} {item.vehicle.model}</h3>
                 <p className="text-xs text-slate-500">{item.vehicle.plateOrSerial}</p>
                 <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">Last: {item.lastService}</span>
               </div>
             </div>
             <div className="text-right">
                <span className="block text-xs text-slate-400">Next Due</span>
                <span className={`font-bold ${item.status === 'OVERDUE' ? 'text-red-600' : 'text-slate-800'}`}>{item.due}</span>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
