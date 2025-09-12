"use client";
import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useSealedAuction } from "../hooks/useSealedAuction";

export default function SealedAuctionUI() {
	const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
	const [connected, setConnected] = useState(false);
	const [account, setAccount] = useState<string>("");
	const [networkOk, setNetworkOk] = useState<boolean>(false);
	const [bidCt, setBidCt] = useState<string>("");
	const [inputProof, setInputProof] = useState<string>("");
	const [state, setState] = useState<any>(null);
	const [winnerCt, setWinnerCt] = useState<string>("");
	const [highestCt, setHighestCt] = useState<string>("");
	const [txPending, setTxPending] = useState<boolean>(false);
    const [inputError, setInputError] = useState<string>("");

	useEffect(() => {
		if (typeof window !== "undefined" && (window as any).ethereum) {
			setProvider(new ethers.BrowserProvider((window as any).ethereum));
		}
	}, []);

	const contract = useSealedAuction(provider);
	const writeContract = useMemo(() => contract, [contract]);

	function normalizeBytes32(input: string): string | null {
		try {
			if (!input) return null;
			let hex = input.trim();
			if (!hex.startsWith("0x")) {
				// treat as decimal string
				const n = BigInt(hex);
				hex = ethers.toBeHex(n);
			}
			// pad to 32 bytes
			return ethers.zeroPadValue(hex, 32);
		} catch {
			return null;
		}
	}

	function normalizeBytes(input: string): string | null {
		try {
			if (!input) return "0x";
			let hex = input.trim();
			if (!hex.startsWith("0x")) {
				// interpret as hex without prefix
				hex = "0x" + hex;
			}
			// basic hex check
			if (!/^0x[0-9a-fA-F]*$/.test(hex)) return null;
			return hex.toLowerCase();
		} catch {
			return null;
		}
	}

	async function connect() {
		await (window as any).ethereum?.request?.({ method: "eth_requestAccounts" });
		if (!provider) return;
		const signer = await provider.getSigner();
		setAccount(await signer.getAddress());
		const net = await provider.getNetwork();
		if (Number(net.chainId) !== 31337) {
			try {
				await (window as any).ethereum.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: "0x539" }],
				});
				setNetworkOk(true);
			} catch (e: any) {
				try {
					await (window as any).ethereum.request({
						method: "wallet_addEthereumChain",
						params: [
							{
								chainId: "0x539",
								chainName: "Hardhat",
								nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
								rpcUrls: ["http://127.0.0.1:8545"],
							},
						],
					});
					setNetworkOk(true);
				} catch {
					setNetworkOk(false);
				}
			}
		} else {
			setNetworkOk(true);
		}
		setConnected(true);
	}

	async function readBids() {
		if (!contract) return;
		const value = await (contract as any).bids();
		console.log("bids:", value);
	}

	async function refreshState() {
		if (!contract) return;
		const s = await contract.getState();
		setState(s);
		try {
			const hc = await contract.highestBidCipher();
			setHighestCt(hc);
		} catch {}
		try {
			const wc = await contract.winnerCipher();
			setWinnerCt(wc);
		} catch {}
	}

	async function onPlaceBid() {
		if (!writeContract || !provider) return;
		const signer = await provider.getSigner();
		const c = (writeContract as any).connect(signer);

		const bidBytes32 = normalizeBytes32(bidCt);
		const proofBytes = normalizeBytes(inputProof);
		if (!bidBytes32 || !proofBytes) {
			setInputError("bidCt phải là bytes32 (số hoặc 0x...), inputProof phải là bytes hex");
			return;
		}
		setInputError("");

		setTxPending(true);
		try {
			const tx = await (c as any).placeBid(bidBytes32, proofBytes);
			await tx.wait();
			await refreshState();
		} finally {
			setTxPending(false);
		}
	}

	async function onFinalize() {
		if (!writeContract || !provider) return;
		const signer = await provider.getSigner();
		const c = (writeContract as any).connect(signer);
		setTxPending(true);
		try {
			const tx = await (c as any).finalize();
			await tx.wait();
			await refreshState();
		} finally {
			setTxPending(false);
		}
	}

	return (
		<div className="w-full max-w-xl border rounded p-4 flex flex-col gap-3">
			<h2 className="text-lg font-semibold">SealedAuction Demo</h2>
			<div className="flex gap-2">
				<button className="btn" onClick={connect}>Connect</button>
				<button className="btn" onClick={refreshState} disabled={!contract}>Refresh</button>
				<button className="btn" onClick={readBids} disabled={!contract}>Read bids()</button>
			</div>
			<div className="text-sm text-gray-600">
				<div>Account: {account || "-"}</div>
				<div>Network ok: {networkOk ? "yes" : "no"}</div>
				<div>Connected: {connected ? "yes" : "no"}</div>
			</div>

			<div className="flex flex-col gap-2">
				<label className="text-sm">bidCt (bytes32 hex)</label>
				<input className="border px-2 py-1" value={bidCt} onChange={(e) => setBidCt(e.target.value)} placeholder="ví dụ: 12345 hoặc 0x12ab... (32 bytes)" />
				<label className="text-sm">inputProof (bytes hex)</label>
				<input className="border px-2 py-1" value={inputProof} onChange={(e) => setInputProof(e.target.value)} placeholder="0x... (có thể để trống = 0x)" />
				{inputError && <div className="text-red-600 text-sm">{inputError}</div>}
				<button className="btn" onClick={onPlaceBid} disabled={!contract || txPending}>Place Bid</button>
				<button className="btn" onClick={onFinalize} disabled={!contract || txPending}>Finalize</button>
			</div>

			<div className="mt-2 text-sm">
				<div>State: {state ? JSON.stringify(state) : "-"}</div>
				<div>highestBidCipher: {highestCt || "-"}</div>
				<div>winnerCipher: {winnerCt || "-"}</div>
			</div>
		</div>
	);
}


