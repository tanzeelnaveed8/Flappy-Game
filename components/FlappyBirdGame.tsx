"use client";
import dynamic from "next/dynamic";
import { useIsMobile } from "@/app/hooks/useIsMobile";

const FlappyBirdGamePC = dynamic(() => import("../app/FlappyBirdGamePC/page"), { ssr: false });
const FlappyBirdGameMobile = dynamic(() => import("../app/FlappyBirdGameMobile/page"), { ssr: false });

export default function FlappyBirdGame() {
  const isMobile = useIsMobile();

  return <>{isMobile ? <FlappyBirdGameMobile /> : <FlappyBirdGamePC />}</>;
}
