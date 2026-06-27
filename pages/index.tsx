import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const AnalyticsDashboard = dynamic(
  () => import('../components/AnalyticsDashboard'),
  { 
    ssr: false, 
    loading: () => <div className="animate-pulse h-96 bg-slate-900/50 rounded-2xl border border-slate-800 w-full flex items-center justify-center text-slate-500">Grafikler Yükleniyor...</div> 
  }
);

interface Project {
  id?: string;
  title: string;
  client: string;
  budget: number;
  expenses: number;
  status: 'Aktif' | 'Tamamlandı' | 'Gecikti';
  deadline: string;
  user_id?: string;
}

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [budget, setBudget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [status, setStatus] = useState<'Aktif' | 'Tamamlandı' | 'Gecikti'>('Aktif');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
      if (user) fetchProjects(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProjects(session.user.id);
      } else {
        setProjects([]);
        setIsPro(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjects = async (userId: string) => {
    setLoading(true);
    try {
      const { data: projData, error: projError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projError) throw projError;
      setProjects(projData || []);
    } catch (error: any) {
      console.error('Veri çekme hatası:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !client || !budget) {
      toast.error('Lütfen zorunlu alanları (Başlık, Müşteri, Bütçe) doldurun!');
      return;
    }

    if (!user) {
      toast.error('Proje eklemek için giriş yapmalısınız!');
      return;
    }

    const toastId = toast.loading('Proje kaydediliyor...');

    const newProject: Project = {
      title,
      client,
      budget: Number(budget),
      expenses: Number(expenses) || 0,
      status,
      deadline,
      user_id: user.id
    };

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([newProject])
        .select();

      if (error) throw error;

      if (data) {
        setProjects([data[0], ...projects]);
        toast.success('Proje başarıyla eklendi! 🚀', { id: toastId });
        setTitle(''); setClient(''); setBudget(''); setExpenses(''); setDeadline('');
      }
    } catch (error: any) {
      toast.error(`Hata: ${error.message}`, { id: toastId });
    }
  };

  const handleSignOut = async () => {
    const toastId = toast.loading('Oturum kapatılıyor...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Başarıyla çıkış yapıldı!', { id: toastId });
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse font-medium">Güvenli bölge kontrol ediliyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 selection:bg-blue-500/30">
        <div className="w-full max-w-4xl bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 flex justify-between items-center mb-12 backdrop-blur-md">
          <div>
            <h1 className="text-xl font-black text-blue-500 tracking-tight">SwiftTrack</h1>
            <p className="text-xs text-slate-400">Freelancer Gelir, Gider ve Proje Yönetimi</p>
          </div>
          <Link href="/auth" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/25">
            Giriş Yap / Kayıt Ol
          </Link>
        </div>

        <div className="w-full max-w-2xl bg-slate-900/60 border border-slate-800 p-12 rounded-3xl text-center shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-6 right-6 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-full">
            🚀 Açık Beta (Ücretsiz)
          </div>
          
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-xl font-bold shadow-inner mt-4">
            ₺
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-4">Finansal Durumunu Kontrol Altına Al</h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-8">
            Projelerinin bütçelerini, maliyetlerini ve yaklaşan teslim tarihlerini güvenle takip et. Şu an Erken Erişimde ve tamamen ücretsiz!
          </p>
          <Link href="/auth" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 transform hover:-translate-y-0.5">
            Ücretsiz Hesabını Oluştur
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-blue-500/30">
      
      <header className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/40 border border-slate-800/80 backdrop-blur-md rounded-2xl p-6 mb-8 gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Yönetim Paneli</span>
            <span className="ml-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              AÇIK BETA
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Finansal Portföyüm</h1>
          <p className="text-xs text-slate-400 mt-0.5">Aktif oturum: <span className="text-blue-400 font-medium">{user.email}</span></p>
        </div>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-900 text-slate-300 hover:text-red-400 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          Çıkış Yap
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        <AnalyticsDashboard projects={projects} isPro={isPro} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          <section className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm shadow-xl h-fit relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-1">Yeni Proje Tanımla</h3>
            <p className="text-xs text-slate-400 mb-6">Sisteme yeni bir finansal hacim ekleyin</p>
            
            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Proje Adı *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. E-Ticaret Arayüz Yenileme" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Müşteri / Şirket *</label>
                <input type="text" value={client} onChange={e => setClient(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="e.g. Acme Corp" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Proje Bütçesi (₺) *</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="30000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Toplam Masraf (₺)</label>
                  <input type="number" value={expenses} onChange={e => setExpenses(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" placeholder="5000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Durum</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none">
                    <option value="Aktif">Aktif</option>
                    <option value="Tamamlandı">Tamamlandı</option>
                    <option value="Gecikti">Gecikti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Teslim Tarihi</label>
                  <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-2">
                Projeyi Kaydet
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm shadow-xl flex flex-col">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-bold text-white">Tüm Projeler</h3>
                <p className="text-xs text-slate-400">Yalnızca sizin tarafınızdan eklenen kayıtlar listelenir.</p>
              </div>
              <div className="text-xs font-semibold px-3 py-1.5 bg-slate-800/50 rounded-lg text-slate-300 border border-slate-700">
                Toplam Proje: <span className="text-blue-400">{projects.length}</span>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 animate-pulse text-sm">Projeleriniz güvenli veritabanından çekiliyor...</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-medium">Henüz hiçbir proje eklemediniz.</span>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="text-xs uppercase text-slate-400 bg-slate-950/40 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Proje & Müşteri</th>
                      <th className="px-4 py-3">Finansal Durum</th>
                      <th className="px-4 py-3">Durum</th>
                      <th className="px-4 py-3">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-slate-900/20 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-semibold text-white">{proj.title}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{proj.client}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-emerald-400 font-medium">{proj.budget.toLocaleString('tr-TR')}₺ bütçe</div>
                          <div className="text-xs text-slate-500 mt-0.5">-{proj.expenses.toLocaleString('tr-TR')}₺ masraf</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            proj.status === 'Tamamlandı' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            proj.status === 'Gecikti' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs font-mono text-slate-400">
                          {proj.deadline ? new Date(proj.deadline).toLocaleDateString('tr-TR') : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
