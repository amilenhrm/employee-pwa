// src/utils/payrollUtils.js
export const formatCurrency = (value) =>
  isNaN(value)
    ? ""
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
        minimumFractionDigits: 2,
      }).format(value);

export const computeTotals = (empId, payrollData, companyRates) => {
  const d = payrollData[empId] || {};
  const rate = Number(d.rate ?? 0);

  // Regular Pay
  const regAmt = (d.days ?? 0) * rate;
  const regotAmt = (d.regotHrs ?? 0) * rate * (companyRates?.regotRate ?? 100) / 8;
  const regndAmt = (d.regndHrs ?? 0) * rate * (companyRates?.regndRate ?? 0) / 8;

  // SpclHol/Sun Pay
  const spclholsunAmt = (d.days1 ?? 0) * rate * (companyRates?.spclholsunRate ?? 100) - ((d.days1 ?? 0) * rate);
  const spclholsunotAmt = (d.spclholsunotHrs ?? 0) * rate * (companyRates?.spclholsunotRate ?? 100) / 8;
  const spclholsunndAmt = (d.spclholsunndHrs ?? 0) * (companyRates?.spclholsunRate ?? 100) * (rate * (companyRates?.spclholsunndRate ?? 0) / 8);

  // Regular Holiday Pay
  const regholAmt = (d.days2 ?? 0) * rate * (companyRates?.regholRate ?? 100) - ((d.days2 ?? 0) * rate);
  const regholotAmt = (d.regholotHrs ?? 0) * rate * (companyRates?.regholotRate ?? 100) / 8;
  const regholndAmt = (d.regholotndHrs ?? 0) * (companyRates?.regholRate ?? 100) * (rate * (companyRates?.regholndRate ?? 0) / 8);

  // Sun + Special Holiday Pay
  const sunaddspclholAmt = (d.days3 ?? 0) * rate * (companyRates?.sunaddspclholRate ?? 100) - ((d.days3 ?? 0) * rate);
  const sunaddspclholotAmt = (d.sunaddspclholotHrs ?? 0) * rate * (companyRates?.sunaddspclholotRate ?? 100) / 8;
  const sunaddspclholndAmt = (d.sunaddspclholndHrs ?? 0) * (companyRates?.sunaddspclholRate ?? 100) * (rate * (companyRates?.sunaddspclholndRate ?? 0) / 8);

  // Sun + Regular Holiday Pay
  const sunaddregholAmt = (d.days4 ?? 0) * rate * (companyRates?.sunaddregholRate ?? 100) - ((d.days4 ?? 0) * rate) ;
  const sunaddregholotAmt = (d.sunaddregholotHrs ?? 0) * rate * (companyRates?.sunaddregholotRate ?? 100) / 8;
  const sunaddregholndAmt = (d.sunaddregholndHrs ?? 0) * (companyRates?.sunaddregholRate ?? 100) * (rate * (companyRates?.sunaddregholndRate ?? 0) / 8);
  // Late
  const lateAmt = (d.lateMins ?? 0) * (rate / 8 / 60)  ;
  const allowance = d.allowance ?? 0;
  const incetives = d.incentives ?? 0;
  const adj = d.adj ?? 0;
  
  // Gross pay
  const grossPay =
    regAmt +
    regotAmt +
    regndAmt +
    spclholsunAmt +
    spclholsunotAmt +
    spclholsunndAmt +
    regholAmt +
    regholotAmt +
    regholndAmt +
    sunaddspclholAmt +
    sunaddspclholotAmt +
    sunaddspclholndAmt +
    sunaddregholAmt +
    sunaddregholotAmt +
    sunaddregholndAmt -
    lateAmt +
    allowance +
    incetives +
    adj;

  // Cash Advance & Loans
  const coLoan = d.coLoan ?? 0;
  const cA = d.cA ?? 0;
  
  // Loans & Calamity
  const sssLoan = d.sssLoan ?? 0;
  const sssCal = d.sssCal ?? 0;
  const hdmfLoan = d.hdmfLoan ?? 0;
  const hdmfCal = d.hdmfCal ?? 0;

  // Mandatory Contributions
// 🧾 SSS (employee share only)
  const sss = regAmt * companyRates?.sssRate ?? 0 / 100;

// 🏠 Pag-IBIG (EE 2%, ER 2%, max ₱10,000 base)
const hdmfBase = Math.min(regAmt, 10000);
const hdmf = hdmfBase * 0.02; // Employee share
const hdmfER = hdmfBase * 0.02; // Employer share (for reference only)

// 🩺 PhilHealth (2024–2025: 5% split 50/50, base ₱10k–₱100k)
const phicBase = Math.min(Math.max(regAmt), 100000);
const totalPhic = phicBase * 0.05;
const phic = totalPhic / 2;     // Employee Share (EE)
const phicER = totalPhic / 2;   // Employer Share (ER)

  const totalDeductions =coLoan + cA + sss + hdmf + phic + sssLoan + sssCal + hdmfLoan + hdmfCal;
  const netPay = grossPay - totalDeductions;

  return {
  regAmt,
  regotAmt,
  regndAmt,
  spclholsunAmt,
  spclholsunotAmt,
  spclholsunndAmt,
  regholAmt,
  regholotAmt,
  regholndAmt,
  sunaddspclholAmt,
  sunaddspclholotAmt,
  sunaddspclholndAmt,
  sunaddregholAmt,
  sunaddregholotAmt,
  sunaddregholndAmt,
  lateAmt,
  allowance,
  incetives,
  adj,
  coLoan,
  cA,
  sssLoan,
  sssCal,
  hdmfLoan,
  hdmfCal,
  sss,
  hdmf,
  phic, 
  grossPay,
  netPay,
};
};
