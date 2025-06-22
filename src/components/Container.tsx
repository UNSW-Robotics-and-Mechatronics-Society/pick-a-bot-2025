import { Box } from "@chakra-ui/react";

const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <Box p="4">
      {children}
    </Box>
  );
};

export default Container;