import { PreviousMatchResult } from "@/types";
import { Button, Card, Center, Progress, Text, VStack } from "@chakra-ui/react";
import { FC, useEffect, useRef, useState } from "react";

type MatchResultOverlayProps = {
  previousMatchResult: PreviousMatchResult | null;
};

const OVERLAY_DURATION = 5000; // ms

export const MatchResultOverlay: FC<MatchResultOverlayProps> = ({
  previousMatchResult,
}) => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<PreviousMatchResult | null>(null);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (previousMatchResult) {
      setData(previousMatchResult);
      setShow(true);
      setProgress(0);

      // Progress bar countdown
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const percent = Math.max(0, (elapsed / OVERLAY_DURATION) * 100);
        setProgress(percent);
      }, 50);

      // Hide overlay after duration
      timerRef.current = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, OVERLAY_DURATION);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [previousMatchResult]);

  // Cleanup interval when overlay closes
  useEffect(() => {
    if (!show && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [show]);

  if (!show || !data) return null;

  const gained = (data.tokenDelta ?? 0) > 0;
  const lost = (data.tokenDelta ?? 0) < 0;

  let header = "";
  let desc = "";
  let bg = "gray.700";

  if (gained) {
    header = `🎉 You picked the correct bot: ${data.botChosen}`;
    desc = `You gained ${Math.abs(data.tokenDelta)} tokens!`;
    bg = "green.600/30";
  } else if (lost) {
    header = `😢 You picked the wrong bot: ${data.botChosen}`;
    desc = `You lost ${Math.abs(data.tokenDelta)} tokens.`;
    bg = "red.600/30";
  } else {
    header = `No tokens gained or lost.`;
    desc = `You picked: ${data.botChosen ?? "None"}`;
    bg = "gray.700";
  }

  return (
    <Center
      position="fixed"
      inset={0}
      zIndex={9999}
      bg="rgba(0,0,0,0.6)"
      backdropFilter="blur(8px)"
    >
      <Card.Root
        maxW="90vw"
        minW="320px"
        boxShadow="xl"
        borderRadius="md"
        p={4}
        bg={bg}
        color="white"
      >
        <Progress.Root
          value={progress}
          size="sm"
          w="full"
          animated
          position="absolute"
          top={0}
          left={0}
          zIndex="overlay"
        >
          <Progress.Track bg="transparent">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <Card.Header fontWeight="bold" mb={2} fontSize="xl">
          {header}
        </Card.Header>
        <Card.Body>
          <Text fontSize="lg" fontWeight="semibold" mb={2}>
            {desc}
          </Text>
          <Text fontSize="md">
            Your new token balance: <b>{data.newTokenBalance}</b>
          </Text>
        </Card.Body>
        <Card.Footer>
          <VStack gap="0" w="full">
            <Button
              onClick={() => {
                setShow(false);
                setProgress(0);
                if (timerRef.current) clearTimeout(timerRef.current);
                if (intervalRef.current) clearInterval(intervalRef.current);
              }}
              size="sm"
              w="full"
            >
              Close
            </Button>
          </VStack>
        </Card.Footer>
      </Card.Root>
    </Center>
  );
};

export default MatchResultOverlay;
