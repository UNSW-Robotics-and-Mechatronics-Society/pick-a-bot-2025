"use client";

import { CurrentMatch, Header, VoteForm } from "@/components/dashboard";
import { useColorMode } from "@/components/ui/color-mode";
import Dock from "@/components/ui/dock";
import { useCurrentMatch, useUserProfile } from "@/hooks";
import { Center, VStack } from "@chakra-ui/react";
import { useRouter } from "next/navigation"; // Changed import
import { useEffect, useState } from "react";
import { VscColorMode, VscCombine, VscHome } from "react-icons/vsc";

export default function DashboardPage() {
  const [mount, setMount] = useState(false);
  const router = useRouter(); // Now from next/navigation

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
    loading: isMatchLoading,
    refetch: refetchMatch,
    lastFetchedAt,
  } = useCurrentMatch();

  const { toggleColorMode } = useColorMode();

  useEffect(() => {
    if (!currentMatch) {
      const timer = setTimeout(refetchUserProfile, 60000);
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
      icon: <VscColorMode size={18} />,
      label: "Colour Mode",
      onClick: toggleColorMode,
    },
  ];

  return (
    <VStack minH="100vh" maxW="100vw">
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
          reloadUserProfile={refetchUserProfile}
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
