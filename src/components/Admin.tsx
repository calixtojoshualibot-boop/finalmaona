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

  // Fetch users from backend on component mount
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

  // ACTION 1: Change User Role
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

  // ACTION 2: Delete User Account
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this account?")) {
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

  if (loading) return <div className="text-center p-10">Loading accounts...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">User Accounts</h2>
        <button 
          onClick={() => window.history.back()} 
          className="text-sm font-semibold text-slate-600 hover:text-slate-900 uppercase"
        >
          Back
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white font-medium text-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                <td className="px-6 py-4 text-gray-500 font-normal">{user.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-bold rounded uppercase tracking-wide cursor-pointer border border-transparent focus:outline-none focus:border-slate-300 ${
                      user.role === "admin" 
                        ? "bg-red-600 text-white" 
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    <option value="user" className="bg-white text-slate-800">User</option>
                    <option value="admin" className="bg-white text-slate-800">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
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
  );
}
