"use client";
import { useState, useEffect, useRef } from 'react';

export default function TakaApp() {
  const [user, setUser] = useState("Guest");
  const [kg, setKg] = useState(1250);
  const [kgInput, setKgInput] = useState("");
  const [recycler, setRecycler] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState("Karibu! Login na Pi");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://sdk.minepi.com/pi-sdk.js';
    s.onload = () => { // @ts-ignore
      window.Pi.init({ version: "2.0", sandbox: false }); };
    document.body.appendChild(s);
  }, []);

  const login = async () => {
    try { // @ts-ignore
      const res = await window.Pi.authenticate(['username','payments'], onIncompletePayment);
      setUser(res.user.username); setStatus("Karibu " + res.user.username + " ✅");
    } catch (e) { setStatus("Fungua ndani ya Pi Browser!"); }
  };

  function onIncompletePayment(payment:any){
    // @ts-ignore
    return window.Pi.createPayment(payment.identifier, {
      onReadyForServerApproval: (id:string) => fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId:id})}),
      onReadyForServerCompletion: (id:string, txid:string) => fetch('/api/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId:id,txid})}),
      onCancel: ()=>{}, onError: ()=>{}
    });
  }

  const openCamera = async () => {
    try {
      if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject = stream; videoRef.current.style.display='block'; }
      setStatus("Camera ON");
    } catch { fileRef.current?.click(); }
  };

  const capture = () => {
    if(!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v,0,0);
    setPhoto(c.toDataURL('image/jpeg',0.8));
    v.style.display='none';
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    setStatus("Picha OK ✅ Weka Kg");
  };

  const onFile = (e:any) => {
    const f = e.target.files[0]; if(!f) return;
    const r = new FileReader(); r.onload = (ev) => setPhoto(ev.target?.result as string); r.readAsDataURL(f);
  };

  const donate = async () => {
    const kgNum = parseFloat(kgInput);
    if(!photo){ alert("Piga picha ya mzani kwanza!"); return; }
    if(!kgNum){ alert("Andika kg! mfano 10"); return; }
    if(user==="Guest"){ alert("Login na Pi kwanza!"); return; }
    if(!recycler){ alert("Andika jina la recycler na Pi username yake! mfano: Malimbe - @malimbe_pi"); return; }
    const amount = Math.max(0.1, kgNum/10);
    setStatus("Preparing payment...");
    try {
      // @ts-ignore
      await window.Pi.createPayment({amount, memo:`TAKA: ${kgNum}kg kwa ${recycler}`, metadata:{kg:kgNum, recycler, hasPhoto:true}}, {
        onReadyForServerApproval: async (paymentId:string) => { setStatus("Inathibitisha..."); await fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId})}); },
        onReadyForServerCompletion: async (paymentId:string, txid:string) => { 
          setStatus("Inakamilisha..."); 
          const res = await fetch('/api/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId, txid, kg:kgNum, recycler})});
          const j = await res.json();
          setStatus(`✅ ${kgNum}kg! ${recycler} anadai ${j.payout?.owes?.toFixed(2)} Pi - TX: ${txid.slice(0,8)}`); 
          setKg(k=>k+kgNum); setPhoto(null); setKgInput(""); 
        },
        onCancel: ()=>setStatus("Imeghairiwa"), onError: (e:any)=>setStatus("Error: "+e.message)
      });
    } catch(e:any){ setStatus("Error: "+e.message); }
  };

  const kgNum = parseFloat(kgInput||'0');
  const piAmount = kgNum>0 ? Math.max(0.1, kgNum/10).toFixed(1) : '0';
  const owes = kgNum>0 ? (parseFloat(piAmount)*0.9).toFixed(2) : '0';

  return (
    <div style={{maxWidth:480, margin:'auto', padding:16, background:'#f0f8ff', minHeight:'100vh'}}>
      <div style={{background:'#0a7a5c', color:'white', padding:16, borderRadius:16, textAlign:'center'}}>
        <h1>🌊 $TAKA - 1250kg</h1><div>User: {user}</div>
        <button onClick={login} style={{marginTop:10, padding:12, width:'100%', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontWeight:700}}>Login na Pi</button>
        <div style={{marginTop:8, fontSize:13, background:'rgba(255,255,255,0.2)', padding:6, borderRadius:8}}>{status}</div>
      </div>
      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}><h2>♻️ {kg} kg Saved - Ziwa Victoria</h2><div style={{fontSize:12, color:'#666'}}>Recycler atapata 90% ya Pi</div></div>
      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}>
        <h2>📸 Thibitisha Mzani</h2>
        <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:12, background:'#000', display:'none'}} />
        <canvas ref={canvasRef} style={{display:'none'}} />
        {photo && <img src={photo} style={{width:'100%', borderRadius:12, marginTop:8}} />}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={onFile} />
        <button onClick={openCamera} style={{width:'100%', padding:12, marginTop:10, border:'2px solid #0a7a5c', background:'white', borderRadius:12}}>📷 Fungua Kamera</button>
        <button onClick={()=>fileRef.current?.click()} style={{width:'100%', padding:12, marginTop:8, border:'2px solid #0a7a5c', background:'white', borderRadius:12}}>🖼️ Chagua Gallery</button>
        <button onClick={capture} style={{width:'100%', padding:12, marginTop:10, background:'#0a7a5c', color:'white', border:'none', borderRadius:12}}>📸 Piga Picha ya Mzani</button>
        {photo && <button onClick={()=>setPhoto(null)} style={{width:'100%', padding:12, marginTop:8, background:'#eee', border:'none', borderRadius:12}}>Piga Tena</button>}
        <div style={{marginTop:12}}><label style={{fontWeight:700}}>Kg kwenye mzani:</label><input value={kgInput} onChange={e=>setKgInput(e.target.value)} type="number" inputMode="decimal" step="0.1" placeholder="mfano: 10" style={{width:'100%', padding:12, border:'2px solid #0a7a5c', borderRadius:10, marginTop:4}} /></div>
        <div style={{marginTop:10}}><label style={{fontWeight:700}}>Jina + Pi Username ya Recycler:</label><input value={recycler} onChange={e=>setRecycler(e.target.value)} placeholder="Malimbe - @malimbe_pi" style={{width:'100%', padding:12, border:'2px solid #0a7a5c', borderRadius:10, marginTop:4}} /><div style={{fontSize:11, color:'#0a7a5c', marginTop:4}}>Atapata {owes} Pi kati ya {piAmount} Pi (90%)</div></div>
      </div>
      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}>
        <h2>💸 Lipa na Pi</h2>
        <button onClick={donate} style={{width:'100%', padding:14, background: photo && kgInput && recycler ? '#0a7a5c' : '#9ca3af', color:'white', border:'none', borderRadius:12, fontWeight:700, fontSize:16}}>Lipa {piAmount} Pi kwa {kgInput||'0'}kg</button>
        <div style={{fontSize:12, color:'#666', marginTop:6, textAlign:'center'}}>{!photo ? '⚠️ Piga picha' : !kgInput ? '⚠️ Weka kg' : !recycler ? '⚠️ Weka jina la recycler + Pi username' : `✅ ${recycler} atapata ${owes} Pi`}</div>
      </div>
    </div>
  );
}
