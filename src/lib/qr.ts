import "server-only";
import QRCode from "qrcode";
import { parseUnits, encodeFunctionData, erc20Abi } from "viem";
import type { TokenConfig } from "./services";

/**
 * Generate an EIP-681 URI for a given payment.
 *
 * Native:  ethereum:<receiveAddress>@137?value=<units>
 * ERC-20:  ethereum:<tokenAddress>@137/transfer?address=<receiveAddress>&uint256=<units>
 */
export function buildEip681Uri(
  receiveAddress: string,
  token: TokenConfig,
  amountHuman: string,
): string {
  const units = parseUnits(amountHuman, token.decimals).toString();
  if (token.kind === "native") {
    return `ethereum:${receiveAddress}@137?value=${units}`;
  }
  return `ethereum:${token.address}@137/transfer?address=${receiveAddress}&uint256=${units}`;
}

/**
 * Generate a QR code as an SVG string using the `qrcode` npm package.
 * Never uses external QR APIs.
 */
export async function generateQrSvg(data: string): Promise<string> {
  return QRCode.toString(data, {
    type: "svg",
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

/**
 * Generate a QR code as a data URL (base64 PNG).
 */
export async function generateQrDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    margin: 1,
    width: 240,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
