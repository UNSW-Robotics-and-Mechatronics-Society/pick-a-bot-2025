'use client'

import { useColorMode } from "@/components/ui/color-mode";
import Dock from "@/components/ui/dock";
import { Leaderboard } from "@/components/ui/leaderboard";
import { Podium } from "@/components/ui/podium";
import { LeaderboardData } from "@/components/ui/types";
import { useUserProfile } from "@/hooks";
import { Container, Heading } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IoMdRibbon } from "react-icons/io";
import { VscColorMode, VscCombine, VscHome } from "react-icons/vsc";

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserProfile();

  const [mount, setMount] = useState(false);
  const router = useRouter();
  const { toggleColorMode } = useColorMode();

  useEffect(() => {
    setMount(true);

    const fetchData = async () => {
      try {
        const response = await fetch('/api/leaderboard');

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: LeaderboardData = await response.json();

        console.log("Fetched leaderboard data:", result);

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const topThree = data?.top.slice(0, 3) ?? [];

  if (!mount) return null;

  const items = [
    {
      icon: <VscHome size={18} />,
      label: "Home",
      onClick: () => router.push("/dashboard"),
    },
    {
      icon: <VscCombine size={18} />,
      label: "Bracket",
      onClick: () => router.push("/bracket"),
    },
    {
      icon: <IoMdRibbon size={18} />,
      label: "Leaderboard",
      onClick: () => router.push("/leaderboard"),
    },
    {
      icon: <VscColorMode size={18} />,
      label: "Colour Mode",
      onClick: toggleColorMode,
    },
  ];

  return (
    <Container maxW="container.md" py={8} pb="24">
      <Heading size="xl" mb={6}>
        Token Leaderboard
      </Heading>

      {!isLoading && data && data.top.length >= 3 && <Podium data={data} />}

      {data && (
        <Leaderboard
          data={data}
          isLoading={isLoading}
          error={error}
        />
      )}

      <Dock items={items} />
    </Container>
  );
}
