'use client';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';
import {
    Receipt,
    Plus,
    Trash2,
    Calendar,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    MoreHorizontal,
    TrendingUp
} from 'lucide-react';

export default function IncomeExpensesPage() {
    const { activeStore } = useAuth();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [income, setIncome] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [newExpense, setNewExpense] = useState({
        category: 'Rent',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const CATEGORIES = ['Rent', 'Utilities', 'Salary', 'Maintenance', 'Inventory', 'Marketing', 'Other'];

    useEffect(() => {
        if (activeStore?.id) {
            fetchData();
        }
    }, [activeStore]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Expenses
            const { data: expensesData } = await supabase
                .from('expenses')
                .select('*')
                .eq('store_id', activeStore?.id)
                .order('date', { ascending: false });

            if (expensesData) setExpenses(expensesData);

            // 2. Fetch Sales & Calculate Income (Gross Profit)
            // Income = Total Revenue - Total Cost of Goods Sold
            // We need sale items to calculate this
            const { data: salesData, error: salesError } = await supabase
                .from('sales')
                .select(`
                    id,
                    sale_items (
                        quantity,
                        price_at_sale,
                        product:products (
                            cost_price
                        )
                    )
                `)
                .eq('store_id', activeStore?.id);

            if (salesData) {
                let totalProfit = 0;
                salesData.forEach((sale: any) => {
                    sale.sale_items?.forEach((item: any) => {
                        const quantity = item.quantity || 0;
                        const sellingPrice = item.price_at_sale || 0;
                        const costPrice = item.product?.cost_price || 0;

                        // Profit = (Price - Cost) * Qty
                        const itemProfit = (sellingPrice - costPrice) * quantity;
                        totalProfit += itemProfit;
                    });
                });
                setIncome(totalProfit);
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async () => {
        if (!activeStore) return;
        if (!newExpense.amount || !newExpense.category) return;

        const { error } = await supabase.from('expenses').insert({
            store_id: activeStore.id,
            category: newExpense.category,
            amount: parseFloat(newExpense.amount),
            description: newExpense.description,
            date: newExpense.date
        });

        if (!error) {
            setIsAddModalOpen(false);
            setNewExpense({
                category: 'Rent',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } else {
            alert('Failed to add expense');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (!error) {
            setExpenses(prev => prev.filter(e => e.id !== id));
        }
    };

    const filteredExpenses = expenses.filter(e =>
        e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = income - totalExpenses;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Income & Expenses</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Track your profits and manage operational costs.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-500/30"
                >
                    <Plus className="h-4 w-4" />
                    Add Expense
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                {/* Income Card */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-6 dark:border-emerald-900/50 dark:bg-emerald-900/20">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Income (Gross Profit)</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {activeStore?.currency} {income.toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Expenses Card */}
                <div className="rounded-xl border border-rose-100 bg-rose-50 p-6 dark:border-rose-900/50 dark:bg-rose-900/20">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-rose-100 p-3 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                            <ArrowDownRight className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Total Expenses</p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {activeStore?.currency} {totalExpenses.toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className={`rounded-xl border p-6 ${netProfit >= 0
                    ? 'border-indigo-100 bg-indigo-50 dark:border-indigo-900/50 dark:bg-indigo-900/20'
                    : 'border-orange-100 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-900/20'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`rounded-full p-3 ${netProfit >= 0
                            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
                            : 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400'}`}>
                            <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                            <p className={`text-sm font-medium ${netProfit >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                Net Profit
                            </p>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {activeStore?.currency} {netProfit.toFixed(2)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Expense History</h3>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-800">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search expenses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-200"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Category</th>
                                <th className="px-6 py-3 font-medium">Description</th>
                                <th className="px-6 py-3 font-medium text-right">Amount</th>
                                <th className="px-6 py-3 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        Loading data...
                                    </td>
                                </tr>
                            ) : filteredExpenses.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        No expenses found.
                                    </td>
                                </tr>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <td className="px-6 py-4 dark:text-slate-300">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 dark:text-slate-300">
                                            {expense.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                                            {activeStore?.currency} {Number(expense.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 transition-all"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add New Expense</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                                <input
                                    type="date"
                                    value={newExpense.date}
                                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Amount</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                                <textarea
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-800"
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddExpense}
                                    className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                                >
                                    Save Expense
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
