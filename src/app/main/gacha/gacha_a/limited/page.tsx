'use client'
import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import BoxItem from "@/app/component/gacha/BoxItem";
import GachaButton from "@/app/component/gacha/GachaButton";
import { Users, GachaItem } from "@/app/interface";
import Modal from '@/app/component/modal';
import ErrorAlert from "@/app/component/ErrorAlert";
import { encryptData } from '@/lib/crypto';
import { useRefresh } from "@/app/component/RefreshContext"; // Import context
import Loading from "@/app/component/Loading";
import { useSession } from "@/lib/auth-client";

// Define the ResourceInfo type (important!)
interface ResourceInfo {
    dust: string;
    tokens: string;
}

const Limited_A = () => {
    const { data: session } = useSession();
    const uid = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('uid') : null);

    const [userData, setUserData] = useState<Users | null>(null);
    const [gachaItem, setGachaItem] = useState<GachaItem[] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false); // State for insufficient gems modal
    const [localGachaData, setLocalGachaData] = useState<GachaItem[]>([]);
    const [pulledItems, setPulledItems] = useState<GachaItem[]>([]);
    const [resourceInfo, setResourceInfo] = useState<ResourceInfo[]>([]);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [exchangeAmount, setExchangeAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { refresh } = useRefresh();
    let tenpull: GachaItem[] = [];
    // Base probabilities
    const baseSSRProbability = 0.006; // 0.600%
    const consolidatedSSRProbability = 1; // 100%
    const baseSRProbability = 0.051; // 5.100%
    const consolidatedSRProbability = 1// 100%
    let ProbabilitySSRNow: number;
    let ProbabilitySRNow: number;
    let pity: number;
    const activeTab = 'limited';

    useEffect(() => {
        if (!uid) return;

        const fetchData = async () => {
            try {
                await fetchGachaApi("getUserData", null);
            } finally {
                setIsLoading(false); // Set loading ke false setelah data diterima (atau error)
            }
        };

        fetchData();
        fetchAllGachaItems();
    }, [uid]); // Jalankan kembali saat uid dari session sudah siap

    async function fetchAllGachaItems() {
        try {
            const data = await fetchGachaApi('getAllGachaItems');
            // console.log('data gacha: ', data.gachaItem)
            setLocalGachaData(data.gachaItem); // Simpan ke state lokal
        } catch (error) {
            console.error('Error fetching all gacha items:', error);
        }
    }

    const fetchGachaApi = async (typeFetch: string, dataFetch?: any) => {
        try {
            const currentUid = uid || (typeof window !== 'undefined' ? localStorage.getItem('uid') : null);

            if (!currentUid) {
                console.error("User ID not found in session or storage");
                return;
            }

            // Gabungkan data yang akan dikirimkan dalam body
            const requestBody = {
                uid: currentUid,
                typeFetch: typeFetch,
                ...(dataFetch || {}) // Gabungkan dataFetch jika ada
            };

            const encryptedData = encryptData(requestBody);

            const response = await fetch('/api/gacha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ encryptedData }), // Kirim data sebagai JSON
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Tangani response berdasarkan typeFetch
            switch (typeFetch) {
                case "getUserData":
                    const reqData: Users = await response.json();
                    setUserData(reqData);
                    break;
                case "getPity":
                    const pityData = await response.json();
                    pity = Number(pityData[0].pity);
                    break;
                case "getRateUpItem":
                    const RateUpItems = await response.json();
                    return RateUpItems;
                case "getRateOn":
                    const isRateOn = await response.json();
                    return isRateOn;
                default:
                    const responseData = await response.json();
                    return responseData;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            return <ErrorAlert message='Terjadi kesalahan. Muat ulang kembali.' />;
        }
    }


    const closeModal = () => {
        setIsModalOpen(false);
        tenpull = [];
        refresh();
    };

    const closeInsufficientModal = () => {
        setIsInsufficientModalOpen(false);
    };

    const openModal = async (a: number) => {
        if (!userData || !userData.user_resources || userData.user_resources.length === 0) {
            console.error('User data or user resources not available');
            return;
        }

        const essenceCost = a === 1 ? 1 : 10;
        await fetchGachaApi("getUserData", null);

        if (userData.user_resources[0].glimmering_essence < essenceCost) {
            const gemsNeeded = essenceCost * 160;
            console.log('gems now : ', userData.user_resources[0].glamour_gems)
            if (userData.user_resources[0].glamour_gems < gemsNeeded) {
                setIsInsufficientModalOpen(true);
                return;
            } else {
                // Tampilkan modal konfirmasi penukaran
                setShowExchangeModal(true);
                setExchangeAmount(essenceCost);
            }
        } else {
            // Jika essence cukup, langsung jalankan gacha
            setIsModalOpen(true);
            setIsLoading(true);
            try {
                const pulledItems = await pull(a);
                setGachaItem(pulledItems);
            } catch (error) {
                console.error('Error during gacha pull:', error);
            } finally {
                setIsLoading(false); // Nonaktifkan loading indicator setelah selesai
            }
        }
        await fetchGachaApi("getUserData", null);
    };

    const handleExchange = async () => {
        try {
            await fetchGachaApi('exchangeGemsForEssence', {
                type: 'glimmering_essence',
                glamour_gems: (exchangeAmount * 160).toString(),
                glimmering_essence: exchangeAmount.toString()
            });

            setShowExchangeModal(false); // Tutup modal konfirmasi 

            // Jalankan gacha setelah penukaran berhasil
            setIsModalOpen(true);
            setIsLoading(true);
            try {
                const pulledItems = await pull(exchangeAmount === 1 ? 1 : 10);
                setGachaItem(pulledItems);
            } catch (error) {
                console.error('Error during gacha pull:', error);
            } finally {
                setIsLoading(false); // Nonaktifkan loading indicator setelah selesai
            }

            await fetchGachaApi("getUserData", null);

        } catch (error) {
            console.error('Error exchanging gems:', error);
        }
    }

    useEffect(() => {
        if (gachaItem) {
            listGacha(gachaItem);
        }
    }, [gachaItem]);

    function multiplicativeCRNG(seed: number) {
        const a = 1664525; // Multiplier
        const c = 1013904223; // Increment (can be 0 for multiplicative)
        const m = Math.pow(2, 32); // Modulus
        let xn = seed;

        return function () {
            xn = (a * xn + c) % m;
            return xn / m; // Normalize to 0 - 1 range
        }
    }

    function xorshift32(state: number) {
        state ^= state << 13;
        state ^= state >> 17;
        state ^= state << 5;
        return state;
    }

    function combinedRandom(seed: number) {
        const mcrng = multiplicativeCRNG(seed);
        let xorshiftState = seed; // Use seed as initial state for Xorshift

        return function () {
            const mcrngOutput = mcrng();
            xorshiftState = xorshift32(xorshiftState ^ mcrngOutput); // XOR MCRNG output with Xorshift state
            return (xorshiftState >>> 0) / Math.pow(2, 32); // Return unsigned Xorshift state normalized to 0-1
        };
    }

    // Usage
    let random = combinedRandom(Date.now());

    class GachaSystem {
        static SSR_DUPLICATE_TOKENS = 25;
        static SR_DUPLICATE_TOKENS = 5;
        static SSR_NEW_ITEM_TOKENS = 10;
        static SR_NEW_ITEM_TOKENS = 2;
        static GLAMOUR_DUST_AMOUNT = 15;
        static PITY_THRESHOLD = 90;
        static isRateUp: boolean;
        static itemsToUpload: GachaItem[] = [];
        static fashionToken: number = 0;
        static glamourDust: number = 0;
        srPity: number = 0;  // Track SR pity

        async makeWish() {
            try {
                const rarity = this.calculateRarity();
                const rateUp = GachaSystem.isRateUp;
                const pulledCharacterOrItem = await this.pullCharacterOrItem(rarity, rateUp);

                if (!pulledCharacterOrItem) return null;

                const isDuplicate = await this.checkDuplicateItem(pulledCharacterOrItem);

                // Always add to tenpull for display, regardless of duplicate status
                tenpull.push(pulledCharacterOrItem);

                if (isDuplicate) {
                    // Skip adding to inventory if it's a duplicate, but still add to tenpull
                    await this.handleDuplicate(pulledCharacterOrItem);
                } else {
                    // If it's not a duplicate, add to itemsToUpload array for batch upload
                    GachaSystem.itemsToUpload.push(pulledCharacterOrItem);
                    const tokens = rarity === "SSR"
                        ? GachaSystem.SSR_NEW_ITEM_TOKENS
                        : rarity === "SR"
                            ? GachaSystem.SR_NEW_ITEM_TOKENS
                            : 0;
                    GachaSystem.fashionToken += tokens;
                    // await fetchGachaApi('updateFashionTokens', { fashion_tokens: tokens });
                }

                if (rarity === "R") {
                    GachaSystem.glamourDust += GachaSystem.GLAMOUR_DUST_AMOUNT;
                    // await this.updateGlamourDust(GachaSystem.GLAMOUR_DUST_AMOUNT);
                }

                // await this.updateHistory(pulledCharacterOrItem);

                // Reset and handle the gacha result
                if (rarity === "SSR") {
                    this.resetSSR();
                } else if (rarity === "SR") {
                    this.incrementPity();
                    this.resetSR();
                } else {
                    this.incrementPity();
                }

                return pulledCharacterOrItem;
            } catch (error) {
                console.error('Error in makeWish:', error);
                return null;
            }
        }

        async checkDuplicateItem(item: { item_name: string; }) {
            try {
                await fetchGachaApi("getUserData", null); // Refresh user data
                const currentInventory = userData?.inventory || [];
                return currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);
            } catch (error) {
                console.error('Error checking duplicate item:', error);
                return false;
            }
        }

        // Calculate SSR and SR probabilities based on pity
        calculatePityProbabilities() {
            // SSR probability (Soft and Hard Pity)
            console.log('pity now : ', pity + 1)
            if (pity >= 74 && pity < 90) {
                // Soft pity: Exponentially increase SSR probability
                const progress = (pity - 74) / (90 - 74); // Progression between 0 and 1
                ProbabilitySSRNow = baseSSRProbability +
                    (consolidatedSSRProbability - baseSSRProbability) * (1 - Math.exp(-5 * progress));
            } else if (pity >= 90) {
                // Hard pity: Guaranteed SSR
                ProbabilitySSRNow = 1;
            } else {
                // Base probability
                ProbabilitySSRNow = baseSSRProbability;
            }

            // SR probability (Soft Pity only)
            if (this.srPity >= 9) {
                // Guarantee SR at 10th pull
                ProbabilitySRNow = 1;
            } else {
                // Soft pity increases SR probability incrementally
                ProbabilitySRNow = baseSRProbability + (this.srPity / 9) * (consolidatedSRProbability - baseSRProbability);
            }
        }

        calculateRarity() {
            const rand = random(); // Use MCRNG generator
            console.log('random numb : ', rand)
            if (rand < ProbabilitySSRNow || (pity + 1) >= GachaSystem.PITY_THRESHOLD) {
                return "SSR";
            } else if (rand < ProbabilitySRNow || (this.srPity + 1) % 10 === 0) {
                return "SR";
            } else {
                return "R";
            }
        }

        async pullCharacterOrItem(rarity: string, isRateUp: boolean) {
            try {
                let data;

                if (rarity === "SSR" || rarity === "SR") {
                    if (rarity === "SSR" && isRateUp === true) {
                        console.log('dapat rateup');
                        // Jika isRateUp true, ambil hanya item dengan rate_up = true
                        data = localGachaData.filter(item => item.rarity === rarity && item.rate_up === true);
                    } else {
                        console.log('dapat 50:50');
                        // Jika isRateUp false, pilih 50:50 antara item dengan rate_up = true dan rate_up = false
                        const rateUpItems = localGachaData.filter(item => item.rarity === rarity && item.rate_up === true);
                        const rateOffItems = localGachaData.filter(item => item.rarity === rarity && item.rate_up === false);

                        // Gabungkan keduanya dengan proporsi 50:50
                        data = Math.random() < 0.5 ? rateOffItems : rateUpItems;

                        // Cek hasil data
                        // console.log('Hasil data:', data);
                    }

                    // Jika tidak ada item yang memenuhi kriteria, fallback ke acak
                    if (data.length === 0) {
                        data = localGachaData.filter(item => item.rarity === rarity);
                    }

                    const randomItem = this.selectRandomItem(data);

                    // console.log('random item : ', randomItem)

                    if (rarity === "SSR" && randomItem.islimited === true) {
                        // Jika item yang terpilih adalah SSR dan limited, set rate-off
                        await fetchGachaApi('setRateOff');
                        if (userData && userData.user_resources?.[0]) {
                            userData.user_resources[0].is_rate = false; // Set is_rate to false
                            GachaSystem.isRateUp = false;
                        }
                    } else if (rarity === "SSR" && randomItem.islimited === false) {
                        // Set rate-on jika item tidak limited atau bukan SSR
                        await fetchGachaApi('setRateOn');
                        if (userData && userData.user_resources?.[0]) {
                            userData.user_resources[0].is_rate = true; // Set is_rate to true
                            GachaSystem.isRateUp = true;
                        }
                    }

                    return randomItem;
                } else {
                    // Untuk rarity lainnya, langsung pilih item acak
                    data = localGachaData.filter(item => item.rarity === rarity);
                    return this.selectRandomItem(data);
                }
            } catch (error) {
                console.error('Error pulling character or item:', error);
                return null;
            }
        }

        selectRandomItem(data: { [x: string]: any; }) {
            const keys = Object.keys(data);
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            return data[randomKey];
        }

        async handleDuplicate(item: { rarity: string; }) {
            try {
                const tokens = item.rarity === "SSR"
                    ? GachaSystem.SSR_NEW_ITEM_TOKENS
                    : item.rarity === "SR"
                        ? GachaSystem.SR_NEW_ITEM_TOKENS
                        : 0;
                GachaSystem.fashionToken += tokens;
                // await fetchGachaApi('updateFashionTokens', { fashion_tokens: tokens });
            } catch (error) {
                console.error('Error handling duplicate item:', error);
            }
        }

        // Reset SSR pity after pulling an SSR
        resetSSR() {
            pity = 0; // Reset SSR pity
        }

        // Reset SR pity to the nearest multiple of 10
        resetSR() {
            this.srPity = Math.floor(this.srPity / 10) * 10; // Reset SR pity
        }

        // Increment pity for SSR or SR
        incrementPity() {
            pity += 1; // Increment SSR pity after a regular pull
            this.srPity += 1;  // Increment SR pity after a regular pull
        }
    }

    async function pull(a: number): Promise<GachaItem[]> {
        tenpull = [];

        await fetchGachaApi("getUserData", null);

        try {
            await fetchGachaApi('getPity');

            if (userData?.user_resources[0]) {
                GachaSystem.isRateUp = userData.user_resources[0].is_rate;
                console.log('rate up : ', GachaSystem.isRateUp)
            } else {
                throw new Error("user_resources[0].is_rate is undefined or not available.");
            }

            for (let i = 0; i < a; i++) {
                // Hitung probabilitas berdasarkan pity
                gacha.calculatePityProbabilities();
                console.log('probability SSR : ', ProbabilitySSRNow)

                // Simulasi gacha
                const result = await gacha.makeWish();
                tenpull[i] = result;
            }

            if (GachaSystem.itemsToUpload.length > 0) await uploadInventory(GachaSystem.itemsToUpload);
            if (GachaSystem.glamourDust !== 0) await updateGlamourDust(GachaSystem.glamourDust);
            if (GachaSystem.fashionToken !== 0) await updateFashionToken(GachaSystem.fashionToken);

            // Reset after the upload
            GachaSystem.itemsToUpload = [];
            GachaSystem.glamourDust = 0;
            GachaSystem.fashionToken = 0;

            // Update pity dan essence di server
            await fetchGachaApi('incPity', {
                incPity: pity,
                type: 'limited',
            });

            const GlimmeringEssence = a.toString();
            await fetchGachaApi('updateEssence', {
                essence: GlimmeringEssence,
                type: 'limited',
            });

            await updateHistory(tenpull);

            return tenpull;
        } catch (error) {
            console.error('Error pulling gacha:', error);
            return [];
        }
    }

    async function updateHistory(items: GachaItem[]) {
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                gacha_type: 'Whispers_of_Silk'
            }));
            await fetchGachaApi('batchUpHistory', { items: dataFetch });
        } catch (error) {
            console.error('Error updating history:', error);
        }
    }

    async function updateGlamourDust(amount: number) {
        try {
            await fetchGachaApi('updateGlamourDust', { glamour_dust: amount });
        } catch (error) {
            console.error('Error updating glamour dust:', error);
        }
    }

    async function updateFashionToken(amount: number) {
        try {
            await fetchGachaApi('updateFashionTokens', { fashion_tokens: amount });
        } catch (error) {
            console.error('Error updating glamour dust:', error);
        }
    }

    // Fungsi untuk mengunggah hasil gacha ke inventory sekaligus
    async function uploadInventory(items: GachaItem[]) {
        try {
            const dataFetch = items.map(item => ({
                rarity: item.rarity,
                item_name: item.item_name,
                part_outfit: item.part_outfit,
                layer: item.layer,
                stat: item.stat,
                power: item.power,
                gacha_type: 'Whisper_of_Silk',
            }));
            await fetchGachaApi('batchUpInven', { items: dataFetch });
        } catch (error) {
            console.error('Error uploading inventory:', error);
        }
    }

    const sortPulledItems = (pulledItems: GachaItem[]) => {
        return pulledItems.sort((a, b) => {
            const rarityOrder = { R: 0, SR: 1, SSR: 2 };
            return rarityOrder[b.rarity as keyof typeof rarityOrder] - rarityOrder[a.rarity as keyof typeof rarityOrder];
        });
    };

    const listGacha = async (tenpull: any[]) => {
        const sortedTenpull = sortPulledItems(tenpull);
        setPulledItems(sortedTenpull);

        // Assuming fetchGachaApi("getUserData", null) has been called before listGacha
        const currentInventory = userData?.inventory || [];

        // Create ResourceInfo objects with filtered values
        const resourceInfo = tenpull.map((item) => {
            const rarity = item.rarity.trim();
            const isDuplicate = currentInventory.some(inventoryItem => inventoryItem.item_name === item.item_name);

            return {
                dust: rarity === "R" ? '+15' : '',
                tokens: rarity === "SR"
                    ? (isDuplicate ? '+5' : '+2')
                    : (rarity === "SSR" ? (isDuplicate ? '+25' : '+10') : ''),
            };
        }).filter(resource => resource.dust !== '' || resource.tokens !== '');

        // Update state with the resourceInfo array
        setResourceInfo(resourceInfo);
    };

    const gacha = new GachaSystem();

    return (
        <>
            {isLoading && (
                <Loading />
            )}
            {!isLoading && ( // Render konten hanya jika isLoading false
                <>
                    <div className="flex flex-1 lg:pt-10 pt-4 bg-gacha1 bg-cover lg:blur-md blur-sm animate-pulse" />
                    <div className="absolute w-full h-full flex flex-1 pt-10 bg-gradient-to-b from-transparent via-transparent to-black to-100% z-10" />
                    <div className="absolute w-full h-full flex flex-1 z-20 lg:pt-20 pt-14">
                        <div className="flex flex-none flex-shrink w-2/5">
                            <div className="relative h-full w-full transition-transform duration-200">
                                <div className="absolute flex justify-end w-full h-full -bottom-32 -right-10">
                                    <Image
                                        id="MikoImg"
                                        src={"/banner/avatar/limitedA.png"}
                                        alt={"Miko"}
                                        layout="fill"
                                        objectFit="contain"
                                        objectPosition="bottom"
                                        className="scale-150"
                                    />
                                </div>
                                <div className="absolute flex justify-end w-full h-full -bottom-32 -right-52">
                                    <Image
                                        id="MikoImg"
                                        src={"/banner/avatar/limitedB.png"}
                                        alt={"Miko"}
                                        layout="fill"
                                        objectFit="contain"
                                        objectPosition="bottom"
                                        className="scale-95"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="relative flex flex-1">
                            <div className="absolute z-40 flex flex-1 w-full h-full flex-col lg:gap-4 gap-2">
                                <div className="absolute flex items-center justify-end px-12 transform -skew-x-12 bg-gradient-to-r from-transparent via-red-600 to-red-600 to-100% bg-opacity-50 -right-10 transition-opacity duration-1000">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-white pr-12">JAPANESE MIKO</p>
                                </div>

                                {/* transparent div */}
                                <div className="flex items-end justify-end px-12 transform -skew-x-12 bg-transparent">
                                    <p className="lg:text-8xl text-5xl text-end font-black transform skew-x-12 text-transparent pr-12">JAPANESE MIKO</p>
                                </div>
                                {/* transparent div */}

                                <div className="flex flex-none items-start justify-end pr-16">
                                    <p className="text-end lg:text-sm text-[9px] lg:w-5/6 w-full">Rasakan keagungan kuil dengan gacha Miko terbaru! Dapatkan kostum gadis kuil yang cantik dengan jubah putih bersih dan rok merah menyala, lengkap dengan aksesoris seperti gohei dan ofuda. Raih kesempatan untuk memanggil roh keberuntungan dan keindahan! Jangan lewatkan kesempatan langka ini, tersedia untuk waktu terbatas!</p>
                                </div>
                                <div className="flex flex-1 flex-col gap-12">
                                    <div className="flex flex-1 items-end justify-end gap-8 pr-16">
                                        <BoxItem imageUrl={"/icons/outfit/A/MikoA.png"} altText={"Miko a"} />
                                        <BoxItem imageUrl={"/icons/outfit/B/MikoB.png"} altText={"Miko b"} />
                                        <BoxItem imageUrl={"/icons/outfit/C/MikoC.png"} altText={"Miko c"} />
                                        <p className=" flex flex-none h-20 justify-center items-center animate-pulse text-yellow-400">Rate Up!</p>
                                    </div>
                                    <div className="flex flex-none flex-col gap-4 pr-16 pb-10 justify-center">
                                        <GachaButton onClick={openModal} activeTab={activeTab} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gacha Modal */}
                    <Modal isOpen={isModalOpen} onClose={closeModal}>
                        <div className="relative w-full h-full flex flex-1 flex-col items-center justify-center">
                            <div className="flex flex-1 flex-col w-full h-full justify-between bg-white p-8">
                                <div className="flex flex-1 flex-col flex-wrap items-center justify-center">

                                    <div id="diDapat" className="flex flex-none flex-row w-full justify-center items-center gap-1">
                                        {pulledItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className={`
                                                    ${item.rarity.trim() === "SSR" ? 'bg-gradient-to-b from-transparent from-0% via-amber-500 via-50% to-transparent to-100%' :
                                                        item.rarity.trim() === "SR" ? 'bg-gradient-to-b from-transparent from-0% via-purple-800 via-50% to-transparent to-100%' :
                                                            'bg-gradient-to-b from-transparent from-0% via-gray-400 via-50% to-transparent to-100%'}
                                                    h-64 flex items-center justify-center overflow-hidden opacity-100 p-1
                                                `}
                                                style={{ animationDelay: `${index * 0.2}s` }}
                                                onAnimationEnd={(e) => {
                                                    // On animation end, set opacity to 100
                                                    (e.target as HTMLDivElement).classList.add('opacity-100', 'scale-100');
                                                }}
                                            >
                                                <img
                                                    src={`/icons/outfit/${item.layer.toLocaleUpperCase()}/${item.item_name}.png`}
                                                    alt={item.item_name}
                                                    className={`w-24 h-24 object-cover `}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div id="addResource" className="flex flex-none flex-row w-full justify-center items-center gap-1 animate-pulse text-[8px]">
                                        {resourceInfo.length > 0 && resourceInfo.map((resource, index) => (
                                            <p key={index} className="flex flex-none flex-row gap-2 justify-center items-center text-black w-[105px] p-1 font-bold">
                                                {resource.dust !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/glamour_dust.png"} alt={"glamour_dust"} width={12} height={12} />
                                                        {resource.dust}
                                                    </>
                                                )}
                                                {resource.tokens !== '' && (
                                                    <>
                                                        <Image src={"/icons/currency/fashion_tokens.png"} alt={"fashion_tokens"} width={12} height={12} />
                                                        {resource.tokens}
                                                    </>
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 focus:outline-none font-bold text-2xl text-gray-400 animate-pulse"
                                    >
                                        CLOSE
                                    </button>
                                </div>
                            </div>

                        </div>
                    </Modal>

                    {/* Insufficient Gems Modal */}
                    <Modal isOpen={isInsufficientModalOpen} onClose={closeInsufficientModal}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black">Glamour Gems tidak cukup!</p>
                            <div className="flex justify-end mt-4">
                                <button
                                    type="button"
                                    onClick={closeInsufficientModal}
                                    className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Modal Konfirmasi Penukaran */}
                    <Modal isOpen={showExchangeModal} onClose={() => setShowExchangeModal(false)}>
                        <div className="p-4 flex flex-col flex-none w-2/5 justify-center items-center bg-white rounded-lg py-8">
                            <p className="text-black mb-4 text-center">
                                Glimmering Essence tidak cukup! <br />
                                Tukarkan <span className="text-amber-400">{exchangeAmount * 160} Glamour Gems</span> dengan <span className="text-blue-400">{exchangeAmount} Glimmering Essence</span>?
                            </p>
                            <div className="flex gap-4">
                                <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                    onClick={handleExchange}

                                >
                                    Ya, Tukar
                                </button>
                                <button
                                    className="bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                    onClick={() => setShowExchangeModal(false)}
                                >
                                    Tidak
                                </button>
                            </div>
                        </div>
                    </Modal>

                </>
            )}

        </>
    )
}

export default Limited_A;