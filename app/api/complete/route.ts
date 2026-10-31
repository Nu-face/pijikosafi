export async function POST(req: Request) {
  const { paymentId, id, txid } = await req.json();
  const finalId = paymentId || id;
  const PI_API_KEY = process.env.PI_API_KEY;
  await fetch(`https://api.minepi.com/v2/payments/${finalId}/complete`, {
    method: 'POST',
    headers: { 
      'Authorization': `Key ${PI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({txid})
  });
  return Response.json({ok:true});
}
