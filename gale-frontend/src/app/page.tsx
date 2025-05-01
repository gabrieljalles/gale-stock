"use client";
import { Button } from "@/_components/ui/button";
import { House } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SideBar from "@/_components/SideBar";

export default function Home() {
  return (
    //main
    <div className="flex flex-col gap-4">
      <SideBar />
    </div>
  );
}
