"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn, avatarColor, initials } from "@/frontend/lib/utils";

const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border-subtle",
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center text-white text-[10px] font-medium uppercase tracking-wide",
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
}

const UserAvatar = React.forwardRef<HTMLSpanElement, UserAvatarProps>(
  ({ name, src, size = 28, className, style, ...rest }, ref) => {
    const color = avatarColor(name ?? "user");
    return (
      <Avatar
        ref={ref}
        className={cn(className)}
        style={{ height: size, width: size, ...style }}
        {...rest}
      >
        {src ? <AvatarImage src={src} alt={name ?? "User"} /> : null}
        <AvatarFallback style={{ backgroundColor: color, fontSize: Math.max(9, size * 0.36) }}>
          {initials(name)}
        </AvatarFallback>
      </Avatar>
    );
  },
);
UserAvatar.displayName = "UserAvatar";

export { Avatar, AvatarImage, AvatarFallback, UserAvatar };
