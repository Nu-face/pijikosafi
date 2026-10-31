export async function POST(req: Request) {
  const { id } = await req.json();
  await fetch(`https://api.minepi.com/v2/payments/${id}/approve`, {
    method: 'POST',
    headers: { Authorization: `Key ${process.env.PI_API_KEY}` }
  });
  return Response.json({ok:true});
}
