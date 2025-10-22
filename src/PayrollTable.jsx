// PayrollTable.jsx
import React, { memo, useMemo, useState, useEffect } from "react";
import { Paper, TextField, Box, Button } from "@mui/material";
import { formatCurrency, computeTotals } from "./utils/payrollUtils";

const PayrollTable = ({ activeEmployees, payrollData, handleChange, companyRates, }) => {
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [visibleColumns, setVisibleColumns] = useState({
    specialHoliday: true,
    regularHoliday: true,
    sunSpecial: true,
    sunRegular: true,
    premiums: true,
  });

  const toggleColumn = (key) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };
  

  // 🔹 Compute total summary
  const totalSummary = useMemo(() => {
    let gross = 0,
      net = 0;
    activeEmployees.forEach((emp) => {
      const t = computeTotals(emp.id, payrollData, companyRates);
      gross += t.grossPay || 0;
      net += t.netPay || 0;
    });
    return { gross, net };
  }, [activeEmployees, payrollData, companyRates]);

  useEffect(() => {
  if (!activeEmployees || activeEmployees.length === 0) return;

  // Sort exactly the same way as visible in the table
  const sortedIds = [...activeEmployees]
    .sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "empNo") {
        const idA = (a.idNo || "").toString().toLowerCase();
        const idB = (b.idNo || "").toString().toLowerCase();
        return sortOrder === "asc" ? idA.localeCompare(idB) : idB.localeCompare(idA);
      }
      return 0;
    })
    .map((e) => e.id);

  // Save to localStorage
  localStorage.setItem("lastSortedEmployeeOrder", JSON.stringify(sortedIds));
  console.log("💾 Saved employee order to localStorage:", sortedIds.length, "employees");
}, [activeEmployees, sortBy, sortOrder]);

  // 🔸 Dynamically count visible columns
const visibleHolidayCols =
  (visibleColumns.specialHoliday ? 6 : 0) +
  (visibleColumns.regularHoliday ? 6 : 0) +
  (visibleColumns.sunSpecial ? 6 : 0) +
  (visibleColumns.sunRegular ? 6 : 0) +
  (visibleColumns.premiums ? 3 : 0);

// Regular pay = 7 cols, Deductions group = 9, plus 3 fixed columns (#, ID, Name)
const fixedColsBeforeGross = 3 + visibleHolidayCols + 9;
const totalColSpanBeforeGross = fixedColsBeforeGross;

// 🔹 Sort employees for display
  const sortedEmployees = useMemo(() => {
    return [...activeEmployees].sort((a, b) => {
      if (sortBy === "name") {
        const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortBy === "empNo") {
        const idA = (a.idNo || "").toLowerCase();
        const idB = (b.idNo || "").toLowerCase();
        return sortOrder === "asc" ? idA.localeCompare(idB) : idB.localeCompare(idA);
      }
      return 0;
    });
  }, [activeEmployees, sortBy, sortOrder]);

  return (
    <Paper sx={{ mt: 2, p: 1, overflowX: "auto" }}>
      {/* 🔘 Hide/Show Toggle Buttons */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Button
          variant={visibleColumns.specialHoliday ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => toggleColumn("specialHoliday")}
        >
          {visibleColumns.specialHoliday ? "Hide" : "Show"} Special Holiday
        </Button>

        <Button
          variant={visibleColumns.regularHoliday ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => toggleColumn("regularHoliday")}
        >
          {visibleColumns.regularHoliday ? "Hide" : "Show"} Regular Holiday
        </Button>

        <Button
          variant={visibleColumns.sunSpecial ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => toggleColumn("sunSpecial")}
        >
          {visibleColumns.sunSpecial ? "Hide" : "Show"} Sun + Special Holiday
        </Button>

        <Button
          variant={visibleColumns.sunRegular ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => toggleColumn("sunRegular")}
        >
          {visibleColumns.sunRegular ? "Hide" : "Show"} Sun + Regular Holiday
        </Button>
        
        <Button
          variant={visibleColumns.premiums ? "contained" : "outlined"}
          color="primary"
          size="small"
          onClick={() => toggleColumn("premiums")}
        >
          {visibleColumns.premiums ? "Hide" : "Show"} Premiums
        </Button>
      </Box>

      {/* 🔹 Payroll Table */}
      <table
        style={{
          borderCollapse: "collapse",
          width: "max-content",
          fontSize: "0.85rem",
          minWidth: "100%",
        }}
      >
        <thead>
          {/* --- Group header row --- */}
          <tr style={{ background: "#bbdefb" }}>
            <th style={{ width: 25 }}></th>
            <th style={{ width: 45 }}></th>
            <th style={{ width: 200 }}></th>

            <th colSpan={7} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Regular Pay</th>
            {visibleColumns.specialHoliday && (
            <th colSpan={6} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Special Holiday / Sunday / Restday</th>)}
            {visibleColumns.regularHoliday && (
            <th colSpan={6} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Regular Holiday</th>)}
            {visibleColumns.sunSpecial && (
            <th colSpan={6} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Sun + Special Holiday</th>)}
            {visibleColumns.sunRegular && (
            <th colSpan={6} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Sun + Regular Holiday</th>)}
            <th colSpan={2} style={{ border: "1px solid #ffffff", textAlign: "center" }}></th>
            {visibleColumns.premiums && (
            <th colSpan={3} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Premiums</th>)}
            <th colSpan={1} style={{ border: "1px solid #ffffff", textAlign: "center" }}>GROSS</th>
            <th colSpan={9} style={{ border: "1px solid #ffffff", textAlign: "center" }}>Deductions</th>
            <th style={{ textAlign: "center" }}>Net</th>
            <th style={{ textAlign: "center" }}>Signature</th>
          </tr>
          {/* --- Subheader (actual columns) --- */}
          <tr style={{ background: "#c6e2faff" }}>
          
            <th style={{ width: 25, border: "1px solid #ffffff" }}>#</th>
            <th style={{ width: 45, border: "1px solid #ffffff", cursor: "pointer", userSelect: "none", }} onClick={() => { if (sortBy === "empNo") { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); } else { setSortBy("empNo"); setSortOrder("asc"); }}}> EMP ID {sortBy === "empNo" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
            <th style={{ width: 200,border: "1px solid #ffffff", cursor: "pointer", userSelect: "none", }} onClick={() => { if (sortBy === "name") { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); } else { setSortBy("name"); setSortOrder("asc"); }}}>Employee Name {sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>

            {/* Regular Pay */}
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Days</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>Rate</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>Regular Wage Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>OT Hrs</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>OT Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Hrs</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Amt</th>

            {/* SpclHol/Sun Pay Days1*/}
            {visibleColumns.specialHoliday && (
              <>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Days</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>OT Hrs</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>OT Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Hrs</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Amt</th>
            </>
            )}
            {/* Regular Holiday Pay Days2*/}
            {visibleColumns.regularHoliday && (
              <>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Days</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>OT Hrs</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>OT Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Hrs</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Amt</th>
            </>
            )}  
            {/* Sun + Special Holiday Pay Days3*/}
            {visibleColumns.sunSpecial && (
              <>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Days</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>OT Hrs</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>OT Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Hrs</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Amt</th>
            </>
            )}
            {/* Sun + Regular Holiday Pay Days4*/}
            {visibleColumns.sunRegular && (
              <>
            <th style={{ width: 30, border: "1px solid #ffffff" }}>Days</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>Amt</th>
            <th style={{ width: 30, border: "1px solid #ffffff" }}>OT Hrs</th>
            <th style={{ width: 70, border: "1px solid #ffffff" }}>OT Amt</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Hrs</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>ND Amt</th>
            </>
            )}
            {/* Deductions */}
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Late Mins</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Late Amt</th>

            {/* Premiums*/}
            {visibleColumns.premiums && (
              <>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Allowance</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Incentives</th>
            <th style={{ width: 40, border: "1px solid #ffffff" }}>Adjustment</th>
             </>
            )} 

            {/* Total Gross */}
            <th style={{ width: 100, border: "1px solid #ffffff" }}>Gross Pay</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>CO Loan</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>CA</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>SSS SLoan</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>SSS CLoan</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>HDMF SLoan</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>HDMF CLoan</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>SSS</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>HDMF</th>
            <th style={{ width: 50, border: "1px solid #ffffff" }}>PHIC</th>

            {/* Net Total */}
            <th style={{ width: 100, border: "1px solid #ffffff" }}>Net Pay</th>
            <th style={{ width: 150, border: "1px solid #ffffff" }}>Signature</th>
          </tr>
        </thead>

        <tbody>
          {sortedEmployees.map((emp, idx) => {
            const d = payrollData[emp.id] || {};
            const t = computeTotals(emp.id, payrollData, companyRates);

            return (
              <tr key={emp.id} style={{ background: idx % 2 ? "#f9f9f9" : "white" }}>
                <td>{idx + 1}</td>
                <td>{emp.idNo ?? ""}</td>
                <td>{`${emp.lastName}, ${emp.firstName}`}</td>

{/*Days*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.days ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "days", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Rate*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.rate ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "rate", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Regular Wage Amt*/}     
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regAmt ?? 0)}</td>
{/*Reg OT Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.regotHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "regotHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Reg OT Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regotAmt ?? 0)}</td>
{/*Reg ND Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.regndHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "regndHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Reg ND Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regndAmt ?? 0)}</td>
{/*Days1*/}
                {visibleColumns.specialHoliday && (
                  <>    
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.days1 ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "days1", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*SpclHol/ Sun Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.spclholsunAmt ?? 0)}</td>
{/*SpclHol/ Sun OT Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.spclholsunotHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "spclholsunotHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*SpclHol/ Sun OT Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.spclholsunotAmt ?? 0)}</td>
{/*SpclHol/ Sun ND Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.spclholsunndHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "spclholsunndHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*SpclHol/ Sun ND Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.spclholsunndAmt ?? 0)}</td>
                  </> )}
{/*Days2*/}
                {visibleColumns.regularHoliday && (
                  <>    
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.days2 ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "days2", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*RegHol Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regholAmt ?? 0)}</td>
{/*RegHol OT Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.regholotHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "regholotHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*RegHol OT Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regholotAmt ?? 0)}</td>
{/*RegHol ND Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.regholotndHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "regholotndHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*RegHol ND Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.regholndAmt ?? 0)}</td>
                  </> )}
{/*Days3*/}
                {visibleColumns.sunSpecial && (
                  <>    
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.days3 ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "days3", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + SpclHol Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddspclholAmt ?? 0)}</td>                
{/*Sun + SpclHol OT Hrs*/}                
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sunaddspclholotHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sunaddspclholotHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + SpclHol OT Amt*/} 
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddspclholotAmt ?? 0)}</td>    
{/*Sun + SpclHol ND Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sunaddspclholndHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sunaddspclholndHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + SpclHol ND Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddspclholndAmt ?? 0)}</td>
                  </> )}
{/*Days4*/}
                {visibleColumns.sunRegular && (
                  <>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.days4 ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "days4", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + RegHol Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddregholAmt ?? 0)}</td>
{/*Sun + RegHol OT Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sunaddregholotHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sunaddregholotHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + RegHol OT Amt*/}   
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddregholotAmt ?? 0)}</td>
{/*Sun + RegHol ND Hrs*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sunaddregholndHrs ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sunaddregholndHrs", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Sun + RegHol ND Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.sunaddregholndAmt ?? 0)}</td>
                  </> )}
{/*Late Mins*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.lateMins ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "lateMins", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Late Amt*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.lateAmt ?? 0)}</td>
{/*Allowance*/}
                {visibleColumns.premiums && (
                  <>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.allowance ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "allowance", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>                
{/*Incentives*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.incentives ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "incentives", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>                
{/*Adjusment*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.adj ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "adj", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
                </> )}
{/*Gross Pay*/}
                <td style={{ textAlign: "right" }}>{formatCurrency(t.grossPay ?? 0)}</td>
{/*Company Loan*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.coLoan ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "coLoan", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
{/*Cash Advance*/}
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.cA ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "cA", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sssLoan ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sssLoan", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.sssCal ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "sssCal", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.hdmfLoan ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "hdmfLoan", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>
                <td>
                  <TextField
                    size="small"
                    type="number"
                    value={d.hdmfCal ?? ""}
                    onChange={(e) =>
                      handleChange(emp.id, "hdmfCal", parseFloat(e.target.value))
                    }
                    sx={{ width: "100%" }}
                    inputProps={{ style: { textAlign: "right", padding: "2px" } }}
                  />
                </td>

                <td style={{ textAlign: "right" }}>{formatCurrency(t.sss ?? 0)}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(t.hdmf ?? 0)}</td>
                <td style={{ textAlign: "right" }}>{formatCurrency(t.phic ?? 0)}</td>

                {/* Totals */}
                
                <td style={{ textAlign: "right", fontWeight: "bold" }}>
                  {formatCurrency(t.netPay ?? 0)}
                </td>
                <td></td>
              </tr>
            );
          })}
        </tbody>

        {/* ✅ Footer Totals */}
<tfoot style={{ background: "#80ccf8ff", fontWeight: "bold" }}>
  <tr>
    {/* Dynamic colSpan up to Gross Pay */}
    <td colSpan={totalColSpanBeforeGross} style={{ textAlign: "right", fontWeight: "bold" }}>
      TOTAL GROSS:
    </td>

    {/* Aligned Gross Pay total */}
    <td style={{ textAlign: "right", fontWeight: "bold" }}>
      {formatCurrency(totalSummary.gross)}
    </td>
          
    {/* Fill the columns between Gross Pay and Net Pay */}
    <td colSpan="9" style={{ textAlign: "right", fontWeight: "bold" }}>
      TOTAL NET:
    </td>
    {/* Aligned Net Pay total */}
    <td style={{ textAlign: "right", fontWeight: "bold" }}>
      {formatCurrency(totalSummary.net)}
    </td>
      
    {/* Signature cell (empty) */}
    <td></td>
  </tr>
</tfoot>
      </table>
    </Paper>
  );
};

export default memo(PayrollTable);
