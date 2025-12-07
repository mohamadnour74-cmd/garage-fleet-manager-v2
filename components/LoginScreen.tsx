
import React, { useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { UserCircle2, Shield, Loader2, ArrowRight } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { login, createFirstAdmin, systemHasUsers, isDemoMode } = useFleet();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const result = await login(name, password);
    if (!result.success) {
        setError(result.message || 'Login failed');
    }
    setIsLoading(false);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await createFirstAdmin(name, password);
    } catch (err) {
        setError("Failed to create admin");
    }
    setIsLoading(false);
  };

  // Loading State (Checking DB)
  if (systemHasUsers === null) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
            <div className="flex flex-col items-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500">Checking System...</p>
            </div>
        </div>
      );
  }

  // --- Scenario 1: First Run (Create Admin) ---
  if (systemHasUsers === false) {
    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                 <Shield className="text-white w-10 h-10" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">System Setup</h1>
              <p className="text-slate-500 mt-2">No users found. Create the first Manager account.</p>
            </div>
    
            <form onSubmit={handleCreateAdmin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Admin Name</label>
                <input 
                  type="text" required
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Workshop Manager"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Create Password</label>
                <input 
                  type="password" required
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
                  placeholder="Strong password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit" disabled={isLoading}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg mt-4 flex items-center justify-center"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>Create & Enter <ArrowRight className="ml-2 w-4 h-4"/></>}
              </button>
            </form>
          </div>
        </div>
      );
  }

  // --- Scenario 2: Normal Login ---
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
             <UserCircle2 className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back</h1>
          <p className="text-slate-500">Garage Fleet Manager</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 text-center">
                {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Name</label>
            <input 
              type="text" required
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Your username"
              value={name} onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input 
              type="password" required
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Enter password"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg mt-4 flex items-center justify-center"
          >
             {isLoading ? <Loader2 className="animate-spin" /> : 'Login'}
          </button>
          
          {isDemoMode && (
              <p className="text-xs text-center text-slate-400 mt-4">Demo Mode: Use any name and password '1234'</p>
          )}
        </form>
      </div>
    </div>
  );
};
