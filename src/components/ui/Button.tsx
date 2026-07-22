import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Kenshi QuestPay DS — Button.
 * Violet-gradient primary, glass secondary, hairline ghost. Renders a <button>,
 * or a next/link <Link> when `href` is set (external hrefs fall back to <a>).
 *
 * Styling comes from globals.css (.qp-button*) rather than inline styles, so the
 * component works in Server Components and ships no hover-state JS.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  className?: string;
}

function classesFor({ variant = "primary", size = "md", fullWidth, className = "" }: CommonProps) {
  return [
    "qp-button",
    `qp-button--${variant}`,
    size !== "md" ? `qp-button--${size}` : "",
    fullWidth ? "qp-button--block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

export type ButtonLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "href"> & { href: string };

export default function Button(props: ButtonProps | ButtonLinkProps) {
  const { variant, size, fullWidth, icon, iconRight, children, className, ...rest } = props;
  const cls = classesFor({ variant, size, fullWidth, className });
  const inner = (
    <>
      {icon}
      {children}
      {iconRight}
    </>
  );

  if (typeof (props as ButtonLinkProps).href === "string") {
    const { href, ...anchorRest } = rest as AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };
    // Internal routes use next/link for client-side navigation; external ones stay plain anchors.
    const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a className={cls} href={href} {...anchorRest}>
          {inner}
        </a>
      );
    }
    return (
      <Link className={cls} href={href} {...anchorRest}>
        {inner}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type} className={cls} {...buttonRest}>
      {inner}
    </button>
  );
}
