"use client";
import SideBar from "@/admin/_components/SideBar";
import NewSale from "../_components/NewSale";
import NewStock from "../stock/_tabs/history/_components/newStock";
import NewProductLoss from "../stock/_tabs/history/_components/newProductLoss";
import { StockTransactionProvider } from "@/_store/stock/StockTransactionContext";
import { CatalogProvider } from "@/_store/catalog/CatalogContext";
import { WorkDayProvider } from "@/_store/workDay/WorkDayContext";
import CurrentWorkDayCards from "../_components/CurrentWorkDayCards";
import StoreStatusDot from "../_components/StoreStatusDot";
import TopProductsChart from "../_components/TopProductsChart";
import ExpiredProductsWarning from "../_components/ExpiredProductsWarning";
import LowStockWarning from "../_components/LowStockWarning";
import PaymentMethodsChart from "../_components/PaymentMethodsChart";
import OpenTabsList from "../_components/OpenTabsList";
import DeliveryOrdersSection from "../_components/DeliveryOrdersSection";

const ResumePage = () => {
  return (
    <div className="flex h-screen w-full gap-1 overflow-hidden p-1">
      <SideBar />

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-md border border-black bg-white p-4">
        <WorkDayProvider>
          {/* Atalhos */}
          <StockTransactionProvider>
            <CatalogProvider>
              <div className="flex flex-wrap items-center gap-2">
                <NewSale />
                <NewStock />
                <NewProductLoss />
                <StoreStatusDot />
              </div>
            </CatalogProvider>
          </StockTransactionProvider>

          {/* Só o traço separando os atalhos dos indicadores. */}
          <hr className="my-2" />

          <div className="flex items-stretch gap-2">
            {/* Esquerda: indicadores em cima, pedidos (todas as etapas)
                embaixo, ambos com a mesma largura. */}
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <CurrentWorkDayCards />
                <TopProductsChart />
                <PaymentMethodsChart scope="today" compact />
                <ExpiredProductsWarning />
                <LowStockWarning />
              </div>

              <DeliveryOrdersSection />
            </div>

            {/* Direita: notinhas em aberto, esticando pra acompanhar a
                altura total da coluna da esquerda. */}
            <OpenTabsList />
          </div>
        </WorkDayProvider>
      </div>
    </div>
  );
};

export default ResumePage;
