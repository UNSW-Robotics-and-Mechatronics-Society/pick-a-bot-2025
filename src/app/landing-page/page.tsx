import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div>
        <div>
          UNSW RAMSOC presents to you
        </div>
        <Image
          src="/ramsoc-logo-blue.svg"
          alt="Pickabot Logo"
          width={150}
          height={150}
          className="mb-4"
        />
        <h1>
          The Pickabot Competition
        </h1>
        <div className="ml-4">
        <div className="text-xl text-left w-full mb-2">Here’s how it works.</div>
        <ul className="list-disc">
          <li>Each player will be given a 100 starting tokens</li>
          <li>Each round of the finals you will be able to bid on a bot</li>
          <li>If you win a bid the tokens you bid will be doubled</li>
          <li>
            Bidding for each round will have a cap on how much you can bid except
            the final
          </li>
          <li>You are competing to have the most tokens</li>
          <li>The winner will get a prize of ______</li>
        </ul>
        <div className="text-left w-full mb-2">
          For more information click{" "}
          <Link href="#" className="text-blue-400 underline">
            here
          </Link>
        </div>
        <div className="text-left w-full mb-8">
          Good luck, May the odds be ever in your favor!
        </div>
        </div>
    </div>
  );
}