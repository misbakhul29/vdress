'use client'

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ModalAlert from '@/app/component/ModalAlert';
import Image from 'next/image';
import PWAInstallPrompt from '../component/PWAInstallPompt';
import { authClient } from '@/lib/auth-client';
import { loginSchema } from '@/lib/validations/auth';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const { data: session, isPending: sessionPending } = authClient.useSession();

  useEffect(() => {
    // Jika session aktif ditemukan, redirect ke /main
    if (session?.user) {
      localStorage.setItem('uid', session.user.id);
      router.push('/main');
    }

    if (
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsInstalled(true);
    } else {
      setIsInstalled(false);
    }
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation with Zod
    const validationResult = loginSchema.safeParse(formData);
    if (!validationResult.success) {
      setError(validationResult.error.errors[0]?.message || 'Input tidak valid');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
      });

      if (res.error) {
        setError(res.error.message || 'Login gagal. Periksa kembali email dan password Anda.');
      } else if (res.data) {
        // Simpan uid untuk kompatibilitas fitur downstream
        if (res.data.user?.id) {
          localStorage.setItem('uid', res.data.user.id);
        }
        router.push('/main');
      }
    } catch (err) {
      console.error('Error during sign-in:', err);
      setError('Terjadi kesalahan koneksi atau server.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInstalled) {
    return <PWAInstallPrompt />;
  }

  return (
    <div className='relative flex flex-none w-1/3 flex-col items-center justify-center gap-2'>
      <Image
        src="/ui/logo2.svg"
        alt="logo"
        className='pointer-events-none select-none'
        width={200}
        height={70}
        priority
      />

      {/* Modal Alert */}
      {error && (
        <ModalAlert
          isOpen={!!error}
          onConfirm={() => setError(null)}
          title="Error"
          imageSrc="/ui/galat_img.svg"
        >
          <p>{error}</p>
        </ModalAlert>
      )}

      <form onSubmit={handleSubmit} className='flex flex-col flex-none w-1/2 items-center justify-center gap-4'>
        {/* Email Input */}
        <input
          type="email"
          placeholder="Email"
          name="email"
          className='flex flex-1 w-full rounded-md p-2 text-black text-sm lg:text-md'
          value={formData.email}
          onChange={handleChange}
          required
          autoComplete="email"
        />

        {/* Password Input */}
        <input
          type="password"
          placeholder="Password"
          name="password"
          className='flex flex-1 w-full rounded-md p-2 text-black text-sm lg:text-md'
          value={formData.password}
          onChange={handleChange}
          required
          autoComplete="current-password"
        />

        {/* Buttons */}
        <div className='flex flex-1 gap-2 w-full justify-center items-center'>
          <Link href="/daftar" className="flex-1">
            <p className="flex-1 text-center bg-transparent border-2 border-white text-white font-bold p-2 rounded-lg hover:bg-white hover:text-green-500 transition-all duration-300">
              DAFTAR
            </p>
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-transparent border-2 border-white text-white font-bold p-2 rounded-lg hover:bg-white hover:text-blue-500 transition-all duration-300 disabled:opacity-50">
            {isLoading ? 'MEMUAT...' : 'MASUK'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <p className='text-xs text-white font-sans pt-4'>Hazart Studio @2024</p>
    </div>
  );
};

export default Login;