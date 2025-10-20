// src/ContributionManager.jsx
import React, { useEffect, useState } from "react";
import { Box, Typography, Button, TextField, MenuItem, Paper } from "@mui/material";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { formatCurrency } from "./utils/payrollUtils";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  computeSSS,
  computePhilHealth,
  computePagibig,
  sssTable,
} from "./utils/contributionTables";

const ContributionManager = () => {
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState("");
  const [availablePayrolls, setAvailablePayrolls] = useState([]);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🧾 Compute summary totals for the footer
const totals = contributions.reduce(
  (acc, c) => {
    acc.sssEE += c.sssEE || c.sss || 0;
    acc.sssER += c.sssER || 0;
    acc.phicEE += c.phicEE || 0;
    acc.phicER += c.phicER || 0;
    acc.hdmfEE += c.hdmfEE || c.hdmf || 0;
    acc.hdmfER += c.hdmfER || 0;
    acc.totalEE += (c.sssEE || c.sss || 0) + c.phicEE + c.hdmfEE;
    acc.totalER += c.sssER + c.phicER + c.hdmfER;
    acc.grand +=
      (c.sssEE || c.sss || 0) +
      c.phicEE +
      c.hdmfEE +
      c.sssER +
      c.phicER +
      c.hdmfER;
    return acc;
  },
  {
    sssEE: 0,
    sssER: 0,
    phicEE: 0,
    phicER: 0,
    hdmfEE: 0,
    hdmfER: 0,
    totalEE: 0,
    totalER: 0,
    grand: 0,
  }
);

            // 🔹 Load companies list
        useEffect(() => {
        const loadCompanies = async () => {
                const snap = await getDocs(collection(db, "companies"));
                setCompanies(snap.docs.map((d) => d.data().name));
                };
                loadCompanies();
            }, []);

            // 🔹 Load all payroll documents (list of periods)
        useEffect(() => {
        const loadPayrolls = async () => {
                if (!company) return;
                const snap = await getDocs(collection(db, "payrolls"));
                const list = snap.docs
                    .filter((d) => d.id.startsWith(`${company}_`))
                    .map((d) => ({
                    id: d.id,
                    ...d.data(),
                    }))
                    .sort((a, b) => new Date(a.period.start) - new Date(b.period.start));
                setAvailablePayrolls(list);
                };
                loadPayrolls();
            }, [company]);

            // 🔹 Handle selection toggle
        const togglePeriod = (id) => {
                setSelectedPeriods((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                );
            };

            // 🔹 Compute total contributions from selected payrolls
        const handleGenerate = async () => {
                if (!company || selectedPeriods.length === 0) {
                alert("⚠️ Please select a company and payroll periods.");
                return;
                }
                setLoading(true);

                try {
                const employeeTotals = {};
                
                const empSnap = await getDocs(collection(db, "employees"));
                const empMap = {};
                empSnap.docs.forEach((doc) => {
                const e = doc.data();
                empMap[doc.id] = `${e.lastName ?? ""}, ${e.firstName ?? ""}`.trim();
                });

                for (const pid of selectedPeriods) {
                // 1️⃣ Load payroll document
                const docRef = doc(db, "payrolls", pid);
                const snap = await getDoc(docRef);
                if (!snap.exists()) continue;
                const payroll = snap.data().data;

                // 2️⃣ Load employee names from Firestore (only once before the loop ideally)
                const empSnap = await getDocs(collection(db, "employees"));
                const empMap = {};
                empSnap.docs.forEach((doc) => {
                    const e = doc.data();
                    empMap[doc.id] = `${e.lastName ?? ""}, ${e.firstName ?? ""}`.trim();
                });

                // 3️⃣ Loop through employees inside this payroll
                Object.entries(payroll).forEach(([empId, data]) => {
                    const empName =
                    empMap[empId] ||
                    data.name ||
                    data.fullName ||
                    `${data.lastName ?? ""}, ${data.firstName ?? ""}`.trim() ||
                    empId;

                    if (!employeeTotals[empId])
                    employeeTotals[empId] = {
                        empId,
                        name: empName,
                        sss: 0,
                        phic: 0,
                        hdmf: 0,
                        regAmt: 0,
                    };

                    employeeTotals[empId].sss += data.sss || 0;
                    employeeTotals[empId].phic += data.phic || 0;
                    employeeTotals[empId].hdmf += data.hdmf || 0;
                    employeeTotals[empId].regAmt += data.regAmt || 0;
                });
                }
                  
            // Compute employer shares (simplified logic)
        const result = Object.values(employeeTotals).map((e) => {

            // 🧮 Match SSS bracket more accurately
        let match = sssTable.find((b) => Math.abs(b.ee - e.sss) <= 5);
        if (!match) {

            // find closest bracket by smallest difference
        match = sssTable.reduce((prev, curr) =>
            Math.abs(curr.ee - e.sss) < Math.abs(prev.ee - e.sss) ? curr : prev
        );
        }

            // use midpoint of bracket as salary basis
        const estimatedSalary = (match.min + match.max) / 2;

            // compute all contributions based on matched bracket
        const sss = { ee: match.ee, er: match.er };
        const phic = computePhilHealth(e.regAmt || estimatedSalary);
        const pagibig = computePagibig(e.regAmt);

        return {
        ...e,
        estimatedSalary,
        sssBase: (match.min + match.max) / 2,
        sssEE: sss.ee,
        sssER: sss.er,
        phicEE: phic.ee,
        phicER: phic.er,
        hdmfEE: pagibig.ee,
        hdmfER: pagibig.er,
        };
    })
        .sort((a, b) => a.name.localeCompare(b.name));

        setContributions(result);
        } catch (err) {
        console.error("❌ Error generating contributions:", err);
        alert("Failed to generate data. Check console for details.");
        } finally {
        setLoading(false);
        }
    };
            // 🔹 Export to Excel
        const handleExportExcel = () => {
            if (contributions.length === 0) return;

            const rows = contributions.map((c, i) => ({
                "#": i + 1,
                "Employee Name": c.name,
                "SSS Base": c.sssBase || 0,
                "SSS (EE)": c.sssEE || c.sss || 0,
                "SSS (ER)": c.sssER || 0,
                "PHIC (EE)": c.phicEE || c.phic || 0,
                "PHIC (ER)": c.phicER || 0,
                "HDMF (EE)": c.hdmfEE || c.hdmf || 0,
                "HDMF (ER)": c.hdmfER || 0,
                "Total EE":
                    (c.sssEE || c.sss || 0) + (c.phicEE || c.phic || 0) + (c.hdmfEE || c.hdmf || 0),
                "Total ER": (c.sssER || 0) + (c.phicER || 0) + (c.hdmfER || 0),
                "Grand Total":
                    (c.sssEE || c.sss || 0) +
                    (c.phicEE || c.phic || 0) +
                    (c.hdmfEE || c.hdmf || 0) +
                    (c.sssER || 0) +
                    (c.phicER || 0) +
                    (c.hdmfER || 0),
                }));
            // 🧾 Add summary row at the bottom of Excel sheet
        const totalRow = {
            "#": "TOTAL →",
            "Employee Name": "",
            "Monthly Salary": "", // optional, we skip summing base
            "SSS (EE)": contributions.reduce((sum, c) => sum + (c.sssEE || c.sss || 0), 0),
            "SSS (ER)": contributions.reduce((sum, c) => sum + (c.sssER || 0), 0),
            "PHIC (EE)": contributions.reduce((sum, c) => sum + (c.phicEE || c.phic || 0), 0),
            "PHIC (ER)": contributions.reduce((sum, c) => sum + (c.phicER || 0), 0),
            "HDMF (EE)": contributions.reduce((sum, c) => sum + (c.hdmfEE || c.hdmf || 0), 0),
            "HDMF (ER)": contributions.reduce((sum, c) => sum + (c.hdmfER || 0), 0),
            "Total EE": contributions.reduce(
                (sum, c) =>
                sum +
                (c.sssEE || c.sss || 0) +
                (c.phicEE || c.phic || 0) +
                (c.hdmfEE || c.hdmf || 0),
                0
            ),
            "Total ER": contributions.reduce(
                (sum, c) => sum + (c.sssER || 0) + (c.phicER || 0) + (c.hdmfER || 0),
                0
            ),
            "Grand Total": contributions.reduce(
                (sum, c) =>
                sum +
                (c.sssEE || c.sss || 0) +
                (c.phicEE || c.phic || 0) +
                (c.hdmfEE || c.hdmf || 0) +
                (c.sssER || 0) +
                (c.phicER || 0) +
                (c.hdmfER || 0),
                0
             ),
            };

            // append total row to the sheet
        rows.push(totalRow);

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Contributions");
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        saveAs(
        new Blob([wbout], { type: "application/octet-stream" }),
        `Contributions_${company}.xlsx`
        );
    }; 

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" align="center" gutterBottom>
        🧮 Contribution Summary (SSS / PhilHealth / Pag-IBIG)
      </Typography>

      <Box display="flex" gap={2} flexWrap="wrap" mb={2}>
        <TextField
          select
          label="Select Company"
          value={company}
          onChange={(e) => {
            setCompany(e.target.value);
            setSelectedPeriods([]);
            setContributions([]);
          }}
          sx={{ minWidth: 250 }}
        >
          <MenuItem value="">-- Select --</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </TextField>
      </Box>
            {availablePayrolls.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2">Select Payroll Periods:</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {availablePayrolls.map((p) => (
              <Button
                key={p.id}
                variant={selectedPeriods.includes(p.id) ? "contained" : "outlined"}
                onClick={() => togglePeriod(p.id)}
              >
                {p.period.start} → {p.period.end}
              </Button>
            ))}
          </Box>
        </Box>
      )}
            <Button
                variant="contained"
                color="primary"
                onClick={handleGenerate}
                disabled={!company || selectedPeriods.length === 0 || loading}
            >
                {loading ? "Generating..." : "Generate Contributions"}
            </Button>
            {contributions.length > 0 && (
        <Box mt={3}>
    <Paper sx={{ p: 2, overflowX: "auto" }}>
                <table
                style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    fontSize: "0.85rem",
            }}
            >
                <thead style={{ background: "#bbdefb" }}>
                    <tr>
                        <th>#</th>
                        <th>Employee</th>
                        <th>Monthly Salary</th>
                        <th>SSS (EE)</th>
                        <th>SSS (ER)</th>
                        <th>PHIC (EE)</th>
                        <th>PHIC (ER)</th>
                        <th>HDMF (EE)</th>
                        <th>HDMF (ER)</th>
                        <th>Total EE</th>
                        <th>Total ER</th>
                        <th>Grand Total</th>
                    </tr>
                </thead>
            <tbody>
                    {contributions.map((c, i) => (
                    <tr key={c.empId}>
                        <td>{i + 1}</td>
                        <td>{c.name}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.sssBase || 0)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.sss)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.sssER)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.phic)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.phicER)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.hdmf)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(c.hdmfER)}</td>   
                        <td style={{ textAlign: "right" }}>
                        {formatCurrency(c.sss + c.phic + c.hdmf)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                        {formatCurrency(c.sssER + c.phicER + c.hdmfER)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                        {formatCurrency(
                            c.sss + c.phic + c.hdmf + c.sssER + c.phicER + c.hdmfER
                        )}
                        </td>
                    </tr>
                ))}
            </tbody>
                <tfoot style={{ background: "#e3f2fd", fontWeight: "bold" }}>
                    <tr>
                        <td colSpan={2} style={{ textAlign: "right" }}>TOTAL →</td>
                        <td style={{ textAlign: "center" }}>—</td> {/* PHIC Base (not summed) */}
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.sssEE)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.sssER)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.phicEE)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.phicER)}</td>       
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.hdmfEE)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.hdmfER)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.totalEE)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.totalER)}</td>
                        <td style={{ textAlign: "right" }}>{formatCurrency(totals.grand)}</td>
                    </tr>
                </tfoot>
        </table>
    </Paper>
        <Box mt={2} textAlign="center">
            <Button variant="outlined" color="success" onClick={handleExportExcel}>
              📤 Export to Excel
            </Button>
        </Box>
        </Box>
            )}
        </Box>
    );
};

export default ContributionManager;
