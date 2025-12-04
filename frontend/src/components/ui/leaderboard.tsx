'use client'

import { useColorMode } from "@/components/ui/color-mode";
import { Badge, Box, Skeleton, Table, Text } from "@chakra-ui/react";
import { LeaderboardProps } from "./types";

export const Leaderboard = ({ 
  data, 
  isLoading = false, 
  error = null 
}: LeaderboardProps) => {
  const { colorMode } = useColorMode();

  // Theme variables
  const themeStyles = {
    borderColor: colorMode === 'dark' ? 'gray.700' : 'gray.200',
    bgColor: colorMode === 'dark' ? 'gray.800' : 'white',
    headerBg: colorMode === 'dark' ? 'gray.700' : 'gray.50',
    rowHover: colorMode === 'dark' ? 'gray.700' : 'gray.50',
    currentUserBg: colorMode === 'dark' ? 'blue.900' : 'blue.50',
    currentUserHover: colorMode === 'dark' ? 'blue.800' : 'blue.100',
    currentUserText: colorMode === 'dark' ? 'blue.200' : 'blue.600',
    textColor: colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800'
  };

  if (isLoading) {
    return <Box>{[...Array(5)].map((_, i) => <Skeleton key={i} height="40px" my={2} />)}</Box>;
  }

  if (error) return <Text color="red.500">{error}</Text>;
  if (!data?.top?.length) return <Text>No leaderboard data available</Text>;

  return (
    <Box 
      border="1px solid"
      borderColor={themeStyles.borderColor}
      borderRadius="lg"
      overflow="hidden"
      bg={themeStyles.bgColor}
      boxShadow="sm"
    >
      <Table.ScrollArea height="400px">
        <Table.Root stickyHeader size="sm">
          <Table.Header>
            <Table.Row bg={themeStyles.headerBg}>
              <Table.ColumnHeader width="15%">Rank</Table.ColumnHeader>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Points</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.top.map((entry) => (
              <Table.Row 
                key={`${entry.name}-${entry.rank}`}
                bg={entry.name === data.self.name ? themeStyles.currentUserBg : 'transparent'}
                _hover={{ 
                  bg: entry.name === data.self.name ? themeStyles.currentUserHover : themeStyles.rowHover 
                }}
                borderTop="1px solid"
                borderColor={themeStyles.borderColor}
              >
                <Table.Cell>
                  <Badge
                    bg={entry.rank <= 3 ? 
                      (entry.rank === 1 ? 'yellow.400' : 
                       entry.rank === 2 ? 'gray.300' : 
                       'orange.300') : 
                      'transparent'}
                    color={entry.rank <= 3 ? (colorMode === 'dark' ? 'white' : 'currentColor') : 'currentColor'}
                    borderWidth="1px"
                    borderColor={
                      entry.rank === 1 ? 'yellow.500' : 
                      entry.rank === 2 ? 'gray.400' : 
                      entry.rank === 3 ? 'orange.400' : themeStyles.borderColor
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
                    fontWeight={entry.name === data.self.name ? 'bold' : 'medium'}
                    color={entry.name === data.self.name ? themeStyles.currentUserText : themeStyles.textColor}
                  >
                    {entry.name}
                    {entry.name === data.self.name && (
                      <Text as="span" ml={2} color={themeStyles.currentUserText} fontSize="sm">(You)</Text>
                    )}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="end">
                  <Text fontWeight="bold" color={themeStyles.textColor}>
                    {entry.points.toLocaleString()}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
};
