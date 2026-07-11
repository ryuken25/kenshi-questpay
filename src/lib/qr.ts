import "server-only";
import QRCode from "qrcode";
import { parseUnits } from "viem";
import { NETWORKS, type ChainKey, type TokenConfig } from "./services";

/**
 * Generate an EIP-681 URI for a given payment.
 *
 * Native:  ethereum:<receiveAddress>@<chainId>?value=<units>
 * ERC-20:  ethereum:<tokenAddress>@<chainId>/transfer?address=<receiveAddress>&uint256=<units>
 */
export function buildEip681Uri(
  receiveAddress: string,
  token: TokenConfig,
  amountHuman: string,
  chainKey: ChainKey = "polygon",
): string {
  const units = parseUnits(amountHuman, token.decimals).toString();
  const chainId = NETWORKS[chainKey].chainId;
  if (token.kind === "native") {
    return `ethereum:${receiveAddress}@${chainId}?value=${units}`;
  }
  return `ethereum:${token.address}@${chainId}/transfer?address=${receiveAddress}&uint256=${units}`;
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
