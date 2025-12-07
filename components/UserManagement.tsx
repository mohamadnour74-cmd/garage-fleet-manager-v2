
import React, { useEffect, useState } from 'react';
import { useFleet } from '../context/FleetContext';
import { UserDocument, UserRole } from '../types';
import { Trash2, UserPlus, Shield, User, Loader2, AlertCircle } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { getAllUsers, createNewUser, deleteUser, currentUser } = useFleet();
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  
  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('staff');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const loadUsers = async () => {
      setLoading(true);
      setFetchError(false);
      try {
          const data = await getAllUsers();
          setUsers(data);
      } catch (err) {
          setFetchError(true);
      }
      setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setAddError(null);
      try {
          // Use the returned user object to update local state immediately (Optimistic Update)
          const newUser = await createNewUser(newEmail, newPassword, newName, newRole);
          
          setUsers(prev => [...prev, newUser]);
          
          setNewName('');
          setNewEmail('');
          setNewPassword('');
          
          // NOTE: We do NOT call loadUsers() here because Firestore is eventually consistent.
          // Fetching immediately often returns the OLD list, overwriting our optimistic update.
      } catch (e: any) {
          console.error(e);
          setAddError(e.message || "Failed to add user.");
      }
      setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
      if (window.confirm("Delete this user?")) {
          try {
              // Optimistic delete
              setUsers(prev => prev.filter(u => u.id !== id));
              await deleteUser(id);
          } catch (err) {
              console.error(err);
              // Revert if failed (simple reload)
              loadUsers();
              alert("Failed to delete user");
          }
      }
  };

  if (currentUser?.role !== 'manager') return <div className="p-10 text-center">Access Denied</div>;

  return (
    <div className="h-full flex flex-col pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">User Management</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><UserPlus className="mr-2 w-5 h-5 text-blue-600" /> Add New User</h2>
              <form onSubmit={handleAddUser} className="space-y-4">
                  {addError && (
                      <div className="bg-red-50 text-red-600 text-xs p-2 rounded flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {addError}
                      </div>
                  )}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
                      <input className="w-full p-2 border rounded-lg" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                      <input className="w-full p-2 border rounded-lg" type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@garage.com" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                      <input className="w-full p-2 border rounded-lg" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
                      <div className="flex gap-2">
                          <button type="button" onClick={() => setNewRole('staff')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${newRole === 'staff' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200 text-slate-500'}`}>Staff</button>
                          <button type="button" onClick={() => setNewRole('manager')} className={`flex-1 py-2 rounded-lg text-sm font-bold border ${newRole === 'manager' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200 text-slate-500'}`}>Manager</button>
                      </div>
                  </div>
                  <button disabled={isSubmitting} className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center">
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create User'}
                  </button>
              </form>
          </div>

          {/* User List */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
               <h2 className="text-lg font-bold text-slate-800 mb-4">Existing Users</h2>
               <div className="flex-1 overflow-y-auto space-y-3">
                   {loading ? (
                       <Loader2 className="animate-spin mx-auto text-slate-400" />
                   ) : fetchError ? (
                       <div className="text-center text-red-500 text-sm p-4 bg-red-50 rounded-lg">
                           <p>Could not load users.</p>
                           <p className="text-xs mt-1">Check database permissions.</p>
                       </div>
                   ) : users.length === 0 ? (
                       <p className="text-slate-400 text-center text-sm">No other users found.</p>
                   ) : (
                       users.map(user => (
                       <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                           <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'manager' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                   {user.role === 'manager' ? <Shield size={18} /> : <User size={18} />}
                               </div>
                               <div>
                                   <p className="font-bold text-slate-800">{user.name}</p>
                                   <p className="text-xs text-slate-500 uppercase">{user.role}</p>
                                   <p className="text-[10px] text-slate-400">{user.email}</p>
                               </div>
                           </div>
                           {user.id !== currentUser.id && (
                               <button onClick={() => handleDelete(user.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                                   <Trash2 size={18} />
                               </button>
                           )}
                       </div>
                   )))}
               </div>
          </div>
      </div>
    </div>
  );
};
