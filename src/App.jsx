import React from "react";
import { CssBaseline, Container, Typography } from "@mui/material";
import EmployeeForm from "./EmployeeForm";

const App = () => {
  return (
    <>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom align="Left">
          AMILEN HRM OPC
        </Typography>
        <Typography variant="h4" gutterBottom align="center">
          Employee Management System
        </Typography>
        <EmployeeForm />
      </Container>
    </>
  );
};

export default App;
