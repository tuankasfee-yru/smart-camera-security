"use client";

import { useState, useEffect } from "react";

interface GalleryItem {
  id: string; device_id: string; detected_at: string;
  distance_cm: number | null; filename: string; size: number; url: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");

  const fetch = () => { setLoading(true); fetch("/api/captures").then(r=>r.json()).then(d=>{if(d.ok)setItems(d.images)}).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(()=>{fetch()},[]);

  const del = async (id:string)=>{await fetch(`/api/captures?id=${id}`,{method:"DELETE"});fetch()};
  const delSelected = async ()=>{await fetch("/api/captures",{method:"DELETE",body:JSON.stringify({ids:[...selected]}),headers:{"Content-Type":"application/json"}});setSelected(new Set());fetch();setMsg("ลบแล้ว")};
  const share = (url:string)=>{navigator.clipboard.writeText(window.location.origin+url).then(()=>setMsg("คัดลอกลิงก์!"))};
  const toggle = (id:string)=>{const s=new Set(selected);s.has(id)?s.delete(id):s.add(id);setSelected(s)};
  const selectAll = ()=>{selected.size===items.length?setSelected(new Set()):setSelected(new Set(items.map(i=>i.id)))};

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🖼️ คลังภาพ</h1><p className="text-sm text-zinc-500">{items.length} รูป</p></div>
        <div className="flex gap-2">{items.length>0&&<><button onClick={selectAll} className="rounded-xl border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:text-zinc-300">{selected.size===items.length?"ยกเลิก":"เลือกทั้งหมด"}</button>{selected.size>0&&<button onClick={delSelected} className="rounded-xl bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">ลบ ({selected.size})</button>}</>}<button onClick={fetch} className="rounded-xl border px-3 py-2 text-sm dark:border-zinc-600 dark:text-zinc-300">รีเฟรช</button><a href="/" className="text-sm text-blue-600 hover:underline self-center ml-2">← กลับ</a></div>
      </div>
      {msg&&<p className="mb-4 text-sm text-zinc-500">{msg}</p>}
      {loading?<p className="text-center py-12 text-zinc-400">กำลังโหลด...</p>:items.length===0?<div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900"><p className="text-4xl mb-4">📸</p><p className="text-zinc-500">ยังไม่มีภาพ</p></div>:<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{items.map(i=><div key={i.id} className={`rounded-2xl border bg-white shadow-sm dark:bg-zinc-900 ${selected.has(i.id)?"ring-2 ring-blue-500":"border-zinc-200 dark:border-zinc-700"}`}>
        <img src={i.url} alt={i.filename} className="w-full h-40 object-cover rounded-t-2xl bg-zinc-100 dark:bg-zinc-800" loading="lazy" />
        <div className="p-3"><p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 truncate">{i.filename}</p><p className="text-xs text-zinc-400">{new Date(i.detected_at).toLocaleString("th-TH")}{i.distance_cm!=null?` · ${i.distance_cm} ซม.`:""}</p><div className="mt-2 flex gap-2"><button onClick={()=>share(i.url)} className="text-xs text-blue-600 hover:underline">แชร์</button><button onClick={()=>del(i.id)} className="text-xs text-red-500 hover:underline">ลบ</button></div></div>
      </div>)}</div>}
    </div>
  );
}
