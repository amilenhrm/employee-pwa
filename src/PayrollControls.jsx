// PayrollControls.jsx
import React from "react";
import { Box, TextField, MenuItem, Button } from "@mui/material";

const PayrollControls = ({ employees = [], company, setCompany, period = {start:"",end:""}, setPeriod, handleExportExcel }) => (
  <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
    <TextField
      select
      label="Select Company"
      value={company}
      onChange={(e) => setCompany(e.target.value)}
      sx={{ minWidth: 250 }}
    >
      {[...new Set(employees.map((emp) => emp.company))].map((c) => (
        <MenuItem key={c} value={c}>{c}</MenuItem>
      ))}
    </TextField>

    <TextField
      type="date"
      label="Period Start"
      value={period.start}
      onChange={(e) => setPeriod((prev) => ({ ...prev, start: e.target.value }))}
      InputLabelProps={{ shrink: true }}
    />
    <TextField
      type="date"
      label="Period End"
      value={period.end}
      onChange={(e) => setPeriod((prev) => ({ ...prev, end: e.target.value }))}
      InputLabelProps={{ shrink: true }}
    />

    <Button variant="outlined" onClick={handleExportExcel} disabled={!company || !period.start || !period.end}>Export to Excel</Button>
  </Box>
);

export default PayrollControls;
