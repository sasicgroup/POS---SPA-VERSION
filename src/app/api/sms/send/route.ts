import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface SMSConfig {
    provider: 'hubtel' | 'mnotify';
    hubtel?: {
        clientId: string;
        clientSecret: string;
        senderId: string;
    };
    mnotify?: {
        apiKey: string;
        senderId: string;
    };
}

const sendHubtelSMS = async (config: SMSConfig, phone: string, message: string): Promise<boolean> => {
    if (!config.hubtel?.clientId || !config.hubtel?.clientSecret || !config.hubtel?.senderId) {
        console.warn('Hubtel credentials missing');
        return false;
    }

    const simplePhone = phone.replace(/\D/g, '');

    const url = `https://smsc.hubtel.com/v1/messages/send?clientsecret=${config.hubtel.clientSecret}&clientid=${config.hubtel.clientId}&from=${encodeURIComponent(config.hubtel.senderId)}&to=${simplePhone}&content=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(url, { method: 'GET' });
        const data = await response.json();
        console.log('[Hubtel Response]', data);
        return response.ok;
    } catch (e) {
        console.error('[Hubtel Error]', e);
        return false;
    }
};

const sendMNotifySMS = async (config: SMSConfig, phone: string, message: string): Promise<boolean> => {
    if (!config.mnotify?.apiKey || !config.mnotify?.senderId) {
        console.warn('mNotify credentials missing');
        return false;
    }

    const apiKey = (config.mnotify.apiKey || '').trim();
    const url = `https://api.mnotify.com/api/sms/quick?key=${apiKey}`;

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '233' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('233') && formattedPhone.length === 9) {
        formattedPhone = '233' + formattedPhone;
    }

    const body = {
        recipient: [formattedPhone],
        sender: config.mnotify.senderId.substring(0, 11),
        message: message,
        is_schedule: false,
        schedule_date: "",
        sms_type: "otp"
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log('[mNotify Response]', data);
        return data.code === '2000' || data.status === 'success' || data.code === 2000;
    } catch (e) {
        console.error('[mNotify Error]', e);
        return false;
    }
};

const sendMetaWhatsApp = async (config: SMSConfig, phone: string, message: string) => {
    if (!config.meta?.accessToken || !config.meta?.phoneNumberId) {
        console.warn('Meta WhatsApp credentials missing');
        return false;
    }

    const simplePhone = phone.replace(/\D/g, '');
    const url = `https://graph.facebook.com/v17.0/${config.meta.phoneNumberId}/messages`;

    const body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: simplePhone,
        type: "text",
        text: {
            preview_url: false,
            body: message
        }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.meta.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log('[Meta WhatsApp Response]', data);
        return response.ok && !data.error;
    } catch (e) {
        console.error('[Meta WhatsApp Error]', e);
        return false;
    }
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('[SMS API] Received request:', body);

        const { phone, message, channels, storeId } = body;

        if (!phone || !message || !storeId || !channels) {
            console.error('[SMS API] Missing required fields:', { phone: !!phone, message: !!message, storeId: !!storeId, channels: !!channels });
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        if (!Array.isArray(channels)) {
            console.error('[SMS API] Channels must be an array:', channels);
            return NextResponse.json({ success: false, error: 'Channels must be an array' }, { status: 400 });
        }

        const cleanPhone = phone.toString().trim();
        if (!cleanPhone) {
            console.error('[SMS API] Phone number is empty after trim');
            return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
        }

        // Load SMS config from DB
        const { data: rawData, error } = await supabase
            .from('app_settings')
            .select('sms_config')
            .eq('store_id', storeId);

        if (error || !rawData?.[0]?.sms_config) {
            console.error('[SMS API] Config load error:', error, 'Data:', rawData);
            return NextResponse.json({ success: false, error: 'SMS config not found' }, { status: 400 });
        }

        const config: SMSConfig = rawData[0].sms_config;
        console.log('[SMS API] Loaded config:', { provider: config.provider, hasHubtel: !!config.hubtel?.clientId, hasMnotify: !!config.mnotify?.apiKey });

        let smsSuccess = false;
        let whatsappSuccess = false;

        // Send SMS
        if (channels.includes('sms')) {
            console.log('[SMS API] Attempting to send SMS via', config.provider);
            if (config.provider === 'hubtel') {
                if (!config.hubtel?.clientId || !config.hubtel?.clientSecret) {
                    console.error('[SMS API] Hubtel credentials missing');
                    return NextResponse.json({ success: false, error: 'Hubtel credentials not configured' }, { status: 400 });
                }
                smsSuccess = await sendHubtelSMS(config, cleanPhone, message);
            } else if (config.provider === 'mnotify') {
                if (!config.mnotify?.apiKey) {
                    console.error('[SMS API] mNotify API key missing');
                    return NextResponse.json({ success: false, error: 'mNotify API key not configured' }, { status: 400 });
                }
                smsSuccess = await sendMNotifySMS(config, cleanPhone, message);
            } else {
                console.error('[SMS API] No SMS provider configured');
                return NextResponse.json({ success: false, error: 'No SMS provider configured' }, { status: 400 });
            }
        }

        // Send WhatsApp
        if (channels.includes('whatsapp') && config.whatsappProvider !== 'none') {
            whatsappSuccess = await sendMetaWhatsApp(config, cleanPhone, message);
        }

        // Log to DB
        await supabase.from('sms_logs').insert({
            phone: cleanPhone,
            message,
            channel: channels.includes('sms') ? 'sms' : 'whatsapp',
            status: (smsSuccess || whatsappSuccess) ? 'sent' : 'failed',
            store_id: storeId,
            created_at: new Date().toISOString()
        });

        const success = smsSuccess || whatsappSuccess;
        return NextResponse.json({
            success,
            error: success ? undefined : 'Failed to send message'
        });

    } catch (e: any) {
        console.error('SMS API Error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}