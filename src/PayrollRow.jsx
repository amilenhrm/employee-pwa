// PayrollRow.jsx
import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "./utils/payrollUtils";
import { TextField } from "@mui/material";
import { computeTotals } from "./utils/payrollUtils"; // row-level totals (we'll use this if needed)

const PayrollRow = React.memo(function PayrollRow({
  emp,
  index,
  data = {},
  totals: totalsProp = null,
  onFieldChange,
  visibleColumns = {},
  useMuiTextField = false,
  companyRates = {},
}) {
    // --- Local state for fast typing: keep strings here ---
    const [local, setLocal] = useState(() => ({ ...data }));
    // Sync from parent only when `data` object identity changes (or initial load)
    useEffect(() => {
    // Only update local if coming from outside (e.g., after save or load)
    if (Object.keys(local).length === 0 && Object.keys(data || {}).length > 0) {
      setLocal(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    // Helper: update local state while typing
    const handleLocalChange = (field, value) => {
      setLocal((p) => ({ ...p, [field]: value }));
    };

    // On blur -> call parent once with parsed value (preserve original signature)
    const handleFieldBlur = (field) => {
      if (!onFieldChange) return;
      const raw = local[field];
      // Try parseFloat, but keep 0 when empty or NaN (this mirrors original cleaning)
      const parsed = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "")) || 0;
      onFieldChange(emp.id, field, parsed);
   };

    // Use totalsProp if provided by parent (faster). If not provided,
    // we won't attempt to compute heavy totals here (PayrollTable provides totals).
    const totals = totalsProp || {};
    // Memoize formatted display values
    const formatted = useMemo(() => {
      return {
      regAmt: formatCurrency(totals.regAmt || 0),
      regotAmt: formatCurrency(totals.regotAmt || 0),
      regndAmt: formatCurrency(totals.regndAmt || 0),
      spclholsunAmt: formatCurrency(totals.spclholsunAmt || 0),
      spclholsunotAmt: formatCurrency(totals.spclholsunotAmt || 0),
      spclholsunndAmt: formatCurrency(totals.spclholsunndAmt || 0),
      regholAmt: formatCurrency(totals.regholAmt || 0),
      regholotAmt: formatCurrency(totals.regholotAmt || 0),
      regholndAmt: formatCurrency(totals.regholndAmt || 0),
      sunaddspclholAmt: formatCurrency(totals.sunaddspclholAmt || 0),
      sunaddspclholotAmt: formatCurrency(totals.sunaddspclholotAmt || 0),
      sunaddspclholndAmt: formatCurrency(totals.sunaddspclholndAmt || 0),
      sunaddregholAmt: formatCurrency(totals.sunaddregholAmt || 0),
      sunaddregholotAmt: formatCurrency(totals.sunaddregholotAmt || 0),
      sunaddregholndAmt: formatCurrency(totals.sunaddregholndAmt || 0),
      grossPay: formatCurrency(totals.grossPay || 0),
      sss: formatCurrency(totals.sss || 0),
      hdmf: formatCurrency(totals.hdmf || 0),
      phic: formatCurrency(totals.phic || 0),
      netPay: formatCurrency(totals.netPay || 0),
      lateAmt: formatCurrency(totals.lateAmt || 0),
    };
  }, [totals]);

  // Field render helper: either MUI TextField (if you keep it) or plain input.
  // Important: onChange updates local state only; onBlur calls parent once.
  const Field = ({ field, value, type = "text", style = {}, inputProps = {} }) =>
    useMuiTextField ? (
      <TextField
        name={field}
        id={`${emp.id}-${field}`}
        size="small"
        type="text"
        value={local[field] ?? ""}
        onChange={(e) => handleLocalChange(field, e.target.value)}
        onBlur={() => handleFieldBlur(field)}
        sx={{ width: "100%" }}
        inputProps={{ style: { textAlign: "right", padding: "2px", ...inputProps.style } }}
      />
    ) : (
      <input
        type="text"
        name={field}
        id={`${emp.id}-${field}`}
        value={local[field] ?? ""}
        onChange={(e) => handleLocalChange(field, e.target.value)}
        onBlur={() => handleFieldBlur(field)}
        style={{ width: "100%", textAlign: "right", padding: "4px 6px", boxSizing: "border-box", ...style }}
      />
    );
  // Render: kept the original column ordering and visibleColumns checks from original upload.
  // (This markup matches the original layout and Tailwind/MUI usage.)
  return (
    <tr style={{ background: index % 2 ? "#f9f9f9" : "white" }}>
      <td style={{ position: "sticky", left: 0, background: "white", zIndex: 2 }}>{index + 1}</td>
      <td style={{ position: "sticky", left: 30, background: "white", zIndex: 2 }}>{emp.idNo ?? ""}</td>
      <td style={{ width: 200 }}>{`${emp.lastName ?? ""}, ${emp.firstName ?? ""}`}</td>

      {/* Days */}
      <td><Field field="days" value={data.days ?? ""} /></td>
      {/* Rate */}
      <td><Field field="rate" value={data.rate ?? ""} /></td>
      {/* Regular Wage Amt (computed) */}
      <td style={{ textAlign: "right" }}>{formatted.regAmt}</td>
      {/* OT Hrs */}
      <td><Field field="regotHrs" value={data.regotHrs ?? ""} /></td>
      {/* OT Amt */}
      <td style={{ textAlign: "right" }}>{formatted.regotAmt}</td>
      {/* ND Hrs */}
      <td><Field field="regndHrs" value={data.regndHrs ?? ""} /></td>
      {/* ND Amt */}
      <td style={{ textAlign: "right" }}>{formatted.regndAmt}</td>

      {/* Special Holiday group (conditionally rendered) */}
      {visibleColumns.specialHoliday && (
        <>
          <td><Field field="days1" value={data.days1 ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.spclholsunAmt}</td>
          <td><Field field="spclholsunotHrs" value={data.spclholsunotHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.spclholsunotAmt}</td>
          <td><Field field="spclholsunndHrs" value={data.spclholsunndHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.spclholsunndAmt}</td>
        </>
      )}

      {/* Regular Holiday */}
      {visibleColumns.regularHoliday && (
        <>
          <td><Field field="days2" value={data.days2 ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.regholAmt}</td>
          <td><Field field="regholotHrs" value={data.regholotHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.regholotAmt}</td>
          <td><Field field="regholndHrs" value={data.regholndHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.regholndAmt}</td>
        </>
      )}

      {/* Sun + Special */}
      {visibleColumns.sunSpecial && (
        <>
          <td><Field field="days3" value={data.days3 ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddspclholAmt}</td>
          <td><Field field="sunaddspclholotHrs" value={data.sunaddspclholotHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddspclholotAmt}</td>
          <td><Field field="sunaddspclholndHrs" value={data.sunaddspclholndHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddspclholndAmt}</td>
        </>
      )}

      {/* Sun + Regular */}
      {visibleColumns.sunRegular && (
        <>
          <td><Field field="days4" value={data.days4 ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddregholAmt}</td>
          <td><Field field="sunaddregholotHrs" value={data.sunaddregholotHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddregholotAmt}</td>
          <td><Field field="sunaddregholndHrs" value={data.sunaddregholndHrs ?? ""} /></td>
          <td style={{ textAlign: "right" }}>{formatted.sunaddregholndAmt}</td>
        </>
      )}

      {/* Late Mins */}
      <td><Field field="lateMins" value={data.lateMins ?? ""} /></td>
      <td style={{ textAlign: "right" }}>{formatted.lateAmt}</td>

      {/* Premiums */}
      {visibleColumns.premiums && (
        <>
          <td><Field field="allowance" value={data.allowance ?? ""} /></td>
          <td><Field field="incentives" value={data.incentives ?? ""} /></td>
          <td><Field field="adj" value={data.adj ?? ""} /></td>
        </>
      )}

      {/* Gross */}
      <td style={{ textAlign: "right" }}>{formatted.grossPay}</td>

      {/* Loans / deductions inputs */}
      <td><Field field="coLoan" value={data.coLoan ?? ""} /></td>
      <td><Field field="cA" value={data.cA ?? ""} /></td>
      <td><Field field="sssLoan" value={data.sssLoan ?? ""} /></td>
      <td><Field field="sssCal" value={data.sssCal ?? ""} /></td>
      <td><Field field="hdmfLoan" value={data.hdmfLoan ?? ""} /></td>
      <td><Field field="hdmfCal" value={data.hdmfCal ?? ""} /></td>

      {/* Deductions display */}
      <td style={{ textAlign: "right" }}>{formatted.sss}</td>
      <td style={{ textAlign: "right" }}>{formatted.hdmf}</td>
      <td style={{ textAlign: "right" }}>{formatted.phic}</td>

      {/* Net */}
      <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatted.netPay}</td>
      <td></td>
    </tr>
  );
});

export default PayrollRow;
