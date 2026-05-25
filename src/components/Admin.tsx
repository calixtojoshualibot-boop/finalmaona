import React, { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  // Navigation tab tracker state
  const [activeTab, setActiveTab] = useState<"menu" | "users" | "products" | "colors">("menu");
  
  // User Accounts State
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users only when the user opens the User Accounts panel
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // User Actions: Change Role
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

  // User Actions: Delete Account
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

  // --- VIEW 1: USER ACCOUNTS PANEL ---
  if (activeTab === "users") {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-xl p-6 mt-4 border border-slate-100">
          {/* HEADER BLOCK WITH WORKING BACK TOGLE */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-50">
            <h2 className="text-lg font-extrabold tracking-wider text-slate-900 uppercase">
              User Accounts
            </h2>
            <button 
              onClick={() => setActiveTab("menu")} // Redirects straight back to your main admin control panel
              className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest bg-transparent border-none cursor-pointer transition-colors"
            >
              Back
            </button>
          </div>

          {loadingUsers ? (
            <div className="text-center p-10 font-medium text-slate-400">Loading accounts...</div>
          ) : (
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
                      <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-normal whitespace-nowrap">{user.email}</td>
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
                          <option value="user" className="text-slate-800 font-semibold">User</option>
                          <option value="admin" className="text-slate-800 font-semibold">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100/50 cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: ADD PRODUCTS PANEL ---
  if (activeTab === "products") {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wide">Add New Product</h2>
            <button onClick={() => setActiveTab("menu")} className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase">Back</button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Product configuration form and upload utilities go here...</p>
          {/* Your product form logic here */}
        </div>
      </div>
    );
  }

  // --- VIEW 3: WEB COLOR CONFIGURATION PANEL ---
  if (activeTab === "colors") {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold uppercase tracking-wide">Configure Website Colors</h2>
            <button onClick={() => setActiveTab("menu")} className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase">Back</button>
          </div>
          <p className="text-sm text-slate-500 mb-4">Theme adjustment utilities and CSS variable modifiers go here...</p>
          {/* Your color styling setup controls here */}
        </div>
      </div>
    );
  }

  // --- MAIN VIEW: CORE ADMIN DASHBOARD HUB ---
  return (
    <div className="min-h-screen bg-slate-50/50 p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white shadow-md rounded-2xl p-8 border border-slate-100 text-center">
        <h1 className="text-2xl font-black tracking-wider text-slate-900 uppercase mb-2">Admin Control Panel</h1>
        <p className="text-sm text-slate-400 uppercase tracking-widest mb-10 font-bold">Select a management configuration system</p>
        
        {/* GRID OPTIONS SELECTION MENU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* OPTION 1: USER ACCOUNT PANEL ACCESS */}
          <button
            onClick={() => setActiveTab("users")}
            className="p-6 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-900 hover:text-white hover:border-transparent hover:shadow-xl transition-all group text-center cursor-pointer"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-extrabold uppercase tracking-wide text-sm group-hover:text-white">User Accounts</h3>
            <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 font-medium">Manage permissions and roles</p>
          </button>

          {/* OPTION 2: PRODUCT MANAGEMENT ACCESS */}
          <button
            onClick={() => setActiveTab("products")}
            className="p-6 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-900 hover:text-white hover:border-transparent hover:shadow-xl transition-all group text-center cursor-pointer"
          >
            <div className="text-2xl mb-2">🧢</div>
            <h3 className="font-extrabold uppercase tracking-wide text-sm group-hover:text-white">Add Products</h3>
            <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 font-medium">Add merchandise inventory</p>
          </button>

          {/* OPTION 3: THEME COLOR MANAGER CONFIGURATION */}
          <button
            onClick={() => setActiveTab("colors")}
            className="p-6 border border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-slate-900 hover:text-white hover:border-transparent hover:shadow-xl transition-all group text-center cursor-pointer"
          >
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-extrabold uppercase tracking-wide text-sm group-hover:text-white">Web Styles</h3>
            <p className="text-xs text-slate-400 mt-1 group-hover:text-slate-300 font-medium">Modify application accent themes</p>
          </button>

        </div>
      </div>
    </div>
  );
}
