import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import OrderList from './OrderList';
import Skeleton from '../ui/Skeleton';
import { isCreatedToday, isOpenOrder } from '../../utils';
import { useRecentOrders } from '../../hooks/useOrders';

const RecentOrders = () => {
  const { orders: all, isLoading } = useRecentOrders();

  // Today's orders (resets at midnight) plus any older order still open.
  const orders = useMemo(
    () => all
      .filter((o) => isCreatedToday(o.createdAt) || isOpenOrder(o))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [all]
  );

  return (
    <div className="glass-card flex h-[380px] flex-col">
      <div className="flex shrink-0 items-end justify-between px-5 pb-3 pt-5 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">Live</p>
          <h2 className="mt-1 font-display text-xl font-semibold text-ink">Today's orders</h2>
        </div>
        {/* <Link>, not <a href>: a plain link reloaded the whole app and re-ran the session check */}
        <Link to="/orders" className="rounded-full border border-[#F6B100]/30 px-3 py-1 text-xs font-semibold text-accent transition-colors hover:bg-[#F6B100] hover:text-[#1a1a1a]">
          View all →
        </Link>
      </div>
      <div className="gold-rule mx-5 sm:mx-6" />

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 scrollbar-thin sm:px-5">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-2xl" />)}
          </div>
        )}
        {!isLoading && orders.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-3xl">🍽️</p>
            <p className="mt-2 text-sm font-medium text-ink">No orders yet today</p>
            <p className="text-xs text-ink-3">New orders will appear here live.</p>
          </div>
        )}
        {orders.map((order) => (
          <OrderList key={order._id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default RecentOrders;
