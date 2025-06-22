"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Center,
  Heading,
  List,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useLocalStorage } from "usehooks-ts";
import { PICKABOTS_RULE_BOOK_URL } from "./constants";
import NextLink from "next/link";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const [jwt] = useLocalStorage("jwt", "");
  const [name] = useLocalStorage("name", "");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid initial mismatches

  return (
    <Center minH="dvh">
      <Stack gap="4" align="center" width="full" maxW="lg">
        <Stack align="center" textAlign="center">
          <Heading size="lg" color="gray.400">
            UNSW RAMSOC presents to you
          </Heading>
          <Image
            src="/ramsoc-logo-blue.svg"
            alt="RAMSoc Logo"
            width={130}
            height={130}
          />
          <Heading>PICK-A-BOTS</Heading>
          <Heading size="sm" color="gray.400">
            SUMOBOTS 2025
          </Heading>
        </Stack>

        <Stack alignSelf="center" width="5/6">
          <Stack gap="2">
            <Text>Here&apos;s how it works.</Text>
            <List.Root paddingLeft="4">
              <List.Item>
                Each player will be given 100 starting tokens
              </List.Item>
              <List.Item>
                Each round of the finals you will be able to "vote" on a bot
              </List.Item>
              <List.Item>
                If you win a "vote", the tokens you "vote" will be doubled
              </List.Item>
              <List.Item>
                "Voting" for each round will have a cap on how much you can
                "vote" except the final
              </List.Item>
              <List.Item>You are competing to have the most tokens</List.Item>
              <List.Item>The winner will get a prize of ______</List.Item>
            </List.Root>
            <Box>
              For more information click{" "}
              <Link href={PICKABOTS_RULE_BOOK_URL} color="blue.400">
                here
              </Link>
            </Box>
            <Text>Good luck, May the odds be ever in your favor!</Text>
          </Stack>
        </Stack>

        <Button
          bg="blue.400"
          borderWidth="2px"
          borderColor="blue.600"
          size="lg"
          fontWeight="bold"
          width="5/6"
          textAlign="inherit"
          color="white"
          asChild
        >
          <NextLink href={jwt ? "/dashboard" : "/login"}>
            {jwt ? `Enter as ${name}` : "Login"}
          </NextLink>
        </Button>
      </Stack>
    </Center>
  );
}
