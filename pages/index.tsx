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

export default function Home() {
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
        setAuthMessage('Lütfen yeni şifrenizi belirleyin.');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Dinamik ve Türkçe Karakter Uyumlu PDF Rapor Oluşturucu
  const exportToPDF = () => {
    trackEvent('pdf_exported');
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return alert('Lütfen tarayıcınızın açılır pencerelerine (popup) izin verin!');

    // Sadece aktif filtrelenmiş projelerin finansal özetini hesapla
    const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
    const totalExpenses = filteredProjects.reduce((sum, p) => sum + p.expenses, 0);
    const totalNet = totalBudget - totalExpenses;

    const tableRows = filteredProjects.map(p => `
      <tr>
        <td>
          <div style="font-weight: 600; color: #111827; font-size: 13px;">${p.title}</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${p.client}</div>
        </td>
        <td style="color: #10b981; font-weight: 600;">${Number(p.budget).toLocaleString('tr-TR')} ₺</td>
        <td style="color: #ef4444; font-weight: 500;">${Number(p.expenses).toLocaleString('tr-TR')} ₺</td>
        <td>
          <span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; 
            background-color: ${p.status === 'Tamamlandı' ? '#ecfdf5' : '#eff6ff'}; 
            color: ${p.status === 'Tamamlandı' ? '#047857' : '#1d4ed8'};
            border: 1px solid ${p.status === 'Tamamlandı' ? '#a7f3d0' : '#bfdbfe'};">
            ${p.status}
          </span>
        </td>
        <td style="font-family: monospace; color: #4b5563; font-size: 12px;">
          ${p.deadline ? new Date(p.deadline).toLocaleDateString('tr-TR') : '-'}
        </td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Finansal_Rapor_${filter}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 40px; line-height: 1.5; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 25px; }
            .title { font-size: 22px; font-weight: 800; color: #111827; letter-spacing: -0.5px; }
            .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .meta { font-size: 12px; color: #4b5563; text-align: right; line-height: 1.6; }
            .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px; }
            .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 14px; border-radius: 10px; }
            .card-title { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
            .card-value { font-size: 18px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 10px; }
            th { border-bottom: 2px solid #e5e7eb; padding: 10px 8px; color: #4b5563; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
            td { border-bottom: 1px solid #f3f4f6; padding: 12px 8px; vertical-align: middle; }
            @media print {
              body { margin: 20px; }
              @page { size: auto; margin: 0mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Freelancer Finansal Raporu</div>
              <div class="subtitle">Üretilen listenin mevcut durum ve hak ediş dökümüdür.</div>
            </div>
            <div class="meta">
              <div><strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')}</div>
              <div><strong>Kullanıcı:</strong> ${session?.user?.email || 'Bilinmiyor'}</div>
              <div><strong>Kapsam:</strong> ${filter} Projeler</div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="card" style="border-left: 4px solid #10b981;">
              <div class="card-title">Toplam Ciro / Bütçe</div>
              <div class="card-value" style="color: #059669;">${totalBudget.toLocaleString('tr-TR')} ₺</div>
            </div>
            <div class="card" style="border-left: 4px solid #ef4444;">
              <div class="card-title">Toplam Gider</div>
              <div class="card-value" style="color: #dc2626;">${totalExpenses.toLocaleString('tr-TR')} ₺</div>
            </div>
            <div class="card" style="border-left: 4px solid #3b82f6;">
              <div class="card-title">Net Hak Ediş (Kâr)</div>
              <div class="card-value" style="color: #2563eb;">${totalNet.toLocaleString('tr-TR')} ₺</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>PROJE & MÜŞTERİ</th>
                <th>BÜTÇE</th>
                <th>MASRAF</th>
                <th>DURUM</th>
                <th>TESLİM TARİHİ</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows ? tableRows : '<tr><td colspan="5" style="text-align:center; color:#9ca3af; padding:30px;">Listelenecek proje bulunamadı.</td></tr>'}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');
    const deviceInfo = window.navigator.userAgent;

    if (authMode === 'login') {
      if (!authEmail || !authPassword) return alert('Lütfen tüm alanları doldurun!');
      const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: password => authPassword });
      if (error) {
        setAuthMessage('Hata: ' + error.message);
        await supabase.from('login_logs').insert([{ email: authEmail, status: 'Başarısız Giriş', device_info: deviceInfo }]);
      } else {
        await supabase.from('login_logs').insert([{ email: authEmail, status: 'Başarılı Giriş', device_info: deviceInfo }]);
      }
    } 
    else if (authMode === 'register') {
      if (!authEmail || !authPassword) return alert('Lütfen tüm alanları doldurun!');
      const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
      if (error) setAuthMessage('Hata: ' + error.message);
      else setAuthMessage('Kayıt başarılı! Giriş yapabilirsiniz.');
    } 
    else if (authMode === 'forgot') {
      if (!authEmail) return alert('Lütfen e-posta adresinizi girin!');
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail, { redirectTo: window.location.origin });
      if (error) setAuthMessage('Hata: ' + error.message);
      else setAuthMessage('✅ Şifre sıfırlama bağlantısı e-postanıza gönderildi!');
    }
    else if (authMode === 'reset') {
      if (!authPassword) return alert('Lütfen yeni şifrenizi girin!');
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) setAuthMessage('Hata: ' + error.message);
      else {
        setAuthMessage('✅ Şifreniz başarıyla güncellendi!');
        setTimeout(() => setAuthMode('login'), 1500);
      }
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) return alert('Lütfen zorunlu alanları doldurun!');
    if (deadline && deadline < todayStr) return alert('Geçmiş bir teslim tarihi seçemezsiniz!');

    const projectData = {
      title, client, budget: Number(budget), expenses: Number(expenses) || 0,
      status, deadline: deadline || null, user_id: session?.user?.id
    };

    if (editingProjectId) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProjectId);
      if (!error) {
        trackEvent('project_updated'); setEditingProjectId(null); clearForm(); fetchProjects(session.user.id);
      } else alert('Hata: ' + error.message);
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (!error) {
        trackEvent('project_created'); clearForm(); fetchProjects(session.user.id);
      } else alert('Hata: ' + error.message);
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id); setTitle(project.title); setClient(project.client);
    setBudget(project.budget.toString()); setExpenses(project.expenses.toString());
    setStatus(project.status); setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
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
    if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    await supabase.auth.signOut(); setProjects([]);
  };

  const clearForm = () => { setTitle(''); setClient(''); setBudget(''); setExpenses(''); setDeadline(''); setStatus('Aktif'); };

  const filteredProjects = projects.filter(p => filter === 'Tümü' ? true : p.status === filter);

  if (authLoading) {
    return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-gray-400 font-sans"><p className="text-sm">Oturum kontrol ediliyor...</p></div>;
  }

  if (!session || authMode === 'reset') {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">Freelancer Finansal Takip</h1>
            <p className="text-xs text-gray-400">
              {authMode === 'login' && 'Projelerinizi yönetmek için giriş yapın'}
              {authMode === 'register' && 'Yeni bir hesap oluşturun'}
              {authMode === 'forgot' && 'Şifrenizi sıfırlamak için e-posta adresinizi girin'}
              {authMode === 'reset' && 'Hesabınız için yeni bir şifre belirleyin'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-4">
            {authMode !== 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">E-Posta Adresi</label>
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" required />
              </div>
            )}
            {authMode !== 'forgot' && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">{authMode === 'reset' ? 'Yeni Şifre' : 'Şifre'}</label>
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" required />
              </div>
            )}
            {authMessage && <p className="text-xs text-center p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">{authMessage}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-lg">
              {authMode === 'login' && 'Giriş Yap'} {authMode === 'register' && 'Kayıt Ol'} {authMode === 'forgot' && 'Sıfırlama Linki Gönder'} {authMode === 'reset' && 'Yeni Şifreyi Kaydet'}
            </button>
          </form>

          <div className="flex flex-col gap-3 text-center pt-4 border-t border-gray-800">
            {authMode === 'login' && (
              <>
                <button type="button" onClick={() => { setAuthMode('forgot'); setAuthMessage(''); }} className="text-xs text-gray-400 hover:text-blue-400 transition-colors">Şifremi Unuttum</button>
                <button type="button" onClick={() => { setAuthMode('register'); setAuthMessage(''); }} className="text-xs text-blue-400 hover:underline">Hesabınız yok mu? Kayıt olun</button>
              </>
            )}
            {(authMode === 'register' || authMode === 'forgot') && (
              <button type="button" onClick={() => { setAuthMode('login'); setAuthMessage(''); }} className="text-xs text-blue-400 hover:underline">Geri dön ve giriş yap</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-xl">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Freelancer Finansal Takip</h1>
            <p className="text-xs text-gray-400">Aktif Kullanıcı: <span className="text-blue-400 font-mono">{session.user?.email}</span></p>
          </div>
          <button onClick={handleLogout} className="w-full sm:w-auto bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 text-xs font-semibold px-4 py-2 rounded-lg transition-colors">Güvenli Çıkış</button>
        </div>

        <AnalyticsDashboard projects={projects} isPro={false} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl h-fit">
            <h2 className="text-lg md:text-xl font-bold mb-1">{editingProjectId ? 'Proje Güncelle' : 'Yeni Proje Tanımla'}</h2>
            <form onSubmit={handleSaveProject} className="space-y-4 mt-6">
              <div><label className="block text-xs font-semibold text-gray-400 mb-1">Proje Adı *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              <div><label className="block text-xs font-semibold text-gray-400 mb-1">Müşteri / Şirket *</label><input type="text" value={client} onChange={(e) => setClient(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Proje Bütçesi (₺) *</label><input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Toplam Masraf (₺)</label><input type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Durum</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100">
                    <option value="Aktif">Aktif</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-gray-400 mb-1">Teslim Tarihi</label><input type="date" value={deadline} min={todayStr} onChange={(e) => setDeadline(e.target.value)} className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100" /></div>
              </div>
              <div className="flex gap-2 pt-2">
                {editingProjectId && <button type="button" onClick={() => { setEditingProjectId(null); clearForm(); }} className="w-1/3 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors">Vazgeç</button>}
                <button type="submit" className={`font-semibold text-sm py-2.5 rounded-lg transition-colors ${editingProjectId ? 'w-2/3 bg-green-600 hover:bg-green-700 text-white' : 'w-full bg-blue-600 hover:bg-blue-700 text-white'}`}>{editingProjectId ? 'Kaydet' : 'Projeyi Kaydet'}</button>
              </div>
            </form>
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl lg:col-span-2">
            {/* PDF İndirme Butonunun Eklendiği Başlık Bölümü */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold mb-1">Tüm Projeler</h2>
                <p className="text-xs text-gray-400">Yalnızca sizin tarafınızdan eklenen kayıtlar listelenir.</p>
              </div>
              
              {/* Şık ve İşlevsel PDF Rapor Butonu */}
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors shadow-md border border-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                PDF Raporu Al ({filter})
              </button>
            </div>

            <div className="flex bg-[#1F2937]/60 p-1 rounded-lg border border-gray-800 mb-6 max-w-xs">
              {(['Tümü', 'Aktif', 'Tamamlandı'] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => handleFilterChange(tab)} className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all ${filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>{tab}</button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Yükleniyor...</p>
            ) : filteredProjects.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center text-sm text-gray-500">Bu kategoride listelenecek proje bulunamadı.</div>
            ) : (
              <div className="overflow-x-auto w-full -mx-5 px-5 sm:mx-0 sm:px-0">
                <table className="w-full text-left border-collapse min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 tracking-wider">
                      <th className="pb-3">PROJE & MÜŞTERİ</th>
                      <th className="pb-3">FİNANSAL DURUM</th>
                      <th className="pb-3">DURUM (DEĞİŞTİR)</th>
                      <th className="pb-3">DEADLINE</th>
                      <th className="pb-3 text-right">İŞLEMLER</th>
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
                          <div className="font-semibold text-green-400 whitespace-nowrap">{Number(project.budget).toLocaleString('tr-TR')}₺ bütçe</div>
                          <div className="text-xs text-gray-500 whitespace-nowrap">-{Number(project.expenses).toLocaleString('tr-TR')}₺ masraf</div>
                        </td>
                        <td className="py-4 pr-2">
                          <button onClick={() => toggleProjectStatus(project.id, project.status)} className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${project.status === 'Tamamlandı' ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>{project.status}</button>
                        </td>
                        <td className="py-4 text-gray-400 text-xs font-mono whitespace-nowrap">{project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR') : '-'}</td>
                        <td className="py-4 text-right space-x-2 whitespace-nowrap">
                          <button onClick={() => handleEditClick(project)} className="text-xs bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 px-2.5 py-1 rounded transition-colors">Düzenle</button>
                          <button onClick={() => handleDeleteProject(project.id)} className="text-xs bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 px-2.5 py-1 rounded transition-colors">Sil</button>
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
