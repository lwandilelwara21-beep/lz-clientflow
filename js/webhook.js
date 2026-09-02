/**
 * Webhook integration for lead/client automation.
 */

export const N8N_WEBHOOK_URL = 'YOUR_N8N_WEBHOOK_URL';

/**
 * Send a JSON payload to n8n.
 * @param {Object} payload - Lead/client payload
 * @returns {Promise<Response>}
 */
export async function dispatchClientWebhook(payload) {
  if (!N8N_WEBHOOK_URL || N8N_WEBHOOK_URL === 'YOUR_N8N_WEBHOOK_URL') {
    throw new Error('n8n webhook URL is not configured');
  }

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.status !== 200) {
    throw new Error(`Webhook request failed with HTTP ${response.status}`);
  }

  return response;
}