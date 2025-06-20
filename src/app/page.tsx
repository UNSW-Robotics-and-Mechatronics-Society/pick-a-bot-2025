"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  Box,
  Button,
  Center,
  Heading,
  List,
  Link
} from "@chakra-ui/react";
import { useLocalStorage } from "usehooks-ts";


export default function LandingPage() {
  
  const [jwt, setJWT] = useLocalStorage('jwt', '');

  return (
    <Box padding="4" bg="gray.900" color="white" h="dvh" w="dvw" fontSize="md">
      <Center display="flex" flexDirection="column">
        <Heading color="gray.400">
          UNSW RAMSOC presents to you
        </Heading>
        <Image
          src="/ramsoc-logo-blue.svg"
          alt="Pickabot Logo"
          width={130}
          height={130}
        />
        <Heading size="2xl">
          The Pickabot Competition
        </Heading>
        </Center>
        <Box paddingLeft="6" paddingRight="6" paddingTop="3">
        <Box>Here’s how it works.</Box>
        <List.Root paddingLeft="4" fontSize="sm">
          <List.Item>Each player will be given a 100 starting tokens</List.Item>
          <List.Item>Each round of the finals you will be able to bid on a bot</List.Item>
          <List.Item>If you win a bid the tokens you bid will be doubled</List.Item>
          <List.Item>Bidding for each round will have a cap on how much you can bid except the final</List.Item>
          <List.Item>You are competing to have the most tokens</List.Item>
          <List.Item>The winner will get a prize of ______</List.Item>
        </List.Root>
        <Box paddingTop="2" paddingBottom="2" fontSize="sm">
          For more information click{" "}
          <Link href="https://www.canva.com/design/DAGqgeTlZVE/K7OGQIJIC9UQ-1zO650x2g/view?utm_content=DAGqgeTlZVE&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hd2d8d11d4c&fbclid=IwZXh0bgNhZW0CMTEAAR6OxpRvsk92fsw_-MxqwsGYnVweGv_88xmGb7bF2jLJXg4s0Y3sM_urri10Uw_aem_Qww362hJ_Ur_5Dk23i-sxA#1" 
          color="blue.400" fontStyle="underline">
            here
          </Link>
        </Box>
        <Box paddingBottom="2">
          Good luck, May the odds be ever in your favor!
        </Box>
        </Box>
        <Center>
        <Button bg="blue.400" borderWidth="2px" borderColor="blue.600" width="4/6" size="xl" fontWeight="bold" asChild>
          <Link href={jwt ? '/dashboard' : '/login'}>
          Go
          </Link>
        </Button>
        </Center>
        

      </Box>
  );
}