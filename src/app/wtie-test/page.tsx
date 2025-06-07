"use client"

import {
  Button,
  Field,
  Fieldset,
  Input,
  Stack,
} from "@chakra-ui/react"

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form"
import { useLocalStorage } from "usehooks-ts";

interface FormValues {
  name: string
  email: string
}

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const [jwt, setJWT] = useLocalStorage('jwt', '');
  const [email, setEmail] = useLocalStorage('email', '');
  const [name, setName] = useLocalStorage('name', '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>()

  const auth = useMutation({
    mutationFn: async (form: FormValues) => {
      let { data } = await axios.post('/api/auth', {
        name: form.name,
        email: form.email
      });
      return data;
    },
    onSuccess: ({ jwt, name, email }) => {
      setJWT(jwt);
      setName(name);
      setEmail(email)
    }
  });

  function onSubmit(data: FormValues) {
    auth.mutate(data)
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // Avoid initial mismatchs

  return (
    <main className="w-full min-h-screen flex justify-center items-center flex-col">
      <h1 className="mb-16 font-bold text-6xl">ITS PARTY TIME: for {name} {email}</h1>
      <form onSubmit={handleSubmit((data) => onSubmit(data), console.log)}>
        <Fieldset.Root size="lg" maxW="md">
          <Stack>
            <Fieldset.Legend>Contact details</Fieldset.Legend>
            <Fieldset.HelperText>
              Please provide your contact details below.
            </Fieldset.HelperText>
          </Stack>

          <Fieldset.Content>
            <Field.Root invalid={!!errors.name}>
              <Field.Label>Name <Field.RequiredIndicator /></Field.Label>
              <Input {...register("name", { required: true })} />
              <Field.ErrorText>Please insert a valid username</Field.ErrorText>
            </Field.Root>

            <Field.Root invalid={!!errors.email}>
              <Field.Label>Email address <Field.RequiredIndicator /></Field.Label>
              <Input {...register("email", { required: true })} />
              <Field.ErrorText>Please insert a valid email</Field.ErrorText>
            </Field.Root>
          </Fieldset.Content>

          <Button type="submit" alignSelf="flex-start">
            Submit
          </Button>
        </Fieldset.Root>
      </form>
    </main>
  );
}