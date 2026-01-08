'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { logActivity } from './logger';
import { useAuth } from './auth-context';

/**
 * Hook to automatically track page visits and user activity
 * Place this in your dashboard layout to track all navigation
 */
export function useActivityTracker() {
    const pathname = usePathname();
    const { user, activeStore } = useAuth();
    const lastPathRef = useRef<string>('');

    useEffect(() => {
        // Only track if user is logged in and path has changed
        if (!user || !pathname || pathname === lastPathRef.current) return;

        // Update last path
        lastPathRef.current = pathname;

        // Skip tracking for the root path on initial load
        if (pathname === '/') return;

        // Extract page name from pathname
        const pageName = pathname
            .split('/')
            .filter(Boolean)
            .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' > ');

        // Log page visit
        logActivity('PAGE_VISIT', {
            page: pageName,
            path: pathname,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
        }, user.id, activeStore?.id);

    }, [pathname, user, activeStore]);
}

/**
 * Helper function to log specific actions
 */
export const trackAction = (
    action: string,
    details: any = {},
    userId?: string,
    storeId?: string
) => {
    logActivity(action, {
        ...details,
        timestamp: new Date().toISOString(),
    }, userId, storeId);
};

/**
 * Common action trackers
 */
export const ActivityTrackers = {
    // Product actions
    productAdded: (productName: string, sku: string) =>
        trackAction('PRODUCT_ADDED', { productName, sku }),

    productUpdated: (productName: string, sku: string, changes: any) =>
        trackAction('PRODUCT_UPDATED', { productName, sku, changes }),

    productDeleted: (productName: string, sku: string) =>
        trackAction('PRODUCT_DELETED', { productName, sku }),

    // Sale actions
    saleCompleted: (saleId: string, amount: number, items: number) =>
        trackAction('SALE_COMPLETED', { saleId, amount, items }),

    saleDeleted: (saleId: string, amount: number) =>
        trackAction('SALE_DELETED', { saleId, amount }),

    // Customer actions
    customerAdded: (customerName: string, phone: string) =>
        trackAction('CUSTOMER_ADDED', { customerName, phone }),

    customerUpdated: (customerName: string, changes: any) =>
        trackAction('CUSTOMER_UPDATED', { customerName, changes }),

    customerDeleted: (customerName: string) =>
        trackAction('CUSTOMER_DELETED', { customerName }),

    // Employee actions
    employeeAdded: (employeeName: string, role: string) =>
        trackAction('EMPLOYEE_ADDED', { employeeName, role }),

    employeeUpdated: (employeeName: string, changes: any) =>
        trackAction('EMPLOYEE_UPDATED', { employeeName, changes }),

    employeeDeleted: (employeeName: string) =>
        trackAction('EMPLOYEE_DELETED', { employeeName }),

    // Expense actions
    expenseAdded: (category: string, amount: number) =>
        trackAction('EXPENSE_ADDED', { category, amount }),

    expenseUpdated: (category: string, amount: number) =>
        trackAction('EXPENSE_UPDATED', { category, amount }),

    expenseDeleted: (category: string, amount: number) =>
        trackAction('EXPENSE_DELETED', { category, amount }),

    // Settings actions
    settingsUpdated: (section: string, changes: any) =>
        trackAction('SETTINGS_UPDATED', { section, changes }),

    profileUpdated: (changes: any) =>
        trackAction('PROFILE_UPDATED', { changes }),

    // Report actions
    reportGenerated: (reportType: string, dateRange: any) =>
        trackAction('REPORT_GENERATED', { reportType, dateRange }),

    reportExported: (reportType: string, format: string) =>
        trackAction('REPORT_EXPORTED', { reportType, format }),

    // Search actions
    searchPerformed: (query: string, module: string, resultsCount: number) =>
        trackAction('SEARCH_PERFORMED', { query, module, resultsCount }),
};
