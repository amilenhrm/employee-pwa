// src/utils/contributionTables.js

// 🧾 Simplified SSS table (2025 rates)
export const sssTable = [
  { min: 5000, max: 5249.99, ee: 250, er: 510 },
  { min: 5250, max: 5749.99, ee: 275, er: 560 },
  { min: 5750, max: 6249.99, ee: 300, er: 610 },
  { min: 6250, max: 6749.99, ee: 325, er: 660 },
  { min: 6750, max: 7249.99, ee: 350, er: 710 },
  { min: 7250, max: 7749.99, ee: 375, er: 760 },
  { min: 7750, max: 8249.99, ee: 400, er: 810 },
  { min: 8250, max: 8749.99, ee: 425, er: 860 },
  { min: 8750, max: 9249.99, ee: 450, er: 910 },
  { min: 9250, max: 9749.99, ee: 475, er: 960 },
  { min: 9750, max: 10249.99, ee: 500, er: 1010 },
  { min: 10250, max: 10749.99, ee: 525, er: 1060 },
  { min: 10750, max: 11249.99, ee: 550, er: 1110 },
  { min: 11250, max: 11749.99, ee: 575, er: 1160 },
  { min: 11750, max: 12249.99, ee: 600, er: 1210 },
  { min: 12250, max: 12749.99, ee: 625, er: 1260 },
  { min: 12750, max: 13249.99, ee: 650, er: 1310 },
  { min: 13250, max: 13749.99, ee: 675, er: 1360 },
  { min: 13750, max: 14249.99, ee: 700, er: 1410 },
  { min: 14250, max: 14749.99, ee: 725, er: 1460 },
  { min: 14750, max: 15249.99, ee: 750, er: 1530 },
  { min: 15250, max: 15749.99, ee: 775, er: 1580 },
  { min: 15750, max: 16249.99, ee: 800, er: 1630 },
  { min: 16250, max: 16749.99, ee: 825, er: 1680 },
  { min: 16750, max: 17249.99, ee: 850, er: 1730 },
  { min: 17250, max: 17749.99, ee: 875, er: 1780 },
  { min: 17750, max: 18249.99, ee: 900, er: 1830 },
  { min: 18250, max: 18749.99, ee: 925, er: 1880 },
  { min: 18750, max: 19249.99, ee: 950, er: 1930 },
  { min: 19250, max: 19749.99, ee: 975, er: 1980 },
  { min: 19750, max: 20249.99, ee: 1000, er: 2030 },
  { min: 20250, max: 20749.99, ee: 1025, er: 2080 },
  { min: 20750, max: 21249.99, ee: 1050, er: 2130 },
  { min: 21250, max: 21749.99, ee: 1075, er: 2180 },
  { min: 21750, max: 22249.99, ee: 1100, er: 2230 },
  { min: 22250, max: 22749.99, ee: 1125, er: 2280 },
  { min: 22750, max: 23249.99, ee: 1150, er: 2330 },
  { min: 23250, max: 23749.99, ee: 1175, er: 2380 },
  { min: 23750, max: 24249.99, ee: 1200, er: 2430 },
  { min: 24250, max: 24749.99, ee: 1225, er: 2480 },
  { min: 24750, max: 25249.99, ee: 1250, er: 2530 },
  { min: 25250, max: 25749.99, ee: 1275, er: 2580 },
  { min: 25750, max: 26249.99, ee: 1300, er: 2630 },
  { min: 26250, max: 26749.99, ee: 1325, er: 2680 },
  { min: 26750, max: 27249.99, ee: 1350, er: 2730 },
  { min: 27250, max: 27749.99, ee: 1375, er: 2780 },
  { min: 27750, max: 28249.99, ee: 1400, er: 2830 },
  { min: 28250, max: 28749.99, ee: 1425, er: 2880 },
  { min: 28750, max: 29249.99, ee: 1450, er: 2930 },
  { min: 29250, max: 29749.99, ee: 1475, er: 2980 },
  { min: 29750, max: 30249.99, ee: 1500, er: 3030 },
  { min: 30250, max: 30749.99, ee: 1525, er: 3080 },
  { min: 30750, max: 31249.99, ee: 1550, er: 3130 },
  { min: 31250, max: 31749.99, ee: 1575, er: 3180 },
  { min: 31750, max: 32249.99, ee: 1600, er: 3230 },
  { min: 32250, max: 32749.99, ee: 1625, er: 3280 },
  { min: 32750, max: 33249.99, ee: 1650, er: 3330 },
  { min: 33250, max: 33749.99, ee: 1675, er: 3380 },
  { min: 33750, max: 34249.99, ee: 1700, er: 3430 },
  { min: 34250, max: 34749.99, ee: 1725, er: 3480 },
  { min: 34750, max: 35249.99, ee: 1750, er: 3530 },
];

// 🩺 PhilHealth - 5% (2024–2025 rate)
// Floor: ₱10,000 | Ceiling: ₱100,000
// Optional: prorated if regAmt < ₱10,000
export const computePhilHealth = (salary, prorated = false) => {
  let baseSalary;

  if (prorated && salary < 10000) {
    // Use actual if below 10k
    baseSalary = salary;
  } else {
    // Apply floor/ceiling
    baseSalary = Math.min(Math.max(salary, 10000), 100000);
  }

  const total = baseSalary * 0.05;
  const ee = total / 2;
  const er = total / 2;

  return { ee, er, baseSalary, total };
};

// 🏠 Pag-IBIG - 2% EE / 2% ER, ER capped at ₱200 max
export const computePagibig = (regAmt = 0) => {
  const base = Number(regAmt) || 0;

  // same computation base for EE and ER
  const ee = base * 0.02;
  let er = base * 0.02;

  // enforce ceiling of ₱200 for employer
  if (er > 200) er = 200;

  // round both for cleaner display (centavo precision)
  return {
    ee: Math.round(ee * 100) / 100,
    er: Math.round(er * 100) / 100,
    base
  };
};

// 🧮 Find SSS bracket (for Employee/Employer Share)
export const computeSSS = (salary) => {
  const bracket = sssTable.find((b) => salary >= b.min && salary <= b.max);
  if (!bracket) {
    const last = sssTable[sssTable.length - 1];
    return { ee: last.ee, er: last.er };
  }
  return { ee: bracket.ee, er: bracket.er };
};