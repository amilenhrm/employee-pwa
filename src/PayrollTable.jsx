// PayrollTable.jsx (updated)
import React, { memo, useMemo, useState, useEffect, useCallback } from "react";
import { Paper, Box, Button } from "@mui/material";
import { formatCurrency, computeTotals } from "./utils/payrollUtils";
import PayrollRow from "./PayrollRow";

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

  // Memoize totals for all employees to avoid repeated computeTotals calls during render
  const totalsCache = useMemo(() => {
    const cache = {};
    if (!activeEmployees) return cache;
    for (const emp of activeEmployees) {
      cache[emp.id] = computeTotals(emp.id, payrollData, companyRates || {});
    }
    return cache;
  }, [activeEmployees, payrollData, companyRates]);

  // stable onFieldChange: parse value once, then call provided handleChange with number
  const onFieldChange = useCallback(
    (empId, field, rawValue) => {
      // Allow empty or numeric strings; convert to number or 0
       handleChange(empId, field, rawValue);
    },
    [handleChange]
  );

  // compute totals for summary
  const totalSummary = useMemo(() => {
    let gross = 0, net = 0;
    if (!activeEmployees) return { gross, net };
    activeEmployees.forEach((emp) => {
      const t = totalsCache[emp.id] || {};
      gross += t.grossPay || 0;
      net += t.netPay || 0;
    });
    return { gross, net };
  }, [activeEmployees, totalsCache]);

  useEffect(() => {
    if (!activeEmployees || activeEmployees.length === 0) return;
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

    localStorage.setItem("lastSortedEmployeeOrder", JSON.stringify(sortedIds));
    console.log("💾 Saved employee order to localStorage:", sortedIds.length, "employees");
  }, [activeEmployees, sortBy, sortOrder]);

  const sortedEmployees = useMemo(() => {
    return [...(activeEmployees || [])].sort((a, b) => {
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

  // compute dynamic colspan like before
  const visibleHolidayCols =
    (visibleColumns.specialHoliday ? 6 : 0) +
    (visibleColumns.regularHoliday ? 6 : 0) +
    (visibleColumns.sunSpecial ? 6 : 0) +
    (visibleColumns.sunRegular ? 6 : 0) +
    (visibleColumns.premiums ? 3 : 0);

  const fixedColsBeforeGross = 3 + visibleHolidayCols + 9;
  const totalColSpanBeforeGross = fixedColsBeforeGross;
  useEffect(() => {
  setPage(1);
}, [companyRates, sortBy, sortOrder]);

  // 🔹 Pagination setup
const [page, setPage] = useState(() => {
  const saved = localStorage.getItem("payrollPage");
  return saved ? parseInt(saved) : 1;
});
const rowsPerPage = 25;
const totalPages = Math.ceil(sortedEmployees.length / rowsPerPage);

const paginatedEmployees = useMemo(() => {
  const start = (page - 1) * rowsPerPage;
  return sortedEmployees.slice(start, start + rowsPerPage);
}, [page, sortedEmployees]);

// save page in localStorage
useEffect(() => {
  localStorage.setItem("payrollPage", page);
}, [page]);

  return (
              <Paper
                sx={{
                  mt: 2,
                  p: 0,
                  border: "1px solid #ccc",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* 🔹 Column toggle buttons (sa labas ng scroll area) */}
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    p: 1,
                    borderBottom: "1px solid #ddd",
                    background: "#f9f9f9",
                    position: "sticky",
                    top: 0,
                    zIndex: 5,
                  }}
                >
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

      {/* ✅ Scrollable area */}
      <Box
    sx={{
      overflowX: "auto",
      overflowY: "auto",
      maxHeight: "70vh",
      position: "relative",
      scrollbarGutter: "stable both-edges",
    }}
    >
      {/* 🔹 Payroll Table */}
          <table
            style={{
              borderCollapse: "collapse",
              width: "max-content", // important para di ma-cut off ang kanan
              fontSize: "0.85rem",
              minWidth: "100%",
              tableLayout: "fixed",
            }}
          >
        <thead>
          {/* --- Group header row --- */}
          <tr style={{ background: "#bbdefb", position: "sticky", top: 0, zIndex: 3 }}>
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
          <tr style={{ background: "#bbdefb", position: "sticky", top: 30, zIndex: 3 }}>
          
            <th style={{ width: 25, border: "1px solid #ffffff", position: "sticky", left: 0, zIndex: 4, background: "#c6e2fa", }}>#</th>
            <th style={{ width: 45, border: "1px solid #ffffff", position: "sticky", left: 30, zIndex: 4, background: "#c6e2fa", cursor: "pointer", userSelect: "none", }} onClick={() => { if (sortBy === "empNo") { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); } else { setSortBy("empNo"); setSortOrder("asc"); }}}> EMP ID {sortBy === "empNo" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>
            <th style={{ width: 200,border: "1px solid #ffffff", position: "sticky", left: 75, zIndex: 4, background: "#c6e2fa", cursor: "pointer", userSelect: "none", }} onClick={() => { if (sortBy === "name") { setSortOrder(sortOrder === "asc" ? "desc" : "asc"); } else { setSortBy("name"); setSortOrder("asc"); }}}>Employee Name {sortBy === "name" ? (sortOrder === "asc" ? "▲" : "▼") : ""}</th>

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
        {paginatedEmployees.map((emp, idx) => (
          <PayrollRow
            key={emp.id}
            emp={emp}
            index={(page - 1) * rowsPerPage + idx} // correct numbering
            data={payrollData[emp.id] || {}}
            totals={totalsCache[emp.id] || {}}
            onFieldChange={onFieldChange}
            visibleColumns={visibleColumns}
            useMuiTextField={false}
          />
        ))}
      </tbody>

        <tfoot style={{ position: "sticky", bottom: 0, background: "#80ccf8ff", fontWeight: "bold" }}>
          <tr>
            <td colSpan={totalColSpanBeforeGross} style={{ textAlign: "right", fontWeight: "bold" }}>
              TOTAL GROSS:
            </td>
            <td style={{ textAlign: "right", fontWeight: "bold" }}>
              {formatCurrency(totalSummary.gross)}
            </td>
            <td colSpan="9" style={{ textAlign: "right", fontWeight: "bold" }}>
              TOTAL NET:
            </td>
            <td style={{ textAlign: "right", fontWeight: "bold" }}>
              {formatCurrency(totalSummary.net)}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      </Box>
      {/* 🔹 Pagination controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            mt: 2,
          }}
        >
          <Button
            variant="outlined"
            size="small"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ⬅ Prev
          </Button>
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="outlined"
            size="small"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ➡
          </Button>
        </Box>
    </Paper>
  );
};

export default memo(PayrollTable);
