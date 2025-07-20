"use client";

import { toaster } from "@/components/ui/toaster";
import { joinSchema } from "@/schemas";
import { isValidAccessCode } from "@/services";
import {
  Button,
  Center,
  Field,
  Heading,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FieldError, useForm } from "react-hook-form";

interface FormValues {
  accessCode: string;
  name: string;
  email: string;
}

const fieldConfigs: Array<{
  key: keyof FormValues;
  label: string;
  placeholder: string;
  type?: string;
}> = [
  {
    key: "accessCode",
    label: "Access Code",
    placeholder: "Enter event access code",
  },
  {
    key: "name",
    label: "Display Name",
    placeholder: "Enter your display name",
  },
  {
    key: "email",
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
];

export default function JoinPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(joinSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (form: FormValues) => {
      try {
        const { data } = await axios.post("/api/join", form, {
          withCredentials: true,
        });
        return data;
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.error) {
          throw new Error(err.response.data.error);
        }
        throw err;
      }
    },
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toaster.create({
        description: message,
        type: "error",
        closable: true,
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    const isValid = await isValidAccessCode(data.accessCode);
    if (!isValid) {
      setError("accessCode", {
        type: "manual",
        message: "Invalid access code",
      });
      return;
    }
    mutate(data);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Center minH="100vh">
      <VStack maxW="400px" gap={6}>
        <Center flexDir="column" mb={8}>
          <Image
            src="/ramsoc-logo-blue.svg"
            alt="Logo"
            width={100}
            height={100}
            priority
          />
          <Heading>Join the Competition</Heading>
          <Text fontSize="sm" mt={2}>
            Enter your details to participate
          </Text>
        </Center>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ width: "100%" }}
        >
          <VStack gap={4} w="full">
            {fieldConfigs.map(({ key, label, placeholder, type }) => {
              const errorObj = errors[key] as FieldError | undefined;
              return (
                <Field.Root key={key} required invalid={!!errorObj}>
                  <Field.Label>
                    {label} <Field.RequiredIndicator />
                  </Field.Label>
                  <Input
                    {...register(key, { required: `${label} is required` })}
                    placeholder={placeholder}
                    type={type || "text"}
                    borderWidth="2px"
                    variant="outline"
                  />
                  {errorObj && (
                    <Field.ErrorText>{errorObj.message}</Field.ErrorText>
                  )}
                </Field.Root>
              );
            })}

            <Center mt={8} w="100%">
              <Button
                type="submit"
                bg="blue.400"
                borderWidth="2px"
                borderColor="blue.600"
                w="full"
                size="lg"
                fontWeight="bold"
                loading={isPending}
              >
                Join
              </Button>
            </Center>
          </VStack>
        </form>
      </VStack>
    </Center>
  );
}
