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
  
  return (
    <>
      <CssBaseline />

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
            <div style={{ display: tab === 3 ? "block" : "none" }}>
  <PayrollManager />
</div>

          </Box>
        </Box>
      )}
    </>
  );
}

export default App;
