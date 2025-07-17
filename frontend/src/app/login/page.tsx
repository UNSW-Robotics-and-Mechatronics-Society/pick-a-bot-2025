"use client";

import { Box, Button, Center, Heading, Input, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useLocalStorage } from "usehooks-ts";

interface FormValues {
  name: string;
  email: string;
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [isAccessCodeInvalid, setIsAccessCodeInvalid] = useState(false);
  const REQUIRED_ACCESS_CODE = "PICKABOT2025";

  const [, setJWT] = useLocalStorage("jwt", "");
  const [, setStoredEmail] = useLocalStorage("email", "");
  const [, setStoredName] = useLocalStorage("name", "");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const auth = useMutation({
    mutationFn: async (form: FormValues) => {
      const { data } = await axios.post("/api/auth", {
        name: form.name,
        email: form.email,
      });
      return data;
    },
    onSuccess: ({ jwt, name, email }) => {
      setJWT(jwt);
      setStoredName(name);
      setStoredEmail(email);
    },
  });

  const onSubmit = (data: FormValues) => {
    if (accessCode !== REQUIRED_ACCESS_CODE) {
      setIsAccessCodeInvalid(true);
      return;
    }
    auth.mutate(data);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Box
      bg="gray.900"
      color="white"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      padding="4"
    >
      <Box maxW="400px" width="full">
        <Center display="flex" flexDirection="column" marginBottom="8">
          <Image
            src="/ramsoc-logo-blue.svg"
            alt="Logo"
            width={100}
            height={100}
          />
          <Heading size="2xl" marginTop="4">
            Join the Competition
          </Heading>
          <Text color="gray.400" fontSize="sm" marginTop="2">
            Enter your details to participate
          </Text>
        </Center>

        <Box paddingX="6" as="form" onSubmit={handleSubmit(onSubmit)}>
          {/* Access Code Field */}
          <Box paddingBottom="4">
            <Text mb={1} fontSize="sm">
              Access Code
            </Text>
            <Input
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                setIsAccessCodeInvalid(false);
              }}
              placeholder="Enter event access code"
              bg="gray.700"
              color="white"
              _placeholder={{ color: "gray.400" }}
              borderWidth="2px"
              borderColor={isAccessCodeInvalid ? "red.500" : "gray.600"}
              _focus={{
                borderColor: isAccessCodeInvalid ? "red.500" : "blue.400",
              }}
              type="password"
            />
            {isAccessCodeInvalid && (
              <Text color="red.400" fontSize="xs" marginTop="1">
                Invalid access code
              </Text>
            )}
          </Box>

          {/* Username Field */}
          <Box paddingBottom="4">
            <Text mb={1} fontSize="sm">
              Username
            </Text>
            <Input
              {...register("name", { required: true })}
              placeholder="e.g. rambo"
              bg="gray.700"
              color="white"
              _placeholder={{ color: "gray.400" }}
              borderWidth="2px"
              borderColor={errors.name ? "red.500" : "gray.600"}
            />
            {errors.name && (
              <Text color="red.400" fontSize="xs" mt="1">
                Please enter your name
              </Text>
            )}
          </Box>

          {/* Email Field */}
          <Box paddingBottom="6">
            <Text mb={1} fontSize="sm">
              Email
            </Text>
            <Input
              type="email"
              {...register("email", { required: true })}
              placeholder="you@example.com"
              bg="gray.700"
              color="white"
              _placeholder={{ color: "gray.400" }}
              borderWidth="2px"
              borderColor={errors.email ? "red.500" : "gray.600"}
            />
            {errors.email && (
              <Text color="red.400" fontSize="xs" mt="1">
                Please enter your email
              </Text>
            )}
          </Box>

          <Center mt="8">
            <Button
              type="submit"
              bg="blue.400"
              borderWidth="2px"
              borderColor="blue.600"
              width="full"
              maxW="300px"
              size="lg"
              fontWeight="bold"
              _hover={{ bg: "blue.500" }}
              loading={auth.isPending}
            >
              Enter
            </Button>
          </Center>
        </Box>
      </Box>
    </Box>
  );
}
