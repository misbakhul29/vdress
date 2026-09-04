'use client'
import { useState, useEffect } from 'react';
import Modal from '@/app/component/modal';
import Image from 'next/image';
import { FormEvent } from 'react';
import { encryptData, decryptData } from '@/lib/crypto';
import ErrorAlert from '@/app/component/ErrorAlert';
import React from 'react';
import { DustItems, User_resources } from '@/app/interface';
import { useRefresh } from "@/app/component/RefreshContext";
import Loading from '@/app/component/Loading';
import { UUID } from 'crypto';

export default function GlamourDustExchange() {
  const [dustItems, setDustItems] = useState<DustItems[] | null>([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<DustItems | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [exchangeSuccess, setExchangeSuccess] = useState(false);
  const { refresh } = useRefresh();
  const [inventoryItemNames, setInventoryItemNames] = useState<string[]>([]);
  const [userData, setUserData] = useState<User_resources | null>(null);

  const uid: any = localStorage.getItem('uid');

  const handleSelectItem = (item: DustItems) => {
    setSelectedItem(item);
    setQuantity(1); // Reset quantity when selecting a new item
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setQuantity(1);
    setError(null);
    setExchangeSuccess(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedItem) return;

    try {
      // Attempt to purchase the dust item
      await fetchApi('buyDustItem', { itemId: selectedItem.id, quantity });

      // Fetch updated dust items after purchase
      const response = await fetchApi('getDustItems');

      // Decrypt the fetched data
      const decryptedData = decryptData(response.encryptedData);

      // Close the modal and show success message
      setShowModal(false);
      setExchangeSuccess(true);

      // Refresh the UI data
      refresh();

      // Update the dust items in state
      setDustItems((prevDustItems) => {
        if (!prevDustItems) return [];

        if (!Array.isArray(decryptedData.dustItems)) {
          console.error("Invalid dustItems format:", decryptedData.dustItems);
          return prevDustItems;
        }

        // Update only matching items
        return prevDustItems.map((dustItems) => {
          const updatedItem = decryptedData.dustItems.find(
            (newItem: { id: number; }) => newItem.id === dustItems.id
          );
          return updatedItem ? { ...dustItems, ...updatedItem } : dustItems;
        });
      });
    } catch (error: any) {
      // Log and handle error
      console.error('Error during purchase:', error);

      // Set a user-friendly error message
      setError(
        error?.message || 'An unexpected error occurred during the purchase process.'
      );
    }
  };

  const fetchApi = async (typeFetch: string, dataFetch?: any) => {
    try {
      if (!uid) throw new Error("User ID not found");

      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          encryptedData: encryptData({
            uid, typeFetch, ...dataFetch
          }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message);
      return { error: error.message }; // Important: Return an error object
    }
  };

  const fetchDustItems = async () => {
    try {
      const response = await fetchApi('getDustItems');

      if (!response) {
        setError("No response received from the server.");
        return;
      }

      if (response.message && response.message !== 'Successful') { // Check for server-side error messages
        setError(response.message);
        return;
      }

      if (response.encryptedData) {
        try {
          const decryptedData = decryptData(response.encryptedData);
          setDustItems(decryptedData.dustItems);
          console.log('Dust items set:', decryptedData.dustItems); // Log data yang sudah didekripsi
        } catch (decryptionError) {
          console.error("Error decrypting dust items:", decryptionError);
          setError("Error decrypting data. Please try again later.");
        }
      } else {
        console.error("No encrypted data received.");
        setError("Invalid data received from the server.");
      }
    } catch (error) {
      console.error("Error fetching dust items:", error);
      setError("An error occurred while fetching dust items.");
    }
  };

  const fetchInventoryItems = async () => {
    try {
      if (!uid) {
        console.error("User ID not found in storage");
        return;
      }

      const encryptedData = encryptData({ uid }); // Encrypt the data

      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData }), // Send encrypted data in the body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Network response was not ok");
      }

      const data = await response.json();
      // Decrypt data if needed (see server-side changes)
      const decryptedData = decryptData(data.encryptedData);
      const itemNames = decryptedData?.inventory?.map((item: { item_name: any; }) => item.item_name) || [];

      setInventoryItemNames(itemNames);
    } catch (error: any) {
      console.error('Error fetching inventory:', error.message);
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
      setUserData(data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      setUserData(null);
    }
  };

  useEffect(() => {
    getData(uid.toString());
    fetchDustItems();
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    const handleMonthlyRestock = async () => {
      const today = new Date();
      if (today.getDate() === 1) { // Check if it's the 1st of the month
        try {
          const response = await fetchApi('restockDustItems');
          if (response && response.success) {
            console.log('Restock successful:', response);
            // Potentially refresh data or display a success message
          } else {
            console.error('Restock failed:', response);
          }
        } catch (error) {
          console.error('Error during restock:', error);
        }
      }
    };

    // Call the function initially and schedule it to run every hour
    handleMonthlyRestock();
    const intervalId = setInterval(handleMonthlyRestock, 3600000); // 1 hour in milliseconds

    return () => clearInterval(intervalId); // Cleanup function to clear interval on unmount
  }, []);

  return (
    <div className="flex flex-1 flex-wrap gap-4 px-16 justify-center">
      {dustItems && dustItems.length > 0 ? (
        dustItems.map((item) => {
          // Cek apakah item dengan id 3, 4, atau 5 sudah ada di inventory
          return (
            <button
              key={item.id}
              className={`flex flex-col flex-none h-40 w-36 rounded-lg overflow-hidden bg-gray-100 shadow-md ${item.limit === 0 || (userData?.glamour_dust ?? 0) < item.price
                ? 'opacity-50 cursor-not-allowed'
                : ''
                }`}
              onClick={() => {
                if (item.limit > 0 && (userData?.glamour_dust ?? 0) >= item.price) {
                  handleSelectItem(item);
                }
              }}
              disabled={item.limit === 0 || (userData?.glamour_dust ?? 0) < item.price}
            >
              <div className="flex flex-1 flex-col w-full justify-between items-center bg-white p-4">
                <Image
                  src={`/icons/shop_items/${item.name}.png`} // Use item name for image
                  alt={item.name}
                  width={72}
                  height={72}
                  onError={(e) => {
                    e.currentTarget.src = '/icons/placeholder.png'; // Placeholder if image fails
                  }}
                />
                {item.limit !== null && <p className="text-xs text-gray-400">Limit: {item.limit}</p>}
              </div>
              {/* Menampilkan status limit dan status sudah dimiliki */}
              <div className="flex flex-col flex-none w-full p-2 bg-amber-500 text-white">
                <p className="text-xs flex gap-1 items-center justify-center">
                  <Image
                    src={`/icons/currency/glamour_dust.png`}
                    alt={item.name}
                    width={20}
                    height={20}
                    onError={(e) => {
                      e.currentTarget.src = '/icons/placeholder.png';
                    }}
                  />
                  <p className="text-md text-white text-center">{item.price}</p>
                </p>
              </div>
            </button>
          );
        })
      ) : (
        <Loading />
      )}

      <Modal isOpen={showModal} onClose={closeModal}>
        {selectedItem && (
          <form onSubmit={handleSubmit} className="relative overflow-hidden flex flex-col w-1/2 text-black bg-white rounded-md p-6 items-center justify-end gap-4">
            <button type="button" onClick={closeModal} className="absolute -top-4 -right-4 font-bold py-5 px-6 rounded-full transition-all duration-300">X</button>
            <Image
              src={`/icons/shop_items/${selectedItem.name}.png`}
              alt={selectedItem.name}
              width={128}
              height={128}
              onError={(e) => {
                e.currentTarget.src = '/icons/placeholder.png'; // Placeholder if image fails
              }}
            />
            <h2 className="text-lg font-bold">{selectedItem.name}</h2>
            <p>{selectedItem.description}</p>
            <div className="flex items-center gap-2">
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max={selectedItem.limit || 99} // Limit quantity if applicable
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="border rounded p-1 w-20"
              />
            </div>
            {error && <ErrorAlert message={error} />}
            <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Buy</button>
          </form>
        )}
      </Modal>
      {/* Success Modal */}
      {exchangeSuccess && (
        <Modal isOpen={exchangeSuccess} onClose={() => setExchangeSuccess(false)}>
          <div className="flex flex-col justify-center items-center p-6 bg-white rounded-md">
            <h2 className="text-lg font-bold text-green-500 mb-4">Success!</h2>
            <p className="text-center">Purchase successful.</p>
            <button onClick={() => setExchangeSuccess(false)} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md">Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}