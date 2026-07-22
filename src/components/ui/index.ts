/**
 * Kenshi QuestPay design-system primitives.
 *
 * Ported from the published DS project (claude.ai/design — "Kenshi QuestPay
 * Design System"). The DS ships inline-styled .jsx references; these are the
 * app-native TypeScript equivalents that consume the existing `.qp-*` token
 * classes in globals.css, so they render identically, work in Server Components,
 * and ship no per-button hover JS.
 */
export { default as Badge } from "./Badge";
export type { BadgeProps, BadgeTone } from "./Badge";

export { default as Button } from "./Button";
export type { ButtonProps, ButtonLinkProps, ButtonVariant, ButtonSize } from "./Button";

export { default as Card } from "./Card";
export type { CardProps } from "./Card";

export { default as Eyebrow } from "./Eyebrow";
export type { EyebrowProps } from "./Eyebrow";

export { default as HashChip, truncateMiddle } from "./HashChip";
export type { HashChipProps } from "./HashChip";

export { default as StatTile } from "./StatTile";
export type { StatTileProps } from "./StatTile";

export { Input, Textarea, Select, Checkbox } from "./Field";
export type { InputProps, TextareaProps, SelectProps, CheckboxProps } from "./Field";

export { default as ChoiceTile } from "./ChoiceTile";
export type { ChoiceTileProps } from "./ChoiceTile";

export { default as TokenCoin } from "./TokenCoin";
export type { TokenCoinProps, TokenCoinId } from "./TokenCoin";
