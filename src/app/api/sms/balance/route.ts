import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json({ balance: 0, error: 'Store ID required' }, { status: 400 });
        }

        // Load SMS config from DB
        const { data: rawData, error } = await supabase
            .from('app_settings')
            .select('sms_config')
            .eq('store_id', storeId);

        if (error || !rawData?.[0]?.sms_config) {
            return NextResponse.json({ balance: 0, error: 'SMS config not found' });
        }

        const config = rawData[0].sms_config;

        if (config.provider === 'mnotify' && config.mnotify?.apiKey) {
            const apiKey = config.mnotify.apiKey.trim();
            try {
                const res = await fetch(`https://api.mnotify.com/api/balance/sms?key=${apiKey}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!res.ok) {
                    console.error(`mNotify Balance Check Failed (Status: ${res.status})`);
                    return NextResponse.json({ balance: 0 });
                }

                const data = await res.json();
                return NextResponse.json({ balance: parseFloat(data?.balance || '0') });
            } catch (e) {
                console.error("Failed to fetch mNotify balance", e);
                return NextResponse.json({ balance: 0 });
            }
        }

        return NextResponse.json({ balance: 0 });

    } catch (e: any) {
        console.error('SMS Balance API Error:', e);
        return NextResponse.json({ balance: 0, error: e.message }, { status: 500 });
    }
}