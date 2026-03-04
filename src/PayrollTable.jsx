// PayrollTable.jsx
import React, {
  memo,
  useMemo,
  useState,
  useEffect,
  useCallback,
  forwardRef,
} from "react";
import { Paper, Box, Button } from "@mui/material";
import { formatCurrency, computeTotals } from "./utils/payrollUtils";
import PayrollRow from "./PayrollRow";

const PayrollTable = forwardRef(({ activeEmployees = [], payrollData = {}, handleChange, companyRates = {}, setSortedEmployeeOrder }, ref) => {
  const emptyTotals = useMemo(() => ({}), []);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [visibleColumns, setVisibleColumns] = useState({
    specialHoliday: true,
    regularHoliday: true,
    sunSpecial: true,
    sunRegular: true,
    premiums: true,
  });
  
  const toggleColumn = (key) => setVisibleColumns((p) => ({ ...p, [key]: !p[key] }));

  // Stable onFieldChange — PayrollRow will call this onBlur only
  const onFieldChange = useCallback(
    (empId, field, value) => {
      // preserve original handleChange signature and behavior
      if (typeof handleChange === "function") handleChange(empId, field, value);
    },
    [handleChange]
  );
  

  // sort & pagination (kept original behavior)
  const sortedEmployees = useMemo(() => {
  const arr = [...(activeEmployees || [])];
  arr.sort((a, b) => {
    if (sortBy === "name") {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    }

    if (sortBy === "empNo") {
      const idA = (a.idNo || "").toLowerCase();
      const idB = (b.idNo || "").toLowerCase();
      return sortOrder === "asc"
        ? idA.localeCompare(idB)
        : idB.localeCompare(idA);
    }

    return 0;
  });

  return arr;
}, [activeEmployees, sortBy, sortOrder]);
  useEffect(() => {
  const ids = sortedEmployees.map((e) => e.id);

  setSortedEmployeeOrder((prev) => {
    const prevStr = JSON.stringify(prev);
    const newStr = JSON.stringify(ids);
    return prevStr === newStr ? prev : ids;
  });

  localStorage.setItem("lastSortedEmployeeOrder", JSON.stringify(ids));
}, [sortedEmployees, setSortedEmployeeOrder]);
  const rowsPerPage = 25;
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("payrollPage");
    return saved ? parseInt(saved) : 1;
  });
  useEffect(() => localStorage.setItem("payrollPage", page), [page]);

  useEffect(() => setPage(1), [companyRates, sortBy, sortOrder]);

  const start = (page - 1) * rowsPerPage;
  const paginatedEmployees = sortedEmployees.slice(start, start + rowsPerPage);

  // total summary (memoized)
  const totalSummary = useMemo(() => {
  let gross = 0, net = 0;

  for (const emp of activeEmployees || []) {
    const t = computeTotals(emp.id, payrollData, companyRates);
    gross += t.grossPay || 0;
    net += t.netPay || 0;
  }

  return { gross, net };
}, [activeEmployees, payrollData, companyRates]);

  // Save sorted order when relevant
  //useEffect(() => {
    //const ids = sortedEmployees.map((e) => e.id);
   // localStorage.setItem("lastSortedEmployeeOrder", JSON.stringify(ids));
    //if (typeof setSortedEmployeeOrder === "function") 
     // setSortedEmployeeOrder(ids);
    //}, 
  //[sortedEmployees, setSortedEmployeeOrder]);
  useEffect(() => {
  if (!setSortedEmployeeOrder) return;
  setSortedEmployeeOrder(sortedEmployees.map((e) => e.id));
}, [sortBy, sortOrder]);
  // compute colspans dynamically (kept original logic)
  const visibleHolidayCols =
    (visibleColumns.specialHoliday ? 6 : 0) +
    (visibleColumns.regularHoliday ? 6 : 0) +
    (visibleColumns.sunSpecial ? 6 : 0) +
    (visibleColumns.sunRegular ? 6 : 0) +
    (visibleColumns.premiums ? 3 : 0);
  const fixedColsBeforeGross = 3 + visibleHolidayCols + 9; // matches original layout
  const totalColSpanBeforeGross = fixedColsBeforeGross;
 
    return (
              <Paper
              tabIndex={-1}
      ref={ref}
      sx={{ mt: 2, p: 0, border: "1px solid #ccc", position: "relative", overflow: "hidden" }}
    >
                <Box tabIndex={-1} sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: 1, borderBottom: "1px solid #ddd", background: "#f9f9f9", position: "sticky", top: 0, zIndex: 5 }}>
        <Button variant={visibleColumns.specialHoliday ? "contained" : "outlined"} size="small" onClick={() => toggleColumn("specialHoliday")}>
          {visibleColumns.specialHoliday ? "Show" : "Hide"} Special Holiday
        </Button>
        <Button variant={visibleColumns.regularHoliday ? "contained" : "outlined"} size="small" onClick={() => toggleColumn("regularHoliday")}>
          {visibleColumns.regularHoliday ? "Show" : "Hide"} Regular Holiday
        </Button>
        <Button variant={visibleColumns.sunSpecial ? "contained" : "outlined"} size="small" onClick={() => toggleColumn("sunSpecial")}>
          {visibleColumns.sunSpecial ? "Show" : "Hide"} Sun + Special Holiday
        </Button>
        <Button variant={visibleColumns.sunRegular ? "contained" : "outlined"} size="small" onClick={() => toggleColumn("sunRegular")}>
          {visibleColumns.sunRegular ? "Show" : "Hide"} Sun + Regular Holiday
        </Button>
        <Button variant={visibleColumns.premiums ? "contained" : "outlined"} size="small" onClick={() => toggleColumn("premiums")}>
          {visibleColumns.premiums ? "Show" : "Hide"} Premiums
        </Button>
      </Box>

      {/* 🔹 Payroll Table */}
          <Box sx={{ overflowX: "auto", //overflowY: "auto", 
            //maxHeight: "70vh", position: "relative", scrollbarGutter: "stable both-edges" 
            }}>
        <table tabIndex={-1} style={{ borderCollapse: "collapse", width: "max-content", fontSize: "0.85rem", minWidth: "100%", tableLayout: "fixed" }}>
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
            index={(page - 1) * rowsPerPage + idx}
            data={payrollData[emp.id] || {}}
            totals={computeTotals(emp.id, payrollData, companyRates)}
            onFieldChange={onFieldChange}
            visibleColumns={visibleColumns}
            useMuiTextField={false}
            companyRates={companyRates}
          />
        ))}
          </tbody>
        <tfoot style={{ position: "sticky", bottom: 0, background: "#80ccf8ff", fontWeight: "bold" }}>
            <tr>
              <td colSpan={totalColSpanBeforeGross} style={{ textAlign: "right", fontWeight: "bold" }}>
                TOTAL GROSS:
              </td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalSummary.gross)}</td>
              <td colSpan="9" style={{ textAlign: "right", fontWeight: "bold" }}>TOTAL NET:</td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrency(totalSummary.net)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </Box>
      {/* 🔹 Pagination controls */}
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, mt: 2 }}>
        <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>⬅ Prev</Button>
        <span>Page {page} of {Math.max(1, Math.ceil(sortedEmployees.length / rowsPerPage))}</span>
        <Button variant="outlined" size="small" disabled={page >= Math.ceil(sortedEmployees.length / rowsPerPage)} onClick={() => setPage((p) => Math.min(Math.ceil(sortedEmployees.length / rowsPerPage), p + 1))}>Next ➡</Button>
      </Box>
    </Paper>
  );
});

export default PayrollTable;
