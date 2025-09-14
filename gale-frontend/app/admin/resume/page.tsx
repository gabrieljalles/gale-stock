"use client";
import { Button } from "@/_components/ui/button";
import SideBar from "@/admin/_components/SideBar";
import { useState } from "react";
import NewSale from "../_components/NewSale";


const ResumePage = () => {
  
  return (
    <div className="flex h-screen w-full gap-1 p-1">
      <SideBar />

      {/* Content */}
      <div className="flex-1 rounded-md border border-black bg-white p-1">
        {/* Atalhos */}
        <div className=" p-4">
            {/* Função de nova venda */}
            <NewSale />
        </div>
      </div>

    </div>
  );
};

export default ResumePage;
