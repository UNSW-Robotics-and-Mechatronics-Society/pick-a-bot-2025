"use client";

import { CurrentMatch, Header, VoteForm } from "@/components/dashboard";
import { MatchResultOverlay } from "@/components/dashboard/MatchResultOverlay";
import { useColorMode } from "@/components/ui/color-mode";
import Dock from "@/components/ui/dock";
import { TOKEN_TRANSACTION_TIMEOUT } from "@/constants";
import { useCurrentMatch, useUserProfile } from "@/hooks";
import { Center, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VscColorMode, VscCombine, VscHistory, VscHome } from "react-icons/vsc";

export default function DashboardPage() {
  const [mount, setMount] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMount(true);
  }, []);

  const {
    user,
    isLoading: isUserLoading,
    refetch: refetchUserProfile,
  } = useUserProfile();

  const {
    match: currentMatch,
    isLoading: isMatchLoading,
    refetch: refetchMatch,
    lastFetchedAt,
    previousMatchResult,
  } = useCurrentMatch();

  const { toggleColorMode } = useColorMode();

  useEffect(() => {
    if (!currentMatch) {
      const timer = setTimeout(refetchUserProfile, TOKEN_TRANSACTION_TIMEOUT);
      return () => clearTimeout(timer);
    }
  }, [currentMatch, refetchUserProfile]);

  if (!mount) return null; // Prevent hydration mismatch

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
      icon: <VscHistory size={18} />,
      label: "Vote History",
      onClick: () => router.push("/vote-history"),
    },
    {
      icon: <VscColorMode size={18} />,
      label: "Colour Mode",
      onClick: toggleColorMode,
    },
  ];

  return (
    <VStack minH="100vh" maxW="100vw" position="relative">
      <MatchResultOverlay previousMatchResult={previousMatchResult} />
      <Center
        flexDirection="column"
        w="100%"
        p="4"
        maxW="500px"
        mx="auto"
        gap="6"
        mb="24"
      >
        <Header user={user} isUserLoading={isUserLoading} />

        <CurrentMatch
          isMatchLoading={isMatchLoading}
          matchPayload={currentMatch}
          refetchMatch={refetchMatch}
          lastFetchedAt={lastFetchedAt}
        />

        <VoteForm
          user={user}
          currentMatch={currentMatch}
          refetchUserProfile={refetchUserProfile}
        />

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
