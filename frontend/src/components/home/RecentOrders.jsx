import React from 'react';
import OrderList from './OrderList';
import { useQuery } from '@tanstack/react-query';
import { getOrders } from '../../https';
import { isCreatedToday } from '../../utils';

const RecentOrders = () => {
  const { data: resData, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
  });

  // Today only — resets at midnight every night
  const orders = [...(resData?.data?.data || [])]
    .filter((o) => isCreatedToday(o.createdAt) && o.orderStatus !== "merged")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="px-4 mt-4 w-full mx-auto">
      <div className="bg-[#1a1a1a] w-full h-[350px] rounded-lg flex flex-col">
        <div className="flex justify-between items-center px-4 py-3 shrink-0">
          <h1 className="text-[#f5f5f5] text-lg font-semibold tracking-wide">
            Today's Orders
          </h1>
          <a href="/orders" className="text-[#025cca] text-xs font-semibold">
            View all
          </a>
        </div>

        <div className="mt-1 px-6 pb-4 overflow-y-auto flex-1 scrollbar-thin">
          {isLoading && <p className="text-[#ababab] text-xs">Loading…</p>}
          {!isLoading && orders.length === 0 && (
            <p className="text-[#ababab] text-xs">No orders placed yet today.</p>
          )}
          {orders.map((order) => (
            <OrderList key={order._id} order={order} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecentOrders;
