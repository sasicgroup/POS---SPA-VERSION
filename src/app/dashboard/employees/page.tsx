'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Plus, Search, MoreVertical, Shield, User as UserIcon, X, Edit2, Trash2 } from 'lucide-react';

interface Employee {
    id: any;
    name: string;
    username?: string;
    phone?: string;
    role: string;
    pin?: string;
    salary?: number;
    avatar?: string;
    status?: string;
    joinDate?: string;
    is_locked?: boolean;
    failed_attempts?: number;
    otp_enabled?: boolean;
    shift_start?: string;
    shift_end?: string;
    work_days?: string[];
}

export default function EmployeesPage() {
    const { activeStore, unlockAccount } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
    const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
        name: '', username: '', phone: '', role: 'staff', pin: '', salary: 0, otp_enabled: true,
        shift_start: '', shift_end: '', work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeMenu, setActiveMenu] = useState<any>(null);
    const [editingId, setEditingId] = useState<any>(null);

    useEffect(() => {
        if (activeStore?.id) fetchEmployees();
    }, [activeStore?.id]);

    const fetchEmployees = async () => {
        if (!activeStore?.id) return;
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('store_id', activeStore.id);

        if (error) console.error(error);
        if (data) setEmployees(data);
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeStore?.id) return;
        setIsSubmitting(true);

        if (editingId) {
            // Update
            const { error } = await supabase.from('employees').update({
                name: newEmployee.name,
                username: newEmployee.username,
                phone: newEmployee.phone,
                role: newEmployee.role,
                otp_enabled: newEmployee.otp_enabled,
                pin: newEmployee.pin,
                salary: newEmployee.salary,
                shift_start: newEmployee.shift_start,
                shift_end: newEmployee.shift_end,
                work_days: newEmployee.work_days
            }).eq('id', editingId);

            if (error) {
                console.error("Error updating employee:", error);
                alert("Failed to update employee");
            } else {
                setEmployees(prev => prev.map(e => e.id === editingId ? { ...e, ...newEmployee } : e) as any);
                setIsAddEmployeeOpen(false);
                setEditingId(null);
                setNewEmployee({ name: '', username: '', phone: '', role: 'staff', pin: '', salary: 0, otp_enabled: true, shift_start: '', shift_end: '', work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });
            }
        } else {
            // Insert
            const { data, error } = await supabase.from('employees').insert({
                store_id: activeStore.id,
                name: newEmployee.name,
                username: newEmployee.username,
                phone: newEmployee.phone,
                role: newEmployee.role,
                otp_enabled: newEmployee.otp_enabled,
                pin: newEmployee.pin,
                salary: newEmployee.salary,
                shift_start: newEmployee.shift_start || null,
                shift_end: newEmployee.shift_end || null,
                work_days: newEmployee.work_days
            }).select().single();

            if (error) {
                console.error("Error adding employee:", error);
                alert("Failed to add employee");
            } else if (data) {
                setEmployees(prev => [data, ...prev]);
                setIsAddEmployeeOpen(false);
                setNewEmployee({ name: '', username: '', phone: '', role: 'staff', pin: '', salary: 0, otp_enabled: true, shift_start: '', shift_end: '', work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });
            }
        }
        setIsSubmitting(false);
    };

    const handleDeleteEmployee = async (id: any) => {
        if (!confirm('Are you sure you want to delete this employee?')) return;
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) {
            console.error("Error deleting", error);
            alert("Failed to delete");
        } else {
            setEmployees(prev => prev.filter(e => e.id !== id));
        }
    };

    const handleUnlock = async (id: any) => {
        if (!unlockAccount) return;
        if (confirm("Are you sure you want to unlock this account?")) {
            const success = await unlockAccount(id);
            if (success) {
                alert("Account unlocked");
                fetchEmployees(); // Refresh list
            } else {
                alert("Failed to unlock");
            }
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team Members</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Manage access and roles for your store staff.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setNewEmployee({ name: '', username: '', phone: '', role: 'staff', pin: '', salary: 0, otp_enabled: true, shift_start: '', shift_end: '', work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] });
                        setIsAddEmployeeOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/30"
                >
                    <Plus className="h-4 w-4" />
                    Add Employee
                </button>
            </div>

            <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search employees..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredEmployees.map((employee) => (
                    <div key={employee.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700">
                        <div className="absolute top-4 right-4 z-10">
                            <button
                                onClick={() => setActiveMenu(activeMenu === employee.id ? null : employee.id)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>

                            {activeMenu === employee.id && (
                                <>
                                    <div className="fixed inset-0 z-0" onClick={() => setActiveMenu(null)}></div>
                                    <div className="absolute right-0 top-10 w-48 rounded-lg border border-slate-100 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 overflow-hidden">
                                        <button
                                            onClick={() => {
                                                setEditingId(employee.id);
                                                setNewEmployee({
                                                    name: employee.name,
                                                    username: employee.username || '',
                                                    phone: employee.phone || '',
                                                    role: employee.role,
                                                    pin: employee.pin,
                                                    salary: employee.salary || 0,
                                                    otp_enabled: employee.otp_enabled,
                                                    shift_start: employee.shift_start || '',
                                                    shift_end: employee.shift_end || '',
                                                    work_days: employee.work_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                                });
                                                setActiveMenu(null);
                                                setIsAddEmployeeOpen(true);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <Edit2 className="h-4 w-4" /> Edit Details
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveMenu(null);
                                                handleDeleteEmployee(employee.id);
                                            }}
                                            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" /> Remove
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-slate-400">
                                {employee.avatar ? (
                                    <img src={employee.avatar} alt={employee.name} className="h-full w-full object-cover" />
                                ) : (
                                    <UserIcon className="h-8 w-8" />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{employee.name}</h3>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Shield className={`h-3 w-3 ${employee.role === 'owner' ? 'text-amber-500' : employee.role === 'manager' ? 'text-indigo-500' : 'text-slate-500'}`} />
                                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">{employee.role}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Status</span>
                                <div className="flex items-center gap-2">
                                    {employee.is_locked ? (
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            Locked
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>
                            {employee.username && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Username</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{employee.username}</span>
                                </div>
                            )}

                            {employee.is_locked && (
                                <button
                                    onClick={() => handleUnlock(employee.id)}
                                    className="w-full mt-2 rounded bg-amber-100 py-1 text-xs font-bold text-amber-700 hover:bg-amber-200"
                                >
                                    Unlock Account
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty State Helper to encourage adding */}
                {filteredEmployees.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500">
                        <p>No employees found. Add your team members here.</p>
                    </div>
                )}
            </div>

            {/* Scale-up Add Employee Modal */}
            {isAddEmployeeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-in zoom-in-95 duration-200">
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Team Member' : 'Add Team Member'}</h2>
                            <button onClick={() => setIsAddEmployeeOpen(false)} className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <X className="h-5 w-5 text-slate-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                    value={newEmployee.name}
                                    onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                    value={newEmployee.username}
                                    onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                                <input
                                    type="tel"
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                    value={newEmployee.phone}
                                    onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                                    placeholder="e.g. 0244000000"
                                />
                            </div>

                            <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Shift Schedule</label>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs text-slate-500">Start Time</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                            value={newEmployee.shift_start || ''}
                                            onChange={e => setNewEmployee({ ...newEmployee, shift_start: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500">End Time</label>
                                        <input
                                            type="time"
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                            value={newEmployee.shift_end || ''}
                                            onChange={e => setNewEmployee({ ...newEmployee, shift_end: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 mb-1 block">Working Days</label>
                                    <div className="flex flex-wrap gap-1">
                                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => {
                                                    const days = newEmployee.work_days || [];
                                                    if (days.includes(day)) {
                                                        setNewEmployee({ ...newEmployee, work_days: days.filter(d => d !== day) });
                                                    } else {
                                                        setNewEmployee({ ...newEmployee, work_days: [...days, day] });
                                                    }
                                                }}
                                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${(newEmployee.work_days || []).includes(day)
                                                    ? 'bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-300'
                                                    : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                    }`}
                                            >
                                                {day.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                                    <select
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                        value={newEmployee.role}
                                        onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })}
                                    >
                                        <option value="staff">Staff</option>
                                        <option value="manager">Manager</option>
                                        <option value="owner">Owner</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">PIN (Login)</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={4}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                                        value={newEmployee.pin}
                                        onChange={e => setNewEmployee({ ...newEmployee, pin: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="otp_enabled"
                                    checked={newEmployee.otp_enabled}
                                    onChange={e => setNewEmployee({ ...newEmployee, otp_enabled: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="otp_enabled" className="text-sm text-slate-700 dark:text-slate-300">Enable OTP (Requires Phone Number)</label>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isSubmitting ? 'Saving...' : 'Add Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
