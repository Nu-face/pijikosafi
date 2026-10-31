"use client";
import { useState, useRef } from "react";
declare const Pi: any;

const LAKE_ZONE = {
  // Box ya kanda yote ya Ziwa Tanzania
  minLat: -3.8, maxLat: -0.7,
  minLng: 30.8, maxLng: 34.8,
  mikoa: ["Mwanza","Mara","Geita","Kagera","Simiyu","Shinyanga"]
};

function isInLakeZone(lat:number, lng:number){
  return lat >= LAKE_ZONE.minLat && lat <= LAKE_ZONE.maxLat && lng >= LAKE_ZONE.minLng && lng <= LAKE_ZONE.maxLng;
}
function getMkoa(lat:number, lng:number){
  if(lat > -1.5) return "Mara/Kagera";
  if(lng < 32.2) return "Geita/Kagera";
  if(lat < -2.8) return "Simiyu/Shinyanga";
  return "Mwanza";
}

export default function Home() {
  const [piUser, setPiUser] = useState<any>(null);
  const [kg, setKg] = useState("");
  const [recycler, setRecycler] = useState("Malimbe - @malimbe_pi");
  const [photo, setPhoto] = useState<string | null>(null);
  const [gps, setGps] = useState<{lat:number,lng:number,mkoa:string,inZone:boolean}|null>(null);
  const [status, setStatus] = useState("");
  const [totalKg, setTotalKg] = useState(1210);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const login = async () => {
    try{
      const scopes = ['username','payments'];
      const auth = await Pi.authenticate(scopes, (p:any)=>{});
      setPiUser(auth.user);
    }catch(e){ setStatus("Login failed"); }
  };

  const openCamera = async () => {
    try {
      // 1. PATA GPS YA KANDA YA ZIWA
      navigator.geolocation.getCurrentPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const inZone = isInLakeZone(lat,lng);
          setGps({lat, lng, mkoa: getMkoa(lat,lng), inZone});
          setStatus(inZone ? `📍 GPS Sawa - ${getMkoa(lat,lng)}` : `📍 GPS nje ya Kanda - ${lat.toFixed(3)}`);
        },
        err => setStatus("GPS: Ruhusu Location kwenye browser"),
        {enableHighAccuracy:true, timeout:10000}
      );
      if(streamRef.current) streamRef.current.getTracks().forEach(t=>t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      streamRef.current = stream;
      if(videoRef.current){ videoRef.current.srcObject = stream; videoRef.current.style.display='block'; }
      setStatus("Camera ON + GPS inatafutwa...");
    } catch { fileRef.current?.click(); }
  };

  const capture = () => {
    if(!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current; const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v,0,0);
    setPhoto(c.toDataURL('image/jpeg',0.7));
    v.style.display='none'; streamRef.current?.getTracks().forEach(t=>t.stop());
    setStatus(gps?.inZone ? `✅ Picha + GPS ${gps.mkoa} - Tayari` : "✅ Picha Tayari");
  };

  const donate = async () => {
    const kgNum = parseFloat(kg); if(!kgNum || kgNum<=0) return setStatus("Weka kg");
    if(!gps) return setStatus("Subiri GPS kwanza...");
    if(!gps.inZone) return setStatus(`❌ GPS nje ya Kanda ya Ziwa! Upo ${gps.mkoa}. Nenda Mwanza/Mara/Geita/Kagera/Simiyu`);
    try{
      setStatus("Inalipa...");
      await Pi.createPayment({
        amount: Math.max(0.1, kgNum/10),
        memo: `${kgNum}kg ${recycler} - ${gps.mkoa} - PiJikoSafi`,
        metadata:{kg:kgNum, recycler, hasPhoto:!!photo, gps, mkoa:gps.mkoa, kanda:"Ziwa Victoria Tanzania"},
      },{
        onReadyForServerApproval:(id:string)=>fetch('/api/approve',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({paymentId:id})}),
        onReadyForServerCompletion:(id:string,txid:string)=>fetch('/api/complete',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({paymentId:id, txid, kg:kgNum, recycler, gps})}).then(r=>r.json()).then(d=>{setStatus(`✅ ${kgNum}kg ${gps.mkoa} - ${recycler} anadai ${d.payout?.owes || kgNum*0.9} Pi`); setTotalKg(t=>t+kgNum);}),
        onCancel:()=>setStatus("Imeghairiwa"),
        onError:(e:any)=>setStatus("Error "+e.message)
      });
    }catch(e:any){ setStatus("Error "+e.message); }
  };

  return (
    <div style={{maxWidth:420, margin:'0 auto', padding:16, fontFamily:'sans-serif'}}>
      <h1>🌊 PiJikoSafi - Kanda ya Ziwa Victoria</h1>
      <div style={{background:'#e0f7fa', padding:8, borderRadius:8, fontSize:12}}>Mikoa: Mwanza, Mara, Geita, Kagera, Simiyu, Shinyanga | Jumla: {totalKg}kg</div>
      
      {!piUser ? <button onClick={login} style={{width:'100%', padding:12, marginTop:12, background:'#7c3aed', color:'#fff', borderRadius:8}}>Login na Pi</button> : <div>👋 {piUser.username}</div>}

      <input value={kg} onChange={e=>setKg(e.target.value)} placeholder="Kg mf: 10" type="number" style={{width:'100%', padding:10, marginTop:12, border:'1px solid #ccc', borderRadius:8}}/>
      <input value={recycler} onChange={e=>setRecycler(e.target.value)} placeholder="Recycler @username" style={{width:'100%', padding:10, marginTop:8, border:'1px solid #ccc', borderRadius:8}}/>
      
      {gps ? (
        <div style={{marginTop:8, padding:8, borderRadius:8, fontSize:12, background: gps.inZone ? '#dcfce7' : '#fee2e2', color: gps.inZone ? '#166534' : '#991b1b'}}>
          {gps.inZone ? '✅' : '❌'} 📍 {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} <br/> Mkoa: {gps.mkoa} {gps.inZone ? '- KANDA YA ZIWA SAWA' : '- NJE YA KANDA!'}
        </div>
      ) : <div style={{fontSize:11, color:'orange', marginTop:8}}>📍 GPS inatafutwa... Ruhusu Location</div>}

      <div style={{marginTop:12}}>
        <video ref={videoRef} autoPlay playsInline style={{width:'100%', display:'none', borderRadius:8}}/>
        <canvas ref={canvasRef} style={{display:'none'}}/>
        {photo && <img src={photo} style={{width:'100%', borderRadius:8}}/>}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setPhoto(r.result as string); r.readAsDataURL(f);}}/>
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button onClick={openCamera} style={{flex:1, padding:10, background:'#0ea5e9', color:'#fff', borderRadius:8}}>📸 Fungua Camera + GPS</button>
          <button onClick={capture} style={{flex:1, padding:10, background:'#10b981', color:'#fff', borderRadius:8}}>📷 Piga Picha</button>
        </div>
      </div>

      <button onClick={donate} style={{width:'100%', padding:12, marginTop:12, background:'#f59e0b', color:'#000', borderRadius:8, fontWeight:'bold'}}>Lipa na Pi - Kanda ya Ziwa</button>
      <div style={{marginTop:8, fontSize:13, color:'#333'}}>{status}</div>
    </div>
  );
}
