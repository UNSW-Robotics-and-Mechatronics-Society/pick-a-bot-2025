import React from "react";
import Image from "next/image";
import Link from "next/link";
import { List } from "@chakra-ui/react"
import { AbsoluteCenter, Center, Circle, Square } from "@chakra-ui/react"

export default function LandingPage() {
  return (
    <div className="block bg-blue-500 p-8 text-center w-full h-screen">
      <Center>
        <div>
          UNSW RAMSOC presents to you
        </div>
        <Image
          src="/ramsoc-logo-blue.svg"
          alt="Pickabot Logo"
          width={150}
          height={150}
          className=""
        />
        <h1>
          The Pickabot Competition
        </h1>
        <div className="text-left">
        <div>Here’s how it works.</div>
        <List.Root>
          <List.Item>Each player will be given a 100 starting tokens</List.Item>
          <List.Item>Each round of the finals you will be able to bid on a bot</List.Item>
          <List.Item>If you win a bid the tokens you bid will be doubled</List.Item>
          <List.Item>Bidding for each round will have a cap on how much you can bid except the final</List.Item>
          <List.Item>You are competing to have the most tokens</List.Item>
          <List.Item>The winner will get a prize of ______</List.Item>
        </List.Root>
        <div className="text-left w-full mb-2">
          For more information click{" "}
          <Link href="#" className="text-blue-400 underline">
            here
          </Link>
        </div>
        <div className=" w-full mb-8">
          Good luck, May the odds be ever in your favor!
        </div>
        </div>
        
      </Center>
      </div>
  );
}