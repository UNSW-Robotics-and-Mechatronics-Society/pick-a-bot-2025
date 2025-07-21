import { Box } from "@chakra-ui/react";

interface PulsingCircleProps {
  color?: string;
  size?: string;
  animationDuration?: string;
  boxShadow?: string;
  gradient?: string;
  borderRadius?: string;
}

const PulsingCircle: React.FC<PulsingCircleProps> = ({
  color,
  size,
  animationDuration,
  boxShadow,
  gradient,
  borderRadius,
}) => {
  return (
    <Box
      position="relative"
      width={size || "100px"}
      height={size || "100px"}
      borderRadius={borderRadius || "50%"}
      bgGradient={gradient || "linear(to-r, blue.500, purple.500)"}
      bgColor={color || "blue.500"}
      boxShadow={boxShadow || "0 0 15px rgba(0, 0, 0, 0.3)"}
      animation={`pulse ${animationDuration || "2s"} infinite`}
    >
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.7;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  );
};

export default PulsingCircle;
