'use client'
import { useState, useEffect, useCallback } from 'react';
import Modal from '@/app/component/modal';
import Image from 'next/image';
import { FormEvent } from 'react';
import { encryptData } from '@/lib/crypto';
import ErrorAlert from '@/app/component/ErrorAlert';
import React from 'react';
import { User_resources } from '@/app/interface';
import { useRefresh } from "@/app/component/RefreshContext"; // Import context
import Loading from '@/app/component/Loading';
import { UUID } from 'crypto';


interface FormData {
  essence: number;
  selectedEssence: string;
}

export default function GemsExchange() {
  const [essence, setEssence] = useState(0);
  const [selectedEssence, setSelectedEssence] = useState<
    "shimmering_essence" | "glimmering_essence" | string
  >('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userResources, setUserResources] = useState<User_resources | null>(null);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const { refresh } = useRefresh();

  const uid: any = localStorage.getItem('uid');

  const handleExchange = (essenceType: "shimmering_essence" | "glimmering_essence") => {
    setSelectedEssence(essenceType);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEssence(0);
    setError(null);
    setExchangeSuccess(false); // Reset exchange success state
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData: FormData = { essence, selectedEssence };

    try {
      await fetchApi('exchangeManyGems', formData);
      closeModal();
      setExchangeSuccess(true);
      getData(uid);
      refresh();
    } catch (error: any) {
      console.error('Error during exchange:', error);
      setError(error.message);
    }
  };

  const fetchApi = async (typeFetch: string, dataFetch?: any) => {
    try {
      if (!uid) throw new Error("User ID not found");

      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          encryptedData: encryptData({
            uid,
            typeFetch: typeFetch,
            ...(dataFetch || {})
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      const responseData = await response.json();

      return responseData;
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
    }
  };

  const getData = async (uid: UUID) => {
    try {
      const response = await fetch('/api/user_resources', { // Your API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      const data = await response.json();

      console.log(data.data)
      setUserResources(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setUserResources(null);
    }
  };

  useEffect(() => {
    getData(uid.toString());
  }, []);

  return (
    <div className="flex flex-1 gap-4 px-16 justify-center">
      {/* Shimmering Essence */}
      {userResources ? (
        <button
          aria-label="button"
          className="flex flex-col flex-none h-40 w-36 rounded-lg overflow-hidden"
          onClick={() => handleExchange("shimmering_essence")}
        >
          <div className="flex flex-1 w-full justify-center items-center bg-white p-4">
            <Image
              src={"/icons/currency/shimmering_essence.png"}
              alt={"shimmering_essence"}
              width={72}
              height={72}
            />
          </div>
          <div className="flex flex-none h-1/6 w-full gap-1 justify-center items-center bg-amber-500 p-4">
            <Image
              src={"/icons/currency/glamour_gems.png"}
              alt={"glamour_gems"}
              width={28}
              height={28}
            />
            {/* Menampilkan nilai glamour_gems jika userResources tersedia */}
            <p>160</p>
          </div>
        </button>
      ) : (
        <Loading />
      )}

      {/* Glimmering Essence */}
      {userResources && (
        <button
          aria-label="button"
          className="flex flex-col flex-none h-40 w-36 rounded-lg overflow-hidden"
          onClick={() => handleExchange("glimmering_essence")}
        >
          <div className="flex flex-1 w-full justify-center items-center bg-white p-4">
            <Image
              src={"/icons/currency/glimmering_essence.png"}
              alt={"glimmering_essence"}
              width={72}
              height={72}
            />
          </div>
          <div className="flex flex-none h-1/6 w-full gap-1 justify-center items-center bg-amber-500 p-4">
            <Image
              src={"/icons/currency/glamour_gems.png"}
              alt={"glamour_gems"}
              width={28}
              height={28}
            />
            {/* Menampilkan nilai glamour_gems jika userResources tersedia */}
            <p>160</p>
          </div>
        </button>
      )}

      <Modal isOpen={showModal} onClose={closeModal}>
        {/* Modal Content */}
        {userResources && (
          <form onSubmit={handleSubmit} className="relative overflow-hidden flex flex-col flex-none w-1/2 text-black bg-white rounded-md p-6 items-center justify-end gap-4">
            <div className="flex flex-none flex-col w-2/3 rounded-md bg-white overflow-hidden items-center gap-2">
              <button
                aria-label="button"
                type="button"
                onClick={closeModal}
                className="absolute -top-4 -right-4 font-bold py-5 px-6 rounded-full transition-all duration-300"
              >
                X
              </button>

              <input
                type="number"
                min="0"
                max={userResources.glamour_gems ? Math.floor(userResources.glamour_gems / 160) : 0}
                id="essence"
                name="essence"
                className="flex flex-1 w-full border-gray-300 bg-gray-200 rounded-md p-2 text-black text-md lg:text-lg"
                value={essence}
                onChange={(e) => {
                  const parsedValue = parseInt(e.target.value, 10);
                  setEssence(isNaN(parsedValue) ? 0 : parsedValue);
                }}
                required
              />

              <input
                type="range"
                min="0"
                max={userResources.glamour_gems ? Math.floor(userResources.glamour_gems / 160) : 0}
                id="essence-range"
                name="essence-range"
                className="flex flex-1 w-full"
                value={essence}
                onChange={(e) => {
                  const parsedValue = parseInt(e.target.value, 10);
                  setEssence(isNaN(parsedValue) ? 0 : parsedValue);
                }}
              />

              {error && <ErrorAlert message={error} />}

              <button
                aria-label="button"
                type="submit"
                className="flex-1 w-full bg-transparent border-2 border-blue-600 text-black text-md font-bold mt-4 py-2 px-1 rounded-lg hover:bg-blue-500 hover:text-white transition-all duration-300"
                disabled={(!essence || essence === 0 || error) ? true : undefined}
              >
                Exchange
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Pemberitahuan (Berhasil/Gagal) */}
      {error && ( // Tampilkan modal error jika ada error
        <Modal isOpen={!!error} onClose={() => setError(null)}>
          <div className="flex flex-col justify-center items-center p-6 bg-white rounded-md">
            <h2 className="text-lg font-bold text-red-500 mb-4">Gagal!</h2>
            <p className="text-center">{error}</p>
            <button aria-label="button" onClick={() => setError(null)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md">Tutup</button>
          </div>
        </Modal>
      )}

      {exchangeSuccess && ( // Tampilkan modal sukses jika exchange berhasil
        <Modal isOpen={exchangeSuccess} onClose={() => setExchangeSuccess(false)}>
          <div className="flex flex-col justify-center items-center p-6 bg-white rounded-md">
            <h2 className="text-lg font-bold text-green-500 mb-4">Berhasil!</h2>
            <p className="text-center">Pertukaran Essence Berhasil.</p>
            <button aria-label="button" onClick={() => setExchangeSuccess(false)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md">Tutup</button>
          </div>
        </Modal>
      )}
    </div>
  );
}