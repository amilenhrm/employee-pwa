import React, { useState } from "react";
import { TextField, Button, Box, Typography, Paper } from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import { APP_VERSION, BUILD_DATE } from "./version"; // ✅ Added this line

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      onLogin(user.email); // pass email to App.jsx
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 350, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Employee Management Login
        </Typography>
        <TextField
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          variant="outlined"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <Typography color="error">{error}</Typography>}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleLogin}
        >
          Login
        </Button>

        {/* ✅ Version label */}
        <Typography
          variant="caption"
          sx={{
            display: "block",
            mt: 3,
            color: "text.secondary",
            opacity: 0.7,
          }}
        >
          @milen HR System v{APP_VERSION} • Built on {BUILD_DATE}
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
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
