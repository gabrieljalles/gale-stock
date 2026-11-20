"use client";

import SideBar from "@/admin/_components/SideBar";
import WorkDaysReport from "../_components/WorkDaysReport";
import WorkDayMetricsChart from "../_components/WorkDayMetricsChart";
import MarginTrendChart from "../_components/MarginTrendChart";
import ProductMarginChart from "../_components/ProductMarginChart";
import FinanceSummaryCards from "../_components/FinanceSummaryCards";
import PaymentMethodsChart from "../_components/PaymentMethodsChart";

const FinancePage = () => {
  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto rounded-md border border-black bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <FinanceSummaryCards />
        </div>

        <WorkDaysReport />

        <hr />
        <PaymentMethodsChart />

        <hr />
        <WorkDayMetricsChart />

        <hr />
        <MarginTrendChart />

        <hr />
        <ProductMarginChart />
      </div>
    </div>
  );
};

export default FinancePage;
