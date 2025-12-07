
import React from 'react';
import { useFleet } from '../context/FleetContext';
import { ArrowLeft, Ban } from 'lucide-react';

interface OutOfServiceListProps {
  onBack: () => void;
  onSelect: (id: string) => void;
}

export const OutOfServiceList: React.FC<OutOfServiceListProps> = ({ onBack, onSelect }) => {
  const { fleet } = useFleet();

  const oosItems = fleet.filter(item => item.status === 'OUT_OF_SERVICE');

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="mr-4 text-slate-600 hover:bg-slate-100 p-2 rounded-full">
            <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-bold text-slate-800">Out of Service</h1>
      </div>

      <div className="space-y-4 overflow-y-auto flex-1">
        {oosItems.length === 0 ? (
             <div className="text-center py-10 text-slate-400">
                <Ban className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assets currently out of service.</p>
             </div>
        ) : (
            oosItems.map(item => (
            <div 
                key={item.id} 
                onClick={() => onSelect(item.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center cursor-pointer hover:border-slate-400 transition"
            >
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">{item.make} {item.model}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200">
                            OUT OF SERVICE
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
