"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// TypeScript Arayüzleri
interface Project {
  id: string | number;
  name?: string;
  title?: string;
  customer?: string;
}

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "gelir" | "gider";
  created_at: string;
  user_id: string;
}

interface AnalyticsDashboardProps {
  projects?: Project[];
  isPro?: boolean;
}

// 🛡️ GÜVENLİ SUPABASE BAĞLANTISI (Env yoksa çökmesini engeller)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default function Dashboard({ projects = [], isPro }: AnalyticsDashboardProps) {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [formData, setFormData] = useState({ title: "", amount: "", type: "gelir" });
  const [envError, setEnvError] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // 🛡️ AUTH GUARD & ENV KONTROLÜ
  useEffect(() => {
    if (!supabase) {
      setEnvError(true);
      setLoading(false);
      setAuthChecked(true);
      return;
    }

    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          fetchTransactions(session.user.id);
        }
      } catch (err) {
        console.error("Auth hatası:", err);
      } finally {
        setAuthChecked(true);
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // 📥 Verileri Çekme
  const fetchTransactions = async (userId: string) => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Yeni Kayıt Ekleme
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return alert("Oturum bulunamadı!");
    if (!formData.title || !formData.amount) return alert("Lütfen tüm alanları doldur!");

    let finalTitle = formData.title;
    if (selectedProjectId) {
      const selectedProj = projects.find((p) => String(p.id) === String(selectedProjectId));
      const projName = selectedProj?.title || selectedProj?.name;
      if (projName && !finalTitle.includes(`[${projName}]`)) {
        finalTitle = `[${projName}] ${finalTitle}`;
      }
    }

    const { error } = await supabase.from("transactions").insert([
      {
        title: finalTitle,
        amount: parseFloat(formData.amount),
        type: formData.type,
        user_id: user.id,
      },
    ]);

    if (!error) {
      setFormData({ title: "", amount: "", type: "gelir" });
      setSelectedProjectId("");
      fetchTransactions(user.id);
    }
  };

  // ❌ Kayıt Silme
  const handleDelete = async (id: string) => {
    if (!supabase || !user) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (!error) fetchTransactions(user.id);
  };

  // 📑 PDF Çıktısı
  const handlePrintPDF = async () => {
    if (!supabase || !user) return;
    await supabase.from("feature_usage").insert([{ feature_name: "pdf_download", user_id: user.id }]);
    window.print();
  };

  // HATA EKRANI: .env eksik
  if (envError) {
    return (
      <div className="p-8 rounded-2xl border border-rose-500/30 bg-[#111827] text-center mb-8 shadow-xl">
        <h2 className="text-xl font-bold text-rose-400 mb-2">⚠️ Ortam Değişkenleri Eksik!</h2>
        <p className="text-gray-400">Vercel veya yerel `.env.local` dosyanızda Supabase URL ve KEY eksik. Lütfen ekleyin.</p>
      </div>
    );
  }

  // YÜKLENİYOR EKRANI
  if (!authChecked) {
    return (
      <div className="p-12 flex justify-center bg-[#0B0F19] rounded-2xl border border-[#1F2937] mb-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // GİRİŞ YAPILMAMIŞ EKRANI (Router çökmesini önlemek için a tag kullanıldı)
  if (!user) {
    return (
      <div className="p-8 rounded-2xl border border-[#1F2937] bg-[#111827] text-center mb-8 shadow-xl">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Finansal Verilerinizi Görmek İçin Giriş Yapın</h2>
        <a href="/login" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-lg">
          Giriş Yap / Kayıt Ol
        </a>
      </div>
    );
  }

  // HESAPLAMALAR
  const totalIncome = transactions.filter((t) => t.type === "gelir").reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "gider").reduce((acc, curr) => acc + curr.amount, 0);
  const netBalance = totalIncome - totalExpense;
  const chartData = [
    { name: "Gelir", Toplam: totalIncome },
    { name: "Gider", Toplam: totalExpense },
  ];

  return (
    <div className="p-6 md:p-8 rounded-2xl border shadow-2xl mb-8" style={{ backgroundColor: "#0B0F19", borderColor: "#1F2937", color: "#F9FAFB" }}>
      {/* Üst Kısım */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Finansal Yönetim Paneli</h1>
          <p className="text-sm mt-1 text-gray-400">Gelir, gider ve proje finansallarınızı anlık olarak takip edin.</p>
        </div>
        <button onClick={handlePrintPDF} className="print:hidden font-medium text-sm py-2.5 px-5 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white">
          <span>📄</span> Raporu İndir
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border shadow-lg bg-[#111827] border-emerald-500/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">Toplam Gelir</h3>
          <p className="text-3xl font-extrabold text-emerald-400">₺{totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border shadow-lg bg-[#111827] border-rose-500/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">Toplam Gider</h3>
          <p className="text-3xl font-extrabold text-rose-400">₺{totalExpense.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl border shadow-lg bg-[#111827] border-blue-500/30">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-400">Net Bakiye</h3>
          <p className="text-3xl font-extrabold text-blue-400">₺{netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Form */}
        <div className="p-6 rounded-xl border shadow-xl print:hidden bg-[#111827] border-gray-800">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-200"><span>➕</span> Yeni İşlem Ekle</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">Proje</label>
                <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full rounded-lg p-2.5 text-sm focus:outline-none bg-[#1F2937] border-gray-700 text-white">
                  <option value="">Genel İşlem</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.title || p.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-400">Başlık *</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full rounded-lg p-2.5 text-sm focus:outline-none bg-[#1F2937] border-gray-700 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">Tutar (₺) *</label>
                <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full rounded-lg p-2.5 text-sm focus:outline-none bg-[#1F2937] border-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">Tip *</label>
                <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full rounded-lg p-2.5 text-sm focus:outline-none bg-[#1F2937] border-gray-700 text-white">
                  <option value="gelir">Gelir (+)</option>
                  <option value="gider">Gider (-)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full font-semibold py-2.5 px-4 rounded-xl transition-all shadow-lg bg-blue-600 hover:bg-blue-500 text-white">Kaydet</button>
          </form>
        </div>

        {/* Grafik */}
        <div className="p-6 rounded-xl border shadow-xl flex flex-col justify-between bg-[#111827] border-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">📊 Gelir & Gider</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#F9FAFB" }} itemStyle={{ color: "#60A5FA" }} />
                <Bar dataKey="Toplam" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tablo */}
      <div className="rounded-xl border overflow-hidden shadow-xl bg-[#111827] border-gray-800">
        <div className="p-5 border-b border-gray-800"><h2 className="text-lg font-semibold text-gray-200">Son İşlemler</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead className="bg-[#1F2937] text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Açıklama</th><th className="px-6 py-3.5">Tarih</th><th className="px-6 py-3.5">Tutar</th><th className="px-6 py-3.5">Tip</th><th className="px-6 py-3.5">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-6 text-center text-gray-500">Kayıt bulunmuyor.</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-800">
                    <td className="px-6 py-4 font-medium text-white">{t.title}</td>
                    <td className="px-6 py-4 text-gray-400">{new Date(t.created_at).toLocaleDateString("tr-TR")}</td>
                    <td className={`px-6 py-4 font-bold ${t.type === "gelir" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "gelir" ? "+" : "-"}₺{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${t.type === "gelir" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border-rose-500/30"}`}>
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDelete(t.id)} className="text-rose-400 text-xs px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20">Sil</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
