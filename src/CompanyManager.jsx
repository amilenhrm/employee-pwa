// CompanyManager.jsx
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
  IconButton
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
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snap) => {
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // ➕ Add
  const handleAddCompany = async () => {
    if (!newCompany) return;
    try {
      await addDoc(collection(db, "companies"), {
        name: newCompany,
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
        sssRate: 4.5,
        hdmfRate: 2,
        phicRate: 3,
        createdAt: serverTimestamp(),
      });
      setSnackbar({ open: true, message: "Company added", severity: "success" });
      setNewCompany("");
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error adding company", severity: "error" });
    }
  };

  // ✏️ Edit Name
  const handleEditName = async (id) => {
    if (!editingName) return;
    try {
      await updateDoc(doc(db, "companies", id), { name: editingName });
      setSnackbar({ open: true, message: "Company updated", severity: "success" });
      setEditingId(null);
      setEditingName("");
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error updating company", severity: "error" });
    }
  };

  // ❌ Delete
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "companies", id));
      setSnackbar({ open: true, message: "Company deleted", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error deleting company", severity: "error" });
    }
  };

  // 🔄 Update Rates
  const handleRateChange = async (id, field, value) => {
    try {
      await updateDoc(doc(db, "companies", id), {
        [field]: parseFloat(value) || 0,
      });
      setSnackbar({ open: true, message: "Rates updated", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Error updating rates", severity: "error" });
    }
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" align="center">Company Manager</Typography>

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

      {/* Company List with Rates */}
      <Paper sx={{ overflowX: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Regular OT %</TableCell>
              <TableCell>Regular ND %</TableCell>
              <TableCell>Special Hol/Sun %</TableCell>
              <TableCell>Special Hol/Sun OT %</TableCell>
              <TableCell>Special Hol/Sun ND %</TableCell>
              <TableCell>Regular Hol %</TableCell>
              <TableCell>Regular Hol OT %</TableCell>
              <TableCell>Regular Hol ND %</TableCell>
              <TableCell>Sun + Special Holiday %</TableCell>
              <TableCell>Sun + Special Holiday OT %</TableCell>
              <TableCell>Sun + Special Holiday ND %</TableCell>
              <TableCell>Sun + Regular Holiday %</TableCell>
              <TableCell>Sun + Regular Holiday OT %</TableCell>
              <TableCell>Sun + Regular Holiday ND %</TableCell>
              <TableCell>SSS %</TableCell>
              <TableCell>HDMF %</TableCell>
              <TableCell>PHIC %</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((c) => (
              <TableRow key={c.id}>
                {/* Company Name (editable) */}
                <TableCell>
                  {editingId === c.id ? (
                    <Box display="flex" gap={1}>
                      <TextField
                        size="small"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                      />
                      <Button size="small" onClick={() => handleEditName(c.id)}>Save</Button>
                    </Box>
                  ) : (
                    c.name
                  )}
                </TableCell>

                {/* Rates */}
                <TableCell><TextField size="small" type="number" value={c.regotRate ?? ""} onChange={(e) => handleRateChange(c.id, "regotRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.regndRate ?? ""} onChange={(e) => handleRateChange(c.id, "regndRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.spclholsunRate ?? ""} onChange={(e) => handleRateChange(c.id, "spclholsunRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.spclholsunotRate ?? ""} onChange={(e) => handleRateChange(c.id, "spclholsunotRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.spclholsunndRate ?? ""} onChange={(e) => handleRateChange(c.id, "spclholsunndRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.regholRate ?? ""} onChange={(e) => handleRateChange(c.id, "regholRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.regholotRate ?? ""} onChange={(e) => handleRateChange(c.id, "regholotRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.regholndRate ?? ""} onChange={(e) => handleRateChange(c.id, "regholndRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddspclholRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddspclholRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddspclholotRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddspclholotRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddspclholndRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddspclholndRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddregholRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddregholRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddregholotRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddregholotRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sunaddregholndRate ?? ""} onChange={(e) => handleRateChange(c.id, "sunaddregholndRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.sssRate ?? ""} onChange={(e) => handleRateChange(c.id, "sssRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.hdmfRate ?? ""} onChange={(e) => handleRateChange(c.id, "hdmfRate", e.target.value)} /></TableCell>
                <TableCell><TextField size="small" type="number" value={c.phicRate ?? ""} onChange={(e) => handleRateChange(c.id, "phicRate", e.target.value)} /></TableCell>

                {/* Actions */}
                <TableCell>
                  <IconButton onClick={() => { setEditingId(c.id); setEditingName(c.name); }}>
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
