"use client";

import { Icon } from "@chakra-ui/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useColorModeValue } from "./ColorModeButton";

export const ArcLogo = () => {
  const [isMounted, setIsMounted] = useState(false);
  const logoSrc = useColorModeValue(
    "/unsw_arc_logo_black.svg",
    "/unsw_arc_logo_white.svg"
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null; // Avoid initial mismatches
  return (
    <Icon pos="fixed" top="0" right="2" zIndex="overlay">
      <Image
        src={logoSrc}
        alt="UNSW Arc Logo"
        width={80}
        height={80}
        priority
      />
    </Icon>
  );
};

export default ArcLogo;
