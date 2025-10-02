// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Grid, Card, CardContent, Typography } from "@mui/material";
import { db } from "./firebase";
import { collection, onSnapshot } from "firebase/firestore";

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "employees"), (snap) => {
      setEmployees(snap.docs.map((d) => d.data()));
    });
    const unsub2 = onSnapshot(collection(db, "companies"), (snap) => {
      setCompanies(snap.docs.map((d) => d.data()));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "Active").length;
  const inactiveEmployees = employees.filter((e) => e.status === "Inactive").length;
  const totalCompanies = companies.length;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Employees</Typography>
            <Typography variant="h4">{totalEmployees}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Active Employees</Typography>
            <Typography variant="h4" color="green">{activeEmployees}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Inactive Employees</Typography>
            <Typography variant="h4" color="red">{inactiveEmployees}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h6">Total Companies</Typography>
            <Typography variant="h4">{totalCompanies}</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
