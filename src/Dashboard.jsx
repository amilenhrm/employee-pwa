// src/Dashboard.jsx
import React, { useEffect, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import { db } from "./firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

dayjs.extend(isBetween);

const Dashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [weeklyCollections, setWeeklyCollections] = useState([]);
  const [monthlyCollections, setMonthlyCollections] = useState([]);
  const [yearlyCollections, setYearlyCollections] = useState([]);

  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);

  const [selectedWeek, setSelectedWeek] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [weekLabel, setWeekLabel] = useState("");
  const [monthLabel, setMonthLabel] = useState("");
  const [yearLabel, setYearLabel] = useState("");

  const [yearlyChartData, setYearlyChartData] = useState([]);

  // 🔹 Realtime employee & company counts
  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "employees"), (snap) => {
      setEmployees(snap.docs.map((d) => d.data()));
    });
    const unsub2 = onSnapshot(collection(db, "companies"), (snap) => {
      setCompanies(snap.docs.map((d) => d.data()));
    });
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  // 🔹 Load available periods
  useEffect(() => {
    const loadAvailablePeriods = async () => {
      try {
        const payrollSnap = await getDocs(collection(db, "payrolls"));
        const endDates = payrollSnap.docs
          .map((d) => d.data().period?.end)
          .filter(Boolean)
          .map((d) => dayjs(d));

        const uniqueWeeks = new Map();
        const uniqueMonths = new Map();
        const uniqueYears = new Set();

        endDates.forEach((date) => {
          const weekStart = date.startOf("week");
          const weekEnd = date.endOf("week");
          const weekKey = `${weekStart.format("YYYY-MM-DD")}|${weekEnd.format("YYYY-MM-DD")}`;
          uniqueWeeks.set(
            weekKey,
            `${weekStart.format("MMM D")}–${weekEnd.format("D, YYYY")}`
          );

          const monthKey = date.startOf("month").format("YYYY-MM");
          uniqueMonths.set(monthKey, date.format("MMMM, YYYY"));

          uniqueYears.add(date.year());
        });

        const weekOptions = Array.from(uniqueWeeks.entries()).map(([key, label]) => ({
          key,
          label,
        }));
        const monthOptions = Array.from(uniqueMonths.entries()).map(([key, label]) => ({
          key,
          label,
        }));
        const yearOptions = Array.from(uniqueYears)
          .sort((a, b) => b - a)
          .map((y) => ({ key: String(y), label: String(y) }));

        setAvailableWeeks(weekOptions.reverse());
        setAvailableMonths(monthOptions.reverse());
        setAvailableYears(yearOptions);

        if (weekOptions.length) setSelectedWeek(weekOptions[0].key);
        if (monthOptions.length) setSelectedMonth(monthOptions[0].key);
        if (yearOptions.length) setSelectedYear(yearOptions[0].key);
      } catch (err) {
        console.error("🔥 Error loading available periods:", err);
      }
    };
    loadAvailablePeriods();
  }, []);

  // 🔹 Load collections + chart
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const payrollSnap = await getDocs(collection(db, "payrolls"));
        const billingSnap = await getDocs(collection(db, "billings"));

        const billingMap = {};
        billingSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (!data.company || !data.period) return;
          const key = `${data.company}_${data.period.start}_${data.period.end}`;
          if (data.totals?.fee) {
          billingMap[key] = data.totals.fee;
        } else if (Array.isArray(data.data)) {
          // compute fee manually if new format
          billingMap[key] = data.data.reduce((sum, e) => sum + (e.serviceFee ?? 0), 0);
        } else {
          billingMap[key] = 0;
        }
        });

        const weekData = [];
        const monthData = [];
        const yearData = [];

        // Weekly
        if (selectedWeek) {
          const [startStr, endStr] = selectedWeek.split("|");
          const weekStart = dayjs(startStr);
          const weekEnd = dayjs(endStr);
          setWeekLabel(`${weekStart.format("MMMM D")}–${weekEnd.format("D, YYYY")} Collection`);

          payrollSnap.docs.forEach((doc) => {
            const data = doc.data();
            const { company, period, data: empData } = data;
            if (!period || !period.start || !period.end) return;

            const endDate = dayjs(period.end);
            if (!endDate.isBetween(weekStart, weekEnd, "day", "[]")) return;

            let totalDeductions = 0;
            if (empData && typeof empData === "object") {
              Object.values(empData).forEach((emp) => {
                totalDeductions +=
                  (emp.sss || 0) +
                  (emp.phic || 0) +
                  (emp.hdmf || 0) +
                  (emp.coLoan || 0) +
                  (emp.cA || 0) +
                  (emp.sssLoan || 0) +
                  (emp.sssCal || 0) +
                  (emp.hdmfLoan || 0) +
                  (emp.hdmfCal || 0);
              });
            }

            const key = `${company}_${period.start}_${period.end}`;
            const serviceFee = billingMap[key] || 0;

            weekData.push({
              company,
              period: `${period.start} – ${period.end}`,
              totalDeductions,
              serviceFee,
            });
          });
        }

        // Monthly
        if (selectedMonth) {
          const monthStart = dayjs(selectedMonth + "-01");
          const monthEnd = monthStart.endOf("month");
          setMonthLabel(`${monthStart.format("MMMM, YYYY")} Collection`);

          payrollSnap.docs.forEach((doc) => {
            const data = doc.data();
            const { company, period, data: empData } = data;
            if (!period || !period.start || !period.end) return;

            const endDate = dayjs(period.end);
            if (!endDate.isBetween(monthStart, monthEnd, "day", "[]")) return;

            let totalDeductions = 0;
            if (empData && typeof empData === "object") {
              Object.values(empData).forEach((emp) => {
                totalDeductions +=
                  (emp.sss || 0) +
                  (emp.phic || 0) +
                  (emp.hdmf || 0) +
                  (emp.coLoan || 0) +
                  (emp.cA || 0) +
                  (emp.sssLoan || 0) +
                  (emp.sssCal || 0) +
                  (emp.hdmfLoan || 0) +
                  (emp.hdmfCal || 0);
              });
            }

            const key = `${company}_${period.start}_${period.end}`;
            const serviceFee = billingMap[key] || 0;

            monthData.push({
              company,
              period: `${period.start} – ${period.end}`,
              totalDeductions,
              serviceFee,
            });
          });
        }

        // Yearly
        if (selectedYear) {
          const yearStart = dayjs(`${selectedYear}-01-01`);
          const yearEnd = dayjs(`${selectedYear}-12-31`);
          setYearLabel(`${selectedYear} Collection`);

          // Month accumulator
          const monthlyTotals = {};

          payrollSnap.docs.forEach((doc) => {
            const data = doc.data();
            const { company, period, data: empData } = data;
            if (!period || !period.start || !period.end) return;

            const endDate = dayjs(period.end);
            if (!endDate.isBetween(yearStart, yearEnd, "day", "[]")) return;

            const monthKey = endDate.format("MMM");

            let totalDeductions = 0;
            if (empData && typeof empData === "object") {
              Object.values(empData).forEach((emp) => {
                totalDeductions +=
                  (emp.sss || 0) +
                  (emp.phic || 0) +
                  (emp.hdmf || 0) +
                  (emp.coLoan || 0) +
                  (emp.cA || 0) +
                  (emp.sssLoan || 0) +
                  (emp.sssCal || 0) +
                  (emp.hdmfLoan || 0) +
                  (emp.hdmfCal || 0);
              });
            }

            const key = `${company}_${period.start}_${period.end}`;
            const serviceFee = billingMap[key] || 0;

            yearData.push({
              company,
              period: `${period.start} – ${period.end}`,
              totalDeductions,
              serviceFee,
            });

            // accumulate chart data
            if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { deductions: 0, serviceFee: 0 };
            monthlyTotals[monthKey].deductions += totalDeductions;
            monthlyTotals[monthKey].serviceFee += serviceFee;
          });

          // Prepare chart data sorted by month
          const chartData = Object.entries(monthlyTotals)
            .map(([month, vals]) => ({ month, ...vals }))
            .sort(
              (a, b) => dayjs(a.month, "MMM").month() - dayjs(b.month, "MMM").month()
            );

          setYearlyChartData(chartData);
        }

        setWeeklyCollections(weekData);
        setMonthlyCollections(monthData);
        setYearlyCollections(yearData);
      } catch (err) {
        console.error("🔥 Error loading collections:", err);
      }
    };

    if (selectedWeek || selectedMonth || selectedYear) loadCollections();
  }, [selectedWeek, selectedMonth, selectedYear]);

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "Active").length;
  const inactiveEmployees = employees.filter((e) => e.status === "Inactive").length;
  const totalCompanies = companies.length;

  const computeTotals = (list) =>
    list.reduce(
      (acc, cur) => {
        acc.deductions += cur.totalDeductions || 0;
        acc.fee += cur.serviceFee || 0;
        return acc;
      },
      { deductions: 0, fee: 0 }
    );

  const weekTotals = computeTotals(weeklyCollections);
  const monthTotals = computeTotals(monthlyCollections);
  const yearTotals = computeTotals(yearlyCollections);

  return (
    <Grid container spacing={2}>
      {/* Summary Cards */}
      <SummaryCard title="Total Employees" value={totalEmployees} />
      <SummaryCard title="Active Employees" value={activeEmployees} color="green" />
      <SummaryCard title="Inactive Employees" value={inactiveEmployees} color="red" />
      <SummaryCard title="Total Companies" value={totalCompanies} />

      {/* Collections */}
      <CollectionSection
        title={weekLabel}
        label="Week"
        data={weeklyCollections}
        totals={weekTotals}
        options={availableWeeks}
        value={selectedWeek}
        onChange={setSelectedWeek}
      />
      <CollectionSection
        title={monthLabel}
        label="Month"
        data={monthlyCollections}
        totals={monthTotals}
        options={availableMonths}
        value={selectedMonth}
        onChange={setSelectedMonth}
      />
      <CollectionSection
        title={yearLabel}
        label="Year"
        data={yearlyCollections}
        totals={yearTotals}
        options={availableYears}
        value={selectedYear}
        onChange={setSelectedYear}
      />

      {/* 📊 Yearly Trend Chart */}
      <Grid size={{ xs: 12 }} mt={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            📈 {selectedYear} Yearly Service Fee Trend
          </Typography>

          {yearlyChartData.length === 0 ? (
            <Typography color="text.secondary">
              No chart data available.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(val) => `₱${val.toLocaleString()}`}
                  labelFormatter={(m) => `${m}`}
                />
                <Legend />
                {/* Single data metric: Service Fee */}
                <Bar dataKey="serviceFee" fill="#4caf50" name="Service Fee (₱)" />
                <Line
                  type="monotone"
                  dataKey="serviceFee"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="Service Fee Trend"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Grid>
    </Grid>
  );
};

const SummaryCard = ({ title, value, color }) => (
  <Grid size={{ xs: 12, sm: 6, md: 3 }}>
    <Card>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="h4" color={color || "inherit"}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  </Grid>
);

const CollectionSection = ({ title, label, data, totals, options, value, onChange }) => (
  <Grid size={{ xs: 12 }} mt={3}>
    <Paper sx={{ p: 2 }}>
      <Grid container justifyContent="space-between" alignItems="center">
        <Typography variant="h6">
          {title ? `📊 ${title}` : `Select ${label}`}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>{label}</InputLabel>
          <Select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
            {options.map((opt) => (
              <MenuItem key={opt.key} value={opt.key}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {data.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No payrolls found for this {label.toLowerCase()}.
        </Typography>
      ) : (
        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Period</TableCell>
              <TableCell align="right">Total Deductions</TableCell>
              <TableCell align="right">Service Fee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.company}</TableCell>
                <TableCell>{r.period}</TableCell>
                <TableCell align="right">
                  {r.totalDeductions.toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {r.serviceFee.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <TableCell colSpan={2} align="right">
                TOTAL:
              </TableCell>
              <TableCell align="right">{totals.deductions.toLocaleString()}</TableCell>
              <TableCell align="right">{totals.fee.toLocaleString()}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
    </Paper>
  </Grid>
);

export default Dashboard;
