"use client";
import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { FC } from "react";
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

export const ReloadButton: FC<ReloadButtonProps> = ({
  onClick,
  isLoading,
  icon = <IoReload />,
  ...iconButtonProps
}) => {
  return (
    <IconButton
      onClick={onClick}
      animation={isLoading ? "spin 0.5s linear infinite" : undefined}
      {...iconButtonProps}
    >
      {icon}
    </IconButton>
  );
};
