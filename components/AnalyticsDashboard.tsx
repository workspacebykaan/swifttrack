"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// TypeScript Arayüzü (Hata vermemesi için)
interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "gelir" | "gider";
  created_at: string;
}

// Supabase Standart Bağlantısı (Asla Çökmez)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({ title: "", amount: "", type: "gelir" });

  // Verileri Supabase'den Çekme (Read)
  const fetchTransactions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Veri çekme hatası:", error);
    } else {
      setTransactions((data as Transaction[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Yeni Kayıt Ekleme (Create)
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert("Lütfen tüm alanları doldur!");
      return;
    }

    const { error } = await supabase.from("transactions").insert([
      {
        title: formData.title,
        amount: parseFloat(formData.amount),
        type: formData.type,
      },
    ]);

    if (error) {
      console.error("Ekleme hatası:", error);
    } else {
      setFormData({ title: "", amount: "", type: "gelir" });
      fetchTransactions(); // Listeyi yenile
    }
  };

  // Kayıt Silme (Delete)
  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      console.error("Silme hatası:", error);
    } else {
      fetchTransactions(); // Listeyi yenile
    }
  };

  // PDF Çıktısı Alma (Tarayıcının yazdır özelliğini kullanarak temiz PDF üretir)
  const handlePrintPDF = () => {
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

  // Grafik Verisi Hazırlığı
  const chartData = [
    { name: "Gelir", Toplam: totalIncome },
    { name: "Gider", Toplam: totalExpense },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Üst Kısım ve PDF Butonu */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Finans Dashboard</h1>
        {/* print:hidden sınıfı sayesinde bu buton PDF'te görünmez */}
        <button
          onClick={handlePrintPDF}
          className="print:hidden bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition-all"
        >
          Raporu İndir (PDF)
        </button>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 className="text-gray-500 text-sm font-medium">Toplam Gelir</h3>
          <p className="text-2xl font-bold text-green-600">₺{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <h3 className="text-gray-500 text-sm font-medium">Toplam Gider</h3>
          <p className="text-2xl font-bold text-red-600">₺{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 className="text-gray-500 text-sm font-medium">Net Bakiye</h3>
          <p className="text-2xl font-bold text-blue-600">₺{netBalance.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Yeni Kayıt Ekleme Formu */}
        <div className="bg-white p-6 rounded-lg shadow print:hidden">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Yeni İşlem Ekle</h2>
          <form onSubmit={handleAddTransaction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Başlık/Açıklama</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Örn: Logo Tasarım İşi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tutar (₺)</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">İşlem Tipi</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              >
                <option value="gelir">Gelir</option>
                <option value="gider">Gider</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-all"
            >
              Kaydet
            </button>
          </form>
        </div>

        {/* Grafik Alanı */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Gelir & Gider Analizi</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Toplam" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kayıt Listesi Tablosu */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">Son İşlemler (Fatura Özeti)</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Açıklama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tip</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">İşlem</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Henüz kayıt bulunmuyor.</td>
              </tr>
            ) : (
              transactions.map((t) => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(t.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${t.type === "gelir" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "gelir" ? "+" : "-"}₺{t.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${t.type === "gelir" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 print:hidden">
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-900 font-medium">
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
  );
}
