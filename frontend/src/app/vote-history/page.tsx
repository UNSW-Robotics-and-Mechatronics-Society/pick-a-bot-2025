"use client";

import axios from "axios";
import React from "react";

import { useColorMode } from "@/components/ui/color-mode";
import Dock from "@/components/ui/dock";
import {
  Badge,
  Box,
  Center,
  Heading,
  HStack,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { VscColorMode, VscCombine, VscHistory, VscHome } from "react-icons/vsc";

interface VoteHistoryItem {
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  bot_chosen: string;
  winner: string;
  match: {
    bot1: string;
    bot2: string;
    ordering: string;
  };
}

const VoteHistory = () => {
  const router = useRouter();
  const { toggleColorMode } = useColorMode();
  const [voteHistory, setVoteHistory] = React.useState([]);

  React.useEffect(() => {
    const fetchVoteHistory = async () => {
      try {
        const response = await axios.get("/api/user/vote-history");
        setVoteHistory(response.data);
      } catch (error) {
        console.error("Error fetching vote history:", error);
      }
    };

    fetchVoteHistory();
  }, []);

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
    <VStack>
      <Center p={4} flexDirection="column">
        <Heading pb="4">Vote History</Heading>
      </Center>
      {voteHistory.length > 0 ? (
        voteHistory.map((vote: VoteHistoryItem, index) => (
          <Box
            key={index}
            p={4}
            borderWidth="2px"
            borderRadius="lg"
            width="90%"
            bg={
              vote.balance_before > vote.balance_after ? "red.200" : "blue.100"
            }
          >
            <Stack gap={2}>
              <Text fontSize="md" fontWeight="semibold" color="gray.500">
                Match #{vote.match.ordering}
              </Text>
              <Text>
                <strong>Match:</strong> {vote.match.bot1} vs {vote.match.bot2}
              </Text>
              <Text>
                <strong>Bot Chosen:</strong> {vote.bot_chosen}
              </Text>
              <Text>
                <strong>Winner:</strong> {vote.winner}
              </Text>

              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.500">
                  Balance Before: {vote.balance_before}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Balance After: {vote.balance_after}
                </Text>
              </HStack>

              {vote.balance_before > vote.balance_after ? (
                <Badge colorPalette="pink">Amount: - {vote.amount}</Badge>
              ) : (
                <Badge colorPalette="white">Amount: + {vote.amount}</Badge>
              )}
            </Stack>
          </Box>
        ))
      ) : (
        <Text>No voting history available.</Text>
      )}
      <Dock items={items} />
    </VStack>
  );
};

export default VoteHistory;
