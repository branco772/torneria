import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Workers from "./pages/Workers";
import Jobs from "./pages/Jobs";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import PrivateRoute from "./routes/PrivateRoute";
import { useEffect } from "react"; 
import Profile from "./pages/Profile";
import EPPMonitor from "./pages/EPPMonitor";
import Reports from "./pages/Reports";

function App() {
  const { loading } = useAuth();

  // 🌙 DARK MODE GLOBAL (AQUÍ VA)
  useEffect(() => {
  const theme = localStorage.getItem("theme");

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />

      <BrowserRouter>
        <Routes>

          {/* 🔓 LOGIN */}
          <Route path="/login" element={<Login />} />

          {/* 🔒 APP */}
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/clients" element={
            <PrivateRoute>
              <Layout>
                <Clients />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/workers" element={
            <PrivateRoute>
              <Layout>
                <Workers />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/jobs" element={
            <PrivateRoute>
              <Layout>
                <Jobs />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/payments" element={
            <PrivateRoute>
              <Layout>
                <Payments />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/expenses" element={
            <PrivateRoute>
              <Layout>
                <Expenses />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/reports" element={
            <PrivateRoute>
              <Layout>
                <Reports />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/epp" element={
            <PrivateRoute>
              <Layout>
                <EPPMonitor />
              </Layout>
            </PrivateRoute>
          } />
          </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
