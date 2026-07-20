"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
// HATA BURADAYDI, DÜZELTİLDİ: App Router için next/navigation kullanılmalı!
import { useRouter } from "next/navigation"; 

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
        // Eğer "/login" sayfan yoksa burası seni olmayan bir sayfaya atabilir, 
        // ama en azından beyaz ekranda kalmaz.
        router.push("/login");
      } else {
        setUser(session.user);
        fetchTransactions(session.user.id);
      }
    };

    checkUser();
  }, [router]);

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

  // ➕ Yeni Kayıt Ekleme
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Oturum bulunamadı!");
    if (!formData.title || !formData.amount) {
      alert("Lütfen tüm alanları doldur!");
      return;
    }

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
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0B0F19", color: "#FFFFFF" }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: "#9CA3AF" }} className="font-medium">Oturum kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-6 md:p-8 rounded-2xl border shadow-2xl mb-8"
      style={{ backgroundColor: "#0B0F19", borderColor: "#1F2937", color: "#F9FAFB" }}
    >
      {/* Üst Kısım ve PDF Butonu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
            Finansal Yönetim Paneli
          </h1>
          <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
            Gelir, gider ve proje finansallarınızı anlık olarak takip edin.
          </p>
        </div>
        <button
          onClick={handlePrintPDF}
          className="print:hidden font-medium text-sm py-2.5 px-5 rounded-xl shadow-lg transition-all duration-200 flex items-center gap-2 cursor-pointer"
          style={{ backgroundColor: "#10B981", color: "#FFFFFF" }}
        >
          <span>📄</span> Raporu İndir (PDF)
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          className="p-6 rounded-xl border shadow-lg"
          style={{ backgroundColor: "#111827", borderColor: "rgba(16, 185, 129, 0.3)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Toplam Gelir</h3>
          <p className="text-3xl font-extrabold" style={{ color: "#34D399" }}>₺{totalIncome.toLocaleString()}</p>
        </div>
        <div 
          className="p-6 rounded-xl border shadow-lg"
          style={{ backgroundColor: "#111827", borderColor: "rgba(244, 63, 94, 0.3)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Toplam Gider</h3>
          <p className="text-3xl font-extrabold" style={{ color: "#F87171" }}>₺{totalExpense.toLocaleString()}</p>
        </div>
        <div 
          className="p-6 rounded-xl border shadow-lg"
          style={{ backgroundColor: "#111827", borderColor: "rgba(59, 130, 246, 0.3)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#9CA3AF" }}>Net Bakiye</h3>
          <p className="text-3xl font-extrabold" style={{ color: "#60A5FA" }}>₺{netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Yeni Kayıt Ekleme Formu */}
        <div 
          className="p-6 rounded-xl border shadow-xl print:hidden"
          style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
            <span>➕</span> Yeni Finansal İşlem Ekle
          </h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            {/* Proje Seçimi */}
            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>İlişkili Proje (Opsiyonel)</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full rounded-lg p-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#F3F4F6", border: "1px solid #374151" }}
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
              <label className="block text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>Başlık / Açıklama *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg p-2.5 text-sm focus:outline-none"
                style={{ backgroundColor: "#1F2937", color: "#F3F4F6", border: "1px solid #374151" }}
                placeholder="Örn: Web Sitem Tasarım Ücreti"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>Tutar (₺) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full rounded-lg p-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: "#1F2937", color: "#F3F4F6", border: "1px solid #374151" }}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>İşlem Tipi *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg p-2.5 text-sm focus:outline-none"
                  style={{ backgroundColor: "#1F2937", color: "#F3F4F6", border: "1px solid #374151" }}
                >
                  <option value="gelir">Gelir (+)</option>
                  <option value="gider">Gider (-)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 shadow-lg cursor-pointer"
              style={{ backgroundColor: "#2563EB", color: "#FFFFFF" }}
            >
              Kaydet ve İşle
            </button>
          </form>
        </div>

        {/* Grafik Alanı */}
        <div 
          className="p-6 rounded-xl border shadow-xl flex flex-col justify-between"
          style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}
        >
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "#E5E7EB" }}>
            <span>📊</span> Gelir & Gider Dağılımı
          </h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#F9FAFB", borderRadius: "8px" }}
                  itemStyle={{ color: "#60A5FA" }}
                />
                <Bar dataKey="Toplam" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kayıt Listesi Tablosu */}
      <div 
        className="rounded-xl border overflow-hidden shadow-xl"
        style={{ backgroundColor: "#111827", borderColor: "#1F2937" }}
      >
        <div className="p-5 border-b" style={{ borderColor: "#1F2937" }}>
          <h2 className="text-lg font-semibold" style={{ color: "#E5E7EB" }}>Son İşlemler (Fatura / Kayıt Özeti)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-collapse">
            <thead style={{ backgroundColor: "#1F2937", color: "#9CA3AF" }} className="text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-3.5">Açıklama / Proje</th>
                <th className="px-6 py-3.5">Tarih</th>
                <th className="px-6 py-3.5">Tutar</th>
                <th className="px-6 py-3.5">Tip</th>
                <th className="px-6 py-3.5 print:hidden">İşlem</th>
              </tr>
            </thead>
            <tbody className="text-sm" style={{ color: "#D1D5DB" }}>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center" style={{ color: "#6B7280" }}>
                    Veriler yükleniyor...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center" style={{ color: "#6B7280" }}>
                    Henüz finansal kayıt bulunmuyor.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid #1F2937" }}>
                    <td className="px-6 py-4 font-medium" style={{ color: "#FFFFFF" }}>{t.title}</td>
                    <td className="px-6 py-4" style={{ color: "#9CA3AF" }}>
                      {new Date(t.created_at).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="px-6 py-4 font-bold" style={{ color: t.type === "gelir" ? "#34D399" : "#F87171" }}>
                      {t.type === "gelir" ? "+" : "-"}₺{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2.5 py-1 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: t.type === "gelir" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                          color: t.type === "gelir" ? "#34D399" : "#F87171",
                          border: `1px solid ${t.type === "gelir" ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`
                        }}
                      >
                        {t.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="font-medium text-xs px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "#EF4444",
                          border: "1px solid rgba(239, 68, 68, 0.3)"
                        }}
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
