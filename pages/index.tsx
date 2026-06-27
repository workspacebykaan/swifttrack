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

export default function Home() {
  // Oturum durumunu takip eden state
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Proje Listesi ve Yüklenme State'leri
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Giriş/Kayıt Formu State'leri
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  // Proje Form State Yapısı
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [deadline, setDeadline] = useState('');

  // Düzenleme Modu State'leri
  const [editingProjectIdId, setEditingProjectId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'Tümü' | 'Aktif' | 'Tamamlandı'>('Tümü');

  const todayStr = new Date().toISOString().split('T')[0];

  // Kullanıcının oturum açıp açmadığını kontrol et
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // KRİTİK DÜZELTME: Sadece giriş yapan kullanıcının kendi projelerini çekmesini sağlıyoruz
  const fetchProjects = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId) // <-- İŞTE BURASI! Sadece bu kullanıcının ID'sine eşit olanları getir.
        .order('deadline', { ascending: true });

      if (error) {
        console.error("Supabase veri çekerken hata:", error);
      } else if (data) {
        setProjects(data as Project[]);
      }
    } catch (err) {
      console.error("Beklenmeyen hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchProjects(session.user.id);
    } else {
      setProjects([]);
    }
  }, [session]);

  // Giriş Yapma / Kayıt Olma İşlemi
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage('');
    if (!authEmail || !authPassword) return alert('Lütfen tüm alanları doldurun!');

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthMessage('Hata: ' + error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
      });
      if (error) {
        setAuthMessage('Hata: ' + error.message);
      } else {
        setAuthMessage('Kayıt başarılı! Giriş yapabilirsiniz.');
      }
    }
  };

  // Proje Oluşturma VEYA Güncelleme
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) return alert('Lütfen zorunlu alanları doldurun!');
    if (deadline && deadline < todayStr) return alert('Geçmiş bir teslim tarihi seçemezsiniz!');

    const projectData = {
      title,            
      name: title,      
      client,
      budget: Number(budget),
      expenses: Number(expenses) || 0,
      status,
      deadline: deadline || null,
      user_id: session?.user?.id // Projeyi ekleyen kişinin ID'sini kaydediyoruz
    };

    if (editingProjectIdId) {
      const { error } = await supabase.from('projects').update(projectData).eq('id', editingProjectIdId);
      if (!error) {
        setEditingProjectId(null);
        clearForm();
        fetchProjects(session.user.id);
      } else {
        alert('Hata: ' + error.message);
      }
    } else {
      const { error } = await supabase.from('projects').insert([projectData]);
      if (!error) {
        clearForm();
        fetchProjects(session.user.id);
      } else {
        alert('Hata: ' + error.message);
      }
    }
  };

  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setClient(project.client);
    setBudget(project.budget.toString());
    setExpenses(project.expenses.toString());
    setStatus(project.status);
    setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
      if (editingProjectIdId === projectId) {
        setEditingProjectId(null);
        clearForm();
      }
    }
  };

  const toggleProjectStatus = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Tamamlandı' : 'Aktif';
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    }
  };

  const handleLogout = async () => {
    if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    await supabase.auth.signOut();
    setProjects([]);
  };

  const clearForm = () => {
    setTitle(''); setClient(''); setBudget(''); setExpenses(''); setDeadline(''); setStatus('Aktif');
  };

  const filteredProjects = projects.filter(p => filter === 'Tümü' ? true : p.status === filter);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-gray-400 font-sans">
        <p className="text-sm">Oturum kontrol ediliyor...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 md:p-8 shadow-2xl w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
              Freelancer Finansal Takip
            </h1>
            <p className="text-xs text-gray-400">Projelerinizi yönetmek için giriş yapın veya hesap oluşturun</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">E-Posta Adresi</label>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                placeholder="ornek@domain.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Şifre</label>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                placeholder="••••••••"
                required
              />
            </div>

            {authMessage && (
              <p className="text-xs text-center p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                {authMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors shadow-lg"
            >
              {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-gray-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthMessage('');
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              {authMode === 'login' ? 'Hesabınız yok mu? Yeni hesap oluşturun' : 'Zaten hesabınız var mı? Giriş yapın'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Üst Navbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-xl">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Freelancer Finansal Takip
            </h1>
            <p className="text-xs text-gray-400">Aktif Kullanıcı: <span className="text-blue-400 font-mono">{session.user?.email}</span></p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 text-xs font-semibold px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Güvenli Çıkış
          </button>
        </div>

        {/* Dashboard */}
        <AnalyticsDashboard projects={projects} isPro={false} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Proje Formu */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl h-fit">
            <h2 className="text-lg md:text-xl font-bold mb-1">
              {editingProjectIdId ? 'Proje Bilgilerini Güncelle' : 'Yeni Proje Tanımla'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {editingProjectIdId ? 'Mevcut projenin verilerini revize ediyorsunuz' : 'Sisteme yeni bir finansal hacim ekleyin'}
            </p>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Proje Adı *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                  placeholder="e.g. E-Ticaret Arayüz Yenileme"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Müşteri / Şirket *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Proje Bütçesi (₺) *</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Toplam Masraf (₺)</label>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Durum</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Teslim Tarihi</label>
                  <input
                    type="date"
                    value={deadline}
                    min={todayStr}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-gray-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingProjectIdId && (
                  <button
                    type="button"
                    onClick={() => { setEditingProjectId(null); clearForm(); }}
                    className="w-1/3 bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
                  >
                    Vazgeç
                  </button>
                )}
                <button
                  type="submit"
                  className={`font-semibold text-sm py-2.5 rounded-lg transition-colors ${
                    editingProjectIdId ? 'w-2/3 bg-green-600 hover:bg-green-700 text-white' : 'w-full bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editingProjectIdId ? 'Değişiklikleri Kaydet' : 'Projeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>

          {/* Proje Tablosu */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg md:text-xl font-bold mb-1">Tüm Projeler</h2>
                <p className="text-xs text-gray-400">Yalnızca sizin tarafınızdan eklenen kayıtlar listelenir.</p>
              </div>
              <span className="bg-[#1F2937] text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-700 self-start sm:self-center">
                Gösterilen: {filteredProjects.length} / {projects.length}
              </span>
            </div>

            {/* Filtreleme Butonları */}
            <div className="flex bg-[#1F2937]/60 p-1 rounded-lg border border-gray-800 mb-6 max-w-xs">
              {(['Tümü', 'Aktif', 'Tamamlandı'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Yükleniyor...</p>
            ) : filteredProjects.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center text-sm text-gray-500">
                Bu kategoride listelenecek proje bulunamadı.
              </div>
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
                          <button
                            onClick={() => toggleProjectStatus(project.id, project.status)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                              project.status === 'Tamamlandı'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'
                            }`}
                          >
                            {project.status}
                          </button>
                        </td>
                        <td className="py-4 text-gray-400 text-xs font-mono whitespace-nowrap">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR') : '-'}
                        </td>
                        <td className="py-4 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEditClick(project)}
                            className="text-xs bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 px-2.5 py-1 rounded transition-colors"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="text-xs bg-red-600/10 text-red-400 border border-red-500/20 hover:bg-red-600/20 px-2.5 py-1 rounded transition-colors"
                          >
                            Sil
                          </button>
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
