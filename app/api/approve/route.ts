export async function POST(req: Request) {
  const { paymentId, id } = await req.json();
  const finalId = paymentId || id;
  const PI_API_KEY = process.env.PI_API_KEY;
  await fetch(`https://api.minepi.com/v2/payments/${finalId}/approve`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${PI_API_KEY}` }
  });
  return Response.json({ok:true});
}
