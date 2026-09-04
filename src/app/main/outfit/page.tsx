'use client'
import React, { useRef, useEffect, useState } from 'react';
import ModalWardrobe from '@/app/component/outfit/ModalWardrobe';
import OutfitComponent from '@/app/component/outfit/OutfitComponent';
import BackButton from '@/app/component/BackButton';
import DownloadButton from '@/app/component/DownloadButton';
import OutfitImage from '@/app/component/outfit/OutfitImage';
import UnEquip from '@/app/component/outfit/UnEquip';
import { Inventory, Suited } from '@/app/interface';
import { encryptData, decryptData } from '@/lib/crypto';
import Loading from '@/app/component/Loading';

const CanvasComponent: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const bottomRef = useRef<HTMLCanvasElement>(null);
  const feetRef = useRef<HTMLCanvasElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [wardrobe, setWardrobe] = useState<Suited | null>(null);
  const [topImage, setTopImage] = useState('');
  const [botImage, setBotImage] = useState('');
  const [feetImage, setFeetImage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [outfitData, setOutfitData] = useState<Inventory[]>([]);
  const loading = '/ui/iconVD.svg';
  const uid = localStorage.getItem('uid');

  const changeOutfit = (newOutfit: { layer: string, item_name: string }) => {
    setWardrobe((prevWardrobe) => {
      if (prevWardrobe) {
        const updatedWardrobe = {
          ...prevWardrobe,
          [newOutfit.layer.toLowerCase()]: newOutfit.item_name
        };

        fetchData("updateOutfit", {
          top: updatedWardrobe.a,
          bottom: updatedWardrobe.b,
          feet: updatedWardrobe.c
        });

        return updatedWardrobe;

      } else {
        console.error("Previous wardrobe is undefined!");
        return prevWardrobe;
      }
    });

    closeModal();
  };

  useEffect(() => {
    fetchData("getOutfitData", { uid });
  }, []);

  useEffect(() => {
    if (wardrobe) {
      setTopImage(wardrobe.a ? `/character/model/cloth/top/${wardrobe.a}.png` : '');
      setBotImage(wardrobe.b ? `/character/model/cloth/bot/${wardrobe.b}.png` : '');
      setFeetImage(wardrobe.c ? `/character/model/cloth/shoes/${wardrobe.c}.png` : '');

      const canvasAvatar = avatarRef.current;
      const canvasTop = topRef.current;
      const canvasBottom = bottomRef.current;
      const canvasFeet = feetRef.current;

      const catx = canvasAvatar?.getContext('2d');
      const cttx = canvasTop?.getContext('2d');
      const cbtx = canvasBottom?.getContext('2d');
      const cftx = canvasFeet?.getContext('2d');

      if (!catx || !cttx || !cbtx || !cftx) {
        console.error('Failed to get canvas context');
        return;
      }

      setIsLoading(true);
      loadAvatar(catx);

      drawClothingItem(cttx, topImage);
      drawClothingItem(cbtx, botImage);
      drawClothingItem(cftx, feetImage);

      setIsLoading(false);
    } else {
      console.log('Wardrobe data is not available');
    }
  }, [wardrobe, topImage, botImage, feetImage]);

  const fetchData = async (action: string, dataFetch?: any) => {
    try {
      const uid = localStorage.getItem('uid');
      if (!uid) throw new Error("User ID not found");

      const encryptedData = encryptData({ action, uid, ...dataFetch });

      const response = await fetch('/api/outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ encryptedData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Network response was not ok");
      }

      const responseData = await response.json();
      const decryptedData = decryptData(responseData.encryptedData);

      switch (action) {
        case "getOutfitData":
          if (decryptedData && decryptedData.length > 0) {
            setWardrobe(decryptedData[0]);
          } else {
            console.log('No data found for getOutfitData');
            setWardrobe(null);
          }
          break;
        case "updateOutfit":
          console.log('Outfit updated successfully:', decryptedData);
          break;
        case "getOutfitByLayer":
          if (decryptedData && decryptedData.length > 0) {
            // Filter duplicate items based on `item_name`
            const uniqueItems = decryptedData.filter((item: Inventory, index: number, self: Inventory[]) =>
              index === self.findIndex((t) => t.item_name === item.item_name)
            );

            setOutfitData(uniqueItems);
          } else {
            console.log('No outfit data found for getOutfitByLayer');
            setOutfitData([]);
          }
          break;

        default:
          console.log('Unknown action:', action);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
    }
  };

  const loadAvatar = (ctx: CanvasRenderingContext2D) => {
    const modelImage = new Image();

    modelImage.onload = () => {
      const imageWidth = modelImage.width;
      const imageHeight = modelImage.height;

      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      const scaleFactor = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

      const newWidth = imageWidth * scaleFactor;
      const newHeight = imageHeight * scaleFactor;

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      const startX = centerX - newWidth / 2;
      const startY = centerY - newHeight / 2;

      ctx.drawImage(modelImage, startX, startY, newWidth, newHeight);
    };

    modelImage.src = '/avatar/model.png';
  };

  const drawClothingItem = (ctx: CanvasRenderingContext2D, src: string) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const clothingImage = new Image();
    clothingImage.onload = () => {
      const imageWidth = clothingImage.width;
      const imageHeight = clothingImage.height;

      const canvasWidth = ctx.canvas.width;
      const canvasHeight = ctx.canvas.height;
      const scaleFactor = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight);

      const newWidth = imageWidth * scaleFactor;
      const newHeight = imageHeight * scaleFactor;

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;

      const startX = centerX - newWidth / 2;
      const startY = centerY - newHeight / 2;

      ctx.globalCompositeOperation = 'destination-over';

      ctx.drawImage(clothingImage, startX, startY, newWidth, newHeight);
    };
    clothingImage.src = src;
  };

  const openModal = (loc: string) => {
    setIsModalOpen(true);
    if (uid) {
      fetchData("getOutfitByLayer", {
        uid,
        layer: loc
      });
    } else {
      console.warn('user id not found!');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleDownload = () => {
    const cAvatar = avatarRef.current;
    const cTop = topRef.current;
    const cBottom = bottomRef.current;
    const cFeet = feetRef.current;

    if (!cAvatar || !cTop || !cBottom || !cFeet) return;

    // Buat canvas baru dengan ukuran yang sama dengan canvas lainnya
    const combinedCanvas = document.createElement('canvas');
    const ctx = combinedCanvas.getContext('2d');
    combinedCanvas.width = cAvatar.width;
    combinedCanvas.height = cAvatar.height;

    // Gambar canvas-canvas ke canvas gabungan
    if (ctx) {
      ctx.drawImage(cAvatar, 0, 0);
      ctx.drawImage(cFeet, 0, 0);
      ctx.drawImage(cBottom, 0, 0);
      ctx.drawImage(cTop, 0, 0);
    }

    // Unduh gambar gabungan
    const url = combinedCanvas.toDataURL();
    const a = document.createElement('a');
    a.href = url;
    a.download = 'model.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="relative flex w-screen h-screen justify-center items-center gap-10 transition-opacity duration-1000">
        <div className="absolute flex flex-col gap-8 md:top-20 top-50 md:right-40 right-20 z-50 max-w-fit scale-125">
          <BackButton href='/main' />
          <DownloadButton onClick={handleDownload} />
        </div>
        {isLoading ? (
          <Loading />
        ) : (
          <div className="relative flex flex-none w-1/4 flex-shrink transition-transform duration-1000 h-full transform">
            <canvas id="avatar" ref={avatarRef} className="absolute left-0 h-full z-0" width={2000} height={4000} />
            <canvas id="oFeet" ref={feetRef} className="absolute inset-0 h-full z-10" width={2000} height={4000} />
            <canvas id="oBottom" ref={bottomRef} className="absolute inset-0 h-full z-30" width={2000} height={4000} />
            <canvas id="oTop" ref={topRef} className="absolute inset-0 h-full z-20" width={2000} height={4000} />
          </div>
        )}

        <form className="flex flex-none flex-col justify-center items-center gap-8 max-w-fit h-full text-gray-800 transition-opacity duration-1000">
          <OutfitComponent loc="top" src={`/icons${topImage}`} openModal={() => openModal('b')} />
          <OutfitComponent loc="bottom" src={`/icons${botImage}`} openModal={() => openModal('a')} />
          <OutfitComponent loc="feet" src={`/icons${feetImage}`} openModal={() => openModal('c')} />

          <ModalWardrobe isOpen={isModalOpen} onClose={closeModal}>
            <div className='flex flex-1 items-center justify-start p-2 select-none gap-3' >
              <UnEquip />
              {
                outfitData?.length > 0 ? (
                  outfitData?.map((item, index) => (
                    <div key={index}>
                      {/* Pass the changeOutfit function to OutfitImage */}
                      {item.part_outfit.toLowerCase() === 'top' && (
                        <OutfitImage
                          src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                          onClick={() => changeOutfit({ layer: item.layer, item_name: item.item_name })}
                        />
                      )}
                      {item.part_outfit.toLowerCase() === 'bottom' && (
                        <OutfitImage
                          src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                          onClick={() => changeOutfit({ layer: item.layer, item_name: item.item_name })}
                        />
                      )}
                      {item.part_outfit.toLowerCase() === 'feet' && (
                        <OutfitImage
                          src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                          onClick={() => changeOutfit({ layer: item.layer, item_name: item.item_name })}
                        />
                      )}
                    </div>
                  ))
                ) : outfitData.length === 0 ? (
                  <div>No outfit data available.</div>
                ) : (
                  <div>Loading item information...</div>
                )}
            </div>
          </ModalWardrobe>
        </form>
      </div>
    </>
  );
};

export default CanvasComponent;
