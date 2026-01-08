import { supabase } from './supabase';

export interface HubtelConfig {
    enabled: boolean;
    client_id: string;
    client_secret: string;
    merchant_account: string;
}

export interface HubtelPaymentRequest {
    amount: number;
    customerName: string;
    customerPhone: string;
    description: string;
    clientReference: string; // Your transaction ID
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
export async function initializeHubtelPayment(
    config: HubtelConfig,
    paymentRequest: HubtelPaymentRequest
): Promise<HubtelPaymentResponse> {
    try {
        if (!config.enabled) {
            return {
                success: false,
                error: 'Hubtel payment is not enabled. Please configure it in Settings > Payments.'
            };
        }

        if (!config.client_id || !config.client_secret) {
            return {
                success: false,
                error: 'Hubtel API credentials are missing. Please configure them in Settings > Payments.'
            };
        }

        // Hubtel API endpoint
        const apiUrl = 'https://payproxyapi.hubtel.com/items/initiate';

        // Create authorization header (Basic Auth with client_id:client_secret)
        const auth = btoa(`${config.client_id}:${config.client_secret}`);

        // Prepare request payload
        const payload = {
            totalAmount: paymentRequest.amount,
            description: paymentRequest.description,
            callbackUrl: `${window.location.origin}/api/payments/hubtel/callback`,
            returnUrl: `${window.location.origin}/dashboard/sales`,
            cancellationUrl: `${window.location.origin}/dashboard/sales`,
            merchantAccountNumber: config.merchant_account,
            clientReference: paymentRequest.clientReference,
            customerName: paymentRequest.customerName,
            customerMsisdn: paymentRequest.customerPhone,
            customerEmail: '',
        };

        console.log('[Hubtel] Initiating payment:', payload);

        // Make API request
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Hubtel] Payment initialization failed:', data);
            return {
                success: false,
                error: data.message || 'Failed to initialize payment'
            };
        }

        console.log('[Hubtel] Payment initialized:', data);

        return {
            success: true,
            transactionId: data.transactionId,
            checkoutUrl: data.checkoutUrl,
            message: 'Payment initialized successfully'
        };

    } catch (error: any) {
        console.error('[Hubtel] Error:', error);
        return {
            success: false,
            error: error.message || 'An error occurred while processing payment'
        };
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
        const auth = btoa(`${config.client_id}:${config.client_secret}`);
        const apiUrl = `https://payproxyapi.hubtel.com/items/status/${transactionId}`;

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
            status: data.status // 'Success', 'Pending', 'Failed', etc.
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

        return data.payment_settings?.hubtel || {
            enabled: false,
            client_id: '',
            client_secret: '',
            merchant_account: ''
        };
    } catch (error) {
        console.error('[Hubtel] Error fetching config:', error);
        return null;
    }
}

/**
 * Save Hubtel configuration
 */
export async function saveHubtelConfig(storeId: string, config: HubtelConfig): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('stores')
            .update({
                payment_settings: {
                    hubtel: config
                }
            })
            .eq('id', storeId);

        if (error) {
            console.error('[Hubtel] Failed to save config:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('[Hubtel] Error saving config:', error);
        return false;
    }
}
