'use client'
import { useState, useEffect } from "react";
import Modal from "@/app/component/modal"; // Adjust the path as needed
import { encryptData } from "@/lib/crypto";
import { useRefresh } from "@/app/component/RefreshContext"; // Import context
import Loading from "@/app/component/Loading";

interface Package {
  id: any;
  name: string;
  price: string;
  glamour_gems: number;
}

export default function TopUp() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false); // Modal konfirmasi pembelian
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // Modal sukses top-up
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refresh } = useRefresh();

  // Fetch packages on component mount and add cache busting
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/shop?cache-bust=' + Math.random(), {
          method: 'GET',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Network response was not ok");
        }

        const responseData = await response.json();
        const packages = responseData.rows || [];
        setPackages(packages);
      } catch (error: any) {
        console.error('Error fetching packages:', error);
        setErrorMessage(error.message);
      }
    };

    fetchPackages();
  }, []);

  const handleOpenModal = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsPurchaseModalOpen(true); // Buka modal konfirmasi pembelian
  };

  const handleClosePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setErrorMessage(null); // Clear error message when closing purchase modal
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setErrorMessage(null); // Clear error message when closing success modal
  };

  const handlePackageSelect = (pkg: Package) => {
    setSelectedPackage(pkg);
    handleOpenModal(pkg);
  };

  // Combine fetchApi and handlePurchase logic with conditional rendering
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    console.log(selectedPackage);

    const purchaseData = {
      packageId: selectedPackage.id,
    };

    try {
      const uid = localStorage.getItem('uid');
      if (!uid) {
        throw new Error("User ID not found");
      }

      const requestBody = {
        uid,
        typeFetch: 'topUp',
        ...purchaseData,
      };

      const encryptedData = encryptData(requestBody);

      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      });

      if (!response.ok) {
        const errorMessage = 'Purchase failed';
        setErrorMessage(errorMessage);
        setIsPurchaseModalOpen(true); // Keep modal open to show error
        console.error("Purchase failed:", errorMessage);
        return;
      }

      const responseData = await response.json();
      if (responseData && responseData.message === 'Top-up successful') {
        console.log('Purchase successful!');
        setSelectedPackage(null);
        setIsPurchaseModalOpen(false); // Tutup modal konfirmasi pembelian
        setErrorMessage('Top-up successful!');
        setIsSuccessModalOpen(true); // Buka modal sukses
        refresh();
      } else {
        const errorMessage = responseData?.message || 'Purchase failed';
        setErrorMessage(errorMessage);
        setIsPurchaseModalOpen(true); // Keep modal open to show error
        console.error("Purchase failed:", errorMessage);
      }
    } catch (error: any) {
      console.error('Error during purchase:', error);
      setErrorMessage(error.message || "An unexpected error occurred.");
      setIsPurchaseModalOpen(true); // Keep modal open to show error
    }
  };

  const purchaseButton = (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={handlePurchase}
      disabled={errorMessage !== null} // Disable button if there's an error
    >
      Purchase
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Package Display */}
      {packages.length > 0 ? (
        <div className="p-12 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id} // Use a unique key, preferably an ID
              className={`border p-4 bg-white text-black rounded-md hover:bg-gray-100 cursor-pointer ${selectedPackage === pkg ? "bg-blue-500 text-blue-600" : ""}`}
              onClick={() => handlePackageSelect(pkg)}
            >
              <h2 className="text-lg font-semibold">{pkg.name}</h2>
              <span className="text-gray-600 flex gap-1">
                <p>IDR.</p>
                {pkg.price}
              </span>
              <p className="text-gray-600">{pkg.glamour_gems} Glamour Gems</p>
            </div>
          ))}
        </div>
      ) : (
        <Loading />
      )}

      {/* Modal Konfirmasi Pembelian */}
      <Modal isOpen={isPurchaseModalOpen} onClose={handleClosePurchaseModal}>
        <div className="mt-4 bg-white p-4 rounded-md">
          {errorMessage && errorMessage !== 'Top-up successful!' && <p className="text-red-500 mb-4">{errorMessage}</p>}
          {selectedPackage && (
            <>
              <p className="text-lg font-semibold">Selected Package:</p>
              <p className="text-black">{selectedPackage.name}</p>
              <p className="text-green-400">IDR. {selectedPackage.price}</p>
            </>
          )}
          <div className="flex flex-1 gap-2 mt-4">
            {purchaseButton}
            <button
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleClosePurchaseModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Sukses Top-up */}
      <Modal isOpen={isSuccessModalOpen} onClose={handleCloseSuccessModal}>
        <div className="flex flex-col justify-center items-center p-6 bg-white rounded-md">
          <h2 className="text-lg font-bold text-green-500 mb-4">Berhasil!</h2>
          <p className="text-center">Top-up Berhasil.</p>
          <button onClick={handleCloseSuccessModal} className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md">Tutup</button>
        </div>
      </Modal>
    </div>
  );
}