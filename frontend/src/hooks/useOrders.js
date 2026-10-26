import { useQuery } from "@tanstack/react-query";
import { getOrders } from "../https";
import { startOfDaysAgoISO } from "../utils";

const EMPTY = [];

// Orders that were folded into another table's order ("merged") or voided
// ("cancelled") are only audit records. Counting them would double-count
// dishes / revenue or inflate open orders, so every screen ignores them
// unless it asks for them.
const select = (includeMerged) => (res) => {
  const list = res?.data?.data || EMPTY;
  return includeMerged ? list : list.filter((o) => o.orderStatus !== "merged" && o.orderStatus !== "cancelled");
};

/**
 * Recent window (last ~8 days + anything still open). Small and fast — used
 * by the live screens (Home, Orders). Cached under ["orders", "recent"].
 */
export const useRecentOrders = ({ includeMerged = false, ...options } = {}) => {
  const query = useQuery({
    queryKey: ["orders", "recent"],
    queryFn: () => getOrders({ from: startOfDaysAgoISO(8) }),
    select: select(includeMerged),
    ...options,
  });
  return { ...query, orders: query.data ?? EMPTY };
};

/** Complete history — for the admin dashboard and personal stats. Cached under ["orders", "all"]. */
export const useAllOrders = ({ includeMerged = false, ...options } = {}) => {
  const query = useQuery({
    queryKey: ["orders", "all"],
    queryFn: () => getOrders(),
    select: select(includeMerged),
    ...options,
  });
  return { ...query, orders: query.data ?? EMPTY };
};
