import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Paper,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
} from "@mui/material";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { formatCurrency } from "./utils/payrollUtils";

const COLUMN_ORDER = [
  "empNo",
  "name",
  "days",
  "rate",
  "regAmt",
  "regotAmt",
  "regholAmt",
  "regholotAmt",
  "regholndAmt",
  "spclholsunAmt",
  "spclholsunotAmt",
  "spclholsunndAmt",
  "sunaddspclholAmt",
  "sunaddspclholotAmt",
  "sunaddspclholndAmt",
  "sunaddregholAmt",
  "sunaddregholotAmt",
  "sunaddregholndAmt",
  "lateAmt",
  "allowance",
  "incentives",
  "adj",
  "grossPay",
  "serviceFee",
  "total"
];

const BillingStatement = () => {
  const [companyList, setCompanyList] = useState([]);
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [billingData, setBillingData] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedBillings, setSavedBillings] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");


  useEffect(() => {
  const loadSavedBillings = async () => {
    const snap = await getDocs(collection(db, "billings"));
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSavedBillings(list);
  };
  loadSavedBillings();
}, []);

  // 🔹 Load list of companies from Firestore
  useEffect(() => {
    const loadCompanies = async () => {
      const snap = await getDocs(collection(db, "companies"));
      const list = snap.docs.map((d) => d.data().name);
      setCompanyList(list);
    };
    loadCompanies();
  }, []);

  // 🔹 Generate Billing (Fetch Firestore Data)
const handleGenerate = async () => {
  if (!company || !period.start || !period.end) return;
  setLoading(true);

  try {
    const key = `${company}_${period.start}_${period.end}`;
    const ref = doc(db, "payrolls", key);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      alert("⚠️ No payroll data found for this company and period.");
      setBillingData([]);
      setVisibleColumns([]);
      setLoading(false);
      return;
    }

    const data = snap.data().data || {};

    // 🔹 Load employee names + ID numbers from Firestore "employees"
    const empSnap = await getDocs(collection(db, "employees"));
    const empMap = {};
    empSnap.docs.forEach((doc) => {
      const e = doc.data();
      empMap[doc.id] = {
        name: `${e.lastName ?? ""}, ${e.firstName ?? ""}`.trim(),
        idNo: e.idNo ?? doc.id, // fallback sa Firestore ID
      };
    });

    // 🔹 Format billing data per employee
    let formatted = Object.entries(data).map(([id, emp]) => {
      const empInfo = empMap[id] || { name: id, idNo: id };
      const gross = emp.grossPay ?? 0;
      const serviceFee = gross * 0.1;
      const total = gross + serviceFee;

      return {
        empNo: empInfo.idNo,
        name: empInfo.name,
        days: emp.days ?? 0,
        rate: emp.rate ?? 0,
        regAmt: emp.regAmt ?? 0,
        regotAmt: emp.regotAmt ?? 0,
        regholotAmt: emp.regholotAmt ?? 0,
        regndAmt: emp.regndAmt ?? 0,
        spclholsunAmt: emp.spclholsunAmt ?? 0,
        spclholsunotAmt: emp.spclholsunotAmt ?? 0,
        spclholsunndAmt: emp.spclholsunndAmt ?? 0,
        regholAmt: emp.regholAmt ?? 0,
        regholotAmt: emp.regholotAmt ?? 0,
        regholndAmt: emp.regholndAmt ?? 0,
        sunaddspclholAmt: emp.sunaddspclholAmt ?? 0,
        sunaddspclholotAmt: emp.sunaddspclholotAmt ?? 0,
        sunaddspclholndAmt: emp.sunaddspclholndAmt ?? 0,
        sunaddregholAmt: emp.sunaddregholAmt ?? 0,
        sunaddregholotAmt: emp.sunaddregholotAmt ?? 0,
        sunaddregholndAmt: emp.sunaddregholndAmt ?? 0,
        lateAmt: emp.lateAmt ?? 0,
        allowance: emp.allowance ?? 0,
        incentives: emp.incentives ?? 0,
        adj: emp.adj ?? 0,
        grossPay: gross,
        serviceFee,
        total,
      };
    });

    // 🔹 Filter out employees with 0 gross pay
    formatted = formatted.filter(emp => emp.grossPay > 0);

    setBillingData(formatted);

    // 🔹 Determine visible columns (hide all-zero)
    const cols = COLUMN_ORDER.filter((field) => {
      if (["empNo", "name"].includes(field)) return true;
      return formatted.some((row) => {
        const val = row[field];
        return val !== 0 && val !== null && val !== undefined && val !== "";
      });
    });
    setVisibleColumns(cols);

  } catch (err) {
    console.error("Error fetching billing data:", err);
    setBillingData([]);
    setVisibleColumns([]);
  }

  setLoading(false);
};
  // 🔹 Compute totals
  const totals = billingData.reduce(
    (acc, cur) => {
      acc.gross += cur.grossPay || 0;
      acc.fee += cur.serviceFee || 0;
      acc.total += cur.total || 0;
      return acc;
    },
    { gross: 0, fee: 0, total: 0 }
  );
 // ✅ Save Billing Statement to Firestore
  const saveBillingToDatabase = async () => {
  if (!company || !period.start || !period.end || billingData.length === 0) {
    alert("⚠️ Please generate billing first before saving.");
    return;
  }

  try {
  const key = `${company}_${period.start}_${period.end}`;
  const billingRef = doc(db, "billings", key);

  const dataToSave = {
    company,
    period,
    data: billingData,
    totals,
    updatedAt: new Date().toISOString(),
  };

  // 🔹 Save to Firestore
  await setDoc(billingRef, dataToSave, { merge: true });
  alert("✅ Billing statement saved successfully!");

  // 🔹 Refresh saved billings list para agad lumabas sa table
  const snap = await getDocs(collection(db, "billings"));
  setSavedBillings(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

} catch (err) {
  console.error("❌ Error saving billing:", err);
  alert("❌ Failed to save billing statement. Check console for details.");
}
};
  const handleLoadBilling = (bill) => {
  setCompany(bill.company);
  setPeriod(bill.period);
  setBillingData(bill.data);

  // 🔹 Hide columns with only 0 values (same logic as Generate)
  const cols = COLUMN_ORDER.filter((field) => {
  if (["empNo", "name"].includes(field)) return true;
  return bill.data.some((row) => {
    const val = row[field];
    return val !== 0 && val !== null && val !== undefined && val !== "";
  });
});
  setVisibleColumns(cols);
};

  return (
    <Box sx={{ mt: 4 }}>
      <Typography align="center" variant="h6" gutterBottom>
        Billing Statement
      </Typography>

      {/* 🔹 Filter Controls */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
        sx={{ mb: 3 }}
      >
        <TextField
          select
          label="Select Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">-- Select --</MenuItem>
          {companyList.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="date"
          label="Start Date"
          value={period.start}
          onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={period.end}
          onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!company || !period.start || !period.end}
        >
          Generate Billing
        </Button>
      </Box>
      <Box sx={{ mt: 5 }}>
  <Typography variant="h6" gutterBottom>
    📋 Saved Billing Statements
  </Typography>

  {savedBillings.length === 0 ? (
    <Typography color="text.secondary">
      No saved billings found.
    </Typography>
  ) : (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Company</TableCell>
            <TableCell>Period</TableCell>
            <TableCell>Date Saved</TableCell>
            <TableCell align="center">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {savedBillings.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.company}</TableCell>
              <TableCell>
                {bill.period.start} – {bill.period.end}
              </TableCell>
              <TableCell>
                {new Date(bill.updatedAt).toLocaleString()}
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleLoadBilling(bill)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )}
</Box>

      {/* 🔹 Billing Table */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : billingData.length > 0 ? (
        <Paper sx={{ width: "95%", mx: "auto", p: 2, overflowX: "auto" }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            {company} — {period.start} to {period.end}
          </Typography>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {visibleColumns.map((col) => (
                    <TableCell
                      key={col}
                      align={["empNo", "name"].includes(col) ? "left" : "right"}
                      sx={{
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        minWidth: col === "name" ? 200 : 100,
                        cursor: ["empNo", "name"].includes(col) ? "pointer" : "default",
                      }}
                      onClick={
                        ["empNo", "name"].includes(col)
                          ? () => {
                              if (sortBy === col) {
                                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                              } else {
                                setSortBy(col);
                                setSortOrder("asc");
                              }
                            }
                          : undefined
                      }
                    >
                      {col === "empNo"
                        ? `Emp No ${
                            sortBy === "empNo" ? (sortOrder === "asc" ? "▲" : "▼") : ""
                          }`
                        : col === "name"
                        ? `Employee Name ${
                            sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""
                          }`
                        : col === "grossPay"
                        ? "Gross Pay"
                        : col === "serviceFee"
                        ? "Service Fee (10%)"
                        : col === "total"
                        ? "Total"
                        : col
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (c) => c.toUpperCase())}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>


              <TableBody>
                {[...billingData]
                .sort((a, b) => {
                  if (!sortBy) return 0;
                  const valA = a[sortBy];
                  const valB = b[sortBy];
                  if (typeof valA === "string") {
                    return sortOrder === "asc"
                      ? valA.localeCompare(valB)
                      : valB.localeCompare(valA);
                  }
                  return sortOrder === "asc" ? valA - valB : valB - valA;
                })
                .map((emp, i) => (
                  <TableRow key={i}>
                    {visibleColumns.map((col) => (
                      <TableCell
                        key={col}
                        align={["empNo", "name"].includes(col) ? "left" : "right"}
                        sx={{ minWidth: col === "name" ? 200 : 100 }}
                      >
                        {typeof emp[col] === "number" ? formatCurrency(emp[col]) : emp[col]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

                {/* 🔹 Total Row */}
                <TableRow sx={{ fontWeight: "bold", backgroundColor: "#f8f9fa" }}>
                  {visibleColumns.map((col, index) => {
                    if (col === "name") {
                      return (
                        <TableCell key={col} align="left">
                          TOTAL
                        </TableCell>
                      );
                    }
                    if (col === "empNo") {
                      return <TableCell key={col}></TableCell>;
                    }
                    const value =
                      col === "grossPay"
                        ? totals.gross
                        : col === "serviceFee"
                        ? totals.fee
                        : col === "total"
                        ? totals.total
                        : "";
                    return (
                      <TableCell key={col} align="right">
                        {value !== "" ? formatCurrency(value) : ""}
                      </TableCell>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ textAlign: "center", mt: 2 }}>
        <Button
          variant="contained"
          color="success"
          onClick={saveBillingToDatabase}
        >
          💾 Save Billing to Database
        </Button>
      </Box>
        </Paper>
      ) : (
        <Typography align="center" color="text.secondary">
          No data available.
        </Typography>
      )}
    </Box>
  );
};

export default BillingStatement;
