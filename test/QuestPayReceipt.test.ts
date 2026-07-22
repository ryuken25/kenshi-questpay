import assert from "node:assert/strict";
import { createRequire } from "node:module";

// NOTE: This suite intentionally avoids `chai` and `@nomicfoundation/hardhat-network-helpers`.
// Under this repo's pnpm layout those toolbox peer deps are not hoisted to the top-level
// node_modules, so a test file cannot import them by bare specifier. Everything here runs
// on hardhat's injected `ethers` plus Node's built-in assert.
//
// hardhat is loaded via a runtime require (not a static `import { ethers } from "hardhat"`)
// because the repo's shared tsconfig compiles to ES modules, and ESM/CJS interop cannot
// statically resolve the lazily-attached `ethers` named export off hardhat's CJS module.
const require = createRequire(import.meta.url);
const { ethers } = require("hardhat");

const ZERO = "0x0000000000000000000000000000000000000000";
const BASE_URI = "https://kenshi-questpay.vercel.app/api/receipts/";

/** Decode a reverted call into { name, args }, checking ethers' decoded `revert`
 *  first and falling back to parsing raw error data against the contract ABI. */
function decodeRevert(contract: any, err: any): { name?: string; args: any[] } {
  if (err?.revert?.name) {
    return { name: err.revert.name, args: Array.from(err.revert.args ?? []) };
  }
  const data =
    err?.data ??
    err?.info?.error?.data ??
    err?.error?.data ??
    err?.error?.error?.data;
  if (typeof data === "string" && data.startsWith("0x") && data.length >= 10) {
    try {
      const parsed = contract.interface.parseError(data);
      if (parsed) return { name: parsed.name, args: Array.from(parsed.args ?? []) };
    } catch {
      /* not a known custom error */
    }
  }
  return { name: undefined, args: [] };
}

async function expectRevert(
  contract: any,
  promise: Promise<unknown>,
  errName: string,
  expectedArgs?: (string | bigint)[]
): Promise<void> {
  try {
    await promise;
  } catch (err: any) {
    const { name, args } = decodeRevert(contract, err);
    assert.equal(
      name,
      errName,
      `expected revert "${errName}" but got "${name ?? err?.shortMessage ?? err?.message}"`
    );
    if (expectedArgs) {
      assert.equal(args.length, expectedArgs.length, `arg count for ${errName}`);
      expectedArgs.forEach((exp, i) => {
        const actual = args[i];
        const a = typeof exp === "bigint" ? BigInt(actual) : String(actual).toLowerCase();
        const e = typeof exp === "bigint" ? exp : String(exp).toLowerCase();
        assert.equal(a, e, `arg ${i} of ${errName}`);
      });
    }
    return;
  }
  assert.fail(`expected revert "${errName}" but the call succeeded`);
}

describe("QuestPayReceipt", () => {
  let receipt: any;
  let admin: any, minter: any, buyer: any, stranger: any;
  let MINTER_ROLE: string, DEFAULT_ADMIN_ROLE: string;

  beforeEach(async () => {
    [admin, minter, buyer, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("QuestPayReceipt");
    receipt = await Factory.deploy();
    await receipt.waitForDeployment();

    MINTER_ROLE = await receipt.MINTER_ROLE();
    DEFAULT_ADMIN_ROLE = await receipt.DEFAULT_ADMIN_ROLE();

    // Grant the dedicated backend minter its role (admin retains its own too).
    await receipt.connect(admin).grantRole(MINTER_ROLE, minter.address);
  });

  describe("metadata & roles", () => {
    it("has the correct name and symbol", async () => {
      assert.equal(await receipt.name(), "QuestPay Receipt");
      assert.equal(await receipt.symbol(), "QPR");
    });

    it("grants the deployer DEFAULT_ADMIN_ROLE and MINTER_ROLE", async () => {
      assert.equal(await receipt.hasRole(DEFAULT_ADMIN_ROLE, admin.address), true);
      assert.equal(await receipt.hasRole(MINTER_ROLE, admin.address), true);
    });

    it("supports ERC721 and AccessControl interfaces", async () => {
      assert.equal(await receipt.supportsInterface("0x80ac58cd"), true); // ERC721
      assert.equal(await receipt.supportsInterface("0x7965db0b"), true); // IAccessControl
      assert.equal(await receipt.supportsInterface("0x01ffc9a7"), true); // ERC165
      assert.equal(await receipt.supportsInterface("0xffffffff"), false);
    });
  });

  describe("minting", () => {
    it("lets a minter mint a receipt and records both mappings + event", async () => {
      const orderId = 42n;
      const tx = await receipt.connect(minter).mintReceipt(buyer.address, orderId);
      const rcpt = await tx.wait();

      // ReceiptMinted event
      const ev = rcpt.logs
        .map((l: any) => {
          try {
            return receipt.interface.parseLog(l);
          } catch {
            return null;
          }
        })
        .find((p: any) => p && p.name === "ReceiptMinted");
      assert.ok(ev, "ReceiptMinted event not emitted");
      assert.equal(ev.args.orderId, orderId);
      assert.equal(ev.args.tokenId, 1n);
      assert.equal(ev.args.to, buyer.address);

      assert.equal(await receipt.ownerOf(1n), buyer.address);
      assert.equal(await receipt.balanceOf(buyer.address), 1n);
      assert.equal(await receipt.orderToToken(orderId), 1n);
      assert.equal(await receipt.tokenToOrder(1n), orderId);
    });

    it("returns the freshly minted incrementing tokenId", async () => {
      const first = await receipt.connect(minter).mintReceipt.staticCall(buyer.address, 100n);
      assert.equal(first, 1n);
      await receipt.connect(minter).mintReceipt(buyer.address, 100n);

      const second = await receipt.connect(minter).mintReceipt.staticCall(stranger.address, 200n);
      assert.equal(second, 2n);
      await receipt.connect(minter).mintReceipt(stranger.address, 200n);

      assert.equal(await receipt.tokenToOrder(1n), 100n);
      assert.equal(await receipt.tokenToOrder(2n), 200n);
    });

    it("reverts when a non-minter stranger tries to mint", async () => {
      await expectRevert(
        receipt,
        receipt.connect(stranger).mintReceipt(buyer.address, 1n),
        "AccessControlUnauthorizedAccount",
        [stranger.address, MINTER_ROLE]
      );
    });

    it("reverts when the buyer (non-minter) tries to mint their own receipt", async () => {
      await expectRevert(
        receipt,
        receipt.connect(buyer).mintReceipt(buyer.address, 7n),
        "AccessControlUnauthorizedAccount",
        [buyer.address, MINTER_ROLE]
      );
    });

    it("reverts on a double-mint for the same orderId", async () => {
      const orderId = 999n;
      await receipt.connect(minter).mintReceipt(buyer.address, orderId);
      await expectRevert(
        receipt,
        receipt.connect(minter).mintReceipt(stranger.address, orderId),
        "ReceiptAlreadyMinted",
        [orderId]
      );
    });
  });

  describe("receiptForOrder", () => {
    it("returns the tokenId for a minted order and 0 for an unknown order", async () => {
      assert.equal(await receipt.receiptForOrder(555n), 0n);
      await receipt.connect(minter).mintReceipt(buyer.address, 555n);
      assert.equal(await receipt.receiptForOrder(555n), 1n);
      assert.equal(await receipt.receiptForOrder(556n), 0n);
    });
  });

  describe("tokenURI", () => {
    it("returns the metadata endpoint for an existing token", async () => {
      await receipt.connect(minter).mintReceipt(buyer.address, 3n);
      assert.equal(await receipt.tokenURI(1n), `${BASE_URI}1/metadata`);
    });

    it("reverts for a non-existent token", async () => {
      await expectRevert(receipt, receipt.tokenURI(123n), "ERC721NonexistentToken", [123n]);
    });
  });

  describe("soulbound enforcement", () => {
    beforeEach(async () => {
      await receipt.connect(minter).mintReceipt(buyer.address, 1n);
    });

    it("reverts on transferFrom", async () => {
      await expectRevert(
        receipt,
        receipt.connect(buyer).transferFrom(buyer.address, stranger.address, 1n),
        "SoulboundNonTransferable"
      );
    });

    it("reverts on safeTransferFrom", async () => {
      await expectRevert(
        receipt,
        receipt
          .connect(buyer)
          ["safeTransferFrom(address,address,uint256)"](buyer.address, stranger.address, 1n),
        "SoulboundNonTransferable"
      );
    });

    it("reverts on approve", async () => {
      await expectRevert(
        receipt,
        receipt.connect(buyer).approve(stranger.address, 1n),
        "SoulboundNonTransferable"
      );
    });

    it("reverts on setApprovalForAll", async () => {
      await expectRevert(
        receipt,
        receipt.connect(buyer).setApprovalForAll(stranger.address, true),
        "SoulboundNonTransferable"
      );
    });

    it("kept the token bound to the buyer after the failed transfers", async () => {
      assert.equal(await receipt.ownerOf(1n), buyer.address);
      assert.notEqual(await receipt.ownerOf(1n), ZERO);
    });
  });
});
