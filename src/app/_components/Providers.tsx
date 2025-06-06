"use client";

import { ParallaxProvider } from "react-scroll-parallax";
import { PostHogProvider } from "./PostHogProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <ParallaxProvider>{children}</ParallaxProvider>
    </PostHogProvider>
  );
}
