// PayrollManager.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Typography, Button, Snackbar, Alert, Tabs, Tab } from "@mui/material";
import { db } from "./firebase";
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import PayrollControls from "./PayrollControls";
import PayrollTable from "./PayrollTable";
import ContributionManager from "./ContributionManager";
import { formatCurrency, computeTotals } from "./utils/payrollUtils";
import { useReactToPrint } from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";
import SaveIcon from "@mui/icons-material/Save";

// Simple debounce util (file-local)
function debounce(fn, wait = 1500) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
const PayrollManager = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState("");
  const [companyRates, setCompanyRates] = useState(null);
  const [payrollData, setPayrollData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [activeTab, setActiveTab] = useState(0);
  const [loadingPayroll, setLoadingPayroll] = useState(false);
  const [sortedEmployeeOrder, setSortedEmployeeOrder] = useState([]);
  const tableRef = useRef(null);
  const savingRef = useRef(false);


  const handlePrint = useReactToPrint({
    content: () => tableRef.current,
    documentTitle: `Payroll_${company}_${period.start}_${period.end}`,
    removeAfterPrint: true,
  });

  // Load employees and companies (kept original onSnapshot)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "employees"), (snap) => {
      setEmployees(snap.docs.map((d, i) => ({ id: d.id, ...(d.data()), no: i + 1 })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "companies"), (snap) => {
      setCompanies(snap.docs.map((d) => ({ id: d.id, ...(d.data()) })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!company) return;
    const selected = companies.find((c) => c.name === company);
    if (selected) setCompanyRates(selected || {});
  }, [company, companies]);

  const activeEmployees = employees.filter((emp) => emp.company === company && ((emp.status ?? "Active") === "Active"));

  // --- handleChange: called from PayrollRow on blur
  const handleChange = useCallback((empId, field, value) => {
    setPayrollData((prev) => {
      const prevRow = prev[empId] || {};
      // only update if actually different - avoids extra re-renders
      if (prevRow[field] === value) return prev;
      const next = { ...prev, [empId]: { ...prevRow, [field]: value } };
      return next;
    });
    debouncedAutoSave(); // schedule save (debounced)
  }, []);

  // --- auto-save (debounced) using original save logic
  const savePayrollToDatabase = useCallback(async () => {
    if (!company || !period.start || !period.end) {
      alert("⚠️ Please select company and period first.");
      return;
    }

    // prevent overlapping saves
    if (savingRef.current) return;
    savingRef.current = true;

    const payrollDocRef = doc(db, "payrolls", `${company}_${period.start}_${period.end}`);
      try {
      const fullData = {};
      const sortedActive = [...activeEmployees].sort((a, b) => {
        const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    sortedActive.forEach((emp, idx) => {
        const d = payrollData[emp.id] || {};
        const cleanedData = {};
        for (const [field, val] of Object.entries(d)) {
          cleanedData[field] = parseFloat(val) || 0;
        }
        const totals = computeTotals(emp.id, payrollData, companyRates);
        const merged = { no: idx + 1, ...cleanedData, ...totals };
        // filter zeros except 'no'
        const filtered = Object.fromEntries(Object.entries(merged).filter(([k, v]) => k === "no" || (v !== 0 && v !== "" && v !== null && v !== undefined)));
        fullData[emp.id] = filtered;
      });

  await setDoc(payrollDocRef, { company, period, data: fullData, order: sortedActive.map((e) => e.id), updatedAt: new Date().toISOString() }, { merge: false });

      // optional: delete zero fields (kept original cleanup)
      const snap = await getDoc(payrollDocRef);
      if (snap.exists()) {
        for (const emp of activeEmployees) {
          const empData = payrollData[emp.id] || {};
          const combined = { ...empData, ...computeTotals(emp.id, payrollData, companyRates) };
          for (const [field, val] of Object.entries(combined)) {
            if (val === 0 || val === "" || val === null || val === undefined) {
              // keep cleanup but beware of many updateDoc calls on big datasets
              await updateDoc(payrollDocRef, { [`data.${emp.id}.${field}`]: deleteField() });
            }
          }
        }
      }

  alert("✅ Payroll saved to Database");
      localStorage.removeItem(`payroll_${company}_${period.start}_${period.end}`);
    } catch (err) {
      console.error("❌ Error saving payroll:", err);
      alert("❌ Failed to save payroll. Check console.");
    } finally {
      savingRef.current = false;
    }
  }, [company, period, payrollData, activeEmployees, companyRates]);

  // Debounced auto-save: will call savePayrollToDatabase after inactivity
  const debouncedAutoSave = useRef(debounce(() => {
    // do not auto-save if user hasn't selected company/period
    if (!company || !period.start || !period.end) return;
    savePayrollToDatabase();
  }, 1500)).current;

    // Load payroll document and localStorage fallback (kept original)
  useEffect(() => {
    if (!company || !period.start || !period.end) return;
    if (employees.length === 0) return;

    const key = `payroll_${company}_${period.start}_${period.end}`;
    const payrollDocRef = doc(db, "payrolls", `${company}_${period.start}_${period.end}`);

const loadData = async () => {
      setLoadingPayroll(true);
      try {
        const snap = await getDoc(payrollDocRef);
        if (snap.exists()) {
          const dbData = snap.data()?.data || {};
          setPayrollData(dbData);
        } else {
          const saved = localStorage.getItem(key);
          if (saved) setPayrollData(JSON.parse(saved));
          else setPayrollData({});
        }
      } catch (err) {
        console.error("❌ Failed to load payroll data:", err);
        setPayrollData({});
      } finally {
        setLoadingPayroll(false);
      }
    };

      loadData();
  }, [company, period.start, period.end, employees]);

  // savePayrollToDatabase used by Save button (manual)
  const handleManualSave = () => savePayrollToDatabase();

  // Export to Excel (kept original)
  const handleExportExcel = () => {
    const orderedEmployees = sortedEmployeeOrder.length
      ? sortedEmployeeOrder.map((id) => activeEmployees.find((emp) => emp.id === id)).filter(Boolean)
      : activeEmployees;

    const rows = orderedEmployees.map((emp) => {
      const d = payrollData[emp.id] || {};
      const totals = computeTotals(emp.id, payrollData, companyRates);
      // build row object (kept same keys as original)
      return {
        "#": emp.no,
        "EMP ID": emp.idNo ?? "",
        "Employee Name": `${emp.lastName}, ${emp.firstName}`,
        "Days (Regular)": d.days ?? 0,
        "Rate": d.rate ?? 0,
        "Regular Wage Amt": totals.regAmt,
        "OT Hrs (Regular)": d.regotHrs ?? 0,
        "OT Amt (Regular)": totals.regotAmt,
        "ND Hrs (Regular)": d.regndHrs ?? 0,
        "ND Amt (Regular)": totals.regndAmt,
        "Days (Special Hol/Sun)": d.days1 ?? 0,
        "Amt (Special Hol/Sun)": totals.spclholsunAmt,
        "OT Hrs (Special Hol/Sun)": d.spclholsunotHrs ?? 0,
        "OT Amt (Special Hol/Sun)": totals.spclholsunotAmt,
        "ND Hrs (Special Hol/Sun)": d.spclholsunndHrs ?? 0,
        "ND Amt (Special Hol/Sun)": totals.spclholsunndAmt,
        "Days (Regular Hol)": d.days2 ?? 0,
        "Amt (Regular Hol)": totals.regholAmt,
        "OT Hrs (Regular Hol)": d.regholotHrs ?? 0,
        "OT Amt (Regular Hol)": totals.regholotAmt,
        "ND Hrs (Regular Hol)": d.regholndHrs ?? 0,
        "ND Amt (Regular Hol)": totals.regholndAmt,
        "Days (Sun + Spcl Hol)": d.days3 ?? 0,
        "Amt (Sun + Spcl Hol)": totals.sunaddspclholAmt,
        "OT Hrs (Sun + Spcl Hol)": d.sunaddspclholotHrs ?? 0,
        "OT Amt (Sun + Spcl Hol)": totals.sunaddspclholotAmt,
        "ND Hrs (Sun + Spcl Hol)": d.sunaddspclholndHrs ?? 0,
        "ND Amt (Sun + Spcl Hol)": totals.sunaddspclholndAmt,
        "Days (Sun + Reg Hol)": d.days4 ?? 0,
        "Amt (Sun + Reg Hol)": totals.sunaddregholAmt,
        "OT Hrs (Sun + Reg Hol)": d.sunaddregholotHrs ?? 0,
        "OT Amt (Sun + Reg Hol)": totals.sunaddregholotAmt,
        "ND Hrs (Sun + Reg Hol)": d.sunaddregholndHrs ?? 0,
        "ND Amt (Sun + Reg Hol)": totals.sunaddregholndAmt,
        "Late Mins": d.lateMins ?? 0,
        "Late Amt": totals.lateAmt ?? 0,
        "Allowance": d.allowance ?? 0,
        "Incentives": d.incentives ?? 0,
        "Adjustment": d.adj ?? 0,
        "Gross Pay": totals.grossPay,
        "CO Loan": d.coLoan ?? 0,
        "CA": d.cA ?? 0,
        "SSS SLoan": d.sssLoan ?? 0,
        "SSS CLoan": d.sssCal ?? 0,
        "HDMF SLoan": d.hdmfLoan ?? 0,
        "HDMF CLoan": d.hdmfCal ?? 0,
        "SSS": totals.sss,
        "HDMF": totals.hdmf,
        "PHIC": totals.phic,
        "Net Pay": totals.netPay,
        "Signature": "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([wbout], { type: "application/octet-stream" }), `Payroll_${company}_${period.start}_${period.end}.xlsx`);
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" gutterBottom align="center">PAYROLL</Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Menu" />
        <Tab label="Create" />
        <Tab label="Contributions" />
      </Tabs>

      {activeTab === 2 && <ContributionManager />}

      {activeTab === 0 && (
        <Box textAlign="center">
          <Button variant="contained" disabled={isCreating} onClick={() => { setIsCreating(true); setActiveTab(1); setTimeout(() => setIsCreating(false), 1000); }}>
            {isCreating ? "Loading..." : "Create Payroll"}
          </Button>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          <PayrollControls
            employees={employees}
            company={company}
            setCompany={setCompany}
            period={period}
            setPeriod={setPeriod}
            handleExportExcel={handleExportExcel}
          />

          {company && period.start && period.end && (
            loadingPayroll ? (
              <Typography align="center" sx={{ mt: 3 }}>⏳ Loading Payroll Data.</Typography>
            ) : (
              <Box>
                <PayrollTable
                  ref={tableRef}
                  activeEmployees={activeEmployees}
                  payrollData={payrollData}
                  handleChange={handleChange}
                  companyRates={companyRates}
                  setSortedEmployeeOrder={setSortedEmployeeOrder}
                />

                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography variant="body1">
                    Total Net Pay: {formatCurrency(activeEmployees.reduce((sum, emp) =>
                      sum + (computeTotals(emp.id, payrollData, companyRates)?.netPay || 0), 0))}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3, textAlign: "center", display: "flex", justifyContent: "center", gap: 2 }}>
                  <Button variant="outlined" color="info" startIcon={<PrintIcon />} onClick={() => { if (!tableRef.current) { alert("⚠️ Table not ready to print."); return; } handlePrint(); }}>
                    Print
                  </Button>
                  <Button variant="outlined" color="success" startIcon={<SaveIcon />} onClick={handleManualSave}>
                    Save
                  </Button>
                </Box>
              </Box>
            )
          )}
        </Box>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PayrollManager;
