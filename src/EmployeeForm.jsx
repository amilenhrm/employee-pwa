// EmployeeForm.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import RestoreIcon from "@mui/icons-material/Restore";
import BackupIcon from "@mui/icons-material/Backup";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputLabel,
  FormControl,
  Typography,
  Box,
  TablePagination,
  Snackbar,
  Alert,
  Menu,
  IconButton,
} from "@mui/material";

// 🔹 Firebase imports
import { db } from "./firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

// ---------- Initial data & config ----------
const initialEmployee = {
  idNo: "",
  lastName: "",
  firstName: "",
  middleName: "",
  suffix: "",
  gender: "",
  maritalStatus: "",
  birthdate: "",
  startDate: "",
  contractDuration: "0",
  endDate: "",
  position: "",
  department: "",
  company: "",
  status: "",
  pagIbigNo: "",
  sssNo: "",
  philHealthNo: "",
  tinNo: "",
  contactNo: "",
  emailAddress: "",
  presentAddress: "",
};

const fieldConfig = [
  { name: "idNo", label: "Emp ID #", readOnly: true },
  { name: "lastName", label: "Last Name", required: true },
  { name: "firstName", label: "First Name", required: true },
  { name: "middleName", label: "Middle Name" },
  { name: "suffix", label: "Suffix" },
  { name: "gender", label: "Gender" },
  { name: "maritalStatus", label: "Marital Status" },
  { name: "birthdate", label: "Birthdate", type: "date" },
  { name: "startDate", label: "Start Date", type: "date" },
  { name: "contractDuration", label: "Contract Duration (months)", type: "number" },
  { name: "endDate", label: "End Date", type: "date", readOnly: true },
  { name: "position", label: "Position" },
  { name: "department", label: "Department" },
  { name: "company", label: "Company", required: true, type: "select" },
  { name: "status", label: "Status", readOnly: true },
  { name: "pagIbigNo", label: "Pag-IBIG No" },
  { name: "sssNo", label: "SSS No" },
  { name: "philHealthNo", label: "PhilHealth No" },
  { name: "tinNo", label: "TIN No" },
  { name: "contactNo", label: "Contact No" },
  { name: "emailAddress", label: "Email Address", type: "email" },
  { name: "presentAddress", label: "Present Address" },
];

// Helper to generate Employee IDs
let empCounter = 0;
const generateIdNo = () => {
  empCounter++;
  return `EMP-${empCounter.toString().padStart(4, "0")}`;
};
// ---------- Component ----------
const EmployeeForm = () => {
  // state
  const [filterCompany, setFilterCompany] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [companyList, setCompanyList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState(initialEmployee);
  const [errors, setErrors] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCompany] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const tableRef = useRef();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
// ---------- Load from Firestore ----------
  useEffect(() => {
  const unsub = onSnapshot(collection(db, "companies"), (snapshot) => {
    const list = snapshot.docs.map((d) => d.data().name);
    setCompanyList(list);
  });
  return () => unsub();
}, []);
  useEffect(() => {
  const unsub = onSnapshot(collection(db, "employees"), (snapshot) => {
    const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    setEmployees(list);

    // update empCounter
    const maxId = list.reduce((max, e) => {
      const m = String(e.idNo || "").match(/EMP-(\d+)/);
      return m ? Math.max(max, parseInt(m[1])) : max;
    }, 0);
    empCounter = maxId;
  });
  return () => unsub();
}, []);

  // Print employee table only
const handlePrint = () => {
  const printContent = tableRef.current;
  const WinPrint = window.open("", "", "width=1200,height=900");
  WinPrint.document.write(`
    <html>
      <head>
        <title>Employee List</title>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 12px; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);
  WinPrint.document.close();
  WinPrint.focus();
  WinPrint.print();
  WinPrint.close();
};

// Export to PDF
const handleExportPDF = () => {
  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.text("Employee List", 14, 15);

  const tableColumn = Object.keys(initialEmployee).map((key) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())
  );
  const tableRows = employees.map((emp) =>
    Object.keys(initialEmployee).map((key) =>
      ["birthdate", "startDate", "endDate"].includes(key) ? formatDate(emp[key]) : emp[key]
    )
  );

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save("employees.pdf");
};

  // pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // auto-calc endDate when startDate or contractDuration changes
  useEffect(() => {
    if (employee.startDate && employee.contractDuration) {
      const months = parseInt(employee.contractDuration, 10);
      if (!isNaN(months)) {
        const start = new Date(employee.startDate);
        const end = new Date(start.getTime());
        end.setMonth(end.getMonth() + months);
        const iso = end.toISOString().split("T")[0];
        setEmployee((prev) => ({ ...prev, endDate: iso }));
        return;
      }
    }
    setEmployee((prev) => ({ ...prev, endDate: "" }));
  }, [employee.startDate, employee.contractDuration]);

  // auto-set status (Active/Inactive)
  useEffect(() => {
    if (employee.startDate && employee.endDate) {
      const today = new Date();
      const start = new Date(employee.startDate);
      const end = new Date(employee.endDate);
      const status = today >= start && today <= end ? "Active" : "Inactive";
      setEmployee((prev) => ({ ...prev, status }));
    } else {
      setEmployee((prev) => ({ ...prev, status: "" }));
    }
  }, [employee.startDate, employee.endDate]);

  // helpers
  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return "";
    return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(
      date.getDate()
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // ---------- Validation ----------
  const validateField = (name, value) => {
    let error = "";
    if (["lastName", "firstName", "company"].includes(name) && !value)
      error = "This field is required";
    if (name === "sssNo" && value && value.length !== 10)
      error = "SSS must be 10 digits";
    if (name === "philHealthNo" && value && value.length !== 12)
      error = "PhilHealth must be 12 digits";
    if (name === "pagIbigNo" && value && value.length !== 12)
      error = "Pag-IBIG must be 12 digits";
    if (name === "tinNo" && value && value.length !== 9)
      error = "TIN must be 9 digits";
    if (name === "contactNo" && value && value.length !== 11)
      error = "Contact No must be 11 digits";
    if (name === "emailAddress" && value && !/\S+@\S+\.\S+/.test(value))
      error = "Invalid email format";
    return error;
  };

  /// ---------- Handlers ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name !== "emailAddress") newValue = value.toUpperCase();
    if (name === "sssNo") newValue = value.replace(/\D/g, "").slice(0, 10);
    if (["philHealthNo", "pagIbigNo"].includes(name))
      newValue = value.replace(/\D/g, "").slice(0, 12);
    if (name === "tinNo") newValue = value.replace(/\D/g, "").slice(0, 9);
    if (name === "contactNo") newValue = value.replace(/\D/g, "").slice(0, 11);

    setEmployee((prev) => ({ ...prev, [name]: newValue }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
  };

  // submit (add or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    fieldConfig.forEach((f) => {
      const err = validateField(f.name, employee[f.name]);
      if (err) newErrors[f.name] = err;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      showSnackbar("Please fix validation errors", "error");
      return;
    }

    try {
      if (editIndex !== null) {
  if (!window.confirm("Are you sure you want to update this employee?")) return;

  const docRef = doc(db, "employees", editIndex);
  await updateDoc(docRef, employee);

  setEmployees((prev) =>
    prev.map((e) =>
      e.id === editIndex ? { ...e, ...employee } : e
    )
  );

  setEditIndex(null);
  showSnackbar("Employee updated successfully", "success");
} else {
      // ✅ ADD NEW EMPLOYEE
      const newEmployee = {
        ...employee,
        idNo: employee.idNo || generateIdNo(),
      };

      const docRef = await addDoc(collection(db, "employees"), newEmployee);

      setEmployees((prev) => [
        ...prev,
        { ...newEmployee, id: docRef.id },
      ]);

      showSnackbar("Employee added successfully", "success");
    }
    setEmployee(initialEmployee);
  } catch (error) {
      console.error(error);
      showSnackbar("Error saving employee", "error");
    }
  };

  // reset form
  const handleReset = () => {
    setEmployee(initialEmployee);
    setEditIndex(null);
    setErrors({});
  };

  // edit
  const handleEdit = (emp) => {
  setEmployee(emp);
  setEditIndex(emp.id);
};

  // delete
  const handleDelete = async (emp) => {
  if (!window.confirm("Delete this employee?")) return;

  try {
    await deleteDoc(doc(db, "employees", emp.id));

    setEmployees((prev) => prev.filter((e) => e.id !== emp.id));

    if (editIndex === emp.id) {
      setEmployee(initialEmployee);
      setEditIndex(null);
    }

    showSnackbar("Employee deleted successfully", "success");
  } catch (err) {
    console.error(err);
    showSnackbar("Error deleting employee", "error");
  }
};

  // ---------- Sorting / Filtering ----------
  const requestSort = (key) => {
    let dir = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") dir = "desc";
    setSortConfig({ key, direction: dir });
  };

  const sortedEmployees = useMemo(() => {
    let arr = [...employees];
    if (sortConfig.key) {
      arr.sort((a, b) => {
        let aVal = a[sortConfig.key] ?? "";
        let bVal = b[sortConfig.key] ?? "";
        if (["birthdate", "startDate", "endDate"].includes(sortConfig.key)) {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        } else {
          aVal = String(aVal).toLowerCase();
          bVal = String(bVal).toLowerCase();
        }
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [employees, sortConfig]);

  const filteredEmployees = sortedEmployees
  .filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      emp.company.toLowerCase().includes(search.toLowerCase())
    );
  })
  .filter((emp) =>
    filterCompany && filterCompany !== "ALL EMPLOYEES"
      ? emp.company === filterCompany
      : true
  )
  .filter((emp) =>
    filterStatus && filterStatus !== "ALL STATUS"
      ? emp.status === filterStatus
      : true
  );
    const paginatedEmployees = useMemo(() => {
  const start = page * rowsPerPage;
  return filteredEmployees.slice(start, start + rowsPerPage);
}, [filteredEmployees, page, rowsPerPage]);
  // excel export
  const handleExportExcel = () => {
    const wsData = employees.map((emp) =>
      Object.keys(initialEmployee).map((key) => (["birthdate", "startDate", "endDate"].includes(key) ? formatDate(emp[key]) : emp[key]))
    );
    // header row
    wsData.unshift(Object.keys(initialEmployee).map((key) => key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())));
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), "employees.xlsx");
  };

  // excel import (simple)
  const handleImportExcel = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length > 0) {
        for (const row of json) {
          const newRow = { ...initialEmployee };
          Object.keys(row).forEach((col) => {
            const normalizedCol = String(col).replace(/\s+/g, "").toLowerCase();
            const matchKey = Object.keys(initialEmployee).find(
              (k) =>
                k.toLowerCase() === normalizedCol ||
                k.toLowerCase() === normalizedCol.replace(/[^a-z]/g, "")
            );
            if (matchKey) newRow[matchKey] = row[col];
          });
          newRow.idNo = newRow.idNo || generateIdNo();

          const docRef = await addDoc(collection(db, "employees"), newRow);
          setEmployees((prev) => [...prev, { ...newRow, id: docRef.id }]);
        }
        showSnackbar("Excel data imported to Firestore", "success");
      }
    } catch (err) {
      console.error(err);
      showSnackbar("Error importing Excel file", "error");
    }
  };
  reader.readAsArrayBuffer(file);
  e.target.value = null;
};

  // JSON backup
  const handleBackupJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(employees, null, 2)], { type: "application/json" });
      saveAs(blob, "employees_backup.json");
    } catch {
      alert("Error creating JSON backup");
    }
  };
  // JSON restore
const handleRestoreJSON = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const json = JSON.parse(evt.target.result);
      const data = Array.isArray(json) ? json : json.employees;
      if (!Array.isArray(data)) throw new Error("Invalid JSON structure");

      for (const row of data) {
        const newRow = { ...initialEmployee, ...row };
        newRow.idNo = newRow.idNo || generateIdNo();

        const docRef = await addDoc(collection(db, "employees"), newRow);
        setEmployees((prev) => [...prev, { ...newRow, id: docRef.id }]);
      }

      showSnackbar("JSON restored to Firestore", "success");
    } catch (err) {
      console.error(err);
      showSnackbar("Invalid JSON file!", "error");
    }
  };
  reader.readAsText(file);
  e.target.value = null;
};
  // pagination handlers
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  const startGlobalIndex = page * rowsPerPage;

  // ---------- UI ----------
  return (
    <Box display="flex" flexDirection={{ xs: "column", md: "row" }} height="100vh">
      {/* Left: Form */}
      <Box width={{ xs: "100%", md: 300 }} p={0} borderRight={{ md: "1px solid #ccc" }} sx={{ overflowY: "auto", flexShrink: 0 }}>
        <Typography variant="h5" gutterBottom>
          {editIndex !== null ? "Edit Employee" : "Add Employee"}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box display="flex" flexDirection="column" gap={1} mb={1}>
            {fieldConfig.map((f) => (
              <FormControl key={f.name} fullWidth>
                {f.type === "select" ? (
                  <>
                    <InputLabel shrink>{f.label}</InputLabel>
                    <Select
                      id={f.name}
                      name={f.name}
                      value={employee[f.name] || ""}
                      onChange={handleChange}
                      required={f.required}
                      error={!!errors[f.name]}
                    >
                      <MenuItem value="">-- Select --</MenuItem>
                      {companyList.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors[f.name] && (
                      <Typography variant="caption" color="error">
                        {errors[f.name]}
                      </Typography>
                    )}
                  </>
                ) : (
                  <TextField
                    id={f.name}
                    label={f.label}
                    type={f.type || "text"}
                    name={f.name}
                    value={employee[f.name] || ""}
                    onChange={handleChange}
                    required={f.required}
                    InputProps={{ readOnly: f.readOnly }}
                    InputLabelProps={{ shrink: f.type === "date" ? true : undefined }}
                    error={!!errors[f.name]}
                    helperText={errors[f.name] || ""}
                    fullWidth
                  />
                )}
              </FormControl>
            ))}
          </Box>

          <Box display="flex" gap={1} mb={2}>
            <Button type="submit" variant="contained" fullWidth>
              {editIndex !== null ? "Update Employee" : "Add Employee"}
            </Button>
            <Button variant="outlined" onClick={handleReset} fullWidth>
              Reset
            </Button>
          </Box>
        </form>
      </Box>
      {/* Right: Table panel */}
      <Box flex={1} p={3} sx={{ overflowX: "auto" }}>
        <Typography variant="h5" gutterBottom>
          {selectedCompany ? `${selectedCompany} Employees` : ""}
        </Typography>
        {/* company filters */}
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          select
          label="Filter by Company"
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL EMPLOYEES">ALL EMPLOYEES</MenuItem>
          {companyList.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL STATUS">ALL STATUS</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
        </TextField>
      </Box>

        {/* Search + Export */}
      <Box
  sx={{
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: "#fff",
    p: 1,
    borderBottom: "1px solid #ddd",
  }}
  display="flex"
  alignItems="center"
  gap={2}
>
  <TextField
    placeholder="Search by Name or Company"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    size="small"
    sx={{ width: 250 }}
  />

  <Button variant="outlined" onClick={handleMenuClick}>
    Export / Import
  </Button>
  {/* Dropdown Menu (Export/Import/Backup) same as before */}

        <Menu anchorEl={anchorEl} open={open} onClose={handleMenuClose}>
        {/* EXPORTS */}
        <MenuItem
          onClick={() => {
            handleExportExcel();
            handleMenuClose();
          }}
        >
          <DownloadIcon fontSize="small" style={{ marginRight: 8 }} />
          Export to Excel
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleExportPDF();
            handleMenuClose();
          }}
        >
          <PictureAsPdfIcon fontSize="small" style={{ marginRight: 8 }} />
          Export to PDF
        </MenuItem>
        <MenuItem
          onClick={() => {
            handlePrint();
            handleMenuClose();
          }}
        >
          <PrintIcon fontSize="small" style={{ marginRight: 8 }} />
          Print Employees
        </MenuItem>

        {/* Divider */}
        <Box sx={{ borderTop: "1px solid #ddd", my: 1 }} />

        {/* IMPORT from Excel */}
        <MenuItem component="label">
          <UploadFileIcon fontSize="small" style={{ marginRight: 8 }} />
          Import from Excel
          <input
            type="file"
            hidden
            accept=".xlsx, .xls"
            onChange={handleImportExcel}
          />
        </MenuItem>

        <MenuItem component="label">
          <RestoreIcon fontSize="small" style={{ marginRight: 8 }} />
          Restore JSON Database
          <input
            type="file"
            hidden
            accept=".json"
            onChange={handleRestoreJSON}
          />
        </MenuItem>

        {/* BACKUP JSON */}
        <MenuItem
          onClick={() => {
            handleBackupJSON();
            handleMenuClose();
          }}
        >
          <BackupIcon fontSize="small" style={{ marginRight: 8 }} />
          Backup to JSON
        </MenuItem>
      </Menu>
        </Box>
        {/* Table */}
        <TableContainer component={Paper} sx={{ maxHeight: "70vh" }}ref={tableRef}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {/* idNo sticky left */}
                <TableCell
                  key="idNo_header"
                  sx={{
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    position: "sticky",
                    left: 0,
                    background: "#fff",
                    zIndex: 4,
                    minWidth: 120,
                  }}
                  onClick={() => requestSort("idNo")}
                >
                  Emp ID {sortIndicator("idNo")}
                </TableCell>

                {Object.keys(initialEmployee)
                  .filter((k) => k !== "idNo")
                  .map((key) => (
                    <TableCell key={key} sx={{ whiteSpace: "nowrap", cursor: "pointer" }} onClick={() => requestSort(key)}>
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                      {sortIndicator(key)}
                    </TableCell>
                  ))}

                {/* Actions sticky right */}
                <TableCell
                  key="actions_header"
                  sx={{
                    position: "sticky",
                    right: 0,
                    background: "#fff",
                    zIndex: 4,
                    whiteSpace: "nowrap",
                    minWidth: 140,
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, idx) => {
                  return (
                    <TableRow
                    key={emp.id || emp.idNo || globalIndex}
                    sx={{
                      background:
                        emp.status === "Active" ? "#e8f5e9" : emp.status === "Inactive" ? "#f5f5f5" : "inherit",
                    }}
                  >
                      {/* idNo sticky left */}
                      <TableCell
                        sx={{
                          position: "sticky",
                          left: 0,
                          background: "#fff",
                          zIndex: 3,
                          whiteSpace: "nowrap",
                          minWidth: 120,
                        }}
                      >
                        {emp.idNo}
                      </TableCell>

                      {Object.keys(initialEmployee)
                        .filter((k) => k !== "idNo")
                        .map((key) => (
                          <TableCell key={`${emp.idNo}_${key}`} sx={{ whiteSpace: "nowrap" }}>
                            {["birthdate", "startDate", "endDate"].includes(key) ? formatDate(emp[key]) : emp[key]}
                          </TableCell>
                        ))}

                      {/* Actions */}
                      <TableCell
                        sx={{
                          position: "sticky",
                          right: 0,
                          background: "#fff",
                          zIndex: 2,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <IconButton color="primary" size="small" onClick={() => handleEdit(emp)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleDelete(emp)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>

                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={Object.keys(initialEmployee).length + 1} align="center">
                    No employees found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={filteredEmployees.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Box>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeeForm;
