import { toaster } from "@/components/ui/toaster";
import { PICKABOTS_RULE_BOOK_URL } from "@/constants";
import {
  CurrentMatchData,
  UserData,
  voteRequestSchema as voteSchema,
} from "@/schemas";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  DataList,
  Field,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaCoins, FaLock, FaRegQuestionCircle, FaRobot } from "react-icons/fa";
import { RxSlash } from "react-icons/rx";
import * as yup from "yup";
import Countdown from "./Countdown";

type VoteState =
  | "no_current_match"
  | "no_vote"
  | "vote_submitted"
  | "timed_out";

interface VoteFormOverlayProps {
  prevVote?: { bot_chosen: string; used_tokens: number };
  state: VoteState;
}

/**
 * Logic for displaying the vote form overlay
 * Handles different states:
 * - If no current match, shows a message: "Voting is closed for this match"
 * - If a vote was submitted, shows the bot chosen and tokens used
 * - If timed out, shows a message: "Voting is closed for this match"
 * - If no vote and vote window is still open, overlay is hidden
 */
export const VoteFormOverlay: FC<VoteFormOverlayProps> = ({
  prevVote,
  state = "no_current_match",
}) => {
  const Content = () => {
    switch (state) {
      case "vote_submitted":
        if (prevVote) {
          return (
            <VStack gap="2">
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                Vote Submitted!
              </Text>
              <DataList.Root orientation="horizontal" gap="1">
                <DataList.Item>
                  <DataList.ItemLabel>Bot Picked</DataList.ItemLabel>
                  <DataList.ItemValue>
                    {prevVote?.bot_chosen}
                  </DataList.ItemValue>
                </DataList.Item>
                <DataList.Item>
                  <DataList.ItemLabel>Tokens Used</DataList.ItemLabel>
                  <DataList.ItemValue>
                    {prevVote?.used_tokens} tokens
                  </DataList.ItemValue>
                </DataList.Item>
              </DataList.Root>
            </VStack>
          );
        }
      case "timed_out":
        return (
          <Text
            fontSize="lg"
            color="red.500"
            fontWeight="bold"
            _dark={{ color: "red.400" }}
          >
            Voting is closed for this match
          </Text>
        );
      case "no_current_match":
        return (
          <Text fontSize="lg" fontWeight="bold">
            No current match available
          </Text>
        );
      default:
        return (
          <Text
            fontSize="lg"
            color="red.500"
            fontWeight="bold"
            _dark={{ color: "red.400" }}
          >
            Unknown state: {state}
          </Text>
        );
    }
  };
  return (
    <Box
      hidden={state === "no_vote"}
      position="absolute"
      inset="0"
      bg="rgba(0, 0, 0, 0.3)"
      backdropFilter="blur(8px)"
      zIndex="overlay"
      borderRadius="inherit"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Content />
    </Box>
  );
};

interface VoteFormProps {
  user: UserData | null;
  currentMatch: CurrentMatchData | null;
  refetchUserProfile: () => void;
}

export const VoteForm: FC<VoteFormProps> = ({
  user,
  currentMatch,
  refetchUserProfile,
}) => {
  const [timeDisabled, setTimeDisabled] = useState(false);
  const [overlayState, setOverlayState] = useState<VoteState>("no_vote");

  useEffect(() => {
    if (!currentMatch?.underway_time) {
      setTimeDisabled(false);
      return;
    }

    const startMs = new Date(currentMatch.underway_time).getTime();
    const cutoffMs = startMs + 5 * 60 * 1000; // +5 minutes

    // Check immediately & then every second
    const check = () => {
      if (Date.now() >= cutoffMs) {
        setTimeDisabled(true);
      }
    };
    check();
    const iv = setInterval(check, 1000);
    return () => clearInterval(iv);
  }, [currentMatch?.underway_time]);

  const dynamicVoteSchema = voteSchema.concat(
    yup.object({
      matchId: yup.string().nullable().required("Match ID is required"),
      amount: yup
        .number()
        .required("Amount is required")
        .positive("Amount must be a positive number")
        .integer("Amount must be a whole number")
        .transform((value) => (isNaN(value) ? 0 : value))
        .min(1, "Minimum vote is 1 token")
        .test("token-limit", function (value) {
          if (!user || !currentMatch || !value) {
            return this.createError({
              message: "Unable to validate - missing data",
            });
          }

          const isFinal = currentMatch.is_final;
          const tokenLimit = isFinal
            ? user.tokens
            : Math.floor(user.tokens * 0.5);

          if (value > tokenLimit) {
            return this.createError({
              message: isFinal
                ? "You don't have enough tokens"
                : "Exceeds 50% token limit for this round",
            });
          }

          if (value > user.tokens) {
            return this.createError({
              message: "You don't have enough tokens",
            });
          }

          return true;
        }),
    })
  );

  type VoteFormData = yup.InferType<typeof dynamicVoteSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<VoteFormData>({
    mode: "onChange",
    resolver: yupResolver(dynamicVoteSchema),
    defaultValues: {
      botChosen: "",
      matchId: currentMatch?.match_id || "",
    },
  });

  const selectedBot = watch("botChosen");

  const voteQuery = useQuery({
    queryKey: ["currentMatchVote", currentMatch?.match_id],
    queryFn: async () => {
      if (!currentMatch?.match_id) return null;

      const response = await axios.get(
        `/api/vote?matchId=${currentMatch.match_id}`
      );
      return response.data;
    },
    enabled: !!currentMatch?.match_id,
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async (voteData: VoteFormData) => {
      const response = await axios.post("/api/vote", voteData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toaster.create({
        title: "Vote submitted!",
        description: `You voted ${variables.amount} tokens on ${variables.botChosen}`,
        type: "success",
        closable: true,
      });

      refetchUserProfile();
      voteQuery.refetch();
      reset();
    },
    onError: (error) => {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.error
          ? error.response.data.error
          : "Failed to submit vote";

      toaster.create({
        title: "Vote failed",
        description: errorMessage,
        type: "error",
        closable: true,
      });
    },
  });

  useEffect(() => {
    if (currentMatch?.match_id) {
      setValue("matchId", currentMatch.match_id);
    }
  }, [currentMatch?.match_id, setValue]);

  useEffect(() => {
    if (voteQuery.data) {
      reset({
        botChosen: voteQuery.data.vote.bot_chosen,
        amount: voteQuery.data.vote.used_tokens,
        matchId: voteQuery.data.vote.match_id,
      });
    } else {
      reset({
        botChosen: "",
        amount: 0,
        matchId: currentMatch?.match_id || "",
      });
    }
  }, [voteQuery.data, reset, currentMatch?.match_id]);

  const onSubmit = (data: VoteFormData) => {
    if (!currentMatch) {
      toaster.create({
        title: "No current match",
        description: "Please wait for match data to load",
        type: "error",
        closable: true,
      });
      return;
    }

    voteMutation.mutate({
      matchId: currentMatch.match_id,
      botChosen: data.botChosen,
      amount: data.amount,
    });
  };

  useEffect(() => {
    if (!currentMatch) {
      setOverlayState("no_current_match");
    } else if (voteQuery.data?.vote) {
      setOverlayState("vote_submitted");
    } else if (timeDisabled) {
      setOverlayState("timed_out");
    } else if (!voteQuery.data?.vote && currentMatch.id) {
      setOverlayState("no_vote");
    }
  }, [currentMatch, voteQuery.data?.vote, timeDisabled, currentMatch?.id]);

  // Calculate current limits
  const isFinal = currentMatch?.is_final ?? false;
  const tokenLimit = user
    ? isFinal
      ? user.tokens
      : Math.floor(user.tokens * 0.5)
    : 0;

  const isFormDisabled =
    voteMutation.isPending || !currentMatch || !user || timeDisabled;

  return (
    <Card.Root w="100%" maxW="500px" boxShadow="lg" position="relative">
      <VoteFormOverlay prevVote={voteQuery.data?.vote} state={overlayState} />
      <IconButton
        aria-label="help"
        position="absolute"
        top="4"
        right="4"
        variant={"ghost"}
        size="sm"
        zIndex="overlay"
        color="gray.500"
        rounded="full"
        asChild
      >
        <Link
          href={PICKABOTS_RULE_BOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <FaRegQuestionCircle size={20} />
        </Link>
      </IconButton>
      <Card.Header pb="2">
        <VStack gap="0" alignItems="flex-start">
          <Heading size="lg" fontWeight="bold">
            Place your vote
          </Heading>
          <Countdown
            underwayTime={String(currentMatch?.underway_time) || ""}
            durationMs={5 * 60 * 1000} // 5 minutes
          />
        </VStack>
      </Card.Header>

      <Card.Body>
        <form onSubmit={handleSubmit(onSubmit)}>
          <VStack gap="6">
            {/* Bot Selection Section */}
            <Box w="100%">
              <VStack gap="3">
                <HStack w="100%">
                  <FaRobot size={24} color="gray.500" />
                  <Heading size="md" alignSelf="self-start">
                    Pick a Bot!
                  </Heading>
                </HStack>

                <ButtonGroup w="100%" gap="3">
                  {[currentMatch?.bot1, currentMatch?.bot2]
                    .filter((bot): bot is string => typeof bot === "string")
                    .map((bot, index) => (
                      <Button
                        key={bot}
                        type="button"
                        flex="1"
                        h="60px"
                        fontWeight="bold"
                        fontSize="lg"
                        borderRadius="lg"
                        borderWidth="3px"
                        position="relative"
                        transition="all 0.2s"
                        bg={
                          selectedBot === bot
                            ? index === 0
                              ? "blue.400"
                              : "red.400"
                            : "gray.500"
                        }
                        color={selectedBot === bot ? "white" : "gray.600"}
                        borderColor={
                          selectedBot === bot
                            ? index === 0
                              ? "blue.500"
                              : "red.500"
                            : ""
                        }
                        opacity={selectedBot === bot ? 1 : 0.3}
                        disabled={isFormDisabled}
                        onClick={() => setValue("botChosen", bot)}
                      >
                        <VStack gap="1">
                          <Text>{bot}</Text>
                        </VStack>
                      </Button>
                    ))}
                </ButtonGroup>

                {errors.botChosen && (
                  <Text color="red.500" fontSize="sm" fontWeight="medium">
                    Please select a bot
                  </Text>
                )}
              </VStack>
            </Box>

            <Separator color="gray.200" width="100%" />

            {/* Amount Input Section */}
            <Box w="100%">
              <VStack gap="3">
                <VStack
                  gap="1"
                  alignItems={"flex-start"}
                  alignSelf={"flex-start"}
                >
                  <HStack>
                    <FaCoins size={20} />
                    <Heading size="md">How much?</Heading>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" fontStyle="italic">
                    {isFinal
                      ? "Final round - all-ins allowed!"
                      : `This round is capped at 50%`}
                  </Text>
                </VStack>

                <Field.Root required invalid={!!errors.amount} w="100%">
                  <InputGroup
                    startElement={
                      <Image
                        src="/ram-buck.svg"
                        alt="Ram-Buck"
                        width={20}
                        height={20}
                      />
                    }
                    endElement={
                      <Text
                        display="flex"
                        alignItems="center"
                        fontWeight="bold"
                        fontSize="md"
                        mr={2}
                        color="gray.600"
                      >
                        <RxSlash size={25} />
                        max {tokenLimit}
                      </Text>
                    }
                  >
                    <Input
                      {...register("amount")}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={tokenLimit}
                      size="lg"
                      h="60px"
                      w="100%"
                      placeholder="Enter amount"
                      borderWidth="2px"
                      fontSize="lg"
                      fontWeight="bold"
                      variant="subtle"
                      borderColor={errors.amount ? "red.400" : "orange.300"}
                      disabled={isFormDisabled}
                    />
                  </InputGroup>
                  <Field.ErrorText color="red.500" fontWeight="medium">
                    {errors.amount?.message}
                  </Field.ErrorText>
                  <Field.HelperText>
                    You have{" "}
                    <Text as="span" fontWeight="bold" color="orange.500">
                      {user?.tokens ?? 0}
                    </Text>{" "}
                    tokens available
                  </Field.HelperText>
                </Field.Root>
              </VStack>
            </Box>

            <Button
              type="submit"
              size="lg"
              h="60px"
              w="100%"
              fontWeight="bold"
              fontSize="xl"
              borderRadius="lg"
              borderWidth="3px"
              bgGradient="to-r"
              gradientFrom={"red.300"}
              gradientTo={"red.500"}
              color="white"
              borderColor="red.600"
              disabled={isFormDisabled || !selectedBot || !isValid}
              loading={voteMutation.isPending}
              loadingText="Submitting..."
            >
              <FaLock /> Lock Selection
            </Button>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  );
};

export default VoteForm;
