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

    // --- HAPA NDIPO TUNAMLIPA MALIMBE AUTOMATIC ---
    // 90% kwa recycler, 10% fee ya app
    const totalPi = Math.max(0.1, (kg || 10) / 10);
    const recyclerPi = totalPi * 0.9;
    
    // Tunahifadhi deni - Malimbe atalipwa next time akilogin
    // Kwa sasa tuna-log tu, baadaye tuta-connect na Pi username yake
    console.log(`✅ PAYMENT COMPLETE: ${kg}kg by ${recycler} - Total ${totalPi} Pi - Recycler anadai ${recyclerPi} Pi - TX: ${txid}`);

    // TODO: A2U payout - itahitaji recycler Pi UID
    // Tutai-add baada ya Malimbe akilogin mara moja kwenye app yako
    
    return NextResponse.json({ 
      success: true, 
      pi: data,
      payout: {
        recycler: recycler,
        kg: kg,
        owes: recyclerPi,
        message: `${recycler} anadai ${recyclerPi} Pi kwa ${kg}kg`
      }
    });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
