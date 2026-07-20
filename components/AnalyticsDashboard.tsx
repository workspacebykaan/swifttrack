import React, { useState } from 'react';

interface Project {
  id: string;
  title: string;
  client: string;
  budget: number;
  expenses: number;
  status: string;
  deadline: string;
}

interface DashboardProps {
  projects: Project[];
  isPro: boolean;
  lang: "tr" | "en";
}

const dict = {
  tr: {
    title: "Finansal Yönetim Paneli",
    subtitle: "Gelir, gider ve proje finansallarınızı anlık olarak takip edin.",
    downloadReport: "Raporu İndir",
    totalIncome: "TOPLAM GELİR",
    totalExpense: "TOPLAM GİDER",
    netBalance: "NET BAKİYE",
    addNew: "Yeni İşlem Ekle",
    project: "Proje",
    generalTransaction: "Genel İşlem",
    transTitle: "Başlık *",
    amount: "Tutar (₺) *",
    type: "Tip *",
    incomeType: "Gelir (+)",
    expenseType: "Gider (-)",
    saveBtn: "Kaydet",
    chartTitle: "Gelir & Gider",
    incomeLabel: "Gelir",
    expenseLabel: "Gider"
  },
  en: {
    title: "Financial Management Dashboard",
    subtitle: "Track your income, expenses and project financials in real-time.",
    downloadReport: "Download Report",
    totalIncome: "TOTAL INCOME",
    totalExpense: "TOTAL EXPENSE",
    netBalance: "NET BALANCE",
    addNew: "Add New Transaction",
    project: "Project",
    generalTransaction: "General Transaction",
    transTitle: "Title *",
    amount: "Amount (₺) *",
    type: "Type *",
    incomeType: "Income (+)",
    expenseType: "Expense (-)",
    saveBtn: "Save",
    chartTitle: "Income & Expense",
    incomeLabel: "Income",
    expenseLabel: "Expense"
  }
};

export default function AnalyticsDashboard({ projects = [], isPro, lang }: DashboardProps) {
  const t = dict[lang];
  
  const [transTitle, setTransTitle] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transType, setTransType] = useState('income');
  const [selectedProject, setSelectedProject] = useState('general');

  const totalIncome = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
  const totalExpense = projects.reduce((sum, p) => sum + (Number(p.expenses) || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6 mb-8">
      
      {/* ÜST KISIM - İKİNCİ DİL BUTONU BURADAN KALDIRILDI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-lg">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{t.title}</h2>
          <p className="text-xs text-gray-400">{t.subtitle}</p>
        </div>
        
        {/* SADECE RAPOR İNDİR BUTONU VAR */}
        <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-md border border-emerald-500/20">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          {t.downloadReport}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 mb-2">{t.totalIncome}</h3>
          <p className="text-3xl font-bold text-emerald-400">₺{totalIncome.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}</p>
        </div>
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 mb-2">{t.totalExpense}</h3>
          <p className="text-3xl font-bold text-rose-400">₺{totalExpense.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}</p>
        </div>
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xs font-bold text-gray-400 mb-2">{t.netBalance}</h3>
          <p className="text-3xl font-bold text-blue-400">₺{netBalance.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-gray-500 font-normal">+</span> {t.addNew}
          </h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">{t.project}</label>
              <select 
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="general">{t.generalTransaction}</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">{t.transTitle}</label>
              <input 
                type="text" 
                value={transTitle}
                onChange={(e) => setTransTitle(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{t.amount}</label>
                <input 
                  type="number" 
                  value={transAmount}
                  onChange={(e) => setTransAmount(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{t.type}</label>
                <select 
                  value={transType}
                  onChange={(e) => setTransType(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="income">{t.incomeType}</option>
                  <option value="expense">{t.expenseType}</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors mt-2 shadow-md">
              {t.saveBtn}
            </button>
          </form>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="text-md font-bold text-white mb-6 flex items-center gap-2">
            📊 {t.chartTitle}
          </h3>
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 border-l border-b border-gray-700 ml-6 mt-4 mb-6">
              <div className="absolute w-full border-t border-dashed border-gray-800 top-0"></div>
              <div className="absolute w-full border-t border-dashed border-gray-800 top-1/4"></div>
              <div className="absolute w-full border-t border-dashed border-gray-800 top-2/4"></div>
              <div className="absolute w-full border-t border-dashed border-gray-800 top-3/4"></div>
              
              <span className="absolute -left-5 -top-2 text-[10px] text-gray-500">4</span>
              <span className="absolute -left-5 top-1/4 -mt-2 text-[10px] text-gray-500">3</span>
              <span className="absolute -left-5 top-2/4 -mt-2 text-[10px] text-gray-500">2</span>
              <span className="absolute -left-5 top-3/4 -mt-2 text-[10px] text-gray-500">1</span>
              <span className="absolute -left-5 bottom-0 -mb-2 text-[10px] text-gray-500">0</span>

              <div className="absolute bottom-0 left-[20%] w-[10%] h-[60%] bg-blue-500/80 rounded-t-sm shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
              <div className="absolute bottom-0 right-[30%] w-[10%] h-[20%] bg-rose-500/80 rounded-t-sm shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
            </div>
            
            <div className="flex justify-between px-10 text-xs text-gray-500">
              <span className="pl-4">{t.incomeLabel}</span>
              <span className="pr-12">{t.expenseLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
