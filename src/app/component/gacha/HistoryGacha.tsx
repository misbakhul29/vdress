import { useEffect, useState } from "react";
import { HistoryGachaA } from "@/app/interface";
import ErrorAlert from "../ErrorAlert";
import { encryptData } from "@/lib/crypto";

const HistoryGacha = ({ gachaType }: { gachaType: string }) => {
  const [gachaList, setGachaList] = useState<HistoryGachaA[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1); // Reset pagination when gachaType changes
    fetchHistoryApi("getHistory", { gacha_type: gachaType.toString() });
  }, [gachaType]);

  const fetchHistoryApi = async (typeFetch: string, dataFetch?: any) => {
    try {
      const uid = localStorage.getItem('uid');

      const requestBody = {
        uid: uid!,
        typeFetch: typeFetch,
        ...(dataFetch || {})
      };

      const encryptedData = encryptData(requestBody);

      const response = await fetch('/api/gacha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encryptedData }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      switch (typeFetch) {
        case "getHistory":
          const reqData: HistoryGachaA[] = await response.json();
          setGachaList(reqData);
          break;
        default:
          const responseData = await response.json();
          return responseData;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      return <ErrorAlert message='Terjadi kesalahan. Muat ulang kembali.' />;
    }
  };

  const sortedGachaList = [...gachaList].sort(
    (a, b) => new Date(b.gacha_time).getTime() - new Date(a.gacha_time).getTime()
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedGachaList.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = Math.ceil(sortedGachaList.length / itemsPerPage);

  const siblings = 1;
  const boundaries = 1;

  const range = (start: number, end: number) => {
    let length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const paginationRange = () => {
    const totalNumbers = siblings * 2 + 3 + boundaries * 2;
    if (totalPages <= totalNumbers) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblings, boundaries);
    const rightSiblingIndex = Math.min(
      currentPage + siblings,
      totalPages - boundaries
    );

    const shouldShowLeftDots = leftSiblingIndex > boundaries + 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - boundaries - 1;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblings;
      let leftRange = range(1, leftItemCount);
      return [...leftRange, -1, totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblings;
      let rightRange = range(
        totalPages - rightItemCount + 1,
        totalPages
      );
      return [1, -1, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [1, -1, ...middleRange, -1, totalPages];
    }
  };

  return (
    <>
      <div className="container flex gap-6 flex-col mx-auto p-4 overflow-y-scroll">
        <div className="flex flex-none flex-wrap p-2">
          <p className="text-black font-thin text-justify">
            The Gacha History page provides a detailed record of all your previous gacha pulls. This allows you to review which items you've obtained, when you obtained them, and from which banner they came. Each record includes the item's name, rarity, outfit part, gacha type, and the exact time of the pull. This information can be useful for tracking your gacha spending, remembering which outfit you've acquired, and analyzing your luck over time.
          </p>
        </div>
        <table className="table-auto w-full border-collapse text-2xl">
          <thead>
            <tr className="bg-amber-500">
              <th className="p-4 text-left">Part Outfit</th>
              <th className="p-4 text-left">Item Name</th>
              <th className="p-4 text-left">Gacha Type</th>
              <th className="p-4 text-left">Gacha Time</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((gacha, index) => (
              <tr key={`${gacha.gacha_time}-${index}`} className="border-b border-amber-800 bg-amber-100 text-gray-500">
                <td className="px-4 py-2">{gacha.part_outfit || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`${gacha.rarity === 'SSR' ? 'text-yellow-600' : gacha.rarity === 'SR' ? 'text-purple-500' : ''}`}>
                    {gacha.item_name}
                  </span>
                </td>
                <td className="px-4 py-2">{gacha.gacha_type}</td>
                <td className="px-4 py-2">{gacha.gacha_time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center mt-4">
          {paginationRange()?.map((pageNumber, index) => (
            <button
              aria-label="button"
              key={index}
              onClick={() => paginate(pageNumber)}
              className={`px-3 py-1 rounded-md mx-1 ${currentPage === pageNumber
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
                } ${pageNumber === -1 ? "pointer-events-none" : ""}`}
              disabled={pageNumber === -1}
            >
              {pageNumber === -1 ? "..." : pageNumber}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default HistoryGacha;
