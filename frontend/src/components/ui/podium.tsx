'use client'

import { useColorMode } from "@/components/ui/color-mode";
import { Badge, Box, Flex, Text, VStack } from "@chakra-ui/react";
import { LeaderboardData } from "./types";

export const Podium = ({ data }: { data: LeaderboardData }) => {
  const { colorMode } = useColorMode();

  // Get top 3 from the data
  const topThree = data.top.slice(0, 3);

  // Theme variables
  const themeStyles = {
    gold: colorMode === 'dark' ? 'yellow.300' : 'yellow.400',
    silver: colorMode === 'dark' ? 'gray.400' : 'gray.300',
    bronze: colorMode === 'dark' ? 'orange.400' : 'orange.300',
    textColor: colorMode === 'dark' ? 'whiteAlpha.900' : 'gray.800'
  };

  if (topThree.length < 3) return null;

  return (
    <Flex justify="center" align="flex-end" gap={6} mb={8} height="320px">
      {/* 2nd Place - Silver */}
      <VStack height="70%" width="120px">
        <Badge colorScheme="gray" fontSize="lg" px={3} py={1} borderRadius="full">
          2nd
        </Badge>
        <Box 
          bg={themeStyles.silver}
          position="relative"
          overflow="hidden"
          w="80px" 
          h="80px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="2xl"
          fontWeight="bold"
          color={colorMode === 'dark' ? 'gray.800' : 'gray.700'}
          boxShadow={`0 4px 8px ${colorMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'}`}
        >
          {topThree[1].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="bold" color={themeStyles.textColor}>{topThree[1].name}</Text>
          <Text color={themeStyles.textColor}>{topThree[1].points.toLocaleString()} points</Text>
        </Box>
        <Box 
          bg={themeStyles.silver}
          w="full" 
          h="70%" 
          borderRadius="md" 
          boxShadow={`0 4px 8px ${colorMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'}`}
        />
      </VStack>

      {/* 1st Place - Gold */}
      <VStack height="100%" width="140px">
        <Badge colorScheme="yellow" fontSize="xl" px={4} py={1} borderRadius="full">
          1st
        </Badge>
        <Box 
          bg={themeStyles.gold}
          position="relative"
          overflow="hidden"
          w="100px" 
          h="100px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="3xl"
          fontWeight="bold"
          color={colorMode === 'dark' ? 'yellow.900' : 'yellow.800'}
          boxShadow={`0 6px 12px ${colorMode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'}`}
        >
          {topThree[0].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="extrabold" fontSize="lg" color={themeStyles.textColor}>
            {topThree[0].name}
          </Text>
          <Text color={themeStyles.textColor} fontWeight="bold">
            {topThree[0].points.toLocaleString()} points
          </Text>
        </Box>
        <Box 
          bg={themeStyles.gold}
          w="full" 
          h="100%" 
          borderRadius="md"
          boxShadow={`0 6px 12px ${colorMode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)'}`}
        />
      </VStack>

      {/* 3rd Place - Bronze */}
      <VStack height="50%" width="120px">
        <Badge colorScheme="orange" fontSize="lg" px={3} py={1} borderRadius="full">
          3rd
        </Badge>
        <Box 
          bg={themeStyles.bronze}
          position="relative"
          overflow="hidden"
          w="70px" 
          h="70px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="xl"
          fontWeight="bold"
          color={colorMode === 'dark' ? 'orange.900' : 'orange.800'}
          boxShadow={`0 4px 8px ${colorMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'}`}
        >
          {topThree[2].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="bold" color={themeStyles.textColor}>{topThree[2].name}</Text>
          <Text color={themeStyles.textColor}>
            {topThree[2].points.toLocaleString()} points
          </Text>
        </Box>
        <Box 
          bg={themeStyles.bronze}
          w="full" 
          h="50%" 
          borderRadius="md"
          boxShadow={`0 4px 8px ${colorMode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'}`}
        />
      </VStack>
    </Flex>
  );
};
