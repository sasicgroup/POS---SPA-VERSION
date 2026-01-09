'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 2 * 60 * 1000, // 2 minutes - data is fresh for 2 mins
                        gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache
                        refetchOnWindowFocus: false, // Don't refetch on window focus
                        refetchOnReconnect: true, // Refetch when internet reconnects
                        retry: 1, // Retry failed requests once
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {/* DevTools only in development */}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom" />
            )}
        </QueryClientProvider>
    );
}
