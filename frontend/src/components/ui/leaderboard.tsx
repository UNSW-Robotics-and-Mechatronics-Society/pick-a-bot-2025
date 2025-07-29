import { Badge, Container, Heading, Table, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  name: string;
  tokens: number;
  rank: number;
};

type ApiResponse = {
  dbResp: {
    data: LeaderboardEntry[];
  };
};

const Leaderboard = ({ data }: { data: LeaderboardEntry[] }) => {
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
  const [data, setData] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json() as Promise<ApiResponse>)
      .then((result) => {
        setData(result.dbResp.data);
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
