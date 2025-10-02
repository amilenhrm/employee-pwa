// src/CompanyManager.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";

import { db } from "./firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  updateDoc,
  doc,
  getDocs,
  where
} from "firebase/firestore";

const CompanyManager = () => {
  const [companies, setCompanies] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    const q = query(collection(db, "companies"), orderBy("name"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCompanies(list);
      },
      (err) => {
        console.error("companies onSnapshot error", err);
        setSnackbar({ open: true, message: "Error loading companies", severity: "error" });
      }
    );
    return () => unsub();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAdd = async () => {
    const name = (newName || "").trim();
    if (!name) {
      showSnackbar("Company name is required", "error");
      return;
    }
    // prevent duplicate (by name, case-insensitive)
    if (companies.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      showSnackbar("Company already exists", "error");
      return;
    }
    try {
      await addDoc(collection(db, "companies"), { name, createdAt: serverTimestamp() });
      setNewName("");
      showSnackbar("Company added", "success");
    } catch (err) {
      console.error("add company error", err);
      showSnackbar("Error adding company", "error");
    }
  };

  const startEdit = (c) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async () => {
    const name = (editingName || "").trim();
    if (!name) {
      showSnackbar("Company name is required", "error");
      return;
    }
    if (companies.some((c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingId)) {
      showSnackbar("Company name already in use", "error");
      return;
    }
    try {
      await updateDoc(doc(db, "companies", editingId), { name });
      cancelEdit();
      showSnackbar("Company updated", "success");
    } catch (err) {
      console.error("update company error", err);
      showSnackbar("Error updating company", "error");
    }
  };

  const handleDelete = async (c) => {
  if (!window.confirm(`Delete company "${c.name}"?`)) return;

  try {
    // 🔹 Check employees referencing this company
    const q = query(collection(db, "employees"), where("company", "==", c.name));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      showSnackbar(
        `Cannot delete "${c.name}" — ${snapshot.size} employee(s) assigned.`,
        "error"
      );
      return;
    }

    // 🔹 Safe to delete
    await deleteDoc(doc(db, "companies", c.id));
    showSnackbar("Company deleted", "success");
  } catch (err) {
    console.error("delete company error", err);
    showSnackbar("Error deleting company", "error");
  }
};

  return (
    <Box sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        Manage Companies
      </Typography>

      <Box display="flex" gap={1} mb={2}>
        <TextField
          label="New Company"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          size="small"
          fullWidth
        />
        <Button variant="contained" onClick={handleAdd}>
          Add
        </Button>
      </Box>

      <Divider />

      <List dense>
        {companies.map((c) => (
          <ListItem
            key={c.id}
            secondaryAction={
              editingId === c.id ? (
                <>
                  <IconButton edge="end" onClick={saveEdit} aria-label="save">
                    <SaveIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={cancelEdit} aria-label="cancel">
                    <CloseIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton edge="end" onClick={() => startEdit(c)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(c)} aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                </>
              )
            }
          >
            {editingId === c.id ? (
              <TextField
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                size="small"
                fullWidth
              />
            ) : (
              <ListItemText primary={c.name} />
            )}
          </ListItem>
        ))}
        {companies.length === 0 && (
          <ListItem>
            <ListItemText primary="No companies yet. Add one above." />
          </ListItem>
        )}
      </List>

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
