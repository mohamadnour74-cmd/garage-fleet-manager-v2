
import React, { useState, useMemo } from 'react';
import { useFleet } from '../context/FleetContext';
import { FleetStatus } from '../types';
import { Search, Filter, Car, Tractor, MoreHorizontal, X, Check, Layers } from 'lucide-react';

interface FleetListProps {
  onSelect: (id: string) => void;
  initialTab?: 'VEHICLE' | 'EQUIPMENT' | 'ALL';
}

export const FleetList: React.FC<FleetListProps> = ({ onSelect, initialTab = 'VEHICLE' }) => {
  const { fleet } = useFleet();
  const [activeTab, setActiveTab] = useState<'VEHICLE' | 'EQUIPMENT' | 'ALL'>(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FleetStatus | 'ALL'>('ALL');
  
  // Advanced Filter States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterMake, setFilterMake] = useState<string>('ALL');
  const [filterModel, setFilterModel] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');

  // Compute dependent/cascading options for dropdowns
  const filterOptions = useMemo(() => {
      // 1. Base items: Filter by Tab (Vehicle vs Equipment vs ALL)
      const baseItems = activeTab === 'ALL' ? fleet : fleet.filter(i => i.type === activeTab);

      // 2. Available Makes: derived from all items in this tab
      const makes = Array.from(new Set(baseItems.map(i => i.make))).sort();

      // 3. Available Models: dependent on selected Make
      let modelItems = baseItems;
      if (filterMake !== 'ALL') {
          modelItems = baseItems.filter(i => i.make === filterMake);
      }
      const models = Array.from(new Set(modelItems.map(i => i.model))).sort();

      // 4. Available Years: dependent on selected Make AND Model
      let yearItems = modelItems; // Already filtered by make if applicable
      if (filterModel !== 'ALL') {
          yearItems = yearItems.filter(i => i.model === filterModel);
      }
      const years = Array.from(new Set(yearItems.map(i => i.year))).sort((a: number, b: number) => b - a);

      return { makes, models, years };
  }, [fleet, activeTab, filterMake, filterModel]);

  const filteredFleet = fleet.filter(item => {
    // 1. Tab Filter
    if (activeTab !== 'ALL' && item.type !== activeTab) return false;

    // 2. Search Filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      item.make.toLowerCase().includes(searchLower) || 
      item.model.toLowerCase().includes(searchLower) ||
      item.plateOrSerial.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;

    // 3. Status Filter
    if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;

    // 4. Advanced Filters
    if (filterMake !== 'ALL' && item.make !== filterMake) return false;
    if (filterModel !== 'ALL' && item.model !== filterModel) return false;
    if (filterYear !== 'ALL' && item.year.toString() !== filterYear) return false;

    return true;
  });

  const getStatusColor = (status: FleetStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'WORKSHOP': return 'bg-red-100 text-red-700 border-red-200';
      case 'OUT_OF_SERVICE': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'STANDBY': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const clearAdvancedFilters = () => {
      setFilterMake('ALL');
      setFilterModel('ALL');
      setFilterYear('ALL');
      setShowFilterModal(false);
  };

  const handleMakeChange = (val: string) => {
      setFilterMake(val);
      setFilterModel('ALL'); // Reset model when make changes
      setFilterYear('ALL');  // Reset year when make changes
  };

  const handleModelChange = (val: string) => {
      setFilterModel(val);
      setFilterYear('ALL'); // Reset year when model changes
  };

  const activeFiltersCount = (filterMake !== 'ALL' ? 1 : 0) + (filterModel !== 'ALL' ? 1 : 0) + (filterYear !== 'ALL' ? 1 : 0);

  return (
    <div className="h-full flex flex-col pb-20 relative">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Fleet</h1>
      
      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input 
            type="text" 
            placeholder="Search plate, make, model..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
            onClick={() => setShowFilterModal(true)}
            className={`p-3 rounded-xl border shadow-sm relative transition ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
        >
          <Filter className={`h-5 w-5 ${activeFiltersCount > 0 ? 'text-blue-600' : 'text-slate-600'}`} />
          {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {activeFiltersCount}
              </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-200 rounded-xl mb-6">
        <button 
          onClick={() => { setActiveTab('ALL'); clearAdvancedFilters(); }}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'}`}
        >
          <Layers className="mr-2 h-4 w-4" /> All Fleet
        </button>
        <button 
          onClick={() => { setActiveTab('VEHICLE'); clearAdvancedFilters(); }}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'VEHICLE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
        >
          <Car className="mr-2 h-4 w-4" /> Vehicles
        </button>
        <button 
          onClick={() => { setActiveTab('EQUIPMENT'); clearAdvancedFilters(); }}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs md:text-sm font-semibold transition ${activeTab === 'EQUIPMENT' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'}`}
        >
          <Tractor className="mr-2 h-4 w-4" /> Equipment
        </button>
      </div>

      {/* Status Chips Filter */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {['ALL', 'ACTIVE', 'WORKSHOP', 'STANDBY', 'OUT_OF_SERVICE'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition ${filterStatus === status ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
          >
            {status.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredFleet.map(item => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 active:scale-[0.98] transition cursor-pointer flex justify-between items-center"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-900 text-lg">{item.make} {item.model}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                  {item.status.replace(/_/g, ' ')}
                </span>
                {activeTab === 'ALL' && (
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.type === 'VEHICLE' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                         {item.type === 'VEHICLE' ? 'VEH' : 'EQP'}
                     </span>
                )}
              </div>
              <p className="text-slate-500 text-sm font-mono">{item.plateOrSerial}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>{item.year}</span>
                <span>•</span>
                <span>{item.currentMeter.toLocaleString()} {item.type === 'VEHICLE' ? 'km' : 'hrs'}</span>
                <span>•</span>
                <span>{item.location}</span>
              </div>
            </div>
            <MoreHorizontal className="text-slate-300" />
          </div>
        ))}
        {filteredFleet.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            <p>No items found.</p>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
          <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-end md:items-center justify-center">
              <div className="bg-white w-full md:w-96 md:rounded-2xl rounded-t-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Filter Assets</h3>
                      <button onClick={() => setShowFilterModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Make</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filterMake}
                            onChange={(e) => handleMakeChange(e.target.value)}
                          >
                              <option value="ALL">All Makes</option>
                              {filterOptions.makes.map(make => <option key={make} value={make}>{make}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Model</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filterModel}
                            onChange={(e) => handleModelChange(e.target.value)}
                            disabled={filterMake === 'ALL'} // Optional: disable if no Make selected, or keep enabled if logic allows
                          >
                              <option value="ALL">All Models {filterMake === 'ALL' ? '' : `(${filterMake})`}</option>
                              {filterOptions.models.map(model => <option key={model} value={model}>{model}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Year</label>
                          <select 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                          >
                              <option value="ALL">All Years</option>
                              {filterOptions.years.map(year => <option key={year} value={year}>{year}</option>)}
                          </select>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button 
                        onClick={clearAdvancedFilters}
                        className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                      >
                          Reset
                      </button>
                      <button 
                        onClick={() => setShowFilterModal(false)}
                        className="flex-1 py-3 text-white font-bold bg-blue-600 rounded-xl hover:bg-blue-700 transition flex justify-center items-center"
                      >
                          <Check className="w-4 h-4 mr-2" /> Apply
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
