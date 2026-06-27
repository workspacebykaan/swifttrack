import React, { useState } from 'react';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); // Giriş mi yoksa Kayıt modu mu?
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Lütfen e-posta ve şifrenizi girin!');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading(isLoginMode ? 'Giriş yapılıyor...' : 'Hesap oluşturuluyor...');

    try {
      if (isLoginMode) {
        // --- GİRİŞ YAPMA İŞLEMİ ---
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success('Başarıyla giriş yapıldı! Yönlendiriliyorsunuz...', { id: toastId });
        router.push('/'); // Başarılıysa ana sayfaya (dashboard) yönlendir
        
      } else {
        // --- YENİ KAYIT OLMA İŞLEMİ ---
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        toast.success('Kayıt başarılı! Lütfen e-postanızı onaylayın (veya giriş yapın).', { id: toastId });
        setIsLoginMode(true); // Kayıt olunca giriş moduna geri at
      }
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-blue-500/30">
      <Head>
        <title>{isLoginMode ? 'Giriş Yap' : 'Kayıt Ol'} | SwiftTrack SaaS</title>
      </Head>

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 p-8 rounded-2xl backdrop-blur-md shadow-2xl">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isLoginMode ? 'Tekrar Hoş Geldiniz' : 'Yeni Hesap Oluşturun'}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Finansal özgürlüğünüz için {isLoginMode ? 'hesabınıza giriş yapın.' : 'ilk adımı atın.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">E-posta Adresi</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="ornek@sirket.com" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Şifre</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              placeholder="••••••••" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 mt-4"
          >
            {isLoginMode ? 'Giriş Yap' : 'Hesabımı Oluştur'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-500">
            {isLoginMode ? 'Henüz hesabınız yok mu? ' : 'Zaten bir hesabınız var mı? '}
          </span>
          <button 
            onClick={() => setIsLoginMode(!isLoginMode)} 
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isLoginMode ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
          </button>
        </div>

      </div>
    </div>
  );
}
