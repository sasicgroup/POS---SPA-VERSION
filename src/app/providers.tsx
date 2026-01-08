'use client';

import { AuthProvider } from '../lib/auth-context';
import { InventoryProvider } from '../lib/inventory-context';
import { ReactQueryProvider } from '../lib/react-query-provider';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ReactQueryProvider>
            <AuthProvider>
                <InventoryProvider>
                    {children}
                </InventoryProvider>
            </AuthProvider>
        </ReactQueryProvider>
    );
}
