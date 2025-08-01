// bspay-token.js
const fetch = require('node-fetch');

exports.handler = async () => {
  const clientId     = process.env.BSPAY_CLIENT_ID;
  const clientSecret = process.env.BSPAY_CLIENT_SECRET;
  const creds        = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://api.bspay.co/v2/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type':  'application/json'
    },
    body: JSON.stringify({ grant_type: 'client_credentials' })
  });

  if (!res.ok) {
    const err = await res.text();
    return { statusCode: res.status, body: err };
  }

  const json = await res.json();
  return {
    statusCode: 200,
    body:       JSON.stringify({ access_token: json.access_token })
  };
};
