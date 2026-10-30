"use client";
import { useState, useEffect } from "react";

export default function Page(){
  const [coords,setCoords]=useState<any>(null);
  const [loc,setLoc]=useState("Inatafuta GPS...");
  const [photo,setPhoto]=useState<string|null>(null);
  const [mama,setMama]=useState("");
  const [kuni,setKuni]=useState("10");
  const [points,setPoints]=useState(0);
  const [done,setDone]=useState(false);

  useEffect(()=>{
    navigator.geolocation.getCurrentPosition(async(pos)=>{
      const lat=pos.coords.latitude,lng=pos.coords.longitude;
      setCoords({lat,lng});
      try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const d=await r.json();
        setLoc(d.address?.village||d.address?.town||d.display_name||`${lat.toFixed(4)},${lng.toFixed(4)}`);
      }catch{setLoc(`${lat.toFixed(4)},${lng.toFixed(4)}`);}
    },()=>setLoc("Ruhusu GPS"),{enableHighAccuracy:true});
    setPoints(Number(localStorage.getItem("pijiko_points")||"0"));
  },[]);

  const kg=parseFloat(kuni)||0;
  const leo=kg*0.225;
  const co2=(kg*52*1.8)/1000;

  const tuma=()=>{
    if(!photo||!coords||kg<=0){alert("Jaza Jina, Kg, Picha na GPS");return;}
    const total=points+leo;
    localStorage.setItem("pijiko_points",String(total));
    setPoints(total);
    setDone(true);
    setTimeout(()=>setDone(false),4000);
  };

  return(
    <div style={{minHeight:'100vh',background:'#f5f5f5',padding:16,fontFamily:'sans-serif'}}>
      <div style={{maxWidth:380,margin:'0 auto',background:'white',borderRadius:16,padding:20}}>
        <h1 style={{textAlign:'center',fontWeight:'bold',color:'#7c3aed'}}>PIJIKOSAFI</h1>
        <p style={{textAlign:'center',fontSize:11}}>GPS Halisi + Points kwa Kg</p>
        <div style={{background:'#f3e8ff',padding:10,borderRadius:12,marginTop:12,fontSize:13}}>📍 {coords?`${coords.lat.toFixed(5)},${coords.lng.toFixed(5)} - ${loc}`:loc}</div>
        <input value={mama} onChange={e=>setMama(e.target.value)} placeholder="Jina la Mama" style={{width:'100%',border:'1px solid #ddd',borderRadius:12,padding:12,marginTop:12}}/>
        <div style={{marginTop:12}}>
          <label style={{fontSize:12,fontWeight:'bold'}}>Kuni wiki (kg)</label>
          <input value={kuni} onChange={e=>setKuni(e.target.value)} type="number" style={{width:'100%',border:'2px solid #fed7aa',borderRadius:12,padding:12,marginTop:4}}/>
          <div style={{background:'#fff7ed',padding:8,borderRadius:8,marginTop:6,fontSize:12}}>🔥 {kg}kg = <b>{leo.toFixed(2)} Points</b> = {co2.toFixed(3)} Tani CO2</div>
        </div>
        <input type="file" accept="image/*" capture="environment" onChange={e=>{const f=(e.target as any).files?.[0];if(f)setPhoto(URL.createObjectURL(f))}} id="cam" style={{display:'none'}}/>
        <label htmlFor="cam" style={{width:'100%',border:'2px dashed #c4b5fd',padding:14,borderRadius:12,textAlign:'center',display:'block',marginTop:12,background:'#faf5ff'}}>📸 {photo?"Picha Ipo ✅":"Piga Picha ya Jiko"}</label>
        {photo&&<img src={photo} style={{width:'100%',marginTop:8,borderRadius:12}}/>}
        <button onClick={tuma} style={{width:'100%',background:'#16a34a',color:'white',padding:14,borderRadius:12,marginTop:16,fontWeight:'bold',border:'none'}}>🎁 Tuma & Pokea {leo.toFixed(2)} Points</button>
        {done&&<div style={{background:'#dcfce7',border:'2px solid #16a34a',padding:12,borderRadius:12,marginTop:12,textAlign:'center'}}>🎉 Hongera {mama}!<br/><b>+{leo.toFixed(2)} Points</b><br/>Jumla: {points.toFixed(2)}</div>}
      </div>
    </div>
  )
    }
