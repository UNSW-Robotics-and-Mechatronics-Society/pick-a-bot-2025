"use client";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { IoReload } from "react-icons/io5";

interface ReloadButtonProps {
  isLoading: boolean;
  icon?: React.ReactNode;
}

interface ReloadButtonProps extends Omit<IconButtonProps, "isLoading"> {
  isLoading: boolean;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
}

export default function ReloadButton({
  onClick,
  isLoading,
  icon = <IoReload />,
  ...iconButtonProps
}: ReloadButtonProps) {
  return (
    <IconButton
      onClick={onClick}
      animation={isLoading ? "spin 0.5s linear infinite" : undefined}
      {...iconButtonProps}
    >
      {icon}
    </IconButton>
  );
}
