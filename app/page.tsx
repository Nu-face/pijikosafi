"use client";
import { useState, useEffect } from 'react';

export default function TakaApp() {
  const [user, setUser] = useState("Guest");
  const [kg, setKg] = useState(1240);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://sdk.minepi.com/pi-sdk.js';
    s.onload = () => {
      // @ts-ignore
      window.Pi.init({ version: "2.0", sandbox: true });
    };
    document.body.appendChild(s);
  }, []);

  const login = async () => {
    try {
      // @ts-ignore
      const res = await window.Pi.authenticate(['username', 'payments'], () => {});
      setUser(res.user.username);
    } catch (e) { 
      alert("Fungua link hii ndani ya Pi Browser");
    }
  };

  const donate = async () => {
    try {
      // @ts-ignore
      await window.Pi.createPayment({
        amount: 1,
        memo: "Save Lake Victoria",
        metadata: { kg: 100 }
      }, {
        onReadyForServerApproval: (id: string) => {
          fetch('/api/approve', { method: 'POST', body: JSON.stringify({id}) });
        },
        onReadyForServerCompletion: (id: string, txid: string) => {
          fetch('/api/complete', { method: 'POST', body: JSON.stringify({id, txid}) });
          setKg(k => k + 100);
          alert("Asante! 100kg saved!");
        },
        onCancel: () => {},
        onError: (e: any) => alert(e.message)
      });
    } catch (e) { alert("Fungua kwenye Pi Browser"); }
  };

  return (
    <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif', background: '#f0f9ff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 40 }}>🌊 $TAKA</h1>
      <p>Okoa Ziwa Victoria, Pata Pi</p>
      <p><b>User:</b> {user} <button onClick={login} style={{ marginLeft: 10, padding: '5px 15px' }}>Login Pi</button></p>
      <h2 style={{ fontSize: 32, color: '#0891b2' }}>{kg} kg Saved</h2>
      
      <button onClick={donate} style={{ background: '#0284c7', color: 'white', padding: '20px 40px', fontSize: 18, border: 'none', borderRadius: 12, margin: 10, width: '90%', maxWidth: 350 }}>
        DONATE 1 Pi = 100kg
      </button>
      
      <button onClick={() => alert("Feature ya Mama inakuja!")} style={{ background: '#16a34a', color: 'white', padding: '20px 40px', fontSize: 18, border: 'none', borderRadius: 12, margin: 10, width: '90%', maxWidth: 350 }}>
        MAMA: PIGA PICHA 📸
      </button>

      <p style={{ marginTop: 30, fontSize: 12, color: 'gray' }}>Live: pijikosafi-s22n.vercel.app</p>
    </div>
  );
}
