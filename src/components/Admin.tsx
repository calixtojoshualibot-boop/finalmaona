import React, { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from the backend server database pool
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // ACTION 1: Change User Account Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  // ACTION 2: Delete User Account Permanently
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          setUsers(users.filter(u => u.id !== userId));
        } else {
          const data = await response.json();
          alert(data.error || "Failed to delete user");
        }
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    }
  };

  if (loading) {
    return <div className="text-center p-10 font-medium text-slate-400">Loading accounts...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-xl p-6 mt-4 border border-slate-100">
        
        {/* HEADER BLOCK */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
          <h2 className="text-lg font-extrabold tracking-wider text-slate-900 uppercase">
            User Accounts
          </h2>
          <button 
            onClick={() => window.history.back()} 
            className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
          >
            Back
          </button>
        </div>

        {/* CUSTOM LAYOUT RESPONSIVE GRID BOX */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead>
              <tr className="text-slate-400 font-bold text-xs tracking-wider uppercase bg-slate-50/70">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                  {/* USER FULLNAME NAME */}
                  <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">
                    {user.name}
                  </td>
                  
                  {/* USER DATA ACCOUNT EMAIL */}
                  <td className="px-6 py-4 text-slate-500 font-normal whitespace-nowrap">
                    {user.email}
                  </td>
                  
                  {/* ACTION DROPDOWN FOR ROLES */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-3 py-1 text-xs font-extrabold rounded-md uppercase tracking-wider cursor-pointer border focus:outline-none transition-all ${
                        user.role.toLowerCase() === "admin"
                          ? "bg-red-600 text-white border-transparent shadow-sm hover:bg-red-700"
                          : "bg-slate-100 text-slate-600 border-slate-200/60 hover:bg-slate-200/80"
                      }`}
                    >
                      <option value="user" className="bg-white text-slate-800 font-semibold">User</option>
                      <option value="admin" className="bg-white text-slate-800 font-semibold">Admin</option>
                    </select>
                  </td>
                  
                  {/* BUTTON ACTION FIELD FOR ROW DELETIONS */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100/50 cursor-pointer transition-all active:scale-95"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
