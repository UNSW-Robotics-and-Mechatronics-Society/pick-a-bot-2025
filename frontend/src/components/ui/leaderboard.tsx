'use client'

import { Badge, Box, Skeleton, Table, Text } from "@chakra-ui/react";

export type LeaderboardEntry = {
  name: string;
  tokens: number;
  rank: number;
};

type LeaderboardProps = {
  data: LeaderboardEntry[];
  isLoading?: boolean;
  error?: string | null;
  currentUsername?: string | null; // New prop
};

export const Leaderboard = ({ 
  data, 
  isLoading = false, 
  error = null,
  currentUsername 
}: LeaderboardProps) => {
  if (isLoading) {
    return (
      <Box>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height="40px" my={2} />
        ))}
      </Box>
    );
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (data.length === 0) {
    return <Text>No leaderboard data available</Text>;
  }

  return (
    <Box border="1px solid" borderColor="gray.200" borderRadius="lg" overflow="hidden">
      <Table.ScrollArea height="400px">
        <Table.Root stickyHeader size="sm">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader width="15%">Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Tokens</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((entry) => (
              <Table.Row 
                key={`${entry.name}-${entry.rank}`}
                bg={entry.name === currentUsername ? 'blue.50' : 'transparent'}
                _hover={{ bg: entry.name === currentUsername ? 'blue.100' : 'gray.50' }}
              >
                <Table.Cell>
                  <Badge
                    bg={entry.rank <= 3 ? 
                      (entry.rank === 1 ? 'yellow.400' : 
                      entry.rank === 2 ? 'gray.300' : 
                      'orange.300') : 
                      'transparent'}
                    color={entry.rank <= 3 ? 
                      (entry.rank === 1 ? 'yellow.800' : 
                      entry.rank === 2 ? 'gray.800' : 
                      'orange.800') : 
                      'currentColor'}
                    borderWidth="1px"
                    borderColor={
                      entry.rank === 1 ? 'yellow.500' : 
                      entry.rank === 2 ? 'gray.400' : 
                      entry.rank === 3 ? 'orange.400' : 'gray.200'
                    }
                    px={2}
                    py={1}
                    w={12}
                    minW={12}
                    display="inline-flex"
                    justifyContent="center"
                    alignItems="center"
                    borderRadius="full"
                    fontSize="md"
                    fontWeight="bold"
                  >
                    #{entry.rank}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text 
                    fontWeight={entry.name === currentUsername ? 'bold' : 'medium'}
                    color={entry.name === currentUsername ? 'blue.600' : 'inherit'}
                  >
                    {entry.name}
                    {entry.name === currentUsername && (
                      <Text as="span" ml={2} color="blue.500" fontSize="sm">(You)</Text>
                    )}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Text fontWeight="bold">{entry.tokens.toLocaleString()}</Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};
