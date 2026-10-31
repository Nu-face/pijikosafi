"use client";
import { useState, useEffect, useRef } from 'react';

export default function TakaApp() {
  const [user, setUser] = useState("Guest");
  const [kg, setKg] = useState(1240);
  const [kgInput, setKgInput] = useState("");
  const [recycler, setRecycler] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const s = document.createElement('script');
    s.src = 'https://sdk.minepi.com/pi-sdk.js';
    s.onload = () => {
      // @ts-ignore
      window.Pi.init({ version: "2.0", sandbox: false });
    };
    document.body.appendChild(s);
  }, []);

  const login = async () => {
    try {
      // @ts-ignore
      const res = await window.Pi.authenticate(['username','payments'], onIncompletePayment);
      setUser(res.user.username);
      setStatus("Karibu " + res.user.username + " ✅");
    } catch (e) {
      alert("Fungua link hii ndani ya Pi Browser!");
    }
  };

  function onIncompletePayment(payment:any){
    // @ts-ignore
    return window.Pi.createPayment(payment.identifier, {
      onReadyForServerApproval: (id:string) => fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId:id})}),
      onReadyForServerCompletion: (id:string, txid:string) => fetch('/api/pi/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId:id,txid})}),
      onCancel: ()=>{},
      onError: ()=>{}
    });
  }

  // CAMERA FIXED
  const openCamera = async () => {
    try {
      if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}, audio:false});
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject = stream; videoRef.current.style.display='block'; }
      setStatus("Camera imefunguka - bofya Piga Picha");
    } catch(err:any) {
      setStatus("Camera haikuruhusiwa, tumia Gallery");
      fileRef.current?.click();
    }
  };

  const capture = () => {
    if(!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v,0,0);
    const dataUrl = c.toDataURL('image/jpeg',0.8);
    setPhoto(dataUrl);
    v.style.display='none';
    if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
    setStatus("Picha ya mzani imechukuliwa ✅");
  };

  const onFile = (e:any) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // PAYMENT FIXED - haizunguki tena
  const donate = async () => {
    const kgNum = parseFloat(kgInput);
    if(!photo){ alert("Piga picha ya plastiki kwenye mzani kwanza!"); return; }
    if(!kgNum || kgNum<=0){ alert("Weka kg sahihi!"); return; }
    if(user==="Guest"){ alert("Login na Pi kwanza!"); return; }

    const amount = Math.max(0.1, kgNum/10);
    setStatus("Preparing for a payment...");

    try {
      // @ts-ignore
      await window.Pi.createPayment({
        amount,
        memo: `TAKA: ${kgNum}kg kwa ${recycler || 'recycler'} - na picha ya mzani`,
        metadata: {kg:kgNum, recycler, hasPhoto:true}
      }, {
        onReadyForServerApproval: async (paymentId:string) => {
          setStatus("Inathibitisha...");
          await fetch('/api/approve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId})});
        },
        onReadyForServerCompletion: async (paymentId:string, txid:string) => {
          setStatus("Inakamilisha... " + txid.slice(0,8));
          await fetch('/api/complete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({paymentId, txid, kg:kgNum})});
          setStatus(`✅ ${kgNum}kg imesajiliwa! Asante ${user}`);
          setKg(k => k + kgNum);
          setPhoto(null); setKgInput("");
        },
        onCancel: (paymentId:string) => setStatus("Malipo yameghairiwa"),
        onError: (error:any) => setStatus("Hitilafu: " + error.message)
      });
    } catch(e:any) { setStatus("Error: " + e.message); }
  };

  return (
    <div style={{maxWidth:480, margin:'auto', padding:16, background:'#f0f8ff', minHeight:'100vh'}}>
      <div style={{background:'#0a7a5c', color:'white', padding:16, borderRadius:16, textAlign:'center'}}>
        <h1>🌊 $TAKA</h1>
        <div>User: {user}</div>
        <button onClick={login} style={{marginTop:10, padding:12, width:'100%', background:'#7c3aed', color:'white', border:'none', borderRadius:12, fontWeight:700}}>Login na Pi</button>
        <div style={{marginTop:8, fontSize:13}}>{status}</div>
      </div>

      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}>
        <h2>{kg} kg Saved</h2>
        <p style={{color:'#666', fontSize:14}}>Jumla ya plastiki iliyookolewa</p>
      </div>

      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}>
        <h2>📸 Thibitisha Plastiki Mzani</h2>
        <p style={{fontSize:13, color:'#555'}}>Piga picha ya plastiki ikiwa kwenye mzani - kwa ajili ya recycler</p>
        
        <video ref={videoRef} autoPlay playsInline style={{width:'100%', borderRadius:12, background:'#000', display:'none'}} />
        <canvas ref={canvasRef} style={{display:'none'}} />
        {photo && <img src={photo} style={{width:'100%', borderRadius:12, marginTop:8}} />}
        
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={onFile} />
        
        <button onClick={openCamera} style={{width:'100%', padding:12, marginTop:10, border:'2px solid #0a7a5c', background:'white', borderRadius:12}}>📷 Fungua Kamera</button>
        <button onClick={()=>fileRef.current?.click()} style={{width:'100%', padding:12, marginTop:8, border:'2px solid #0a7a5c', background:'white', borderRadius:12}}>🖼️ Chagua Gallery</button>
        <button onClick={capture} style={{width:'100%', padding:12, marginTop:10, background:'#0a7a5c', color:'white', border:'none', borderRadius:12}}>📸 Piga Picha ya Mzani</button>
        {photo && <button onClick={()=>setPhoto(null)} style={{width:'100%', padding:12, marginTop:8, background:'#eee', border:'none', borderRadius:12}}>Piga Tena</button>}

        <div style={{marginTop:12}}>
          <label>Kg kwenye mzani:</label>
          <input value={kgInput} onChange={e=>setKgInput(e.target.value)} type="number" step="0.1" placeholder="mfano: 12.5" style={{width:'100%', padding:12, border:'1px solid #ccc', borderRadius:10}} />
        </div>
        <div style={{marginTop:8}}>
          <label>Jina la Recycler / Kituo:</label>
          <input value={recycler} onChange={e=>setRecycler(e.target.value)} placeholder="Kivukoni Recyclers" style={{width:'100%', padding:12, border:'1px solid #ccc', borderRadius:10}} />
        </div>
      </div>

      <div style={{background:'white', padding:16, borderRadius:16, marginTop:12}}>
        <h2>💸 Lipa na Pi</h2>
        <button onClick={donate} style={{width:'100%', padding:14, background:'#0a7a5c', color:'white', border:'none', borderRadius:12, fontWeight:700}}>Lipa {kgInput ? (Math.max(0.1, parseFloat(kgInput||'0')/10)).toFixed(1) : '0'} Pi kwa {kgInput||0}kg</button>
      </div>
    </div>
  );
}
