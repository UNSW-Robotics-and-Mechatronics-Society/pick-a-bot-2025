"use client";

import { CurrentMatch, Header, VoteForm } from "@/components/dashboard";
import { useCurrentMatch, useUserProfile } from "@/hooks";
import { Center, VStack } from "@chakra-ui/react";

export default function DashboardPage() {
  const {
    user,
    isLoading: isUserLoading,
    reload: reloadUserProfile,
  } = useUserProfile();

  const {
    match: currentMatch,
    loading: isMatchLoading,
    reload: reloadMatch,
  } = useCurrentMatch();

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
