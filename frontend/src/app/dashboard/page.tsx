"use client";
import { Toaster, toaster } from "@/components/ui/toaster";
import {
  Box,
  Button,
  ButtonGroup,
  Center,
  Field,
  Heading,
  Input,
  Skeleton,
} from "@chakra-ui/react";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaLock } from "react-icons/fa";
import { useLocalStorage } from "usehooks-ts";
import Match from "../../components/ui/match";

export default function DashboardPage() {
  const [selected, setSelected] = useState("");
  const [name] = useLocalStorage("name", "");
  const [jwt] = useLocalStorage("jwt", "");
  const [email] = useLocalStorage("email", "");
  const [amount, setAmount] = useState("");
  interface MatchType {
    bot1: string;
    bot2: string;
    is_final: boolean;
    challonge_match_id: string;
    [key: string]: unknown;
  }

  interface UserType {
    tokens: number;
    [key: string]: unknown;
  }

  const [user, setUser] = useState<UserType | null>(null);
  const [matchPayload] = useState<MatchType[] | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      if (!email) return;
      const res = await fetch(`/api/user?email=${email}`);
      if (!res.ok) {
        console.error("User not found");
        return;
      }
      const userData: Partial<UserType> = await res.json();
      if (userData && typeof userData.tokens === "number")
        setUser(userData as UserType);
    };

    fetchUser();
  }, [email]);

  // Fetch matches
  // useEffect(() => {
  //   const fetchMatches = async () => {
  //     const error = null;

  //     if (error) console.error("Match fetch error:", error);
  //   };

  //   fetchMatches();

  //   const matchSub = supabase
  //     .channel("public:match")
  //     .on(
  //       "postgres_changes",
  //       { event: "*", schema: "public", table: "match" },
  //       () => {
  //         console.log("Match changed. Refetching...");
  //         fetchMatches();
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(matchSub);
  //   };
  // }, []);

  const handleVote = async () => {
    const parsedAmount = parseInt(amount, 10);

    if (!selected) {
      toaster.create({
        title: "No bot selected",
        type: "error",
        closable: true,
      });
      return;
    }

    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toaster.create({
        title: "Invalid token amount",
        type: "error",
        closable: true,
      });
      return;
    }

    if (!user) {
      toaster.create({
        title: "User data not loaded",
        type: "error",
        closable: true,
      });
      return;
    }

    const isFinal = matchPayload?.[0]?.is_final;
    const tokenLimit = isFinal ? user.tokens : user.tokens * 0.5;

    if (parsedAmount > tokenLimit) {
      toaster.create({
        title: isFinal
          ? "You don't have enough tokens"
          : "Exceeds 50% token limit for this round",
        type: "error",
        closable: true,
      });
      return;
    }

    try {
      await axios.post("/api/vote", {
        matchId: matchPayload?.[0]?.challonge_match_id,
        botChosen: selected,
        amount: parsedAmount,
        jwt,
      });

      toaster.create({
        title: "Vote submitted!",
        description: `You bet ${parsedAmount} tokens on ${selected}`,
        type: "success",
        closable: true,
      });

      // Optional: refresh user token count
      const updatedUser = await fetch(`/api/user?email=${email}`).then(
        (res) => res.json() as Promise<UserType>
      );
      setUser(updatedUser);
    } catch (err: unknown) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Unknown error";
      toaster.create({
        title: "Vote failed",
        description: errorMessage,
        type: "error",
        closable: true,
      });
    }
  };

  const currentMatch = matchPayload?.[0];
  const upcomingMatch = matchPayload?.[1];

  return (
    <Box padding="4" h="dvh" w="dvw" fontSize="md">
      <Toaster />
      <Center
        flexDirection="column"
        h="90%"
        w="100%"
        p="4"
        maxW={"500px"}
        mx="auto"
      >
        <Box w="100%" display="flex" justifyContent="space-between" mb="4">
          <Heading fontWeight="bold">
            Welcome{" "}
            {mounted
              ? name || (
                  <Skeleton
                    marginBottom={-0.5}
                    width="80px"
                    height="1em"
                    display="inline-block"
                  />
                )
              : ""}
          </Heading>
          <Box display={"flex"} flexDir={"row"} alignItems="center">
            <Heading fontWeight="bold" color="orange.500" mr="2">
              {mounted
                ? (user?.tokens ?? (
                    <Skeleton
                      marginBottom={-0.5}
                      width="50px"
                      height="1em"
                      display="inline-block"
                    />
                  ))
                : ""}
            </Heading>
            <Image
              src="/ram-buck.svg"
              height="30"
              width="30"
              alt="Rambo's Ram-Bucks"
            />
          </Box>
        </Box>
        <Box w="100%">
          <Heading>Current Round</Heading>
          {currentMatch ? (
            <Match
              leftLabel={currentMatch.bot1}
              rightLabel={currentMatch.bot2}
              leftColor="blue.500"
              rightColor="red.500"
              leftBorderColor="blue.500"
              rightBorderColor="red.500"
            />
          ) : (
            <Skeleton height="50px" width="100%" mb="4" />
          )}

          <Heading>Upcoming Round</Heading>
          {upcomingMatch ? (
            <Match
              leftLabel={upcomingMatch.bot1}
              rightLabel={upcomingMatch.bot2}
              leftColor="green.500"
              rightColor="purple.500"
              leftBorderColor="green.500"
              rightBorderColor="purple.500"
            />
          ) : (
            <Skeleton height="50px" width="100%" mb="4" />
          )}
        </Box>

        <Box w="100%">
          <Heading>Betting</Heading>
          <Box textAlign="center" fontWeight={"Bold"}>
            Pick a Bot!
          </Box>
          <ButtonGroup w="100%" mb="4">
            {[currentMatch?.bot1, currentMatch?.bot2]
              .filter((item): item is string => typeof item === "string")
              .map((item) => (
                <Button
                  key={item}
                  flex="1"
                  p="5"
                  fontWeight="bold"
                  fontSize="lg"
                  borderRadius="md"
                  borderWidth="3px"
                  colorScheme={selected === item ? "purple" : "gray"}
                  variant={selected === item ? "solid" : "outline"}
                  onClick={() => setSelected(item)}
                  bg={selected === item ? "pink.400" : "gray.700"}
                  color={selected === item ? "white" : "gray.300"}
                  borderColor={selected === item ? "pink.500" : "gray.600"}
                  _hover={{
                    bg: selected === item ? "purple.600" : "gray.600",
                  }}
                >
                  {item}
                </Button>
              ))}
          </ButtonGroup>

          <Box textAlign="center" fontWeight={"Bold"}>
            How much?
          </Box>
          <Box textAlign="center" fontStyle="italic" color="gray.600">
            This round is capped at 50%
          </Box>
          <Field.Root mb="4">
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Please enter your amount    /300"
              w="100%"
              p="5"
              color="orange.600"
              bg="orange.300"
              borderColor="orange.500"
              fontWeight="bold"
              textAlign="center"
              fontSize="md"
              borderRadius="md"
              borderWidth="3px"
              _placeholder={{ color: "orange.600", fontWeight: "bold" }}
            />
          </Field.Root>

          <Button
            w="100%"
            p="5"
            color="red.600"
            bg="red.300"
            borderColor="red.500"
            fontWeight="bold"
            fontSize="lg"
            borderRadius="md"
            borderWidth="3px"
            onClick={handleVote}
          >
            <FaLock />
            Lock Selection
          </Button>
        </Box>
      </Center>
    </Box>
  );
}
