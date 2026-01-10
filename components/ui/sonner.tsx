"use client";

//import { useTheme } from "next-themes";
//import { Toaster as Sonner, ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

//const Toaster = ({ ...props }: ToasterProps) => {
// const { theme = "dark" } = useTheme();
const Toaster = () => {
  return (
    <Sonner
      toastOptions={{
        style: {
          // background: "oklch(81.1% 0.111 293.571)",
        },
      }}
      position="top-center"
    />

    /*
    <Sonner
      //theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--background": "red",
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />*/
  );
};

export { Toaster };
