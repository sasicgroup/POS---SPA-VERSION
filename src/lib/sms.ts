
export interface SMSConfig {
    provider: 'hubtel' | 'mnotify';
    whatsappProvider: 'meta' | 'none';
    hubtel?: {
        clientId: string;
        clientSecret: string;
        senderId: string;
    };
    mnotify?: {
        apiKey: string;
        senderId: string;
    };
    meta?: {
        accessToken: string;
        phoneNumberId: string;
        businessAccountId: string;
    };
    notifications: {
        owner: {
            sms: boolean;
            whatsapp: boolean;
        };
        customer: {
            sms: boolean;
            whatsapp: boolean;
        };
    };
    templates: {
        welcome: string;
        receipt: string;
        ownerSale?: string;
    };
}

import { supabase } from '@/lib/supabase';

// ... interface ...

// Local cache
let smsConfig: SMSConfig = {
    provider: 'hubtel',
    whatsappProvider: 'none',
    hubtel: { clientId: '', clientSecret: '', senderId: '' },
    mnotify: { apiKey: '', senderId: '' },
    meta: { accessToken: '', phoneNumberId: '', businessAccountId: '' },
    notifications: {
        owner: { sms: true, whatsapp: false },
        customer: { sms: true, whatsapp: false }
    },
    templates: {
        welcome: "Welcome {Name}! You have been registered. Shop with us to earn points.",
        receipt: "Thanks for buying! Total: GHS {Amount}. See you soon!",
        ownerSale: "New Sale Alert: GHS {Amount} by {Name}. Total Today: {TotalOrders} orders."
    }
};

export const loadSMSConfigFromDB = async (storeId: string) => {
    const { data: rawData, error } = await supabase
        .from('app_settings')
        .select('sms_config')
        .eq('store_id', storeId);

    if (error) {
        console.error(`[SMS Config Error] Failed to fetch from DB:`, error);
        return null;
    }

    const data: any = rawData?.[0];

    if (data && data.sms_config) {
        console.log(`[SMS Config] Successfully loaded config from DB for store: ${storeId}`);
        smsConfig = { ...smsConfig, ...data.sms_config };
        if (typeof window !== 'undefined') {
            localStorage.setItem('sms_config', JSON.stringify(smsConfig));
        }
        return smsConfig;
    }
    console.warn(`[SMS Config] No config found in DB for store: ${storeId}`);
    return null;
}

export const getSMSConfig = (): SMSConfig => {
    // Priority: If we have an active config in memory (already loaded from DB), use it 
    // to avoid merging with stale localStorage data.
    if (smsConfig.mnotify?.apiKey || smsConfig.hubtel?.clientId) {
        return smsConfig;
    }

    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('sms_config');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log(`[SMS Config] Found config in localStorage. Key starts with: ${parsed.mnotify?.apiKey?.substring(0, 4) || 'none'}`);
                // Update in-memory cache but keep it synced
                smsConfig = { ...smsConfig, ...parsed };
                return smsConfig;
            } catch (e) {
                console.error("Failed to parse SMS config", e);
            }
        }
    }
    console.log(`[SMS Config] Using in-memory config. Key starts with: ${smsConfig.mnotify?.apiKey?.substring(0, 4) || 'none'}`);
    return smsConfig;
};

export const updateSMSConfig = async (config: SMSConfig, storeId?: string): Promise<{ success: boolean; error?: any }> => {
    smsConfig = config;
    if (typeof window !== 'undefined') {
        localStorage.setItem('sms_config', JSON.stringify(config));
    }

    if (storeId) {
        // Upsert to DB
        const { error } = await supabase
            .from('app_settings')
            .upsert({
                store_id: storeId,
                sms_config: config
            });

        if (error) {
            console.error("Failed to save SMS config to DB", error);
            return { success: false, error };
        } else {
            console.log(`[SMS Config] Successfully saved config to DB for store: ${storeId}`);
            return { success: true };
        }
    }
    return { success: true };
};

const sendHubtelSMS = async (config: SMSConfig, phone: string, message: string): Promise<boolean> => {
    if (!config.hubtel?.clientId || !config.hubtel?.clientSecret || !config.hubtel?.senderId) {
        console.warn('Hubtel credentials missing');
        return false;
    }

    const simplePhone = phone.replace(/\D/g, ''); // Remove non-digits

    // Hubtel V1 Endpoint
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

    // Revert to the primary Quick SMS endpoint
    const apiKey = (config.mnotify.apiKey || '').trim();
    const url = `https://api.mnotify.com/api/sms/quick?key=${apiKey}`;

    // Sanitize and format phone number for Ghana (233)
    let formattedPhone = phone.replace(/\D/g, ''); // Remove non-digits
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
        // Adding sms_type 'otp' tells mNotify to use a more reliable route
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

        // mNotify success code is 2000
        return data.code === '2000' || data.status === 'success' || data.code === 2000;
    } catch (e) {
        console.error('[mNotify Error]', e);
        return false;
    }
};

const sendMetaWhatsApp = async (config: SMSConfig, phone: string, message: string) => {
    if (!config.meta?.accessToken || !config.meta?.phoneNumberId) {
        console.warn('Meta WhatsApp credentials missing');
        return;
    }

    const simplePhone = phone.replace(/\D/g, '');
    const url = `https://graph.facebook.com/v17.0/${config.meta.phoneNumberId}/messages`;

    // Note: Meta Cloud API usually requires a Template Message for initiation or 24h window.
    // We will assume "text" payload for simplicity, but template is recommended for business initiated convo.
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
        if (data.error) {
            console.error('[Meta WhatsApp Error Detail]', data.error);
        }
    } catch (e) {
        console.error('[Meta WhatsApp Error]', e);
    }
};

// --- Logging & History ---

export const logSMS = async (phone: string, message: string, channel: 'sms' | 'whatsapp', status: 'sent' | 'failed', storeId?: string) => {
    // Attempt to log to Supabase.
    // Ensure you have a table 'sms_logs' with columns: id, created_at, phone, message, channel, status, store_id
    try {
        await supabase.from('sms_logs').insert({
            phone,
            message,
            channel,
            status,
            store_id: storeId,
            created_at: new Date().toISOString()
        });
    } catch (e) {
        console.error("Failed to log SMS", e);
    }
};

export const getSMSHistory = async (storeId: string, page: number = 1, limit: number = 10) => {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
        .from('sms_logs')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error("Error fetching SMS history", error);
        return { data: [], count: 0 };
    }

    return { data, count };
};

export const sendNotification = async (type: 'welcome' | 'sale', data: any) => {
    // 1. Ensure config is loaded (Try memory, then DB)
    let config = getSMSConfig(); // This already tries localStorage and then global smsConfig

    if (!config) {
        console.warn('SMS Config not loaded. Notification skipped.');
        return;
    }

    const { notifications } = config;
    const { owner, customer } = notifications;
    const storeId = data.storeId;

    // --- Customer Notifications ---
    if (data.customerPhone) {
        let msg = '';
        if (type === 'welcome') {
            msg = config.templates.welcome.replace('{Name}', data.customerName || 'Customer');
        } else if (type === 'sale') {
            // Support {var} and {Var} for some consistency
            msg = config.templates.receipt
                .replace(/{Amount}/g, Number(data.amount).toFixed(2))
                .replace(/{Id}/g, (data.id || '').toString())
                .replace(/{receipt}/g, (data.id || '').toString())
                .replace(/{Receipt}/g, (data.id || '').toString())
                .replace(/{PointsEarned}/g, (data.pointsEarned || '0').toString())
                .replace(/{TotalPoints}/g, (data.totalPoints || '0').toString())
                .replace(/{Name}/g, data.customerName || 'Customer')
                .replace(/{name}/g, data.customerName || 'Customer')
                .replace(/{staff-name}/g, data.staffName || 'Staff');
        }

        console.log(`[SMS] Sending ${type} to customer: ${data.customerPhone}`);

        if (msg) {
            if (customer.sms) await sendDirectMessage(data.customerPhone, msg, ['sms'], storeId);
            if (customer.whatsapp) await sendDirectMessage(data.customerPhone, msg, ['whatsapp'], storeId);
        }
    }

    // --- Owner Notifications ---
    if (data.ownerPhone) {
        let msg = '';
        if (type === 'sale') {
            const template = config.templates.ownerSale || "New sale: GHS {Amount} by {Name}.";
            msg = template
                .replace('{Amount}', Number(data.amount).toFixed(2))
                .replace('{Name}', data.customerName || 'Customer')
                .replace('{TotalOrders}', (data.totalOrders || '0').toString());
        }

        if (msg) {
            if (owner.sms) await sendDirectMessage(data.ownerPhone, msg, ['sms'], storeId);
            if (owner.whatsapp) await sendDirectMessage(data.ownerPhone, msg, ['whatsapp'], storeId);
        }
    }

    return true;
};

export const sendDirectMessage = async (phone: string, message: string, channels: ('sms' | 'whatsapp')[] = ['sms', 'whatsapp'], storeId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const response = await fetch('/api/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone,
                message,
                channels,
                storeId
            })
        });

        const data = await response.json();
        return {
            success: data.success,
            error: data.error
        };
    } catch (e: any) {
        console.error('[SMS API Error]', e);
        return {
            success: false,
            error: e.message || 'Failed to send message'
        };
    }
};

export const getSMSBalance = async (storeId?: string): Promise<number> => {
    if (!storeId) return 0;

    try {
        const response = await fetch(`/api/sms/balance?storeId=${storeId}`);
        const data = await response.json();
        return data.balance || 0;
    } catch (e) {
        console.error('Failed to fetch SMS balance', e);
        return 0;
    }
};
