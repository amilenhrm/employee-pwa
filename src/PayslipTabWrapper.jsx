// src/PayslipTabWrapper.jsx
import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { formatCurrency } from "./utils/payrollUtils";

const PayslipTabWrapper = () => {
  const [company, setCompany] = useState("");
  const [companyList, setCompanyList] = useState([]);
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [employees, setEmployees] = useState([]);
  const [layout, setLayout] = useState("coin");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);


  // 🔹 Load companies list
  useEffect(() => {
    const loadCompanies = async () => {
      const snap = await getDocs(collection(db, "companies"));
      setCompanyList(snap.docs.map((d) => d.data().name));
    };
    loadCompanies();
  }, []);

  // 🔹 Generate / Load payslips
const handleGenerate = async () => {
  setCurrentPage(0);

  if (!company || !period.start || !period.end) return;
  setLoading(true);
  try {
    const key = `${company}_${period.start}_${period.end}`;
    const snap = await getDoc(doc(db, "payrolls", key));

    if (!snap.exists()) {
      alert("⚠️ No payroll data found for this company & period.");
      setEmployees([]);
      return;
    }

    const data = snap.data().data || {};

    // 🧮 Fetch employees for correct order
const empSnap = await getDocs(collection(db, "employees"));
const allEmployees = empSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

// 🔹 Basahin ang last sorted order mula Payroll Table (kung meron)
let lastOrder = [];
try {
  const stored = localStorage.getItem("lastSortedEmployeeOrder");
  if (stored) {
    lastOrder = JSON.parse(stored);
    console.log("✅ Loaded Payroll Table order:", lastOrder.length, "employees");
  } else {
    console.warn("⚠️ No saved order found in localStorage.");
  }
} catch (err) {
  console.error("⚠️ Error reading localStorage order:", err);
  lastOrder = [];
}

// 🔹 Filter employees for this company + may payroll data
const filtered = allEmployees.filter(
  (emp) => emp.company === company && data[emp.id]
);

// 🔹 Sort ayon sa Payroll Table order (fallback: alphabetical)
const ordered = filtered.sort((a, b) => {
  const ia = lastOrder.indexOf(a.id);
  const ib = lastOrder.indexOf(b.id);

  if (ia === -1 && ib === -1) {
    // fallback sort by name
    const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
    const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
    return nameA.localeCompare(nameB);
  }
  if (ia === -1) return 1; // move to end
  if (ib === -1) return -1;
  return ia - ib;
});

// 🔹 Save final ordered list
setEmployees(ordered);
console.log("✅ Payslip order applied:", ordered.map((e) => e.id));

  } catch (e) {
    console.error("Error loading payroll:", e);
  } finally {
    setLoading(false);
  }
};

  /// 🔹 Print all payslips (one per 3x5 page)
const handlePrintAll = () => {
  const payslipsContainer = document.querySelector(".payslip-wrapper");
  if (!payslipsContainer) {
    alert("No payslips to print.");
    return;
  }

  const printWindow = window.open("", "_blank");
  printWindow.document.write(`
    <html>
      <head>
        <title>Payslips</title>
        <style>
          @page {
            size: 3in 5in;
            margin: 0;
          }
          html, body {
            width: 3in;
            height: 5in;
            margin: 0;
            padding: 0;
            background: white;
            overflow: hidden;
            font-family: Arial, sans-serif;
          }
          .payslip {
            width: 3in;
            height: 5in;
            margin: 0 auto;
            padding: 12px;
            box-sizing: border-box;
            page-break-after: always;
            overflow: hidden;
          }
          .MuiDivider-root {
            border-top: 1px solid #000 !important;
            margin: 2px 0 !important;
            width: 50%;
          }
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body, .payslip {
              width: 3in !important;
              height: 5in !important;
            }
            .payslip {
              box-shadow: none !important;
              page-break-after: always !important;
            }
          }
        </style>
      </head>
      <body>${payslipsContainer.innerHTML}</body>
    </html>
  `);

  setTimeout(() => {
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 800);
};


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" align="center" gutterBottom>
        Payslip Generator & Printing
      </Typography>

      {/* 🔹 Filter Controls */}
      <Box
        display="flex"
        justifyContent="center"
        gap={2}
        flexWrap="wrap"
        mb={2}
        className="no-print"
      >
        <TextField
          select
          label="Company"
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
          label="Start"
          value={period.start}
          onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End"
          value={period.end}
          onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          select
          label="Layout"
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="letter">Letter – 2 Payslips/Page</MenuItem>
          <MenuItem value="coin">Coin Envelope 3x5 – 1/Page</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={handleGenerate}
          disabled={!company || !period.start || !period.end}
        >
          Load
        </Button>

        {employees.length > 0 && (
          <Button variant="outlined" color="success" onClick={handlePrintAll}>
            🖨 Print All
          </Button>
        )}
      </Box>

      {/* 🔹 Payslip Display (Paginated) */}
{loading ? (
  <Typography align="center">Loading...</Typography>
) : employees.length > 0 ? (
  <Box textAlign="left">
    {/* Show single payslip only */}
    <Box className="payslip-wrapper" sx={{ display: "flex", justifyContent: "center" }}>
        <Payslip
          key={employees[currentPage].id || employees[currentPage]}
          company={company}
          period={period}
          empId={employees[currentPage]}
          index={currentPage}
          total={employees.length}
        />
    </Box>

    {/* Pagination controls */}
<Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={2} className="no-print">
  <Button
    variant="outlined"
    disabled={currentPage === 0}
    onClick={() => setCurrentPage((p) => Math.max(p - 1, 0))}
  >
    ◀ Previous
  </Button>

  <Typography variant="body2" component="div">
    Page{" "}
    <TextField
      size="small"
      type="number"
      value={currentPage + 1}
      onChange={(e) => {
        let value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 1 && value <= employees.length) {
          setCurrentPage(value - 1);
        }
      }}
      inputProps={{
        min: 1,
        max: employees.length,
        style: { width: 60, textAlign: "center" },
      }}
    />{" "}
    of {employees.length}
  </Typography>

  <Button
    variant="outlined"
    disabled={currentPage === employees.length - 1}
    onClick={() => setCurrentPage((p) => Math.min(p + 1, employees.length - 1))}
  >
    Next ▶
  </Button>
</Box>

  </Box>
) : (
  <Typography align="center">No payslips to display.</Typography>
)}

    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/* 🧾 SINGLE PAYSLIP COMPONENT */
/* -------------------------------------------------------------------------- */
const Payslip = ({ company, period, empId, index, total }) => { 
  const employeeId = typeof empId === "object" ? empId.id : empId;

  const [empData, setEmpData] = useState(undefined); 
  const [employeeName, setEmployeeName] = useState(""); 
  const [fontScale, setFontScale] = useState(1); 
  const slipRef = useRef(null); 
  useEffect(() => { 
    let cancelled = false; 
  const fetchPayslipData = async () => { 
    if (!company || !period?.start || !period?.end || !employeeId) { 
    setEmpData(undefined); 
    return; 
  } 
  setEmpData(undefined); 
  try { 
    const key = `${company}_${period.start}_${period.end}`; 
    const ref = doc(db, "payrolls", key); 
    const snap = await getDoc(ref); 
      if (cancelled) return; 
      if (snap.exists()) { 
        const docData = snap.data();
        const e = docData?.data?.[employeeId]; 
        setEmpData(e || null); 

      if (e?.name) setEmployeeName(e.name); 
      else if (e?.fullName) setEmployeeName(e.fullName); 
    } else setEmpData(null); } 
      catch (err) { 
      console.error("❌ Error loading payslip data:", err); 
      setEmpData(null); 
    } 
  }; 
  fetchPayslipData(); 
  return () => (cancelled = true); 
}, [company, period?.start, period?.end, employeeId]); 

// 🔹 Fetch employee name fallback 
useEffect(() => { 
  const fetchEmployeeName = async () => { 
    try { 
      const ref = doc(db, "employees", employeeId); 
      const snap = await getDoc(ref); 
      if (snap.exists()) { 
        const d = snap.data(); 
        setEmployeeName(`${d.lastName}, ${d.firstName}`); 
      } 
    } catch (err) { 
      console.error("⚠️ Failed to load employee info:", err); 
    } 
  }; 
  if (employeeId) fetchEmployeeName(); 
}, [employeeId, employeeName]); 

// 🔹 Auto font scaling para magkasya sa 3x5 inch area 
useLayoutEffect(() => {
  if (!slipRef.current) return;
  const el = slipRef.current;

  const adjustFont = () => {
    let scale = 1;
    const maxHeight = el.offsetHeight * 0.95;
    const maxWidth = el.offsetWidth * 0.95;
    el.style.fontSize = `${0.75 * scale}rem`;

    while (
      (el.scrollHeight > maxHeight || el.scrollWidth > maxWidth) && 
      scale > 0.5
    ) {
      scale -= 0.05;
      el.style.fontSize = `${0.75 * scale}rem`;
    }
    setFontScale(scale);
  };

  const observer = new ResizeObserver(() => adjustFont());
  observer.observe(el);
  setTimeout(adjustFont, 300);
  return () => observer.disconnect();
}, [empData]);

    const f = (v) => `${formatCurrency(v ?? 0)}`; 
    const show = (v) => v !== undefined && v !== null && v !== 0 && v !== ""; 
      
    if (empData === undefined) 
      return ( 
        <Box sx={{ textAlign: "center", mt: 2 }}> 
          <CircularProgress size={20} /> 
        </Box> );

    if (empData === null) 
      return (
        <Typography sx={{ textAlign: "center", mt: 2 }}> 
          ⚠️ No payslip data found for this employee. 
        </Typography> 
      ); 

    return ( 
      <Paper 
        ref={slipRef}
        className="payslip"
        sx={{ 
          p: 1.5, 
          mt: 2, 
          mx: "auto", 
          width: "3in", 
          minHeight: "5in", 
          overflow: "hidden", 
          fontSize: `${.75 * fontScale}rem`, 
          boxShadow: 2, 
          "@media print": { 
            margin: 1, 
            boxShadow: "none", 
            pageBreakAfter: "always",  
          }, 
        }} 
      > 
                      
        {/* --- Employee Info --- */} 
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.1, }}>
          <Typography sx={{ fontWeight: "bold", fontSize: `${1.5 * fontScale}rem` }}>
            <strong>Name:</strong> {employeeName || employeeId}
          </Typography>
          <Typography sx={{ fontSize: `${1.5 * fontScale}rem`, fontWeight: "medium" }}>
          {index + 1}
          </Typography>
          </Box>
        <Box sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${.5 * fontScale}rem` }}>         
          <Typography sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${1.1 * fontScale}rem` }}>
            <strong>Period:</strong> {period.start} to {period.end}
          </Typography> 
        </Box> 
        
        <Divider sx={{ my: 0.1 }} />

        {/* --- Earnings --- */} 
        <Typography 
          variant="subtitle2" 
          sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${1.3 * fontScale}rem` }}
        >
          EARNINGS
        </Typography> 
                
        <Box sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${.5 * fontScale}rem` }}> 
          {show(empData.rate) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Rate: {f(empData.rate)}
            </Typography>} 
          {show(empData.days) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Days Worked: {empData.days}
            </Typography>} 
          {show(empData.regAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Regular Pay: {f(empData.regAmt)}
            </Typography>} 
          {show(empData.regotAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Regular OT Pay: {f(empData.regotAmt)}
            </Typography>} 
          {show(empData.regndAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Regular ND Pay: {f(empData.regndAmt)}
            </Typography>} 
          {show(empData.spclholsunAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Spcl Hol/Sunday Pay: {f(empData.spclholsunAmt)}
            </Typography>} 
          {show(empData.spclholsunotAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Spcl Hol/Sunday OT Pay: {f(empData.spclholsunotAmt)}
            </Typography>} 
          {show(empData.spclholsunndAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Spcl Hol/Sunday ND Pay: {f(empData.spclholsunndAmt)}
            </Typography>} 
          {show(empData.regholAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Reg Holiday Pay: {f(empData.regholAmt)}
            </Typography>} 
          {show(empData.regholotAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Reg Holiday OT Pay: {f(empData.regholotAmt)}
            </Typography>} 
          {show(empData.regholndAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Reg Holiday ND Pay: {f(empData.regholndAmt)}
            </Typography>} 
          {show(empData.sunaddspclholAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Spcl Hol Pay: {f(empData.sunaddspclholAmt)}
            </Typography>} 
          {show(empData.sunaddspclholotAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Spcl Hol OT Pay: {f(empData.sunaddspclholotAmt)}
            </Typography>} 
          {show(empData.sunaddspclholndAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Spcl Hol ND Pay: {f(empData.sunaddspclholndAmt)}
            </Typography>} 
          {show(empData.sunaddregholAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Reg Hol Pay: {f(empData.sunaddregholAmt)}
            </Typography>} 
          {show(empData.sunaddregholotAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Reg Hol OT Pay: {f(empData.sunaddregholotAmt)}
            </Typography>} 
          {show(empData.sunaddregholndAmt) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Sun + Reg Hol ND Pay: {f(empData.sunaddregholndAmt)}
            </Typography>} 
          {show(empData.allowance) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Allowance: {f(empData.allowance)}
            </Typography>} 
          {show(empData.incentives) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Incentives: {f(empData.incentives)}
            </Typography>} 
          {show(empData.adj) && 
            <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Adjustments: {f(empData.adj)}
            </Typography>} 
          {show(empData.grossPay) && ( 
            <Typography sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${1.4 * fontScale}rem` }}> Gross Pay: {f(empData.grossPay)} 
            </Typography> 
          )} 
        </Box> 
      
      <Divider sx={{ my: 0.1 }} /> 
      {/* --- DEDUCTIONS --- */} 
      <Typography 
        variant="subtitle2" 
        sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${1.3 * fontScale}rem` }}
      >
        DEDUCTIONS
      </Typography> 
      <Box sx={{ fontWeight: "bold", mt: 0.1, fontSize: `${.5 * fontScale}rem` }}> {show(empData.lateAmt) && 
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Late Amt: {f(empData.lateAmt)}
        </Typography>} 
      {show(empData.coLoan) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Company Loan: {f(empData.coLoan)}
        </Typography>} 
      {show(empData.cA) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Cash Advance: {f(empData.cA)}
        </Typography>} 
      {show(empData.sssLoan) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>SSS Loan: {f(empData.sssLoan)}
        </Typography>} 
      {show(empData.sssCal) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>SSS Cal: {f(empData.sssCal)}
        </Typography>} 
      {show(empData.hdmfLoan) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>HDMF Loan: {f(empData.hdmfLoan)}
        </Typography>} 
      {show(empData.hdmfCal) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>HDMF Cal: {f(empData.hdmfCal)}
        </Typography>} 
      {show(empData.sss) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>SSS: {f(empData.sss)}
        </Typography>} 
      {show(empData.phic) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>PHIC: {f(empData.phic)}
        </Typography>} 
      {show(empData.hdmf) &&
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }} >HDMF: {f(empData.hdmf)}
        </Typography>} </Box> <Divider sx={{ my: 0.1 }} /> 
      {/* --- Net Pay --- */} 
        <Typography align="right" sx={{ fontWeight: "bold", mt: 0.5, fontSize: `${1.5 * fontScale}rem` }} > 
          Net Pay: {f(empData.netPay)} 
        </Typography> 
      {/* --- Signatures --- */} 
      <Box 
        sx={{
          display: "flex",
          justifyContent: "space-between",
          textAlign: "center",
          mt: 1,
          fontSize: `${0.65 * fontScale}rem`, 
        }} 
      > 
      <Box sx={{ width: "32%" }}> 
        <Typography sx={{ borderBottom: "1px solid black", pb: 0.5, }}></Typography> 
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Prepared </Typography> 
      </Box> <Box sx={{ width: "32%" }}> 
        <Typography sx={{ borderBottom: "1px solid black", pb: 0.5 }}></Typography> 
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Checked </Typography> 
      </Box> 
    <Box sx={{ width: "32%" }}> 
        <Typography sx={{ borderBottom: "1px solid black", pb: 0.5 }}></Typography> 
        <Typography sx={{ mt: 0.1, fontSize: `${1.2 * fontScale}rem` }}>Received</Typography>        
      </Box> 
    </Box> 
     
  </Paper> 
  ); 
}; 
export default PayslipTabWrapper;
