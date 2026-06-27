import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const COLORS = {
  budget: '#10b981',   
  profit: '#3b82f6',   
  expenses: '#f43f5e', 
  status: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'] 
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/90 border border-slate-700/50 backdrop-blur-md p-4 rounded-xl shadow-xl">
        <p className="text-slate-200 font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></span>
            {entry.name}: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface AnalyticsDashboardProps {
    projects: any[];
    isPro: boolean; // <-- BU SATIRI EKLEDİK
  }

export default function AnalyticsDashboard({ projects = [] }: AnalyticsDashboardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-24 flex items-center justify-center text-slate-400 animate-pulse">Analitik yükleniyor...</div>;

  // Tüm kullanıcılar için veri hesaplamaları
  const clientDataMap: any = {};
  projects.forEach((proj) => {
    const client = proj.client || 'Bilinmeyen Müşteri';
    const budget = Number(proj.budget) || 0;
    const expenses = Number(proj.expenses) || 0;
    const profit = budget - expenses;

    if (!clientDataMap[client]) {
      clientDataMap[client] = { name: client, Bütçe: 0, Kâr: 0 };
    }
    clientDataMap[client].Bütçe += budget;
    clientDataMap[client].Kâr += profit;
  });
  const clientChartData = Object.values(clientDataMap).slice(0, 5);

  const statusDataMap: any = { 'Aktif': 0, 'Tamamlandı': 0, 'Gecikti': 0 };
  projects.forEach((proj) => {
    const status = proj.status || 'Aktif';
    const budget = Number(proj.budget) || 0;
    if (statusDataMap[status] !== undefined) {
      statusDataMap[status] += budget;
    } else {
      statusDataMap[status] = budget;
    }
  });
  
  const statusChartData = Object.keys(statusDataMap).map((key) => ({
    name: key,
    value: statusDataMap[key]
  })).filter(item => item.value > 0);

  return (
    <div className="flex flex-col gap-6 my-8">
      
      {/* AÇIK BETA & GERİ BİLDİRİM ŞERİDİ */}
      <div className="bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm shadow-lg shadow-blue-900/10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-100">Erken Erişimdesiniz (Açık Beta) 🚀</h3>
            <p className="text-xs text-blue-300/80 mt-0.5">Tüm gelişmiş analitik araçları şu an %100 ücretsiz. Büyümemize yardımcı olun!</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.href = "mailto:mkaan.workspace@gmail.com?subject=SwiftTrack%20Açık%20Beta%20Geri%20Bildirim&body=Merhaba,%20uygulama%20hakkında%20şu%20fikri/hatayı%20paylaşmak%20istiyorum:%0A%0A"}
          className="whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
          </svg>
          Fikir Ver / Hata Bildir
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. GRAFİK (BAR CHART) */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-100">En Değerli Müşteriler & Kârlılık</h3>
            <p className="text-xs text-slate-400">Müşteri başına düşen toplam bütçe ve net kâr oranı</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientChartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Bütçe" fill={COLORS.budget} radius={[4, 4, 0, 0]} name="Toplam Bütçe" />
                <Bar dataKey="Kâr" fill={COLORS.profit} radius={[4, 4, 0, 0]} name="Net Kâr" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. GRAFİK (PIE CHART) */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-100">Bütçe Dağılımı</h3>
            <p className="text-xs text-slate-400">Proje durumlarına göre finansal hacim</p>
          </div>
          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.status[index % COLORS.status.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <span className="text-xs text-slate-400 block uppercase tracking-wider">Toplam</span>
              <span className="text-lg font-extrabold text-slate-100">{projects.length} Proje</span>
            </div>
          </div>
          
          {/* ALT BİLGİLER */}
          <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-800/60">
            {statusChartData.map((item: any, index: number) => (
              <div key={item.name} className="flex flex-col items-center">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: COLORS.status[index % COLORS.status.length] }}></span>
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-slate-200 mt-0.5">
                  {new Intl.NumberFormat('tr-TR', { notation: 'compact' }).format(item.value)}₺
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
