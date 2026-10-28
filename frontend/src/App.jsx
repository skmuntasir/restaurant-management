import { lazy, Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import Header from './components/shared/Header';
import useLoadData from './hooks/useLoadData';
import FullScreenLoader from './components/shared/FullScreenLoader';
import BottomNav from './components/shared/BottomNav';

// Each page is its own chunk — the login screen no longer downloads the
// dashboard, charts and menu code it will never show.
const Home = lazy(() => import('./pages/Home.jsx'));
const Auth = lazy(() => import('./pages/Auth.jsx'));
const Orders = lazy(() => import('./pages/Orders.jsx'));
const Tables = lazy(() => import('./pages/Tables.jsx'));
const Menu = lazy(() => import('./pages/Menu.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

// No spinner here: chunks are prefetched, so this only shows for a split second
// on a cold load, and a flashing spinner reads as a jolt. A calm blank canvas doesn't.
const PageFallback = () => <div className="bg-canvas min-h-[calc(100dvh-5rem)]" />;

// Pure cross-fade: no sliding, so nothing moves around while the page changes.
const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

function Layout() {
  const location = useLocation();
  const isLoading = useLoadData();
  const hideHeaderRoutes = ["/auth"];
  const { isAuth } = useSelector((state) => state.user);

  // Once signed in, quietly fetch the other pages' code while the browser is
  // idle so tapping Orders / Tables / Menu feels instant.
  useEffect(() => {
    if (!isAuth) return;
    const prefetch = () => {
      import('./pages/Home.jsx');
      import('./pages/Orders.jsx');
      import('./pages/Tables.jsx');
      import('./pages/Menu.jsx');
      import('./pages/Profile.jsx');
    };
    const id = typeof requestIdleCallback === 'function'
      ? requestIdleCallback(prefetch)
      : setTimeout(prefetch, 800);
    return () => {
      if (typeof cancelIdleCallback === 'function' && typeof id === 'number') cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, [isAuth]);

  if (isLoading) return <FullScreenLoader />;

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && isAuth && <Header />}
      <Suspense fallback={<PageFallback />}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/" element={<ProtectedRoutes><Home /></ProtectedRoutes>} />
            <Route path="/auth" element={isAuth ? <Navigate to="/" replace /> : <Auth />} />
            <Route path="/orders" element={<ProtectedRoutes><Orders /></ProtectedRoutes>} />
            <Route path="/tables" element={<ProtectedRoutes><Tables /></ProtectedRoutes>} />
            <Route path="/menu" element={<ProtectedRoutes><Menu /></ProtectedRoutes>} />
            <Route path="/dashboard" element={<ProtectedRoutes adminOnly><Dashboard /></ProtectedRoutes>} />
            <Route path="/profile" element={<ProtectedRoutes><Profile /></ProtectedRoutes>} />
            {/* "Suggested for you" now lives inside the Menu as a Popular chip. */}
            <Route path="/suggested" element={<Navigate to="/" replace />} />
            <Route path="*" element={isAuth ? <NotFound /> : <Navigate to="/auth" replace />} />
          </Routes>
        </PageTransition>
      </Suspense>
      {/* One persistent bottom nav for every signed-in page — it no longer
          unmounts/remounts on each navigation (that was the flicker). */}
      {!hideHeaderRoutes.includes(location.pathname) && isAuth && <BottomNav />}
    </>
  );
}

function ProtectedRoutes({ children, adminOnly = false }) {
  const { isAuth, role } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" replace />;
  }
  // The dashboard is admin-only on the server; send everyone else home
  // instead of showing a page full of "forbidden" errors.
  if (adminOnly && role?.toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
