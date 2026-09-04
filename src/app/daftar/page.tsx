'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from 'next/image';
import ModalAlert from "../component/ModalAlert";
import React from "react";
import { authClient } from "@/lib/auth-client";
import { registerSchema } from "@/lib/validations/auth";

interface FormData {
    username: string;
    password: string;
    email: string;
    name: string;
}

export default function Daftar() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        username: '',
        password: '',
        email: '',
        name: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const onChecked = () => {
        setIsChecked(!isChecked);
    };

    const handleConfirmModal = () => {
        setIsModalOpen(false);
        router.push('/login');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!isChecked) {
            setError('Silakan setujui syarat dan ketentuan pendaftaran');
            return;
        }

        const validationResult = registerSchema.safeParse(formData);
        if (!validationResult.success) {
            setError(validationResult.error.errors[0]?.message || 'Data registrasi tidak valid');
            return;
        }

        setIsLoading(true);

        try {
            const res = await authClient.signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            if (res.error) {
                setError(res.error.message || 'Registrasi gagal. Email mungkin sudah terdaftar.');
            } else {
                setIsModalOpen(true);
            }
        } catch (err: any) {
            console.error('Error registering user:', err);
            setError(err.message || 'Terjadi kesalahan sistem');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-4 text-sm">
            <Image
                src="/ui/logo2.svg"
                alt="logo"
                className='pointer-events-none select-none'
                width={200}
                height={70}
                priority
            />

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

            <form className="flex flex-col flex-none w-1/4 p-6 rounded-md gap-4" onSubmit={handleSubmit}>
                <input
                    className="border rounded-md text-sm p-2 w-full text-black"
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
                <input
                    className="border rounded-md text-sm p-2 w-full text-black"
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                />
                <input
                    className="border rounded-md text-sm p-2 w-full text-black"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                <input
                    className="border rounded-md text-sm p-2 w-full text-black"
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 rounded"
                        checked={isChecked}
                        onChange={onChecked}
                    />
                    <span className="text-white text-xs">
                        Saya menyetujui pendaftaran akun baru
                    </span>
                </label>

                <div className="flex md:flex-row flex-col gap-4 justify-center items-center mt-2">
                    <Link href="/login" className="flex-1 w-full">
                        <button
                            type="button"
                            className="w-full bg-transparent border-2 border-white text-white font-bold py-2 px-4 rounded-lg hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300"
                        >
                            KEMBALI
                        </button>
                    </Link>
                    <button
                        type="submit"
                        disabled={!isChecked || isLoading}
                        className={`flex-1 w-full bg-transparent border-2 font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
                            isChecked && !isLoading
                                ? 'border-white text-white hover:bg-blue-500 hover:text-white hover:border-blue-500'
                                : 'border-gray-400 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {isLoading ? 'MEMUAT...' : 'DAFTAR'}
                    </button>
                </div>

                <ModalAlert
                    isOpen={isModalOpen}
                    onConfirm={handleConfirmModal}
                    title="Sukses"
                    imageSrc="/ui/success_img.svg"
                >
                    <p>Sukses Mendaftar!</p>
                    <p>Silahkan Melakukan Login!</p>
                </ModalAlert>
            </form>
        </div>
    );
}