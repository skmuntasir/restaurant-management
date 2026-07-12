import React from 'react';

const MiniCard = ({ title, icon, number, trendPercent, trendLabel = "than yesterday", prefix = "" }) => {
  const hasTrend = typeof trendPercent === "number" && isFinite(trendPercent);
  const isIncrease = hasTrend && trendPercent >= 0;

  return (
    <div className="bg-[#1a1a1a] py-3 px-3 rounded-lg w-full">
      <div className="flex items-start justify-between">
        <h1 className="text-[#f5f5f5] text-sm font-semibold tracking-wide">{title}</h1>
        <button className={`${title === 'Total Earning' ? 'bg-[#02ca3a]' : 'bg-[#f6b100]'} p-2 rounded-lg text-[#f5f5f5] text-xl`}>
          {icon}
        </button>
      </div>
      <div>
        <h1 className="text-[#f5f5f5] text-3xl font-bold mt-4">{prefix}{number}</h1>
        <h1 className="text-[#f5f5f5] text-sm mt-1">
          {hasTrend ? (
            <>
              <span className={isIncrease ? "text-[#02ca3a]" : "text-red-500"}>
                {isIncrease ? "▲" : "▼"} {Math.abs(trendPercent).toFixed(1)}%
              </span>{" "}
              {trendLabel}
            </>
          ) : (
            <span className="text-[#ababab]">{trendLabel}</span>
          )}
        </h1>
      </div>
    </div>
  );
};

export default MiniCard;
