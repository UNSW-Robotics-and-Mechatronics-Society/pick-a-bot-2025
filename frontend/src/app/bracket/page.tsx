"use client";

import { useColorMode } from "@/components/ui/color-mode";
import Dock from "@/components/ui/dock";
import { Center, Heading, VStack } from "@chakra-ui/react";
import { useRouter } from 'next/navigation'; // Changed import
import { useEffect, useState } from "react";
import { VscColorMode, VscCombine, VscHome } from 'react-icons/vsc';

export default function BracketPage() {
  const [mount, setMount] = useState(false);
  const router = useRouter(); // Now from next/navigation

  useEffect(() => {
    setMount(true);
  }, []);

  const { toggleColorMode } = useColorMode();

  if (!mount) return null; // Prevent hydration mismatch

  const items = [
    { icon: <VscHome size={18} />, label: 'Home', onClick: () => router.push('/dashboard') },
    { icon: <VscCombine size={18} />, label: 'Bracket', onClick: () => router.push('/bracket') },
    { icon: <VscColorMode size={18} />, label: 'Colour Mode', onClick: toggleColorMode},
  ];

  return (
    <VStack minH="100vh" maxW="100vw">
        <Center w="100%" minH="100vh" p={4} flexDirection="column">
          <Heading pb="4">Competition Bracket</Heading>
          <iframe 
            src={`https://challonge.com/${process.env.NEXT_PUBLIC_CHALLONGE_TOURNAMENT_ID}/module`} 
            className="shadow-[10px_15px_30px_#e1710099] ring-2 ring-amber-600"

            width="100%" 
            height="550" 
            style={{ borderRadius: "8px", }}
          ></iframe>
          <Dock 
            items={items}
            panelHeight={68}
            baseItemSize={50}
            magnification={70}
          />
      </Center>
    </VStack>
  );
}
