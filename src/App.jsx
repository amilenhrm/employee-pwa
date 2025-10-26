import React, { useState, useEffect } from "react";
import {
  Box,
  Tabs,
  Tab,
  Button,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Paper,
} from "@mui/material";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline"; // 🔹 logo placeholder
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import PayrollManager from "./PayrollManager";
import Dashboard from "./Dashboard";
import EmployeeForm from "./EmployeeForm";
import CompanyManager from "./CompanyManager";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import BillingStatement from "./BillingStatement";
import PayslipTabWrapper from "./PayslipTabWrapper";
import { APP_VERSION, BUILD_DATE } from "./version";
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'


// 🔹 Login Form with Firebase
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setError("Invalid email or password");
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f5f5f5",
      }}
    >
      <Paper sx={{ p: 4, width: 300, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1, mb: 1 }}>
          <WorkOutlineIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main" }}>
            Amilen HR System
          </Typography>
        </Box>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <TextField
            label="Email"
            variant="outlined"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
        
          {error && (
            <Typography variant="body2" color="error" align="center">
              {error}
            </Typography>
          )}

          <Button type="submit" variant="contained" fullWidth>
            Sign In
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

function App() {
  const [tab, setTab] = useState(0);
  const [user, setUser] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);
    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, []);

  useEffect(() => {
  const savedMainTab = localStorage.getItem("lastMainTab");
  if (savedMainTab) setTab(parseInt(savedMainTab));
}, []);


useEffect(() => {
  localStorage.setItem("lastMainTab", tab);
}, [tab]);


  // 🔹 Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };
  // existing useEffects mo...

// 🔄 Auto-update detection (PWA)
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return;

      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              toast((t) => (
                <span>
                  🚀 New version available!{" "}
                  <Button
                    size="small"
                    onClick={() => {
                      window.location.reload();
                      toast.dismiss(t.id);
                    }}
                    style={{ color: '#4caf50', textTransform: 'none' }}
                  >
                    Reload now
                  </Button>
                </span>
              ));
            }
          };
        }
      };
    });
  }
}, []);

  
  return (
    <>
      <CssBaseline />
      {/* 🔴 Offline banner */}
  {!isOnline && (
    <Box
      sx={{
        width: "100%",
        bgcolor: "#ffb3b3",
        color: "#600",
        textAlign: "center",
        py: 0.5,
        fontSize: "0.85rem",
      }}
    >
      ⚠️ You are offline. Some features may not be available.
    </Box>
  )}

      {!user ? (
        // 🔹 Show Login Page if not logged in
        <Login />
      ) : (
        // 🔹 Show Tabs if logged in
        <Box sx={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column" }}>
          <AppBar position="static" color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
              {/* Logo + System Title + Tabs */}
              <Box sx={{ display: "flex", alignItems: "center", flex: 1 }}>
                <WorkOutlineIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold", mr: 4, color: "primary.main" }}>
                  Amilen HR System
                </Typography>

                <Tabs
                  value={tab}
                  onChange={handleChange}
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{ flex: 1 }}
                >
                  <Tab icon={<DashboardIcon />} iconPosition="start" label="Dashboard" />
                  <Tab icon={<PeopleIcon />} iconPosition="start" label="Employees" />
                  <Tab icon={<BusinessIcon />} iconPosition="start" label="Companies" /> 
                  <Tab icon={<MonetizationOnIcon />} iconPosition="start" label="Payroll" />
                  <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Payslip" />
                  <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Billing" />
                </Tabs>
              </Box>

              {/* Right side: Welcome + Logout */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Typography variant="body1">
                  Welcome, {user.displayName || user.email}
                </Typography>
                <Button color="error" variant="outlined" onClick={handleLogout}>
                  Logout
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

          {/* Tab Panels */}
          <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
            {tab === 0 && <Dashboard />}
            {tab === 1 && <EmployeeForm />}
            {tab === 2 && <CompanyManager />}
            {tab === 5 && <BillingStatement />}
            {tab === 4 && <PayslipTabWrapper />}
            <div style={{ display: tab === 3 ? "block" : "none" }}>
            
  <PayrollManager />
</div>

          </Box>
        </Box>
      )}
      {/* ✅ Floating version badge */}
      <Box
        sx={{
          position: "fixed",
          bottom: 8,
          right: 12,
          backgroundColor: "rgba(0,0,0,0.6)",
          color: "white",
          px: 1.5,
          py: 0.5,
          borderRadius: 1,
          fontSize: "0.75rem",
          zIndex: 2000,
        }}
      >
        @milen HR System v{APP_VERSION} • Built on {BUILD_DATE}
      </Box>
    {/* ✅ Toast handler */}
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          fontSize: '0.9rem',
          background: '#333',
          color: '#fff',
        },
      }}
    />
  </>
  );
}

export default App;

