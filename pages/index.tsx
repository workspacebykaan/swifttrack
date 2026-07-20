import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

interface Project {
  id: string;
  title: string;
  client: string;
  budget: number;
  expenses: number;
  status: string;
  deadline: string;
  name?: string; 
}

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

// 🌍 DİL SÖZLÜĞÜ (Ana Sayfa İçin)
const dict = {
  tr: {
    checkingSession: "Oturum kontrol ediliyor...",
    title: "Freelancer Finansal Takip",
    loginSub: "Projelerinizi yönetmek için giriş yapın",
    registerSub: "Yeni bir hesap oluşturun",
    forgotSub: "Şifrenizi sıfırlamak için e-posta adresinizi girin",
    resetSub: "Hesabınız için yeni bir şifre belirleyin",
    email: "E-Posta Adresi",
    password: "Şifre",
    newPassword: "Yeni Şifre",
    fillAll: "Lütfen tüm alanları doldurun!",
    loginBtn: "Giriş Yap",
    registerBtn: "Kayıt Ol",
    forgotBtn: "Sıfırlama Linki Gönder",
    resetBtn: "Yeni Şifreyi Kaydet",
    forgotLink: "Şifremi Unuttum",
    noAccount: "Hesabınız yok mu? Kayıt olun",
    backToLogin: "Geri dön ve giriş yap",
    activeUser: "Aktif Kullanıcı:",
    logoutBtn: "Güvenli Çıkış",
    newProject: "Yeni Proje Tanımla",
    updateProject: "Proje Güncelle",
    projectName: "Proje Adı *",
    clientName: "Müşteri / Şirket *",
    budget: "Proje Bütçesi (₺) *",
    expenses: "Toplam Masraf (₺)",
    statusLabel: "Durum",
    deadline: "Teslim Tarihi",
    active: "Aktif",
    completed: "Tamamlandı",
    all: "Tümü",
    cancelBtn: "Vazgeç",
    saveBtn: "Kaydet",
    saveProjectBtn: "Projeyi Kaydet",
    allProjects: "Tüm Projeler",
    projectsDesc: "Yalnızca sizin tarafınızdan eklenen kayıtlar listelenir.",
    downloadPdf: "PDF İndir",
    loading: "Yükleniyor...",
    noProjects: "Bu kategoride listelenecek proje bulunamadı.",
    thProject: "PROJE & MÜŞTERİ",
    thFinancial: "FİNANSAL DURUM",
    thStatus: "DURUM (DEĞİŞTİR)",
    thDeadline: "DEADLINE",
    thActions: "İŞLEMLER",
    budgetLabel: "bütçe",
    expenseLabel: "masraf",
    editBtn: "Düzenle",
    deleteBtn: "Sil",
    alertPastDate: "Geçmiş bir teslim tarihi seçemezsiniz!",
    alertDelete: "Bu projeyi silmek istediğinize emin misiniz?",
    alertLogout: "Çıkış yapmak istediğinize emin misiniz?",
    alertMandatory: "Lütfen zorunlu alanları doldurun!",
    pdfReport: "Freelancer Finansal Raporu",
    pdfDesc: "Üretilen listenin mevcut durum ve hakediş dökümüdür.",
    pdfDate: "Rapor Tarihi:",
    pdfUser: "Kullanıcı:",
    pdfScope: "Kapsam:",
    pdfTotalBudget: "Toplam Bütçe",
    pdfTotalExpense: "Toplam Gider",
    pdfNet: "Net Hak Ediş (Kâr)"
  },
  en: {
    checkingSession: "Checking session...",
    title: "Freelancer Financial Tracker",
    loginSub: "Log in to manage your projects",
    registerSub: "Create a new account",
    forgotSub: "Enter your email to reset password",
    resetSub: "Set a new password for your account",
    email: "Email Address",
    password: "Password",
    newPassword: "New Password",
    fillAll: "Please fill in all fields!",
    loginBtn: "Login",
    registerBtn: "Sign Up",
    forgotBtn: "Send Reset Link",
    resetBtn: "Save New Password",
    forgotLink: "Forgot Password?",
    noAccount: "Don't have an account? Sign up",
    backToLogin: "Back to login",
    activeUser: "Active User:",
    logoutBtn: "Secure Logout",
    newProject: "Define New Project",
    updateProject: "Update Project",
    projectName: "Project Name *",
    clientName: "Client / Company *",
    budget: "Project Budget (₺) *",
    expenses: "Total Expenses (₺)",
    statusLabel: "Status",
    deadline: "Deadline",
    active: "Active",
    completed: "Completed",
    all: "All",
    cancelBtn: "Cancel",
    saveBtn: "Save",
    saveProjectBtn: "Save Project",
    allProjects: "All Projects",
    projectsDesc: "Only records added by you are listed.",
    downloadPdf: "Download PDF",
    loading: "Loading...",
    noProjects: "No projects found in this category.",
    thProject: "PROJECT & CLIENT",
    thFinancial: "FINANCIAL STATUS",
    thStatus: "STATUS (TOGGLE)",
    thDeadline: "DEADLINE",
    thActions: "ACTIONS",
    budgetLabel: "budget",
    expenseLabel: "expense",
    editBtn: "Edit",
    deleteBtn: "Delete",
    alertPastDate: "You cannot select a past deadline!",
    alertDelete: "Are you sure you want to delete this project?",
    alertLogout: "Are you sure you want to log out?",
    alertMandatory: "Please fill in mandatory fields!",
    pdfReport: "Freelancer Financial Report",
    pdfDesc: "Current status and earnings breakdown of the generated list.",
    pdfDate: "Report Date:",
    pdfUser: "User:",
    pdfScope: "Scope:",
    pdfTotalBudget: "Total Budget",
    pdfTotalExpense: "Total Expense",
    pdfNet: "Net Earnings (Profit)"
  }
};

export default function Home() {
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const t = dict[lang];

  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [deadline, setDeadline] = useState('');

  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Tümü' | 'Aktif' | 'Tamamlandı'>('Tümü');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setAuthMode('reset');
        setAuthMessage(t.resetSub);
      }
    });

    return () => subscription.unsubscribe();
  }, [t.resetSub]);

  const fetchProjects = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('deadline', { ascending: true });

      if (!error && data) {
        setProjects(data as Project[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id && authMode !== 'reset') {
      fetchProjects(session.user.id);
    } else {
      setProjects([]);
    }
  }, [session, authMode]);

  const trackEvent = async (eventName: string) => {
    if (!session?.user?.id) return;
    const { error } = await supabase
      .from('feature_usage')
      .insert([{ user_id: session.user.id, event_name: eventName }]);
    
    if (error) {
      console.error("❌ Analitik hatası:", error.message);
    }
  };

  // Doğrudan Bilgisayara PDF İndiren Fonksiyon
  const exportToPDF = () => {
    trackEvent('pdf_exported');

    const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenses = filteredProjects.reduce((sum, p) => sum + p.expenses, 0);
    const totalNet = totalBudget - totalExpenses;

    // Durum İngilizce karşılıklarını almak için yardımcı fonksiyon
    const getStatusText = (s: string) => s === 'Tamamlandı' ? t.completed : t.active;
    const getFilterText = (f: string) => f === 'Tümü' ? t.all : (f === 'Aktif' ? t.active : t.completed);

    const tableRows = filteredProjects.map(p => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; vertical-align: middle; text-align: left;">
          <div style="font-weight: 600; color: #111827; font-size: 13px;">${p.title}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${p.client}</div>
        </td>
        <td style="padding: 12px 8px; vertical-align: middle; text-align: left; color: #10b981; font-weight: 600;">${Number(p.budget).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} ₺</td>
        <td style="padding: 12px 8px; vertical-align: middle; text-align: left; color: #ef4444; font-weight: 500;">${Number(p.expenses).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} ₺</td>
        <td style="padding: 12px 8px; vertical-align: middle; text-align: left;">
          <span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; display: inline-block;
            background-color: ${p.status === 'Tamamlandı' ? '#ecfdf5' : '#eff6ff'}; 
            color: ${p.status === 'Tamamlandı' ? '#047857' : '#1d4ed8'};
            border: 1px solid ${p.status === 'Tamamlandı' ? '#a7f3d0' : '#bfdbfe'};">
            ${getStatusText(p.status)}
          </span>
        </td>
        <td style="padding: 12px 8px; vertical-align: middle; text-align: left; font-family: monospace; color: #4b5563; font-size: 12px;">
          ${p.deadline ? new Date(p.deadline).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR') : '-'}
        </td>
      </tr>
    `).join('');

    const reportTemplate = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937; padding: 30px; background: #fff;">
        <table style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 25px;">
          <tr>
            <td style="vertical-align: top; text-align: left;">
              <div style="font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px;">${t.pdfReport}</div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${t.pdfDesc}</div>
            </td>
            <td style="vertical-align: top; text-align: right; font-size: 11px; color: #4b5563; line-height: 1.6;">
              <div><strong>${t.pdfDate}</strong> ${new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR')}</div>
              <div><strong>${t.pdfUser}</strong> ${session?.user?.email || 'Bilinmiyor'}</div>
              <div><strong>${t.pdfScope}</strong> ${getFilterText(filter)}</div>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="width: 33.33%; padding-right: 10px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 10px; border-left: 4px solid #10b981;">
                <div style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">${t.pdfTotalBudget}</div>
                <div style="font-size: 18px; font-weight: 700; color: #059669;">${totalBudget.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} ₺</div>
              </div>
            </td>
            <td style="width: 33.33%; padding-right: 10px; padding-left: 10px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 10px; border-left: 4px solid #ef4444;">
                <div style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">${t.pdfTotalExpense}</div>
                <div style="font-size: 18px; font-weight: 700; color: #dc2626;">${totalExpenses.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} ₺</div>
              </div>
            </td>
            <td style="width: 33.33%; padding-left: 10px;">
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 10px; border-left: 4px solid #3b82f6;">
                <div style="font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px;">${t.pdfNet}</div>
                <div style="font-size: 18px; font-weight: 700; color: #2563eb;">${totalNet.toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')} ₺</div>
              </div>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 10px 8px; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left;">${t.thProject}</th>
              <th style="padding: 10px 8px; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left;">${t.thFinancial}</th>
              <th style="padding: 10px 8px; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left;">${t.statusLabel}</th>
              <th style="padding: 10px 8px; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; text-align: left;">${t.thDeadline}</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows ? tableRows : `<tr><td colspan="4" style="text-align:center; color:#9ca3af; padding:30px;">${t.noProjects}</td></tr>`}
          </tbody>
        </table>
      </div>
    `;

    const executeDownload = () => {
      const element = document.createElement('div');
      element.innerHTML = reportTemplate;
      
      const opt = {
        margin:       15,
        filename:     `Report_${filter}_${new Date().toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      (window as any).html2pdf().set(opt).from(element).save();
    };

    if (!(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = executeDownload;
      document.body.appendChild(script);
    } else {
      executeDownload();
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');
    const deviceInfo = window.navigator.userAgent;

    if (authMode === 'login') {
      if (!authEmail || !authPassword) return alert(t.fillAll);
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
      if (error) {
        setAuthMessage('Error: ' + error.message);
        await supabase.from('login_logs').insert([{ email: authEmail, status: 'Başarısız Giriş', device_info: deviceInfo }]);
      } else {
        await supabase.from('login_logs').insert([{ email: authEmail, status: 'Başarılı Giriş', device_info: deviceInfo }]);
      }
    } 
    else if (authMode === 'register') {
      if (!authEmail || !authPassword) return alert(t.fillAll);
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthMessage('Error: ' + error.message);
      else setAuthMessage(lang === 'tr' ? 'Kayıt başarılı! Giriş yapabilirsiniz.' : 'Registration successful! You can now log in.');
    } 
    else if (authMode === 'forgot') {
      if (!authEmail) return alert(t.fillAll);
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin });
      if (error) setAuthMessage('Error: ' + error.message);
      else setAuthMessage(lang === 'tr' ? '✅ Şifre sıfırlama bağlantısı e-postanıza gönderildi!' : '✅ Password reset link sent to your email!');
    }
    else if (authMode === 'reset') {
      if (!authPassword) return alert(t.fillAll);
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) setAuthMessage('Error: ' + error.message);
      else {
        setAuthMessage(lang === 'tr' ? '✅ Şifreniz başarıyla güncellendi!' : '✅ Password successfully updated!');
        setTimeout(() => setAuthMode('login'), 1500);
      }
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) return alert(t.alertMandatory);
    if (deadline && deadline < todayStr) return alert(t.alertPastDate);

    const projectData = {
      title, client, budget: Number(budget), expenses: Number(expenses) || 0,
      status, deadline: deadline || null, user_id: session?.user?.id
    };

    if (editingProjectId) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProjectId);
      if (!error) {
        trackEvent('project_updated'); setEditingProjectId(null); clearForm(); fetchProjects(session.user.id);
      } else alert('Error: ' + error.message);
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (!error) {
        trackEvent('project_created'); clearForm(); fetchProjects(session.user.id);
      } else alert('Error: ' + error.message);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id); setTitle(project.title); setClient(project.client);
    setBudget(project.budget.toString()); setExpenses(project.expenses.toString());
    setStatus(project.status); setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm(t.alertDelete)) return;
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
      trackEvent('project_deleted'); setProjects(projects.filter(p => p.id !== projectId));
      if (editingProjectId === projectId) { setEditingProjectId(null); clearForm(); }
    }
  };

  const toggleProjectStatus = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Tamamlandı' : 'Aktif';
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (!error) {
      trackEvent('status_toggled'); setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    }
  };

  const handleFilterChange = (tab: 'Tümü' | 'Aktif' | 'Tamamlandı') => {
    setFilter(tab); trackEvent(`filter_used_${tab.toLowerCase()}`); 
  };

  const handleLogout = async () => {
    if (!confirm(t.alertLogout)) return;
    await supabase.auth.signOut(); setProjects([]);
  };

  const clearForm = () => { setTitle(''); setClient(''); setBudget(''); setExpenses(''); setDeadline(''); setStatus('Aktif'); };

  const filteredProjects = projects.filter(p => filter === 'Tümü' ? true : p.status === filter);

  if (authLoading) {
    return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-gray-400 font-sans"><p className="text-sm">{t.checkingSession}</p></div>;
  }

  if (!session || authMode === 'reset') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4 font-sans relative">
        {/* Giriş ekranı için dil değiştirici */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setLang(lang === "tr" ? "en" : "tr")} className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#374151] border border-gray-700 text-gray-200 font-medium text-sm py-2 px-4 rounded-xl transition-all shadow-md">
            {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
          </button>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">{t.title}</h1>
            <p className="text-xs text-gray-400">
              {authMode === 'login' && t.loginSub}
              {authMode === 'register' && t.registerSub}
              {authMode === 'forgot' && t.forgotSub}
              {authMode === 'reset' && t.resetSub}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{t.email}</label>
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" required />
              </div>
            )}
            {authMode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{authMode === 'reset' ? t.newPassword : t.password}</label>
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" required />
              </div>
            )}
            {authMessage && <p className="text-xs text-center p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">{authMessage}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-lg">
              {authMode === 'login' && t.loginBtn} {authMode === 'register' && t.registerBtn} {authMode === 'forgot' && t.forgotBtn} {authMode === 'reset' && t.resetBtn}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center pt-4 border-t border-gray-800">
            {authMode === 'login' && (
              <>
                <button type="button" onClick={() => { setAuthMode('forgot'); setAuthMessage(''); }} className="text-xs text-gray-400 hover:text-blue-400 transition-colors">{t.forgotLink}</button>
                <button type="button" onClick={() => { setAuthMode('register'); setAuthMessage(''); }} className="text-xs text-blue-400 hover:underline">{t.noAccount}</button>
              </>
            )}
            {(authMode === 'register' || authMode === 'forgot') && (
              <button type="button" onClick={() => { setAuthMode('login'); setAuthMessage(''); }} className="text-xs text-blue-400 hover:underline">{t.backToLogin}</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* ÜST BİLGİ VE BUTONLAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-xl">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t.title}</h1>
            <p className="text-xs text-gray-400">{t.activeUser} <span className="text-blue-400 font-mono">{session.user?.email}</span></p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setLang(lang === "tr" ? "en" : "tr")} className="flex items-center gap-2 bg-[#1F2937] hover:bg-[#374151] border border-gray-700 text-gray-200 font-medium text-xs px-4 py-2 rounded-lg transition-all shadow-md">
              {lang === "tr" ? "🇹🇷 TR" : "🇬🇧 EN"}
            </button>
            <button onClick={handleLogout} className="flex-1 sm:flex-none bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              {t.logoutBtn}
            </button>
          </div>
        </div>

        {/* GRAFİK BÖLÜMÜ */}
        <AnalyticsDashboard projects={projects} isPro={false} />

        {/* PROJE EKLEME VE LİSTELEME */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* FORM */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl h-fit">
            <h2 className="text-lg md:text-xl font-bold mb-1">{editingProjectId ? t.updateProject : t.newProject}</h2>
            <form onSubmit={handleSaveProject} className="space-y-4 mt-6">
              <div><label className="block text-xs font-semibold text-gray-400 mb-1">{t.projectName}</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              <div><label className="block text-xs font-semibold text-gray-400 mb-1">{t.clientName}</label><input type="text" value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">{t.budget}</label><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">{t.expenses}</label><input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">{t.statusLabel}</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100">
                    <option value="Aktif">{t.active}</option>
                    <option value="Tamamlandı">{t.completed}</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">{t.deadline}</label><input type="date" value={deadline} min={todayStr} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                {editingProjectId && <button type="button" onClick={() => { setEditingProjectId(null); clearForm(); }} className="w-1/3 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">{t.cancelBtn}</button>}
                <button type="submit" className={`font-semibold text-sm py-2.5 rounded-lg transition-colors ${editingProjectId ? 'w-2/3 bg-green-600 hover:bg-green-700 text-white' : 'w-full bg-blue-600 hover:bg-blue-700 text-white'}`}>{editingProjectId ? t.saveBtn : t.saveProjectBtn}</button>
              </div>
            </form>
          </div>

          {/* TABLO */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold mb-1">{t.allProjects}</h2>
                <p className="text-xs text-gray-400">{t.projectsDesc}</p>
              </div>
              
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-md border border-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                {t.downloadPdf} ({filter === 'Tümü' ? t.all : (filter === 'Aktif' ? t.active : t.completed)})
              </button>
            </div>

            <div className="flex bg-[#1F2937]/60 p-1 rounded-lg border border-gray-800 mb-6 max-w-xs">
              {(['Tümü', 'Aktif', 'Tamamlandı'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => handleFilterChange(tab)} className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>
                  {tab === 'Tümü' ? t.all : (tab === 'Aktif' ? t.active : t.completed)}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">{t.loading}</p>
            ) : filteredProjects.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center text-sm text-gray-500">{t.noProjects}</div>
            ) : (
              <div className="overflow-x-auto w-full -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 tracking-wider">
                      <th className="pb-3">{t.thProject}</th>
                      <th className="pb-3">{t.thFinancial}</th>
                      <th className="pb-3">{t.thStatus}</th>
                      <th className="pb-3">{t.thDeadline}</th>
                      <th className="pb-3 text-right">{t.thActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm">
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-[#111827]/50 transition-colors">
                        <td className="py-4 pr-2">
                          <div className="font-semibold text-gray-200 max-w-[180px] break-words">{project.title}</div>
                          <div className="text-xs text-gray-500 max-w-[180px] break-words">{project.client}</div>
                        </td>
                        <td className="py-4 pr-2">
                          <div className="font-semibold text-green-400 whitespace-nowrap">{Number(project.budget).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}₺ {t.budgetLabel}</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">-{Number(project.expenses).toLocaleString(lang === 'en' ? 'en-US' : 'tr-TR')}₺ {t.expenseLabel}</div>
                        </td>
                        <td className="py-4 pr-2">
                          <button onClick={() => toggleProjectStatus(project.id, project.status)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${project.status === 'Tamamlandı' ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>
                            {project.status === 'Tamamlandı' ? t.completed : t.active}
                          </button>
                        </td>
                        <td className="py-4 text-gray-400 text-xs font-mono whitespace-nowrap">{project.deadline ? new Date(project.deadline).toLocaleDateString(lang === 'en' ? 'en-US' : 'tr-TR') : '-'}</td>
                        <td className="py-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleEditClick(project)} className="text-xs bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 px-2.5 py-1 rounded transition-colors">{t.editBtn}</button>
                          <button onClick={() => handleDeleteProject(project.id)} className="text-xs bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 px-2.5 py-1 rounded transition-colors">{t.deleteBtn}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
