import { supabase } from './supabase';
import { HubtelConfig } from './hubtel';
import { PaystackConfig } from './paystack';

export interface PaymentSettings {
    default_provider: 'hubtel' | 'paystack';
    hubtel: HubtelConfig;
    paystack: PaystackConfig;
}

const DEFAULT_SETTINGS: PaymentSettings = {
    default_provider: 'hubtel',
    hubtel: {
        enabled: false,
        api_id: '',
        api_key: ''
    },
    paystack: {
        enabled: false,
        public_key: '',
        secret_key: ''
    }
};

export async function getPaymentSettings(storeId: string): Promise<PaymentSettings> {
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('payment_settings')
            .eq('id', storeId)
            .single();

        if (error || !data) {
            return DEFAULT_SETTINGS;
        }

        // Merge saved settings with defaults to ensure all keys exist
        return {
            ...DEFAULT_SETTINGS,
            ...data.payment_settings,
            hubtel: { ...DEFAULT_SETTINGS.hubtel, ...(data.payment_settings?.hubtel || {}) },
            paystack: { ...DEFAULT_SETTINGS.paystack, ...(data.payment_settings?.paystack || {}) }
        };
    } catch (error) {
        console.error('Error fetching payment settings:', error);
        return DEFAULT_SETTINGS;
    }
}

export async function savePaymentSettings(storeId: string, settings: PaymentSettings): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('stores')
            .update({
                payment_settings: settings
            })
            .eq('id', storeId);

        if (error) {
            console.error('Failed to save payment settings:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error saving payment settings:', error);
        return false;
    }
}
