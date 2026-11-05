// SMS sender. 'console' logs (development/tests); 'twilio' posts to the Twilio Messages API.
// NOTE: commercial SMS in India requires DLT registration of sender ID and templates with your operator/provider.
export function createSms(config, { fetchImpl = fetch, log = console } = {}) {
  if (config.SMS_PROVIDER === 'twilio') {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${config.TWILIO_ACCOUNT_SID}:${config.TWILIO_AUTH_TOKEN}`).toString('base64');
    return {
      name: 'twilio',
      async send(phone, body) {
        const res = await fetchImpl(url, {
          method: 'POST',
          headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ To: `+91${phone}`, From: config.TWILIO_FROM, Body: body })
        });
        if (!res.ok) throw new Error(`twilio ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
    };
  }
  const sent = [];
  return {
    name: 'console',
    sent,
    async send(phone, body) {
      sent.push({ phone, body });
      if (config.NODE_ENV !== 'test') log.info?.({ phone, body }, 'SMS (console provider)');
    }
  };
}
