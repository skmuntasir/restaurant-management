import {
  BrowserRouter as Router,
  Routes,
  Route,    
  useLocation,
  Navigate,
}from 'react-router-dom';
import { Home, Auth, Orders, Tables, Menu, Dashboard, Profile, Suggested } from './pages';
import Header from './components/shared/Header';
import { useSelector } from 'react-redux'; // Added Redux hook
import useLoadData from './hooks/useLoadData';
import FullScreenLoader from './components/shared/FullScreenLoader';

function Layout() {
  const location = useLocation();
  const isLoading = useLoadData();
  const hideHeaderRoutes = ["/auth"];
  const { isAuth } = useSelector((state) => state.user);

  if(isLoading) return <FullScreenLoader />

  return (
    <>
      {!hideHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={
          <ProtectedRoutes> {/* Fixed component name */}
            <Home />
          </ProtectedRoutes>
        } />
        <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />
        <Route path="/orders" element={
          <ProtectedRoutes> {/* Fixed component name */}
            <Orders />
          </ProtectedRoutes>
        } />
        <Route path="/tables" element={
          <ProtectedRoutes> {/* Fixed component name */}
            <Tables />
          </ProtectedRoutes>
        } />
        <Route path="/menu" element={
          <ProtectedRoutes> {/* Fixed component name */}
            <Menu />
          </ProtectedRoutes>
        } />
        <Route path="/dashboard" 
        element={
          <ProtectedRoutes> {/* Fixed component name */}
            <Dashboard />
          </ProtectedRoutes>
        } 
      />
        <Route path="/profile" element={
          <ProtectedRoutes>
            <Profile />
          </ProtectedRoutes>
        } />
        <Route path="/suggested" element={
          <ProtectedRoutes>
            <Suggested />
          </ProtectedRoutes>
        } />
        <Route path='*' element={<div>Not Found</div>} />
      </Routes>
    </>
  );
}

// Corrected component name to match usage
function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  if(!isAuth) { // Fixed logic (original had reversed condition)
    return <Navigate to="/auth" />;
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
