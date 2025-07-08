import { Box, Flex, AbsoluteCenter} from "@chakra-ui/react";

interface Match {
  leftLabel?: string;
  rightLabel?: string;
  leftColor?: string;
  rightColor?: string;
  rightBorderColor?: string;
  leftBorderColor?: string;
}

const Match: React.FC<Match> = ({
  leftLabel = "Bot1",
  rightLabel = "Bot2",
  leftColor = "red.500",
  rightColor = "blue.500",
  rightBorderColor = "blue.500",
  leftBorderColor = "right.500",
}) => {
  return (
    <Box rounded="md">
      <Flex
        borderRadius="md"
        overflow="hidden"
        textAlign="center"
        fontWeight="bold"
        fontSize="lg"
        color="white"
        position={"relative"}
        mb="4"
      >
        <Box
          flex="1"
          bg={leftColor}
          py={2}
          borderLeftRadius="md"
          borderWidth="3px"
          borderStyle="solid"
          borderColor={leftBorderColor}
        >
          {leftLabel}
        </Box>
        <Box
          flex="1"
          bg={rightColor}
          py={2}
          borderRightRadius="md"
          borderWidth="3px"
          borderStyle="solid"
          borderColor={rightBorderColor}
        >
          {rightLabel}
        </Box>
        <AbsoluteCenter>VS</AbsoluteCenter>
      </Flex>
    </Box>
  );
};

export default Match;
