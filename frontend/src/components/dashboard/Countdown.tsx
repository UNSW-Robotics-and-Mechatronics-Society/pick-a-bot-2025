import { HStack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

interface CountdownProps {
  underwayTime: string; // ISO timestamp
  durationMs: number;
}

const Countdown = ({ underwayTime, durationMs }: CountdownProps) => {
  const [remaining, setRemaining] = useState("05:00");

  useEffect(() => {
    const startMs = new Date(underwayTime).getTime();
    const cutoffMs = startMs + durationMs;

    const update = () => {
      const now = Date.now();

      // remaining
      const remMs = Math.max(0, cutoffMs - now);
      const rm = Math.floor(remMs / 60000)
        .toString()
        .padStart(2, "0");
      const rs = Math.floor((remMs % 60000) / 1000)
        .toString()
        .padStart(2, "0");
      setRemaining(`${rm}:${rs}`);
    };

    update(); // init immediately
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [underwayTime, durationMs]);

  return (
    <HStack gap="4">
      <Text fontSize="xs" color="gray.500">
        Remaining:{" "}
        <Text as="span" fontWeight="bold">
          {remaining}
        </Text>
      </Text>
    </HStack>
  );
};

export default Countdown;
