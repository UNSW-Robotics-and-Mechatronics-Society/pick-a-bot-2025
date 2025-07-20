"use client";

import { Box, Button, Center, Heading, Input, Text } from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface FormValues {
  name: string;
  email: string;
  accessCode: string;
}

export default function JoinPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const { mutate, isPending } = useMutation({
    mutationFn: async (form: FormValues) => {
      const response = await axios.post(
        "/api/join",
        { name: form.name, email: form.email, accessCode: form.accessCode },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: () => {
      console.error("Join failed");
    },
  });

  const onSubmit = (data: FormValues) => {
    mutate(data);
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
      p={4}
    >
      <Box maxW="400px" w="full">
        <Center flexDir="column" mb={8}>
          <Image
            src="/ramsoc-logo-blue.svg"
            alt="Logo"
            width={100}
            height={100}
            priority
          />
          <Heading size="2xl" mt={4}>
            Join the Competition
          </Heading>
          <Text color="gray.400" fontSize="sm" mt={2}>
            Enter your details to participate
          </Text>
        </Center>

        <Box as="form" px={6} onSubmit={handleSubmit(onSubmit)}>
          {/* Access Code */}
          <Box mb={4}>
            <Text mb={1} fontSize="sm">
              Access Code
            </Text>
            <Input
              {...register("accessCode", { required: true })}
              placeholder="Enter event access code"
              bg="gray.700"
              color="white"
              _placeholder={{ color: "gray.400" }}
              borderWidth="2px"
            />
          </Box>

          {/* Username */}
          <Box mb={4}>
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
              <Text color="red.400" fontSize="xs" mt={1}>
                Please enter your name
              </Text>
            )}
          </Box>

          {/* Email */}
          <Box mb={6}>
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
              <Text color="red.400" fontSize="xs" mt={1}>
                Please enter your email
              </Text>
            )}
          </Box>

          <Center mt={8}>
            <Button
              type="submit"
              bg="blue.400"
              borderWidth="2px"
              borderColor="blue.600"
              w="full"
              maxW="300px"
              size="lg"
              fontWeight="bold"
              _hover={{ bg: "blue.500" }}
              loading={isPending}
            >
              Enter
            </Button>
          </Center>
        </Box>
      </Box>
    </Box>
  );
}
