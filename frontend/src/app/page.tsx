"use client";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  Box,
  Button,
  Center,
  Heading,
  Link,
  List,
  Mark,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import { PICKABOTS_RULE_BOOK_URL } from "./constants";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUserProfile();

  useEffect(() => {
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
          <Heading size="sm">
            <Mark variant="solid">SUMOBOTS 2025</Mark>
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
                Each round of the finals you will have 5 min to &quot;vote&quot; on
                a bot
              </List.Item>
              <List.Item>
                If you win a &quot;vote&quot;, the tokens you &quot;vote&quot;
                will be doubled
              </List.Item>
              <List.Item>
                &quot;Voting&quot; for each round will have a cap on how much
                you can &quot;vote&quot; except the final
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
          <NextLink href={user ? "/dashboard" : "/join"}>
            {user ? `Enter as ${user.name}` : "Join"}
          </NextLink>
        </Button>
      </Stack>
    </Center>
  );
}
