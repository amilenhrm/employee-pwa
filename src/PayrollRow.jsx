// PayrollRow.jsx (Stable typing version - Option 2 Hybrid)
import React, { useMemo, useState, useEffect } from "react";
import { TextField } from "@mui/material";
import { formatCurrency, computeTotals } from "./utils/payrollUtils";

function PayrollRowComponent({
  emp,
  index,
  data = {},
  onFieldChange,
  visibleColumns = {},
  useMuiTextField = false,
  companyRates = {},
}) {
    /// compute totals only for this employee
    const totals = useMemo(() => {
      return computeTotals(emp.id, { [emp.id]: data }, companyRates || {}) || {};
    }, [emp.id, data, companyRates]);

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

    // 🔹 Local buffered Field component (no focus loss)
      const Field = ({ field, value, style = {}, inputProps = {} }) => {
        const [localValue, setLocalValue] = useState(value ?? "");

        // update local state only when parent data actually changes
        useEffect(() => {
          setLocalValue(value ?? "");
        }, [value]);

        const handleBlur = () => {
          const numeric = parseFloat(localValue);
          onFieldChange(emp.id, field, isNaN(numeric) ? 0 : numeric);
        };

        return useMuiTextField ? (
          <TextField
            size="small"
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            sx={{ width: "100%" }}
            inputProps={{
              style: { textAlign: "right", padding: "2px", ...inputProps.style },
            }}
          />
        ) : (
          <input
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={handleBlur}
            style={{
              width: "100%",
              textAlign: "right",
              padding: "4px 6px",
              boxSizing: "border-box",
              ...style,
            }}
          />
        );
      };
  return (
    <tr style={{ background: index % 2 ? "#f9f9f9" : "white" }}>
      <td style={{ position: "sticky", left: 0, background: "white", zIndex: 2 }}>{index + 1}</td>
      <td style={{ position: "sticky", left: 30, background: "white", zIndex: 2 }}>{emp.idNo ?? ""}</td>
      <td style={{ position: "sticky", left: 75, background: "white", zIndex: 2 }}>{`${emp.lastName}, ${emp.firstName}`}</td>

      {/* Days */}
      <td><Field field="days" value={data.days} /></td>
      {/* Rate */}
      <td><Field field="rate" value={data.rate} /></td>
      {/* Regular Wage Amt (computed) */}
      <td style={{ textAlign: "right" }}>{formatted.regAmt}</td>
      {/* OT Hrs */}
      <td><Field field="regotHrs" value={data.regotHrs} /></td>
      {/* OT Amt */}
      <td style={{ textAlign: "right" }}>{formatted.regotAmt}</td>
      {/* ND Hrs */}
      <td><Field field="regndHrs" value={data.regndHrs} /></td>
      {/* ND Amt */}
      <td style={{ textAlign: "right" }}>{formatted.regndAmt}</td>

      {/* Special Holiday group (conditionally rendered) */}
      {visibleColumns.specialHoliday && (
        <>
          <td><Field field="days1" value={data.days1} /></td>
          <td style={{ textAlign: "right" }}>{formatted.spclholsunAmt}</td>
          <td><Field field="spclholsunotHrs" value={data.spclholsunotHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.spclholsunotAmt ?? 0)}</td>
          <td><Field field="spclholsunndHrs" value={data.spclholsunndHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.spclholsunndAmt ?? 0)}</td>
        </>
      )}

      {/* Regular Holiday */}
      {visibleColumns.regularHoliday && (
        <>
          <td><Field field="days2" value={data.days2} /></td>
          <td style={{ textAlign: "right" }}>{formatted.regholAmt}</td>
          <td><Field field="regholotHrs" value={data.regholotHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.regholotAmt ?? 0)}</td>
          <td><Field field="regholndHrs" value={data.regholndHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.regholndAmt ?? 0)}</td>
        </>
      )}

      {/* Sun + Special */}
      {visibleColumns.sunSpecial && (
        <>
          <td><Field field="days3" value={data.days3} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddspclholAmt ?? 0)}</td>
          <td><Field field="sunaddspclholotHrs" value={data.sunaddspclholotHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddspclholotAmt ?? 0)}</td>
          <td><Field field="sunaddspclholndHrs" value={data.sunaddspclholndHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddspclholndAmt ?? 0)}</td>
        </>
      )}

      {/* Sun + Regular */}
      {visibleColumns.sunRegular && (
        <>
          <td><Field field="days4" value={data.days4} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddregholAmt ?? 0)}</td>
          <td><Field field="sunaddregholotHrs" value={data.sunaddregholotHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddregholotAmt ?? 0)}</td>
          <td><Field field="sunaddregholndHrs" value={data.sunaddregholndHrs} /></td>
          <td style={{ textAlign: "right" }}>{formatCurrency(totals.sunaddregholndAmt ?? 0)}</td>
        </>
      )}

      {/* Late Mins */}
      <td><Field field="lateMins" value={data.lateMins} /></td>
      <td style={{ textAlign: "right" }}>{formatted.lateAmt}</td>

      {/* Premiums */}
      {visibleColumns.premiums && (
        <>
          <td><Field field="allowance" value={data.allowance} /></td>
          <td><Field field="incentives" value={data.incentives} /></td>
          <td><Field field="adj" value={data.adj ?? ""} /></td>
        </>
      )}

      {/* Gross */}
      <td style={{ textAlign: "right" }}>{formatted.grossPay}</td>

      {/* Loans / deductions inputs */}
      <td><Field field="coLoan" value={data.coLoan} /></td>
      <td><Field field="cA" value={data.cA} /></td>
      <td><Field field="sssLoan" value={data.sssLoan} /></td>
      <td><Field field="sssCal" value={data.sssCal} /></td>
      <td><Field field="hdmfLoan" value={data.hdmfLoan} /></td>
      <td><Field field="hdmfCal" value={data.hdmfCal} /></td>

      {/* Deductions display */}
      <td style={{ textAlign: "right" }}>{formatted.sss}</td>
      <td style={{ textAlign: "right" }}>{formatted.hdmf}</td>
      <td style={{ textAlign: "right" }}>{formatted.phic}</td>

      {/* Net */}
      <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatted.netPay}</td>
      <td></td>
    </tr>
  );
}
    // ✅ Only re-render when this employee's data actually changes
    const PayrollRow = React.memo(PayrollRowComponent, (prev, next) => {
      if (prev.emp.id !== next.emp.id) return false;
      if (prev.visibleColumns !== next.visibleColumns) return false;
      if (prev.companyRates !== next.companyRates) return false;
      return prev.data === next.data;
    });

export default PayrollRow;
