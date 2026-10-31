import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { paymentId, txid, kg, recycler } = await req.json();
    
    const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.PI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ txid })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      return NextResponse.json({ error: data }, { status: 400 });
    }

    const totalPi = Math.max(0.1, (kg || 10) / 10);
    const recyclerPi = totalPi * 0.9;
    
    console.log(`✅ PAYMENT: ${kg}kg kwa ${recycler} - ${recycler} anadai ${recyclerPi} Pi - TX: ${txid}`);

    return NextResponse.json({ 
      success: true, 
      pi: data,
      payout: {
        recycler: recycler,
        kg: kg,
        owes: recyclerPi,
        message: `${recycler} anadai ${recyclerPi} Pi`
      }
    });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
