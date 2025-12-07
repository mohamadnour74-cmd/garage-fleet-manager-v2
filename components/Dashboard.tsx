
import React, { useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { Truck, Wrench, Ban, PlusCircle, Tractor, PauseCircle, ArrowRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { fleet, loading } = useFleet();
  
  const stats = useMemo(() => {
    const totalVehicles = fleet.filter(i => i.type === 'VEHICLE').length;
    const totalEquipment = fleet.filter(i => i.type === 'EQUIPMENT').length;
    const inWorkshop = fleet.filter(i => i.status === 'WORKSHOP').length;
    const outOfService = fleet.filter(i => i.status === 'OUT_OF_SERVICE').length;
    const standby = fleet.filter(i => i.status === 'STANDBY').length;

    return { totalVehicles, totalEquipment, inWorkshop, outOfService, standby };
  }, [fleet]);

  if (loading) return <div className="p-10 text-center text-slate-500">Connecting to Garage Cloud...</div>;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">MRTC</h1>
          <p className="text-slate-500 text-sm pl-1">Garage Overview</p>
        </div>
        <button 
          onClick={() => onNavigate('fleet-all')}
          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center hover:bg-blue-100 transition"
        >
          View All Fleet <ArrowRight className="w-3 h-3 ml-1" />
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Row 1 */}
        <button 
          onClick={() => onNavigate('fleet')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-blue-200 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
        >
          <Truck className="h-8 w-8 text-blue-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.totalVehicles}</span>
          <span className="text-xs text-slate-500 font-semibold">Vehicles</span>
        </button>

        <button 
          onClick={() => onNavigate('fleet-equipment')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-orange-200 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
        >
          <Tractor className="h-8 w-8 text-orange-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.totalEquipment}</span>
          <span className="text-xs text-slate-500 font-semibold">Equipment</span>
        </button>

        <button 
          onClick={() => onNavigate('standby')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-amber-200 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
        >
          <PauseCircle className="h-8 w-8 text-amber-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.standby}</span>
          <span className="text-xs text-slate-500 font-semibold">Standby</span>
        </button>
        
        {/* Row 2 */}
        <button 
          onClick={() => onNavigate('workshop')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:border-red-200 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
        >
          <Wrench className="h-8 w-8 text-red-500 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.inWorkshop}</span>
          <span className="text-xs text-slate-500 font-semibold">In Workshop</span>
        </button>

        <button 
          onClick={() => onNavigate('out-of-service')}
          className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center col-span-2 md:col-span-1 hover:shadow-md hover:border-slate-300 hover:scale-[1.02] transition-all cursor-pointer active:scale-95"
        >
          <Ban className="h-8 w-8 text-slate-600 mb-2" />
          <span className="text-2xl font-bold text-slate-800">{stats.outOfService}</span>
          <span className="text-xs text-slate-500 font-semibold">Out of Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1">
        <button 
          onClick={() => onNavigate('new-vehicle')}
          className="flex items-center justify-center p-4 bg-blue-600 text-white rounded-xl shadow-md active:bg-blue-700 transition font-bold"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Vehicle
        </button>
      </div>
    </div>
  );
};
