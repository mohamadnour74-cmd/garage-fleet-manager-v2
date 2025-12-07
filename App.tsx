
import React, { useState, useEffect } from 'react';
import { FleetProvider, useFleet } from './context/FleetContext';
import { Dashboard } from './components/Dashboard';
import { FleetList } from './components/FleetList';
import { FleetDetail } from './components/FleetDetail';
import { MaintenanceForm } from './components/MaintenanceForm';
import { WorkshopList } from './components/WorkshopList';
import { StandbyList } from './components/StandbyList';
import { OutOfServiceList } from './components/OutOfServiceList';
import { SettingsPage } from './components/Settings';
import { EditFleetItem } from './components/EditFleetItem';
import { AddFleetItem } from './components/AddFleetItem';
import { LoginScreen } from './components/LoginScreen';
import { UserManagement } from './components/UserManagement';
import { LayoutGrid, List, Settings as SettingsIcon, WifiOff, LogOut, UserCircle2, Shield } from 'lucide-react';
import { MaintenanceType } from './types';

const MainLayout = () => {
  const { isDemoMode, currentUser, logout } = useFleet();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewStack, setViewStack] = useState<string[]>(['dashboard']);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formInitialType, setFormInitialType] = useState<MaintenanceType>('SERVICE');

  const navigate = (view: string) => setViewStack(prev => [...prev, view]);
  const goBack = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  const currentView = viewStack[viewStack.length - 1];

  // If not logged in, show login screen
  if (!currentUser) {
      return <LoginScreen />;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />;
      case 'fleet': return <FleetList initialTab='VEHICLE' onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'fleet-equipment': return <FleetList initialTab='EQUIPMENT' onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'fleet-all': return <FleetList initialTab='ALL' onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'detail': return selectedItemId ? <FleetDetail itemId={selectedItemId} onBack={goBack} onEdit={() => navigate('edit-fleet')} onAddMaintenance={(id, type) => { setSelectedItemId(id); setFormInitialType(type); navigate('maintenance-form'); }} /> : null;
      case 'edit-fleet': return selectedItemId ? <EditFleetItem itemId={selectedItemId} onBack={goBack} onSuccess={goBack} /> : null;
      case 'maintenance-form': return selectedItemId ? <MaintenanceForm itemId={selectedItemId} initialType={formInitialType} onBack={goBack} onSuccess={goBack} /> : null;
      case 'workshop': return <WorkshopList onBack={goBack} onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'standby': return <StandbyList onBack={goBack} onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'out-of-service': return <OutOfServiceList onBack={goBack} onSelect={(id) => { setSelectedItemId(id); navigate('detail'); }} />;
      case 'settings': return <SettingsPage onNavigate={navigate} />;
      case 'users': return <UserManagement />;
      case 'new-vehicle': return <AddFleetItem onBack={goBack} onSuccess={goBack} />;
      default: return <Dashboard onNavigate={navigate} />;
    }
  };

  const handleNavClick = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'dashboard') setViewStack(['dashboard']);
    if (tab === 'fleet') setViewStack(['fleet']);
    if (tab === 'settings') setViewStack(['settings']);
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col md:flex-row max-w-7xl mx-auto shadow-2xl overflow-hidden relative">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="absolute top-0 left-0 right-0 bg-slate-800 text-slate-200 text-xs font-medium text-center py-1 z-50 shadow-md flex items-center justify-center">
            <WifiOff className="h-3 w-3 mr-2" />
            Offline Demo Mode (Changes saved locally)
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-6 pt-10">
        <h1 className="text-xl font-bold mb-10 flex items-center gap-2"><div className="w-8 h-8 bg-blue-500 rounded-lg"></div> Fleet Mgr</h1>
        
        {/* User Info Card */}
        <div className="mb-6 bg-slate-800 p-4 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                 {currentUser.role === 'manager' ? <Shield size={20} className="text-amber-400" /> : <UserCircle2 size={24} />}
             </div>
             <div className="overflow-hidden">
                 <p className="font-bold text-sm truncate">{currentUser.name}</p>
                 <p className="text-xs text-slate-400 uppercase">{currentUser.role}</p>
             </div>
        </div>

        <nav className="space-y-4 flex-1">
          <button onClick={() => handleNavClick('dashboard')} className={`flex items-center gap-3 w-full p-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><LayoutGrid size={20} /> Dashboard</button>
          <button onClick={() => handleNavClick('fleet')} className={`flex items-center gap-3 w-full p-3 rounded-xl ${activeTab === 'fleet' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><List size={20} /> Vehicles</button>
          <button onClick={() => handleNavClick('settings')} className={`flex items-center gap-3 w-full p-3 rounded-xl ${activeTab === 'settings' ? 'bg-blue-600' : 'hover:bg-slate-800'}`}><SettingsIcon size={20} /> Settings</button>
        </nav>

        <button onClick={logout} className="flex items-center gap-2 text-slate-400 hover:text-white mt-auto p-2">
            <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-6 md:pt-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">{renderContent()}</div>
      </main>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-4 z-40">
        <button onClick={() => handleNavClick('dashboard')} className={`flex flex-col items-center ${activeTab === 'dashboard' ? 'text-blue-600' : 'text-slate-400'}`}><LayoutGrid size={24} /><span className="text-[10px] font-bold mt-1">Home</span></button>
        <button onClick={() => handleNavClick('fleet')} className={`flex flex-col items-center ${activeTab === 'fleet' ? 'text-blue-600' : 'text-slate-400'}`}><List size={24} /><span className="text-[10px] font-bold mt-1">Fleet</span></button>
        <button onClick={() => handleNavClick('settings')} className={`flex flex-col items-center ${activeTab === 'settings' ? 'text-blue-600' : 'text-slate-400'}`}><SettingsIcon size={24} /><span className="text-[10px] font-bold mt-1">Settings</span></button>
        <button onClick={logout} className="flex flex-col items-center text-slate-400"><LogOut size={24} /><span className="text-[10px] font-bold mt-1">Exit</span></button>
      </div>
    </div>
  );
};

const App = () => (
  <FleetProvider>
    <MainLayout />
  </FleetProvider>
);

export default App;
