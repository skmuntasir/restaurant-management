import { useQuery } from "@tanstack/react-query";
import { getPendingSignups } from "../https";

export const PENDING_SIGNUPS_KEY = ["pending-signups"];

/**
 * Admin-only: how many staff sign-ups are waiting for approval.
 * Polls gently so a request made on another device shows up on its own.
 * Every caller shares one cached query, so it's still a single request.
 */
const usePendingSignups = (enabled) => {
  const { data } = useQuery({
    queryKey: PENDING_SIGNUPS_KEY,
    queryFn: async () => (await getPendingSignups()).data.data,
    enabled: Boolean(enabled),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: false,
  });
  return { count: data?.count ?? 0, loaded: data !== undefined };
};

export default usePendingSignups;
