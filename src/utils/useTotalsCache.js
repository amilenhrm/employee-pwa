import { useRef, useEffect } from "react";
import { computeTotals } from "./payrollUtils";

export function useTotalsCache(payrollData, companyRates, employees) {
  const cacheRef = useRef({});

  useEffect(() => {
    if (!employees?.length) return;

    // Loop only affected employees (instead of recomputing all)
    for (const emp of employees) {
      const empId = emp.id;
      const empData = payrollData[empId];
      if (!empData) continue;

      // compute once, store in cache
      cacheRef.current[empId] = computeTotals(empId, payrollData, companyRates);
	cacheRef.current = { ...cacheRef.current }; // trigger shallow update
    }
  }, [payrollData, companyRates, employees]);

  return cacheRef.current;
}
