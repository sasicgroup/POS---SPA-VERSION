import { supabase } from './supabase';

export interface HubtelConfig {
    enabled: boolean;
    api_id: string; // Hubtel API ID (Username)
    api_key: string; // Hubtel API Key (Password)
}

export interface HubtelPaymentRequest {
    amount: number;
    customerName: string;
    customerPhone: string;
    description: string;
    clientReference: string; // Your transaction ID
    callbackUrl?: string;
}

export interface HubtelPaymentResponse {
    success: boolean;
    transactionId?: string;
    checkoutUrl?: string;
    message?: string;
    error?: string;
}

/**
 * Initialize Hubtel payment
 * This creates a payment request and returns a checkout URL or USSD code
 */
/**
 * Initialize Hubtel payment
 * This creates a payment request and returns a checkout URL or USSD code
 */
// import { initiateHubtelPaymentAction } from '@/app/actions/payment-actions'; // Removed for SPA

/**
 * Initialize Hubtel payment
 * client-side fetching for SPA
 */
export async function initializeHubtelPayment(
    config: HubtelConfig,
    paymentRequest: HubtelPaymentRequest
): Promise<HubtelPaymentResponse> {
    try {
        if (!config.enabled) {
            return { success: false, error: 'Hubtel payment is not enabled.' };
        }
        if (!config.api_id || !config.api_key) {
            return { success: false, error: 'Hubtel API credentials are missing.' };
        }

        const authHeader = 'Basic ' + btoa(`${config.api_id}:${config.api_key}`);
        const apiUrl = 'https://api-v2.hubtel.com/merchantaccount/onlinecheckout/items/initiate';

        const payload = {
            totalAmount: paymentRequest.amount,
            description: paymentRequest.description,
            callbackUrl: paymentRequest.callbackUrl,
            returnUrl: paymentRequest.callbackUrl, // Or a dedicated return page
            cancellationUrl: paymentRequest.callbackUrl,
            clientReference: paymentRequest.clientReference,
            customerName: paymentRequest.customerName,
            customerMsisdn: paymentRequest.customerPhone,
            customerEmail: '',
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Hubtel Client] Payment initialization failed:', data);
            return { success: false, error: data.message || 'Failed to initialize payment' };
        }

        return {
            success: true,
            transactionId: data.transactionId,
            checkoutUrl: data.checkoutUrl,
            message: 'Payment initialized successfully'
        };
    } catch (error: any) {
        console.error('[Hubtel Client] Error:', error);
        return { success: false, error: error.message || 'Client error initializing payment' };
    }
}

/**
 * Verify Hubtel payment status
 */
export async function verifyHubtelPayment(
    config: HubtelConfig,
    transactionId: string
): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
        const auth = btoa(`${config.api_id}:${config.api_key}`);
        const apiUrl = `https://api-v2.hubtel.com/merchantaccount/onlinecheckout/items/status/${transactionId}`; // Verify endpoint for v2

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            }
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                success: false,
                error: data.message || 'Failed to verify payment'
            };
        }

        return {
            success: true,
            status: data.data?.status || data.status // Adjust based on actual v2 response structure
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to verify payment'
        };
    }
}

/**
 * Get Hubtel configuration from store settings
 * @deprecated Use getPaymentSettings from payment-settings.ts instead
 */
export async function getHubtelConfig(storeId: string): Promise<HubtelConfig | null> {
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('payment_settings')
            .eq('id', storeId)
            .single();

        if (error || !data) {
            console.error('[Hubtel] Failed to fetch config:', error);
            return null;
        }

        // Return modern config structure
        const settings = data.payment_settings?.hubtel;
        if (settings && (settings.api_id || settings.api_key)) {
            return settings;
        }

        // Migration fallback if old keys exist but new ones don't
        if (settings && settings.client_id) {
            return {
                enabled: settings.enabled,
                api_id: settings.client_id,
                api_key: settings.client_secret
            };
        }

        return {
            enabled: false,
            api_id: '',
            api_key: ''
        };
    } catch (error) {
        console.error('[Hubtel] Error fetching config:', error);
        return null;
    }
}

/**
 * Save Hubtel configuration
 * @deprecated Use savePaymentSettings from payment-settings.ts instead
 */
export async function saveHubtelConfig(storeId: string, config: HubtelConfig): Promise<boolean> {
    // This function is likely unused now but kept for compatibility
    return false;
}
