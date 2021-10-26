import React from "react";
import { IoPersonOutline } from "react-icons";
import { Avatar } from "@chakra-ui/react";

interface CustomAvatarProps {
    url?: string | null;
    size?:
        | (string & "sm")
        | "2xs"
        | "xs"
        | "md"
        | "lg"
        | "xl"
        | "2xl"
        | "full"
        | undefined;
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({ url, size = "sm" }) => {
    return url ? (
        <Avatar size={size} src={url} />
    ) : (
        <Avatar size={size} as={IoPersonOutline} />
    );
};

export default CustomAvatar;
