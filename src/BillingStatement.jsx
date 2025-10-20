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
  Grid,
  useMediaQuery,
  useTheme, Accordion, AccordionSummary, AccordionDetails
} from "@mui/material";
import { db } from "./firebase";
import { collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { formatCurrency } from "./utils/payrollUtils";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const COLUMN_ORDER = [
  "empNo","name","days","rate","regAmt","regotAmt","regholAmt","regholotAmt",
  "regholndAmt","spclholsunAmt","spclholsunotAmt","spclholsunndAmt",
  "sunaddspclholAmt","sunaddspclholotAmt","sunaddspclholndAmt",
  "sunaddregholAmt","sunaddregholotAmt","sunaddregholndAmt",
  "lateAmt","allowance","incentives","adj","grossPay","serviceFee","total"
];

const BillingStatement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [companyList, setCompanyList] = useState([]);
  const [company, setCompany] = useState("");
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [periodList, setPeriodList] = useState([]);
  const [billingData, setBillingData] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedBillings, setSavedBillings] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;


  // Load companies
  useEffect(() => {
    const loadCompanies = async () => {
      const snap = await getDocs(collection(db, "companies"));
      setCompanyList(snap.docs.map((d) => d.data().name));
    };
    loadCompanies();
  }, []);

  // Load saved billings
  useEffect(() => {
    const loadSavedBillings = async () => {
      const snap = await getDocs(collection(db, "billings"));
      setSavedBillings(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };
    loadSavedBillings();
  }, []);

  // Generate billing
  const handleGenerate = async () => {
  if (!company || !period.start || !period.end) return;
  setLoading(true);

  try {
    const key = `${company}_${period.start}_${period.end}`;
    const snap = await getDoc(doc(db, "payrolls", key));
    if (!snap.exists()) {
      alert("⚠️ No payroll data found for this company and period.");
      setBillingData([]);
      setVisibleColumns([]);
      setLoading(false);
      return;
    }

    const data = snap.data().data || {};
const empSnap = await getDocs(collection(db, "employees"));
const empMap = {};
empSnap.docs.forEach(doc => {
  const e = doc.data();
  empMap[doc.id] = {
    name: `${e.lastName ?? ""}, ${e.firstName ?? ""}`.trim(),
    idNo: e.idNo ?? doc.id
  };
});

// 🔹 Get company info ONCE (outside map)
const companySnap = await getDocs(collection(db, "companies"));
const companyInfo = companySnap.docs
  .map((d) => d.data())
  .find((c) => c.name === company);

let serviceFeeType = companyInfo?.serviceFeeType ?? "percentage"; // default
let serviceFeeValue = parseFloat(companyInfo?.serviceFeeValue ?? 10); // default 10%

// 🔹 Now process all employees
let formatted = Object.entries(data).map(([id, emp]) => {
  const empInfo = empMap[id] || { name: id, idNo: id };
  const gross = emp.grossPay ?? 0;

  // Compute service fee based on company type
  let serviceFee = 0;
  if (serviceFeeType === "percentage") {
    serviceFee = (emp.regAmt ?? 0) * (serviceFeeValue / 100);
  } else if (serviceFeeType === "fixed") {
    serviceFee = (serviceFeeValue ?? 0) * (emp.days ?? 0);
  }

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
    total
  };
});

    formatted = formatted.filter(emp => emp.grossPay > 0);
    setBillingData(formatted);

    const cols = COLUMN_ORDER.filter(field => {
      if (["empNo","name"].includes(field)) return true;
      return formatted.some(row => row[field] !== 0);
    });
    setVisibleColumns(cols);
    // compute totals
      const totals = formatted.reduce(
        (acc, cur) => {
          acc.gross += cur.grossPay ?? 0;
          acc.fee += cur.serviceFee ?? 0;
          acc.total += cur.total ?? 0;
          return acc;
        },
        { gross: 0, fee: 0, total: 0 }
      );

// 🔹 SAVE sa Firestore
try {
  const billingDocId = `${company}_${period.start}_${period.end}`;
  await setDoc(doc(db, "billings", billingDocId), {
    company,
    period,
    data: formatted,
    totals, // <-- ADD THIS LINE
    updatedAt: new Date().toISOString(),
  });
    console.log("Billing saved successfully:", billingDocId);
    // 🔹 Update savedBillings state instantly
    setSavedBillings(prev => {
      const newEntry = {
        id: billingDocId,
        company,
        period,
        data: formatted,
        totals,
        updatedAt: new Date().toISOString(),
      };

      // Check if existing entry for same ID already exists
      const existing = prev.find(b => b.id === billingDocId);
      if (existing) {
        // replace it
        return prev.map(b => b.id === billingDocId ? newEntry : b);
      } else {
        // add to top of list
        return [newEntry, ...prev];
      }
    });

      } catch (err) {
        console.error("Error saving billing:", err);
      }

      } catch (err) {
        console.error("Error fetching billing data:", err);
        setBillingData([]);
        setVisibleColumns([]);
      }

      setLoading(false);
    };
// 🔹 Compute totals para magamit sa table at mobile view
const totals = billingData.reduce(
  (acc, cur) => {
    acc.gross += cur.grossPay ?? 0;
    acc.fee += cur.serviceFee ?? 0;
    acc.total += cur.total ?? 0;
    return acc;
  },
  { gross: 0, fee: 0, total: 0 }
);
// 🔹 Load saved billing data into table
const handleLoadBilling = (bill) => {
  if (!bill?.data) {
    alert("⚠️ This saved billing has no data.");
    return;
  }
  setCompany(bill.company);
  setPeriod(bill.period);
  setBillingData(bill.data);

  // Auto-detect visible columns
  const cols = COLUMN_ORDER.filter((field) => {
    if (["empNo", "name"].includes(field)) return true;
    return bill.data.some((row) => row[field] !== 0);
  });
  setVisibleColumns(cols);

  window.scrollTo({ top: 0, behavior: "smooth" });
};

  return (
    <Box sx={{ mt: 4 }}>
      <Typography align="center" variant="h6" gutterBottom>Billing Statement</Typography>

      {/* Company & Period Dropdown */}
      <Grid container spacing={2} justifyContent="center" alignItems="center" sx={{ mb: 3 }}>
        <Grid sx={{ flex:1, maxWidth:220 }}>
          <TextField
            select
            label="Select Company"
            value={company}
            onChange={async e => {
              const selectedCompany = e.target.value;
              setCompany(selectedCompany);

              if(selectedCompany){
                const payrollSnap = await getDocs(collection(db, "payrolls"));
                const periods = payrollSnap.docs
                  .map(doc => doc.id)
                  .filter(id => id.startsWith(selectedCompany + "_"))
                  .map(id => {
                    // Split sa underscore: COMPANY_YYYY-MM-DD_YYYY-MM-DD
                    const parts = id.split("_");
                    const start = parts[1];
                    const end = parts[2];
                    return `${start}-${end}`;
                  });
                setPeriodList(periods);
                setPeriod({ start: "", end: "" });
              }
            }}
            fullWidth
          >
            <MenuItem value="">-- Select --</MenuItem>
            {companyList.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
          <Grid sx={{ flex:1, maxWidth:220 }}>
            <TextField
              select
              label="Select Period"
              value={period.start && period.end ? `${period.start}-${period.end}` : ""}
              onChange={e => {
              const val = e.target.value; // "2025-09-24-2025-09-30"
              const [start, end] = val.split(/-(?=\d{4}-\d{2}-\d{2}$)/);
              setPeriod({ start, end });
                console.log("Generated key:", `${company}_${period.start}_${period.end}`);
              }}
              fullWidth
              disabled={periodList.length===0}
            >
              <MenuItem value="">-- Select --</MenuItem>
              {periodList.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
        <Grid sx={{ flex:1, maxWidth:220 }}>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!company || !period.start || !period.end}
            fullWidth
          >
            Generate Billing
          </Button>
        </Grid>
      </Grid>

      {/* Billing Table / Cards */}
      {loading ? <Box textAlign="center" mt={4}><CircularProgress /></Box> :
      billingData.length > 0 ? (
        isMobile ? (
          <Grid container spacing={2}>
            {[...billingData].sort((a,b)=>a.name.localeCompare(b.name)).map((emp,i)=>(
              <Grid sx={{width:"100%"}} key={i}>
                <Paper sx={{p:2, boxShadow:3, borderRadius:2}}>
                  <Box sx={{backgroundColor:"#f0f0f0", p:1, borderRadius:1, mb:1}}>
                    <Typography variant="subtitle1" fontWeight="bold">{emp.name} ({emp.empNo})</Typography>
                  </Box>
                  <Box sx={{ display:"flex", flexDirection:"column", gap:0.5}}>
                    {visibleColumns.filter(c=>!["empNo","name","grossPay","serviceFee","total"].includes(c))
                      .map(col=>{
                        let label = col.replace(/([A-Z])/g," $1").replace(/^./,str=>str.toUpperCase());
                        if(col==="empNo") label="Employee No";
                        else if(col==="name") label="Employee Name";
                        else if(col==="grossPay") label="Gross Pay";
                        else if(col==="serviceFee") label="Service Fee";
                        else if(col==="total") label="Total";
                        return <Typography key={col} variant="body2">{label}: {typeof emp[col]==="number"?formatCurrency(emp[col]):emp[col]}</Typography>
                      })
                    }
                  </Box>
                  <Box mt={1} sx={{borderTop:"1px solid #ccc", pt:1, backgroundColor:"#fafafa", p:1, borderRadius:1}}>
                    {["grossPay","serviceFee","total"].map(col=>(
                      <Typography key={col} variant="body2" fontWeight="bold">
                        {col==="grossPay"?"Gross Pay: ": col==="serviceFee"?"Service Fee: ":"Total: "}
                        {formatCurrency(emp[col])}
                      </Typography>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
            <Grid sx={{width:"100%"}}>
              <Paper sx={{p:2, boxShadow:3, borderRadius:2, backgroundColor:"#e0e0e0"}}>
                <Typography variant="subtitle1" fontWeight="bold">TOTALS</Typography>
                <Typography variant="body2" fontWeight="bold">Gross Pay: {formatCurrency(totals.gross)}</Typography>
                <Typography variant="body2" fontWeight="bold">Service Fee: {formatCurrency(totals.fee)}</Typography>
                <Typography variant="body2" fontWeight="bold">Total: {formatCurrency(totals.total)}</Typography>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{width:"95%", mx:"auto", p:2, overflowX:"auto"}}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {visibleColumns.map(col=>(
                      <TableCell key={col} align={["empNo","name"].includes(col)?"left":"right"}>
                        {col==="empNo"?"Emp. No": col==="name"?"Employee Name": col==="grossPay"?"Gross Pay": col==="serviceFee"?"Service Fee": col==="total"?"Total": col.replace(/([A-Z])/g," $1").replace(/^./,c=>c.toUpperCase())}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...billingData].sort((a,b)=>a.name.localeCompare(b.name)).map((emp,i)=>(
                    <TableRow key={i}>
                      {visibleColumns.map(col=>(
                        <TableCell key={col} align={["empNo","name"].includes(col)?"left":"right"}>
                          {typeof emp[col]==="number"?formatCurrency(emp[col]):emp[col]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  <TableRow sx={{fontWeight:"bold", backgroundColor:"#f8f9fa"}}>
                    {visibleColumns.map(col=>{
                      if(col==="name") return <TableCell key={col} align="left">TOTAL</TableCell>;
                      if(col==="empNo") return <TableCell key={col}></TableCell>;
                      const value = col==="grossPay"?totals.gross: col==="serviceFee"?totals.fee: col==="total"?totals.total:"";
                      return <TableCell key={col} align="right">{value!==""?formatCurrency(value):""}</TableCell>
                    })}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )
      ) : (
        <Typography align="center" color="text.secondary">No data available.</Typography>
      )}

      {/* 📋 Saved Billing Statements */}
      <Box sx={{ mt: 5 }}>
        <Typography variant="h6" gutterBottom>
          📋 Saved Billing Statements
        </Typography>

        {/* 🔍 Search Bar */}
        <TextField
          label="Search company or date"
          size="small"
          fullWidth
          sx={{ mb: 2, maxWidth: 400 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value.toLowerCase())}
          placeholder="Type to filter..."
        />

        {savedBillings.length === 0 ? (
          <Typography color="text.secondary">No saved billings found.</Typography>
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
                {savedBillings
                  .filter(
                    (bill) =>
                      bill.company.toLowerCase().includes(searchTerm) ||
                      `${bill.period.start}-${bill.period.end}`.includes(searchTerm)
                  )
                  .slice((page - 1) * perPage, page * perPage)
                  .map((bill) => (
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

        {/* 📑 Pagination Controls */}
        {savedBillings.length > perPage && (
          <Box mt={2} display="flex" justifyContent="center" alignItems="center" gap={2}>
            <Button
              variant="outlined"
              size="small"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Typography variant="body2">
              Page {page} of {Math.ceil(savedBillings.length / perPage)}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              disabled={page * perPage >= savedBillings.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>

    </Box>
  );
};

export default BillingStatement;
