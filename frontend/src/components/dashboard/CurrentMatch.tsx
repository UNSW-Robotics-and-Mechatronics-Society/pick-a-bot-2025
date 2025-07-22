import { PulsingCircle, ReloadButton } from "@/components";
import { CurrentMatchData } from "@/schemas";
import {
  Box,
  Card,
  Center,
  Heading,
  HStack,
  Separator,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { FC, useEffect, useState } from "react";

interface MatchProps {
  isLoading: boolean;
  leftTeam?: string;
  rightTeam?: string;
  leftTeamScore?: number;
  rightTeamScore?: number;
  elapsedTime?: string;
  refetchMatch: () => void;
  lastFetchedAt?: number;
}

const MatchCard: FC<MatchProps> = ({
  isLoading = false,
  leftTeam = "",
  rightTeam = "",
  leftTeamScore = 0,
  rightTeamScore = 0,
  elapsedTime = "00:00",
  refetchMatch,
  lastFetchedAt,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.theme === "dark";
  const getDynamicFontSize = (text: string) => {
    if (!text) return "xl";
    if (text.length > 16) return "3xs";
    if (text.length > 14) return "2xs";
    if (text.length > 12) return "sm";
    if (text.length > 8) return "md";
    return "2xl";
  };
  return (
    <Card.Root
      p="4"
      borderRadius="md"
      boxShadow="md"
      h="18rem"
      w="100%"
      pos="relative"
    >
      <ReloadButton
        isLoading={isLoading}
        onClick={refetchMatch}
        pos="absolute"
        top="4"
        right="4"
        size="xs"
        rounded="full"
        bg="transparent"
        variant="outline"
      />
      <Card.Header p="0">
        <VStack gap="0" alignItems="flex-start">
          <Heading size="md" fontWeight="bold">
            Current Match
          </Heading>
          <Text fontSize="2xs" color={isDarkMode ? "gray.400" : "gray.600"}>
            Last updated:{" "}
            {lastFetchedAt
              ? new Date(lastFetchedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              : "Never"}
          </Text>
        </VStack>
      </Card.Header>
      <Card.Body display="flex" justifyContent="center" p="0">
        <HStack gap="4" justifyContent="space-between">
          {isLoading ? (
            <>
              <Skeleton flex="1" h="5rem" />
              <Heading>vs</Heading>
              <Skeleton flex="1" h="5rem" />
            </>
          ) : (
            <>
              <Box
                fontWeight="bold"
                bgGradient="to-bl"
                gradientFrom="blue.400"
                gradientTo="blue.600"
                borderRadius="md"
                border="2px solid"
                borderColor="blue.300"
                flex="1"
                textAlign="center"
                px="2"
                py="6"
                overflow="hidden"
                minW="0"
                boxShadow="0 4px 20px rgba(0,0,255,0.15), inset 0 1.5px 4px rgba(255,255,255,0.10)"
                _dark={{
                  bgGradient: "linear(to-br, blue.500, blue.700)",
                  boxShadow:
                    "0 4px 20px rgba(0,0,255,0.25), inset 0 1.5px 4px rgba(255,255,255,0.15)",
                }}
              >
                <Heading
                  color="white"
                  position="relative"
                  zIndex={1}
                  fontSize={getDynamicFontSize(leftTeam || "")}
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  w="100%"
                >
                  {leftTeam}
                </Heading>
              </Box>
              <Heading>vs</Heading>
              <Box
                fontWeight="bold"
                bgGradient="to-br"
                gradientFrom="red.400"
                gradientTo="red.600"
                borderRadius="md"
                border="2px solid"
                borderColor="red.300"
                flex="1"
                textAlign="center"
                px="2"
                py="6"
                overflow="hidden"
                minW="0"
                boxShadow="0 4px 20px rgba(255,0,0,0.15), inset 0 1.5px 4px rgba(255,255,255,0.10)"
                _dark={{
                  boxShadow:
                    "0 4px 20px rgba(255,0,0,0.25), inset 0 1.5px 4px rgba(255,255,255,0.15)",
                }}
              >
                <Heading
                  color="white"
                  position="relative"
                  zIndex={1}
                  whiteSpace="nowrap"
                  textOverflow="ellipsis"
                  overflow="hidden"
                  fontSize={getDynamicFontSize(rightTeam || "")}
                >
                  {rightTeam}
                </Heading>
              </Box>
            </>
          )}
        </HStack>
      </Card.Body>
      <Separator py={2} />
      <Card.Footer
        display="flex"
        justifyContent="center"
        flexDir="column"
        gap="2"
        p="0"
      >
        <HStack gap="8" alignItems="center">
          <VStack fontSize="md" gap={1}>
            <Heading>{rightTeamScore}</Heading>
            <Text fontSize="sm">WINS</Text>
          </VStack>
          <VStack gap={1}>
            <PulsingCircle
              color={isDarkMode ? "white" : "black"}
              size="10px"
              animationDuration="1s"
              boxShadow={
                isDarkMode
                  ? "0 0 8px 2px rgba(255, 255, 255, 0.3)"
                  : "0 0 8px 2px rgba(0, 0, 0, 0.3)"
              }
              gradient="linear(to-r, blue.500, purple.500)"
              borderRadius="50%"
            />
            <Text>LIVE</Text>
          </VStack>
          <VStack fontSize="md" gap={1}>
            <Heading>{leftTeamScore}</Heading>
            <Text fontSize="sm">WINS</Text>
          </VStack>
        </HStack>
        <Text fontSize="sm" color={isDarkMode ? "gray.200" : "gray.800"}>
          {elapsedTime}{" "}
          <Text as="span" color="gray.400">
            elapsed
          </Text>
        </Text>
      </Card.Footer>
    </Card.Root>
  );
};

interface CurrentMatchProps {
  isMatchLoading: boolean;
  matchPayload: CurrentMatchData | null;
  refetchMatch: () => void;
  lastFetchedAt?: number;
}

export const CurrentMatch: FC<CurrentMatchProps> = ({
  isMatchLoading,
  matchPayload,
  refetchMatch,
  lastFetchedAt,
}) => {
  const [elapsed, setElapsed] = useState("00:00");

  useEffect(() => {
    if (!matchPayload?.underway_time) {
      setElapsed("00:00");
      return;
    }

    const update = () => {
      const now = Date.now();
      const start = new Date(matchPayload.underway_time ?? 0).getTime();
      const diff = Math.max(0, now - start);
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsed(
        `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
      );
    };

    update(); // initialize immediately
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [matchPayload?.underway_time]);

  return (
    <Box w="100%" mb="6">
      {matchPayload ? (
        <MatchCard
          isLoading={isMatchLoading}
          leftTeam={matchPayload.bot1}
          rightTeam={matchPayload.bot2}
          leftTeamScore={matchPayload.score_bot1}
          rightTeamScore={matchPayload.score_bot2}
          elapsedTime={elapsed}
          refetchMatch={refetchMatch}
          lastFetchedAt={lastFetchedAt}
        />
      ) : (
        <Box pos={"relative"} w="100%" h="18rem">
          <Center
            position="absolute"
            p="4"
            bg="rgba(0, 0, 0, 0.3)"
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            textAlign="center"
            color="gray.600"
            h="full"
            inset="0"
            zIndex="overlay"
            _dark={{ color: "gray.300" }}
          >
            No current match available
          </Center>
          <MatchCard isLoading={isMatchLoading} refetchMatch={refetchMatch} />
        </Box>
      )}
    </Box>
  );
};

export default CurrentMatch;
