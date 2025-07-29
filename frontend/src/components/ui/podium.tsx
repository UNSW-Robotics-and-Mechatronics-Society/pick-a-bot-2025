'use client'

import { Badge, Box, Flex, Text, VStack } from "@chakra-ui/react";
import { LeaderboardEntry } from "./leaderboard";

type PodiumProps = {
  topThree: LeaderboardEntry[];
};

export const Podium = ({ topThree }: PodiumProps) => {
  if (topThree.length < 3) return null;

  
  const metallicStyles = {
    gold: {
      base: 'linear-gradient(145deg, #FFD700 0%, #FFC000 50%, #FFDF00 100%)', // More vibrant gold
      shine: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.7) 50%, transparent 65%)',
      text: 'yellow.900' // Darker text for contrast
    },
    silver: {
      base: 'linear-gradient(145deg, #E0E0E0 0%, #C0C0C0 50%, #E5E5E5 100%)', // Brighter silver
      shine: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.6) 50%, transparent 65%)',
      text: 'gray.900'
    },
    bronze: {
      base: 'linear-gradient(145deg, #CD7F32 0%, #C67C2E 50%, #D68938 100%)', // Warmer bronze
      shine: 'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.5) 50%, transparent 65%)',
      text: 'orange.900'
    }
  };

  return (
    <Flex justify="center" align="flex-end" gap={6} mb={8} height="320px">
      {/* 2nd Place - Silver */}
      <VStack height="75%" width="120px">
        <Badge colorScheme="grey" fontSize="xl" px={3} py={1} borderRadius="fulll">
          2nd
        </Badge>
        <Box 
          bg={metallicStyles.silver.base}
          position="relative"
          overflow="hidden"
          w="80px" 
          h="70px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="2xl"
          fontWeight="bold"
          color="gray.800"
          boxShadow="0 4px 8px rgba(0,0,0,0.2)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.silver.shine,
            opacity: 0.8
          }}
        >
          {topThree[1].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="bold">{topThree[1].name}</Text>
          <Text color="gray.600">{topThree[1].tokens.toLocaleString()} tokens</Text>
        </Box>
        <Box 
          position="relative"
          overflow="hidden"
          bg={metallicStyles.silver.base}
          w="full" 
          h="70%" 
          borderRadius="md" 
          boxShadow="0 4px 8px rgba(0,0,0,0.2)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.silver.shine,
            opacity: 0.6
          }}
        />
      </VStack>

      {/* 1st Place - Gold */}
      <VStack height="100%" width="120px">
        <Badge colorScheme="yellow" fontSize="xl" px={4} py={1} borderRadius="full">
          1st
        </Badge>
        <Box 
          bg={metallicStyles.gold.base}
          position="relative"
          overflow="hidden"
          w="80px" 
          h="100px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="3xl"
          fontWeight="bold"
          color="yellow.900"
          boxShadow="0 6px 12px rgba(0,0,0,0.3)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.gold.shine,
            opacity: 0.9
          }}
        >
          {topThree[0].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="extrabold" fontSize="lg">{topThree[0].name}</Text>
          <Text color="yellow.700" fontWeight="bold">
            {topThree[0].tokens.toLocaleString()} tokens
          </Text>
        </Box>
        <Box 
          position="relative"
          overflow="hidden"
          bg={metallicStyles.gold.base}
          w="full" 
          h="100%" 
          borderRadius="md"
          boxShadow="0 6px 12px rgba(0,0,0,0.3)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.gold.shine,
            opacity: 0.7
          }}
        />
      </VStack>

      {/* 3rd Place - Bronze */}
      <VStack height="70%" width="120px">
        <Badge colorScheme="orange" fontSize="xl" px={3} py={1} borderRadius="full">
          3rd
        </Badge>
        <Box 
          bg={metallicStyles.bronze.base}
          position="relative"
          overflow="hidden"
          w="80px" 
          h="70px" 
          borderRadius="full" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          fontSize="xl"
          fontWeight="bold"
          color="orange.900"
          boxShadow="0 4px 8px rgba(0,0,0,0.2)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.bronze.shine,
            opacity: 0.7
          }}
        >
          {topThree[2].name.charAt(0)}
        </Box>
        <Box textAlign="center">
          <Text fontWeight="bold">{topThree[2].name}</Text>
          <Text color="orange.700">
            {topThree[2].tokens.toLocaleString()} tokens
          </Text>
        </Box>
        <Box 
          position="relative"
          overflow="hidden"
          bg={metallicStyles.bronze.base}
          w="full" 
          h="50%" 
          borderRadius="md"
          boxShadow="0 4px 8px rgba(0,0,0,0.2)"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            background: metallicStyles.bronze.shine,
            opacity: 0.5
          }}
        />
      </VStack>
    </Flex>
  );
};
