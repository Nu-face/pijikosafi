export async function POST(req: Request) {
  const { id, txid } = await req.json();
  await fetch(`https://api.minepi.com/v2/payments/${id}/complete`, {
    method: 'POST',
    headers: { Authorization: `Key ${process.env.PI_API_KEY}`, 'Content-Type':'application/json' },
    body: JSON.stringify({txid})
  });
  return Response.json({ok:true});
}
