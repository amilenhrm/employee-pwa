import React, { useState } from "react";
import { CssBaseline, Container, Typography, Button, Box } from "@mui/material";
import EmployeeForm from "./EmployeeForm";
import EmployeeList from "./EmployeeList";
import Login from "./Login";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState(""); // store username

  if (!isLoggedIn) {
    return (
      <Login
        onLogin={(user) => {
          setUsername(user);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header row with Welcome + Logout */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="subtitle1">Welcome, {username}</Typography>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setIsLoggedIn(false)}
          >
            Logout
          </Button>
        </Box>

        <Typography variant="h5" gutterBottom align="left">
          AMILEN HRM OPC
        </Typography>
        <Typography variant="h4" gutterBottom align="center">
          Employee Management System
        </Typography>

        {/* Main project UI */}
        <EmployeeForm />
        <EmployeeList />
      </Container>
    </>
  );
};

export default App;
