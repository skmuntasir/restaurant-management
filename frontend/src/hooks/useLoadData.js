import { useDispatch } from "react-redux";
import { getUserData, logout as logoutApi } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { SESSION_KEY, hasActiveSession, clearSession, setBootLogout } from "../utils/session";

// Re-exported so existing imports of SESSION_KEY from this file keep working.
export { SESSION_KEY };

/**
 * Restores the session on page load.
 *
 *  - Fresh visit (no session key): nothing to verify, so we DON'T block the
 *    screen. The login page paints immediately; a stale cookie (if any) is
 *    cleared in the background. Previously the whole app sat behind a
 *    full-screen spinner until the server answered — painful when the free
 *    host is waking up.
 *  - Returning tab (session key present): verify it with the server, showing
 *    the loader only for that short check.
 */
const useLoadData = () => {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(() => hasActiveSession());

    useEffect(() => {
        if (!hasActiveSession()) {
            dispatch(removeUser());
            setBootLogout(logoutApi());
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const { data } = await getUserData();
                const { _id, name, email, phone, role } = data.data;
                if (!cancelled) dispatch(setUser({ _id, name, email, phone, role }));
            } catch {
                // Token expired or cookie gone — clean up; the router sends
                // the user to the login page.
                clearSession();
                if (!cancelled) dispatch(removeUser());
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [dispatch]);

    return isLoading;
};

export default useLoadData;
