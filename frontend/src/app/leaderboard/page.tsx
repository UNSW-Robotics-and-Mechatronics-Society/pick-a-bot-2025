'use client'

import { Badge, Container, Heading, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  name: string;
  tokens: number;
};

type RankedLeaderboardEntry = LeaderboardEntry & {
  rank: number;
};

type ApiResponse = {
  dbResp: {
    data: LeaderboardEntry[];
  };
};

// Function to calculate ranks (handles ties)
const calculateRanks = (entries: LeaderboardEntry[]): RankedLeaderboardEntry[] => {
  if (entries.length === 0) return [];
  
  let currentRank = 1;
  let previousTokens = entries[0].tokens;
  
  return entries.map((entry, index) => {
    // If current tokens are less than previous, increase rank
    if (entry.tokens < previousTokens) {
      currentRank = index + 1;
    }
    previousTokens = entry.tokens;
    
    return {
      ...entry,
      rank: currentRank
    };
  });
};

const Leaderboard = ({ data }: { data: RankedLeaderboardEntry[] }) => {
  return (
    <Table.Root size="sm">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader width="15%">Rank</Table.ColumnHeader>
          <Table.ColumnHeader>Name</Table.ColumnHeader>
          <Table.ColumnHeader textAlign="end">Tokens</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {data.map((entry) => (
          <Table.Row key={`${entry.name}-${entry.rank}`}>
            <Table.Cell>
              {entry.rank <= 3 ? (
                <Badge 
                  colorScheme={
                    entry.rank === 1 ? 'yellow' : 
                    entry.rank === 2 ? 'gray' : 'orange'
                  }
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {entry.rank}
                </Badge>
              ) : (
                <Text fontWeight="bold">{entry.rank}</Text>
              )}
            </Table.Cell>
            <Table.Cell>
              <Text fontWeight="medium">{entry.name}</Text>
            </Table.Cell>
            <Table.Cell textAlign="end">
              <Text fontWeight="bold">{entry.tokens.toLocaleString()}</Text>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
};

export default function LeaderboardPage() {
  const [data, setData] = useState<RankedLeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((result) => {
        // Calculate ranks after receiving the ordered data
        const rankedData = calculateRanks(result.dbResp.data);
        setData(rankedData);
      })
      .catch(() => {
        setData([]);
      });
  }, []);

  return (
    <Container maxW="container.md" py={8}>
      <Heading size="xl" mb={6}>
        Token Leaderboard
      </Heading>
      <Leaderboard data={data} />
    </Container>
  );
}
