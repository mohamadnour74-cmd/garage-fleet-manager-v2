
import React from 'react';
import { useFleet } from '../context/FleetContext';
import { ArrowLeft, PauseCircle } from 'lucide-react';

interface StandbyListProps {
  onBack: () => void;
  onSelect: (id: string) => void;
}

export const StandbyList: React.FC<StandbyListProps> = ({ onBack, onSelect }) => {
  const { fleet } = useFleet();

  const standbyItems = fleet.filter(item => item.status === 'STANDBY');

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-slate-600 hover:bg-slate-100 p-2 rounded-full">
            <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Standby Assets</h1>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1">
        {standbyItems.length === 0 ? (
             <div className="text-center py-10 text-slate-400">
                <PauseCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assets currently on standby.</p>
             </div>
        ) : (
            standbyItems.map(item => (
            <div 
                key={item.id} 
                onClick={() => onSelect(item.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-amber-300 transition"
            >
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">{item.make} {item.model}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-100 text-amber-700 border-amber-200">
                            STANDBY
                        </span>
                    </div>
                    <p className="text-slate-500 text-sm">{item.plateOrSerial}</p>
                    <p className="text-xs text-slate-400 mt-1">{item.location}</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-400">Meter</span>
                    <p className="font-mono font-semibold text-slate-700">{item.currentMeter.toLocaleString()}</p>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  );
};
