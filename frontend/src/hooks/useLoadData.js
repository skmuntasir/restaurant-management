import { useDispatch } from "react-redux";
import { getUserData, logout as logoutApi } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";

/**
 * SESSION_KEY is stored in sessionStorage, which is:
 *   - Persisted across page REFRESHES within the same tab  ✓
 *   - Cleared when the TAB is closed                       ✓
 *   - Cleared when the BROWSER WINDOW is closed            ✓
 *   - NOT shared between tabs (each tab is independent)    ✓
 *
 * Flow:
 *   Login → set SESSION_KEY → app works as normal
 *   Close tab / close browser → SESSION_KEY gone
 *   Re-open app → SESSION_KEY missing → backend cookie cleared → login screen shown
 */
export const SESSION_KEY = "restro_session_active";

const useLoadData = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const hasSession = sessionStorage.getItem(SESSION_KEY);

            if (!hasSession) {
                // Tab was closed and reopened (or first visit).
                // Proactively clear the httpOnly cookie on the backend so no
                // stale session is reused even if the cookie somehow persisted.
                try { await logoutApi(); } catch { /* ignore */ }
                dispatch(removeUser());
                navigate("/auth");
                setIsLoading(false);
                return;
            }

            // Session key present — verify it's still valid with the backend.
            try {
                const { data } = await getUserData();
                const { _id, name, email, phone, role } = data.data;
                dispatch(setUser({ _id, name, email, phone, role }));
            } catch (error) {
                // Token expired or cookie gone — clean up and send to login.
                sessionStorage.removeItem(SESSION_KEY);
                dispatch(removeUser());
                navigate("/auth");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [dispatch, navigate]);

    return isLoading;
};

export default useLoadData;
