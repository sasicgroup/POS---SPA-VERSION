import { supabase } from './supabase';

export interface PaystackConfig {
    enabled: boolean;
    public_key: string;
    secret_key: string;
}

export interface PaystackPaymentRequest {
    amount: number; // in GHS (will be converted to pesewas)
    email: string;
    reference: string;
    callback_url?: string;
    metadata?: any;
    channels?: string[]; // ['mobile_money', 'card'] etc.
}

export interface PaystackPaymentResponse {
    success: boolean;
    authorization_url?: string;
    access_code?: string;
    reference?: string;
    message?: string;
    error?: string;
}

/**
 * Initialize Paystack payment
 */
export async function initializePaystackPayment(
    config: PaystackConfig,
    paymentRequest: PaystackPaymentRequest
): Promise<PaystackPaymentResponse> {
    try {
        if (!config.enabled) {
            return {
                success: false,
                error: 'Paystack payment is not enabled.'
            };
        }

        if (!config.secret_key) {
            return {
                success: false,
                error: 'Paystack Secret Key is missing.'
            };
        }

        const apiUrl = 'https://api.paystack.co/transaction/initialize';

        // Amount must be in kobo/pesewas (multiply by 100)
        const amountInSubunits = Math.round(paymentRequest.amount * 100);

        const payload = {
            email: paymentRequest.email,
            amount: amountInSubunits,
            currency: 'GHS',
            reference: paymentRequest.reference,
            callback_url: paymentRequest.callback_url || `${window.location.origin}/dashboard/sales`,
            channels: paymentRequest.channels || ['mobile_money'], // Default to MoMo since that's the request
            metadata: paymentRequest.metadata
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.secret_key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return {
                success: false,
                error: data.message || 'Failed to initialize Paystack payment'
            };
        }

        return {
            success: true,
            authorization_url: data.data.authorization_url,
            access_code: data.data.access_code,
            reference: data.data.reference,
            message: 'Payment initialized successfully'
        };

    } catch (error: any) {
        console.error('[Paystack] Error:', error);
        return {
            success: false,
            error: error.message || 'An error occurred while initializing payment'
        };
    }
}

/**
 * Verify Paystack payment
 */
export async function verifyPaystackPayment(
    config: PaystackConfig,
    reference: string
): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
        const apiUrl = `https://api.paystack.co/transaction/verify/${reference}`;

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.secret_key}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            return {
                success: false,
                error: data.message || 'Failed to verify payment'
            };
        }

        return {
            success: true,
            status: data.data.status // 'success', 'abandoned', 'failed'
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Failed to verify payment'
        };
    }
}
