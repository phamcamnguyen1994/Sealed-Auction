import React, { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";

// Minimal ABI for the SealedAuction contract (only what we use here)
const AUCTION_ABI = [
  // read-only
  { "inputs": [], "name": "endTime", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "ended", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "highestBidCipher", "outputs": [{ "internalType": "euint64", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "winnerCipher", "outputs": [{ "internalType": "eaddress", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getState", "outputs": [
      { "internalType": "bool", "name": "isBidding", "type": "bool" },
      { "internalType": "bool", "name": "isEnded", "type": "bool" },
      { "internalType": "uint256", "name": "_endTime", "type": "uint256" },
      { "internalType": "uint32", "name": "_bids", "type": "uint32" }
    ], "stateMutability": "view", "type": "function" },

  // write
  { "inputs": [ { "internalType": "externalEuint64", "name": "bidCt", "type": "bytes" }, { "internalType": "bytes", "name": "inputProof", "type": "bytes" } ], "name": "placeBid", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "finalize", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ { "internalType": "address", "name": "viewer", "type": "address" } ], "name": "grantView", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
];

// Helper: EIP-712 user decryption via relayer SDK
async function userDecryptHandles({ instance, signer, contractAddress, handles }: {
  instance: any;
  signer: ethers.Signer;
  contractAddress: string;
  handles: string[]; // bytes32 handles returned by ciphertext getters or staticCall
}) {
  // Create ephemeral keypair
  const keypair = instance.generateKeypair();
  const start = Math.floor(Date.now() / 1000).toString();
  const durationDays = "7";
  const contractAddresses = [contractAddress];

  // Build EIP-712 struct and sign it with the user's wallet
  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, start, durationDays);
  // ethers v6: signer.signTypedData(domain, types, value)
  // @ts-ignore: signTypedData exists on Browser wallet signers
  const signature: string = await (signer as any).signTypedData(
    eip712.domain,
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
    eip712.message,
  );

  const req = handles.map((h) => ({ handle: h, contractAddress }));
  const out = await instance.userDecrypt(
    req,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    await signer.getAddress(),
    start,
    durationDays,
  );
  return out; // object: { [handle]: decodedValue }
}

export default function SealedAuctionUI() {
  const [conn, setConn] = useState<{ provider: ethers.BrowserProvider; signer: ethers.Signer; address: string } | null>(null);
  const [contractAddr, setContractAddr] = useState("");
  const [bid, setBid] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [instance, setInstance] = useState<any>(null);
  const [leadHandle, setLeadHandle] = useState<string | null>(null);
  const [winnerHandle, setWinnerHandle] = useState<string | null>(null);
  const [priceHandle, setPriceHandle] = useState<string | null>(null);

  const addLog = useCallback((m: string) => setLogs((xs) => [m, ...xs].slice(0, 200)), []);

  useEffect(() => {
    (async () => {
      try {
        const mod = await import("@zama-fhe/relayer-sdk/web");
        const instance = await mod.createInstance(mod.SepoliaConfig);
        setInstance(instance);
      } catch (e: any) {
        addLog("Relayer init error: " + (e?.message || e));
      }
    })();
  }, [addLog]);

  const connect = useCallback(async () => {
    if (!window.ethereum) { addLog("No wallet detected (MetaMask)"); return; }
    const provider = new ethers.BrowserProvider(window.ethereum as any);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Ensure we're on Sepolia
    const net = await provider.getNetwork();
    if (Number(net.chainId) !== 11155111) {
      addLog(`Wrong network (${net.chainId}). Please switch to Sepolia (11155111).`);
    }
    setConn({ provider, signer, address });
    addLog("Connected: " + address);
  }, [addLog]);

  const placeBid = useCallback(async () => {
    if (!conn || !instance) return addLog("Connect wallet first");
    if (!ethers.isAddress(contractAddr)) return addLog("Invalid contract address");
    const amt = BigInt(bid || "0");
    const signer = conn.signer;

    const contract = new ethers.Contract(contractAddr, AUCTION_ABI, signer);

    // Encrypt input with relayer SDK
    const buf = instance.createEncryptedInput(contractAddr, conn.address);
    buf.add64(amt);
    const { handles, inputProof } = await buf.encrypt();

    // Try staticCall to see if contract returns a lead bit (non-strict mode)
    try {
      const encLeadHandle: string = await (contract as any).placeBid.staticCall(handles[0], inputProof);
      setLeadHandle(encLeadHandle);
      addLog("Got encrypted lead-bit (non-strict mode). Sending tx...");
    } catch {
      setLeadHandle(null);
      addLog("Strict sealed (no return). Sending tx...");
    }

    const tx = await contract.placeBid(handles[0], inputProof);
    addLog("Tx sent: " + tx.hash);
    await tx.wait();
    addLog("✅ Bid confirmed");
  }, [conn, instance, contractAddr, bid, addLog]);

  const decryptLead = useCallback(async () => {
    if (!conn || !instance) return;
    if (!leadHandle) return addLog("No encrypted lead-bit to decrypt");
    const out = await userDecryptHandles({ instance, signer: conn.signer, contractAddress: contractAddr, handles: [leadHandle] });
    const val = out[leadHandle];
    addLog("Lead bit (you only): " + (val ? "true" : "false"));
  }, [conn, instance, leadHandle, contractAddr, addLog]);

  const finalize = useCallback(async () => {
    if (!conn) return addLog("Connect wallet (seller)");
    const signer = conn.signer;
    const contract = new ethers.Contract(contractAddr, AUCTION_ABI, signer);
    const tx = await contract.finalize();
    addLog("Finalize tx: " + tx.hash);
    await tx.wait();
    addLog("✅ Auction finalized");
  }, [conn, contractAddr, addLog]);

  const fetchResultHandles = useCallback(async () => {
    if (!conn) return;
    const signer = conn.signer;
    const contract = new ethers.Contract(contractAddr, AUCTION_ABI, signer);
    try {
      const w = await contract.winnerCipher();
      const p = await contract.highestBidCipher();
      setWinnerHandle(w);
      setPriceHandle(p);
      addLog("Fetched ciphertext handles for winner & price");
    } catch (e: any) {
      addLog("Cannot fetch results. Are you seller or whitelisted? " + (e?.message || e));
    }
  }, [conn, contractAddr, addLog]);

  const decryptResults = useCallback(async () => {
    if (!conn || !instance) return;
    if (!winnerHandle || !priceHandle) return addLog("No result handles. Click 'Fetch Results' first");
    const out = await userDecryptHandles({ instance, signer: conn.signer, contractAddress: contractAddr, handles: [winnerHandle, priceHandle] });
    const winner = out[winnerHandle];
    const price = out[priceHandle];
    addLog("Winner (you only): " + winner);
    addLog("Winning price (you only): " + String(price));
  }, [conn, instance, contractAddr, winnerHandle, priceHandle, addLog]);

  return (
    <div className="min-h-screen w-full p-6 bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Sealed Auction UI (Sepolia)</h1>
        <p className="text-sm opacity-80">Encrypts bids in-browser via Relayer SDK; interacts with your deployed fhEVM contract on Sepolia.</p>

        <div className="grid gap-3 rounded-2xl p-4 bg-white shadow">
          <button onClick={connect} className="px-3 py-2 rounded-xl bg-black text-white">{conn ? `Connected: ${conn.address.slice(0,6)}…${conn.address.slice(-4)}` : "Connect Wallet"}</button>
          <label className="text-sm">Contract address</label>
          <input value={contractAddr} onChange={(e)=>setContractAddr(e.target.value)} placeholder="0x..." className="px-3 py-2 rounded-xl border"/>
          <label className="text-sm">Your bid (uint64)</label>
          <input value={bid} onChange={(e)=>setBid(e.target.value)} placeholder="e.g. 70" className="px-3 py-2 rounded-xl border"/>
          <div className="flex gap-2">
            <button onClick={placeBid} className="px-3 py-2 rounded-xl bg-indigo-600 text-white">Place Encrypted Bid</button>
            <button onClick={decryptLead} className="px-3 py-2 rounded-xl bg-indigo-100">Decrypt My Lead Bit</button>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl p-4 bg-white shadow">
          <h2 className="font-semibold">Finalize & Read Results (Seller / Whitelisted)</h2>
          <div className="flex gap-2">
            <button onClick={finalize} className="px-3 py-2 rounded-xl bg-emerald-600 text-white">Finalize</button>
            <button onClick={fetchResultHandles} className="px-3 py-2 rounded-xl bg-emerald-100">Fetch Results</button>
            <button onClick={decryptResults} className="px-3 py-2 rounded-xl bg-emerald-100">Decrypt Results</button>
          </div>
          <p className="text-xs opacity-70">Tip: If your contract is strict-sealed and you are not whitelisted, fetch will fail by design.</p>
        </div>

        <div className="rounded-2xl p-4 bg-white shadow">
          <h2 className="font-semibold mb-2">Logs</h2>
          <div className="text-xs space-y-2 max-h-64 overflow-auto">
            {logs.map((l, i) => <div key={i} className="font-mono">• {l}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}