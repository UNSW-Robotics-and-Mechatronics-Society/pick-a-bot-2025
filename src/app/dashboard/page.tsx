"use client";
import React, { useState } from "react";
import Match from "../../components/ui/match";
import Image from "next/image";
import { FaLock } from "react-icons/fa";
import { useLocalStorage } from "usehooks-ts";
import { 
    Box,
    Center,
    Heading,
    ButtonGroup,
    Button,
    Input,
    Field,
 } from "@chakra-ui/react";

export default function DashboardPage() {
  const [selected, setSelected] = useState("");
  const [name, setName] = useLocalStorage('name', '');

  return (
    <Box padding="4" bg="gray.900" color="white" h="dvh" w="dvw" fontSize="md">
        
        <Center flexDirection="column" h="90%" w="100%" p="4"> 
            <Box w="100%" display="flex" justifyContent="space-between" mb="4">
                <Heading fontWeight="bold">Welcome {name}</Heading>
                <Box display={"flex"} flexDir={"row"} alignItems="center">
                    <Heading fontWeight="bold" color="orange.500" mr="2">600</Heading>
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
                <Match 
                    leftLabel="Bot1" 
                    rightLabel="Bot2"
                    leftColor="blue.500"
                    rightColor="red.500"
                    rightBorderColor="red.500"
                    leftBorderColor="blue.500"
                ></Match>
                <Heading>Upcoming Round</Heading>
                <Match 
                    leftLabel="Bot3" 
                    rightLabel="Bot4"
                    leftColor="green.500"
                    rightColor="purple.500"
                    rightBorderColor="purple.500"
                    leftBorderColor="green.500"
                ></Match>
            </Box>
            <Box w="100%">
                <Heading>Betting</Heading>
                <Box textAlign="center" fontWeight={"Bold"}>Pick a Bot!</Box>
                <ButtonGroup w="100%" mb="4">
                  {["Bot3", "Bot4"].map((item) => (
                    <Button
                      key={item}
                      flex="1"
                      p="5"
                      fontWeight="bold"
                      fontSize="lg"
                      borderRadius="md"
                      borderWidth="3px"
                      colorScheme={selected === item ? "purple" : "gray"} // selected is purple, unselected is gray
                      variant={selected === item ? "solid" : "outline"}
                      onClick={() => setSelected(item)}
                      bg={selected === item ? "pink.400" : "gray.700"} // custom background
                      color={selected === item ? "white" : "gray.300"}   // custom text color
                      borderColor={selected === item ? "pink.500" : "gray.600"} // custom border
                      _hover={{
                        bg: selected === item ? "purple.600" : "gray.600",
                      }}
                    >
                      {item}
                    </Button>
                  ))}
                </ButtonGroup>
                <Box textAlign="center" fontWeight={"Bold"}>How much?</Box>
                <Box textAlign="center" fontStyle="italic" color="gray.600">This round is capped at 50%</Box>
                <Field.Root mb="4">
                <Input 
                    placeholder="Please enter your amount    /300"
                    w="100%"
                    p="5"
                    color="orange.600"
                    bg="orange.300"
                    borderColor="orange.500"
                    fontWeight="bold"
                    fontSize="lg"
                    borderRadius="md"
                    borderWidth="3px"
                    _placeholder={{ color: "orange.600", fontWeight: "bold" }} // <-- change color here
                ></Input>
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
                ><FaLock />Lock Selection</Button>
            </Box>
        </Center>
    </Box>
  );
}