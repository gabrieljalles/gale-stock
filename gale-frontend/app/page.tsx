"use client";
import { Button } from "@/_components/ui/button";
import { Car, House } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SideBar from "@/admin/_components/SideBar";
import Header from "./_components/Header";
import VideoCarousel from "./_components/Carousel";

export default function Home() {
  const videos = ["video-carousel/promocoes.mp4", "video-carousel/doces.mp4"];

  return (
    //main
    <div className="mx-auto flex h-full w-[1440px] flex-col pt-[70px]">
      <Header />

      {/* Hero section */}
      <div className="flex flex-col gap-4 p-4">
        <VideoCarousel videos={videos} />
        <div className="mx-auto h-40 w-full max-w-[1124px] bg-black"></div>
      </div>
    </div>
  );
}
