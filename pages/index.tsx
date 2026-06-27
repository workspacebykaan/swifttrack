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

  // Takvimde bugünden öncesinin seçilmesini engellemek için bugünün tarihini alıyoruz (YYYY-MM-DD formatında)
  const todayStr = new Date().toISOString().split('T')[0];

  // Projeleri Veritabanından Çekme (Hata Yakalama Zırhlı)
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('deadline', { ascending: true }); // Teslim tarihi en yakın olanı en yukarı taşır

      if (error) {
        console.error("Supabase veri çekerken hata fırlattı:", error);
      } else if (data) {
        setProjects(data as Project[]);
      }
    } catch (err) {
      console.error("Beklenmeyen bir hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Yeni Proje Kaydetme
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) return alert('Lütfen zorunlu alanları doldurun!');

    // Kod tarafında da ekstra güvenlik: Girilen tarih bugünden eskiyse engelle
    if (deadline && deadline < todayStr) {
      return alert('Geçmiş bir teslim tarihi (deadline) seçemezsiniz!');
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('projects').insert([
      {
        title,            
        name: title,      
        client,
        budget: Number(budget),
        expenses: Number(expenses) || 0,
        status,
        deadline: deadline || null,
        user_id: user?.id
      }
    ]);

    if (!error) {
      setTitle('');
      setClient('');
      setBudget('');
      setExpenses('');
      setDeadline('');
      fetchProjects();
    } else {
      alert('Proje eklenirken bir hata oluştu: ' + error.message);
    }
  };

  // Listeden Durum Güncelleme (Aktif <-> Tamamlandı)
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

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-6 font-sans">
      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* Dashboard Bileşeni */}
        <AnalyticsDashboard projects={projects} isPro={false} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Proje Tanımlama Formu */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl h-fit">
            <h2 className="text-xl font-bold mb-1">Yeni Proje Tanımla</h2>
            <p className="text-xs text-gray-400 mb-6">Sisteme yeni bir finansal hacim ekleyin</p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Proje Adı *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  placeholder="e.g. E-Ticaret Arayüz Yenileme"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Müşteri / Şirket *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    placeholder="30000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Toplam Masraf (₺)</label>
                  <input
                    type="number"
                    value={expenses}
                    onChange={(e) => setExpenses(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                    min={todayStr} // <-- BURASI: Bugünden önceki tarihlerin seçilmesini engeller!
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-[#1F2937] border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-lg mt-2 transition-colors"
              >
                Projeyi Kaydet
              </button>
            </form>
          </div>

          {/* Proje Listesi Kolonu */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-xl lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Tüm Projeler</h2>
                <p className="text-xs text-gray-400">Yalnızca sizin tarafınızdan eklenen kayıtlar listelenir.</p>
              </div>
              <span className="bg-[#1F2937] text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-700">
                Toplam Proje: {projects.length}
              </span>
            </div>

            {loading ? (
              <p className="text-sm text-gray-400 text-center py-8">Yükleniyor...</p>
            ) : projects.length === 0 ? (
              <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center text-sm text-gray-500">
                Henüz hiçbir proje eklemediniz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800 text-xs font-semibold text-gray-400 tracking-wider">
                      <th className="pb-3">PROJE & MÜŞTERİ</th>
                      <th className="pb-3">FİNANSAL DURUM</th>
                      <th className="pb-3">DURUM (DEĞİŞTİR)</th>
                      <th className="pb-3">DEADLINE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-sm">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-[#111827]/50 transition-colors">
                        <td className="py-4">
                          <div className="font-semibold text-gray-200">{project.title}</div>
                          <div className="text-xs text-gray-500">{project.client}</div>
                        </td>
                        <td className="py-4">
                          <div className="font-semibold text-green-400">{Number(project.budget).toLocaleString('tr-TR')}₺ bütçe</div>
                          <div className="text-xs text-gray-500">-{Number(project.expenses).toLocaleString('tr-TR')}₺ masraf</div>
                        </td>
                        <td className="py-4">
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
                        <td className="py-4 text-gray-400 text-xs font-mono">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString('tr-TR') : '-'}
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
