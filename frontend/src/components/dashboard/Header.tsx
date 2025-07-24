import { UserData } from "@/schemas";
import {
  Avatar,
  Heading,
  HStack,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react";
import Image from "next/image";
import { FC } from "react";

interface HeaderProps {
  user?: UserData | null;
  isUserLoading?: boolean;
}

export const Header: FC<HeaderProps> = ({ user, isUserLoading }) => {
  return (
    <HStack w="100%" display="flex" justifyContent="space-between" inset={1}>
      <HStack>
        <Avatar.Root variant="outline" size="md">
          <Avatar.Image src="ramsoc-logo-blue.svg" alt="RAM Soc Logo" />
          <Avatar.Fallback name="RAM Soc" />
        </Avatar.Root>

        <VStack gap="0" alignItems="flex-start">
          <Heading fontWeight="bold" size="md">
            Welcome{" "}
            {isUserLoading ? (
              <Skeleton
                marginBottom={-0.5}
                width="80px"
                height="1em"
                display="inline-block"
              />
            ) : (
              user?.name || "User"
            )}
          </Heading>
          <Text fontSize="xs" color="gray.500">
            Ready to vote?
          </Text>
        </VStack>
      </HStack>
      <HStack
        gap="2"
        alignItems="center"
        bg="gray.200"
        py="2"
        px="4"
        borderRadius="full"
        _dark={{ bg: "gray.900" }}
      >
        <Image
          src="/ram-buck.svg"
          height="25"
          width="25"
          alt="Rambo's Ram-Bucks"
          style={{ filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }}
          priority
        />
        <Heading fontWeight="bold" color="orange.400">
          {isUserLoading ? (
            <Skeleton
              marginBottom={-0.5}
              width="50px"
              height="1em"
              display="inline-block"
            />
          ) : (
            (user?.tokens ?? 0)
          )}
        </Heading>
      </HStack>
    </HStack>
  );
};

export default Header;
