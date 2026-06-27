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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State Yapısı
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [status, setStatus] = useState('Aktif');
  const [deadline, setDeadline] = useState('');

  // Düzenleme Modu State'leri
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // 1. YENİ ÖZELLİK: Filtreleme Sekmesi State'i (Tümü / Aktif / Tamamlandı)
  const [filter, setFilter] = useState<'Tümü' | 'Aktif' | 'Tamamlandı'>('Tümü');

  // Takvim kısıtlaması için bugünün tarihi
  const todayStr = new Date().toISOString().split('T')[0];

  // Projeleri Veritabanından Çekme
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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
    fetchProjects();
  }, []);

  // Proje Oluşturma VEYA Güncelleme Fonksiyonu
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) return alert('Lütfen zorunlu alanları doldurun!');

    // Geçmiş tarih kontrolü
    if (deadline && deadline < todayStr) {
      return alert('Geçmiş bir teslim tarihi (deadline) seçemezsiniz!');
    }

    const { data: { user } } = await supabase.auth.getUser();

    const projectData = {
      title,            
      name: title,      
      client,
      budget: Number(budget),
      expenses: Number(expenses) || 0,
      status,
      deadline: deadline || null,
      user_id: user?.id
    };

    if (editingProjectId) {
      // DÜZENLEME MODU: Mevcut projeyi güncelle
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProjectId);

      if (!error) {
        setEditingProjectId(null);
        clearForm();
        fetchProjects();
      } else {
        alert('Proje güncellenirken hata oluştu: ' + error.message);
      }
    } else {
      // YENİ EKLEME MODU: Sıfırdan ekle
      const { error } = await supabase.from('projects').insert([projectData]);

      if (!error) {
        clearForm();
        fetchProjects();
      } else {
        alert('Proje eklenirken hata oluştu: ' + error.message);
      }
    }
  };

  // Düzenleme Butonuna Basıldığında Formu Dolduran Fonksiyon
  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setClient(project.client);
    setBudget(project.budget.toString());
    setExpenses(project.expenses.toString());
    setStatus(project.status);
    setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
    
    // Sayfayı yukarı kaydır ki kullanıcı formu rahat görsün
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Proje Silme Fonksiyonu
  const handleDeleteProject = async (projectId: string) => {
    const confirmDelete = confirm('Bu projeyi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.filter(p => p.id !== projectId));
      if (editingProjectId === projectId) {
        setEditingProjectId(null);
        clearForm();
      }
    } else {
      alert('Proje silinirken bir hata oluştu.');
    }
  };

  // Listeden Hızlı Durum Güncelleme (Aktif <-> Tamamlandı)
  const toggleProjectStatus = async (projectId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Tamamlandı' : 'Aktif';

    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (!error) {
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    } else {
      alert('Durum güncellenirken bir hata oluştu.');
    }
  };

  // 2. YENİ ÖZELLİK: Güvenli Çıkış Yapma Fonksiyonu
  const handleLogout = async () => {
    const confirmLogout = confirm('Oturumu kapatmak istediğinize emin misiniz?');
    if (!confirmLogout) return;
    await supabase.auth.signOut();
    window.location.reload(); // Supabase auth durum dinleyicisi sayfayı login ekranına düşürür
  };

  // Formu Temizleme Yardımcısı
  const clearForm = () => {
    setTitle('');
    setClient('');
    setBudget('');
    setExpenses('');
    setDeadline('');
    setStatus('Aktif');
  };

  // Filtreleme mantığını uygulayan liste
  const filteredProjects = projects.filter(project => {
    if (filter === 'Tümü') return true;
    return project.status === filter;
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        
        {/* Üst Bar / Navbar: Uygulama Başlığı ve Çıkış Butonu */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-gray-800 rounded-xl p-4 shadow-xl">
          <div>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Freelancer Finansal Takip
            </h1>
            <p className="text-xs text-gray-400">Proje bütçelerinizi ve teslim tarihlerini tek ekrandan yönetin</p>
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

        {/* Dashboard Bileşeni */}
        <AnalyticsDashboard projects={projects} isPro={false} />

        {/* 3. YENİ ÖZELLİK: Mobil uyumlu duyarlı grid yapısı */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* Proje Tanımlama / Düzenleme Formu */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-5 md:p-6 shadow-xl h-fit">
            <h2 className="text-lg md:text-xl font-bold mb-1">
              {editingProjectId ? 'Proje Bilgilerini Güncelle' : 'Yeni Proje Tanımla'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {editingProjectId ? 'Mevcut projenin verilerini revize ediyorsunuz' : 'Sisteme yeni bir finansal hacim ekleyin'}
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
                <label className="block text-xs font-semibold text-gray-400 mb-1">Müşteri / Şiriket *</label>
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
                {editingProjectId && (
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
                    editingProjectId ? 'w-2/3 bg-green-600 hover:bg-green-700 text-white' : 'w-full bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {editingProjectId ? 'Değişiklikleri Kaydet' : 'Projeyi Kaydet'}
                </button>
              </div>
            </form>
          </div>

          {/* Proje Listesi Kolonu */}
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

            {/* Filtreleme Sekmeleri Buton Grubu */}
            <div className="flex bg-[#1F2937]/60 p-1 rounded-lg border border-gray-800 mb-6 max-w-xs">
              {(['Tümü', 'Aktif', 'Tamamlandı'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`flex-1 text-center py-1.5 text-xs font-medium rounded-md transition-all ${
                    filter === tab
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
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
              /* Mobil Uyumlu: Taşmaları Önleyen Yatay Kaydırılabilir Tablo Alanı */
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
                            title="Durumu değiştirmek için tıklayın"
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
                          {/* Düzenleme Butonu */}
                          <button
                            onClick={() => handleEditClick(project)}
                            className="text-xs bg-yellow-600/10 text-yellow-400 border border-yellow-500/20 hover:bg-yellow-500/20 px-2.5 py-1 rounded transition-colors"
                          >
                            Düzenle
                          </button>
                          {/* Silme Butonu */}
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
