"use client";

import { CurrentMatch, Header, VoteForm } from "@/components/dashboard";
import { useCurrentMatch, useUserProfile } from "@/hooks";
import { Center, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    setMount(true);
  }, []);

  const {
    user,
    isLoading: isUserLoading,
    reload: reloadUserProfile,
  } = useUserProfile();

  const {
    match: currentMatch,
    loading: isMatchLoading,
    refetch: reloadMatch,
    lastFetchedAt,
  } = useCurrentMatch();

  if (!mount) return null; // Prevent hydration mismatch

  return (
    <VStack minH="100vh">
      <Center
        flexDirection="column"
        w="100%"
        p="4"
        maxW="500px"
        mx="auto"
        gap="6"
      >
        <Header user={user} isUserLoading={isUserLoading} />

        <CurrentMatch
          isMatchLoading={isMatchLoading}
          matchPayload={currentMatch}
          refetchMatch={reloadMatch}
          lastFetchedAt={lastFetchedAt}
        />

        <VoteForm
          user={user}
          currentMatch={currentMatch}
          reloadUserProfile={reloadUserProfile}
        />
      </Center>
    </VStack>
  );
}
