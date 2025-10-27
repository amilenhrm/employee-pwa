// src/CompanyManager.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

const CompanyManager = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [editingCompany, setEditingCompany] = useState(null);
  const [editRates, setEditRates] = useState({});

  // 🔹 Load realtime companies
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snap) => {
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ➕ Add company
  const handleAddCompany = async () => {
    if (!newCompany.trim()) return;
    try {
      await addDoc(collection(db, "companies"), {
        name: newCompany.trim(),
        regotRate: 125,
        regndRate: 130,
        spclholsunRate: 200,
        spclholsunotRate: 225,
        spclholsunndRate: 10,
        regholRate: 130,
        regholotRate: 200,
        regholndRate: 100,
        sunaddspclholRate: 100,
        sunaddspclholotRate: 100,
        sunaddspclholndRate: 100,
        sunaddregholRate: 100,
        sunaddregholotRate: 100,
        sunaddregholndRate: 100,
        sssRate: 5,
        hdmfRate: 2,
        phicRate: 2.5,
        serviceFeeType: "percentage", // NEW
        serviceFeeValue: 10,          // NEW
        createdAt: serverTimestamp(),
      });
      setSnackbar({ open: true, message: "Company added", severity: "success" });
      setNewCompany("");
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Error adding company",
        severity: "error",
      });
    }
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "companies", id));
      setSnackbar({ open: true, message: "Company deleted", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Error deleting company",
        severity: "error",
      });
    }
  };

  // ✏️ Open Edit Dialog
  const handleOpenEdit = (company) => {
    setEditingCompany(company);
    setEditRates({ ...company });
  };

  // ❌ Close Dialog
  const handleCloseDialog = () => {
    setEditingCompany(null);
    setEditRates({});
  };

  // 💾 Save All Rates
  const handleSaveRates = async () => {
    if (!editingCompany) return;
    try {
      const ref = doc(db, "companies", editingCompany.id);
      const fieldsToUpdate = { ...editRates };
      delete fieldsToUpdate.id;
      delete fieldsToUpdate.createdAt;

      await updateDoc(ref, fieldsToUpdate);
      setSnackbar({ open: true, message: "Rates updated", severity: "success" });
      handleCloseDialog();
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        message: "Error saving rates",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" align="center">
        Company Manager
      </Typography>

      {/* Add New Company */}
      <Box display="flex" gap={2} mt={2} mb={2}>
        <TextField
          label="New Company"
          value={newCompany}
          onChange={(e) => setNewCompany(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddCompany}>
          Add Company
        </Button>
      </Box>

      {/* Company Table */}
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Service Fee</TableCell>
              <TableCell align="center">SSS %</TableCell>
              <TableCell align="center">HDMF %</TableCell>
              <TableCell align="center">PHIC %</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell align="center">
                  {c.serviceFeeType === "percentage"
                    ? `${c.serviceFeeValue ?? 0}%`
                    : `₱${c.serviceFeeValue ?? 0}`}
                </TableCell>
                <TableCell align="center">{c.sssRate ?? "-"}</TableCell>
                <TableCell align="center">{c.hdmfRate ?? "-"}</TableCell>
                <TableCell align="center">{c.phicRate ?? "-"}</TableCell>
                <TableCell align="center">
                  <IconButton color="primary" onClick={() => handleOpenEdit(c)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton color="error" onClick={() => handleDelete(c.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* ✏️ Edit Dialog */}
      <Dialog open={!!editingCompany} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit Rates – {editingCompany?.name}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* NEW: Service Fee Section */}
            <Grid item xs={6}>
              <TextField
                select
                fullWidth
                label="Service Fee Type"
                value={editRates.serviceFeeType || "percentage"}
                onChange={(e) =>
                  setEditRates((prev) => ({
                    ...prev,
                    serviceFeeType: e.target.value,
                  }))
                }
              >
                <MenuItem value="percentage">Percentage (%)</MenuItem>
                <MenuItem value="fixed">Fixed Amount (₱)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Service Fee Value"
                value={editRates.serviceFeeValue ?? ""}
                onChange={(e) =>
                  setEditRates((prev) => ({
                    ...prev,
                    serviceFeeValue: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </Grid>

            {/* Existing Rate Fields */}
            {[
              "regotRate",
              "regndRate",
              "spclholsunRate",
              "spclholsunotRate",
              "spclholsunndRate",
              "regholRate",
              "regholotRate",
              "regholndRate",
              "sunaddspclholRate",
              "sunaddspclholotRate",
              "sunaddspclholndRate",
              "sunaddregholRate",
              "sunaddregholotRate",
              "sunaddregholndRate",
              "sssRate",
              "hdmfRate",
              "phicRate",
            ].map((field) => (
              <Grid item xs={6} sm={4} key={field}>
                <TextField
                  fullWidth
                  type="number"
                  label={field.replace(/([A-Z])/g, " $1")}
                  value={editRates[field] ?? ""}
                  onChange={(e) =>
                    setEditRates((prev) => ({
                      ...prev,
                      [field]: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRates}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyManager;
