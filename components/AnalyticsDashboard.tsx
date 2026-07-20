"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useRouter } from "next/router";

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

// Supabase Standart Bağlantısı
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Dashboard({ projects = [], isPro }: AnalyticsDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [formData, setFormData] = useState({ title: "", amount: "", type: "gelir" });

  // 🛡️ AUTH GUARD: Oturum Kontrolü
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || !session.user) {
        router.push("/login");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    };

    checkUser();
  }, []);

  // 📥 Verileri Çekme
  const fetchTransactions = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Veri çekme hatası:", error);
    } else {
      setTransactions((data as Transaction[]) || []);
    }
    setLoading(false);
  };

  // ➕ Yeni Kayıt Ekleme (Proje Bağlantısı İle)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Oturum bulunamadı!");
    if (!formData.title || !formData.amount) {
      alert("Lütfen tüm alanları doldur!");
      return;
    }

    // Seçilen proje varsa başlığa otomatik ekleme yapıyoruz
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

    if (error) {
      console.error("Ekleme hatası:", error);
    } else {
      setFormData({ title: "", amount: "", type: "gelir" });
      setSelectedProjectId("");
      fetchTransactions(user.id);
    }
  };

  // ❌ Kayıt Silme
  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Silme hatası:", error);
    } else {
      fetchTransactions(user.id);
    }
  };

  // 📑 PDF Çıktısı Alma & Sayaç Kaydı
  const handlePrintPDF = async () => {
    if (!user) return;

    const { error } = await supabase.from("feature_usage").insert([
      {
        feature_name: "pdf_download",
        user_id: user.id,
      },
    ]);

    if (error) {
      console.error("Özellik kullanım kaydı eklenemedi:", error);
    }

    window.print();
  };

  // Hesaplamalar
  const totalIncome = transactions
    .filter((t) => t.type === "gelir")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "gider")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Grafik Verisi
  const chartData = [
    { name: "Gelir", Toplam: totalIncome },
    { name: "Gider", Toplam: totalExpense },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F19] text-white p-6 md:p-8 rounded-2xl border border-gray-800 shadow-2xl mb-8">
      {/* Üst Kısım ve PDF Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Finansal Yönetim Paneli</h1>
          <p className="text-sm text-gray-400 mt-1">Gelir, gider ve proje finansallarınızı anlık olarak takip edin.</p>
        </div>
        <button
          onClick={handlePrintPDF}
          className="print:hidden bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-900/20 transition-all duration-200 flex items-center gap-2"
        >
          <span>📄</span> Raporu İndir (PDF)
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111827] p-6 rounded-xl border border-emerald-500/30 shadow-lg">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Toplam Gelir</h3>
          <p className="text-3xl font-extrabold text-emerald-400">₺{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-[#111827] p-6 rounded-xl border border-rose-500/30 shadow-lg">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Toplam Gider</h3>
          <p className="text-3xl font-extrabold text-rose-400">₺{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-[#111827] p-6 rounded-xl border border-blue-500/30 shadow-lg">
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Net Bakiye</h3>
          <p className="text-3xl font-extrabold text-blue-400">₺{netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Yeni Kayıt Ekleme Formu */}
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-xl print:hidden">
          <h2 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
            <span>➕</span> Yeni Finansal İşlem Ekle
          </h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            {/* Proje Seçimi (Eğer proje varsa) */}
            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">İlişkili Proje (Opsiyonel)</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Proje Seçilmedi (Genel İşlem)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title || p.name} {p.customer ? `(${p.customer})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Başlık / Açıklama *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Örn: Web Sitem Tasarım Ücreti"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Tutar (₺) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">İşlem Tipi *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="gelir">Gelir (+)</option>
                  <option value="gider">Gider (-)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30"
            >
              Kaydet ve İşle
            </button>
          </form>
        </div>

        {/* Grafik Alanı */}
        <div className="bg-[#111827] p-6 rounded-xl border border-gray-800 shadow-xl flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-4 text-gray-200 flex items-center gap-2">
            <span>📊</span> Gelir & Gider Dağılımı
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#FFF", borderRadius: "8px" }}
                  itemStyle={{ color: "#60A5FA" }}
                />
                <Bar dataKey="Toplam" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kayıt Listesi Tablosu */}
      <div className="bg-[#111827] rounded-xl border border-gray-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-gray-200">Son İşlemler (Fatura / Kayıt Özeti)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800 text-left">
            <thead className="bg-[#1F2937]/50 text-gray-400 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Açıklama / Proje</th>
                <th className="px-6 py-3.5">Tarih</th>
                <th className="px-6 py-3.5">Tutar</th>
                <th className="px-6 py-3.5">Tip</th>
                <th className="px-6 py-3.5 print:hidden">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    Veriler yükleniyor...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-gray-500">
                    Henüz finansal kayıt bulunmuyor.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#1F2937]/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{t.title}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(t.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className={`px-6 py-4 font-bold ${t.type === "gelir" ? "text-emerald-400" : "text-rose-400"}`}>
                      {t.type === "gelir" ? "+" : "-"}₺{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                          t.type === "gelir"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-rose-400 hover:text-rose-300 font-medium text-xs bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-all"
                      >
                        Sil
                      </button>
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
