"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

// Import SealedAuction ABI and addresses
import artifact from "../contracts/SealedAuction.json";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type SealedAuctionInfoType = {
  abi: any[];
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getSealedAuctionByChainId(
  chainId: number | undefined,
  currentContractAddress?: string | null
): SealedAuctionInfoType {
  // Priority: currentContractAddress > localStorage > artifact.address
  let activeContractAddress = null;
  
  // First priority: currentContractAddress from component
  if (currentContractAddress) {
    activeContractAddress = currentContractAddress;
    console.log('[getSealedAuctionByChainId] Using currentContractAddress:', activeContractAddress);
  } else {
    // Second priority: localStorage (only on client side)
    if (typeof window !== 'undefined') {
      activeContractAddress = localStorage.getItem('active-contract-address');
      console.log('[getSealedAuctionByChainId] localStorage active-contract-address:', activeContractAddress);
    }
  }
  
  // Final fallback: artifact.address
  const contractAddress = activeContractAddress || (artifact as any).address;
  console.log('[getSealedAuctionByChainId] Final contract address:', contractAddress);
  console.log('[getSealedAuctionByChainId] Artifact has address:', 'address' in artifact);
  console.log('[getSealedAuctionByChainId] Artifact address:', (artifact as any).address);
  
  return {
    address: contractAddress as `0x${string}` | undefined,
    chainId: chainId,
    chainName: chainId === 11155111 ? "sepolia" : chainId === 31337 ? "hardhat" : "unknown",
    abi: artifact.abi,
  };
}

export const useSealedAuctionFHE = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
  currentContractAddress?: string | null;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    currentContractAddress,
  } = parameters;

  // States
  const [state, setState] = useState<any>(undefined);
  const [highestBidHandle, setHighestBidHandle] = useState<string | undefined>(undefined);
  const [winnerHandle, setWinnerHandle] = useState<string | undefined>(undefined);
  const [clearHighestBid, setClearHighestBid] = useState<ClearValueType | undefined>(undefined);
  const [clearWinner, setClearWinner] = useState<ClearValueType | undefined>(undefined);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [isPlacingBid, setIsPlacingBid] = useState<boolean>(false);
  const [isFinalizing, setIsFinalizing] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [blockTimestamp, setBlockTimestamp] = useState<number | undefined>(undefined);

  const auctionRef = useRef<SealedAuctionInfoType | undefined>(undefined);
  const isRefreshingRef = useRef<boolean>(isRefreshing);
  const isDecryptingRef = useRef<boolean>(isDecrypting);
  const isPlacingBidRef = useRef<boolean>(isPlacingBid);
  const isFinalizingRef = useRef<boolean>(isFinalizing);

  // Contract info
  const auction = useMemo(() => {
    const c = getSealedAuctionByChainId(chainId, currentContractAddress);
    auctionRef.current = c;

    if (!c.address) {
      setMessage(`SealedAuction deployment not found. Please check contract deployment.`);
    } else {
      const networkMatch = chainId === c.chainId;
      setMessage(`SealedAuction found at ${c.address} on ${c.chainName || 'unknown network'}${!networkMatch ? ` (MetaMask on chainId=${chainId}, contract on chainId=${c.chainId})` : ''}`);
    }

    return c;
  }, [chainId, currentContractAddress]);

  const isDeployed = useMemo(() => {
    if (!auction) {
      return undefined;
    }
    return (Boolean(auction.address) && auction.address !== ethers.ZeroAddress);
  }, [auction]);

  const canRefresh = useMemo(() => {
    return auction.address && ethersReadonlyProvider && !isRefreshing;
  }, [auction.address, ethersReadonlyProvider, isRefreshing]);

  const refreshState = useCallback(() => {
    console.log("[useSealedAuctionFHE] call refreshState()");
    if (isRefreshingRef.current) {
      return;
    }

    if (
      !auctionRef.current ||
      !auctionRef.current?.chainId ||
      !auctionRef.current?.address ||
      !ethersReadonlyProvider
    ) {
      setState(undefined);
      return;
    }

    isRefreshingRef.current = true;
    setIsRefreshing(true);

    const thisChainId = auctionRef.current.chainId;
    const thisAuctionAddress = auctionRef.current.address;

    const thisAuctionContract = new ethers.Contract(
      thisAuctionAddress,
      auctionRef.current.abi,
      ethersReadonlyProvider
    );

    // Get state first
    thisAuctionContract
      .getState()
      .then(async (state) => {
        // Convert BigInt values to strings before logging
        const stateForLog = {
          isBidding: state.isBidding,
          isEnded: state.isEnded,
          _endTime: state._endTime.toString(),
          _bids: state._bids.toString(),
        };
        console.log("[useSealedAuctionFHE] getState()=" + JSON.stringify(stateForLog));
        
        // Get current block timestamp
        try {
          const block = await ethersReadonlyProvider?.getBlock('latest');
          if (block) {
            setBlockTimestamp(block.timestamp);
            console.log("[useSealedAuctionFHE] Block timestamp:", block.timestamp);
            console.log("[useSealedAuctionFHE] Block number:", block.number);
            console.log("[useSealedAuctionFHE] End time:", state._endTime.toString());
            console.log("[useSealedAuctionFHE] Time difference:", block.timestamp - Number(state._endTime));
          }
        } catch (error) {
          console.log("[useSealedAuctionFHE] Failed to get block timestamp:", error);
        }
        
        if (
          sameChain.current(thisChainId) &&
          thisAuctionAddress === auctionRef.current?.address
        ) {
          // Convert BigInt values to strings for JSON serialization
          const processedState = {
            isBidding: state.isBidding,
            isEnded: state.isEnded,
            _endTime: state._endTime.toString(),
            _bids: state._bids.toString(),
          };
          setState(processedState);

          // Only try to get results if auction is ended
          if (state.isEnded) {
            console.log("[useSealedAuctionFHE] Auction ended, trying to get results...");
            console.log("[useSealedAuctionFHE] Current address:", ethersSigner?.address);
            console.log("[useSealedAuctionFHE] Contract address:", thisAuctionAddress);
            
            // Check seller address from contract
            thisAuctionContract.seller()
              .then((sellerAddress) => {
                console.log("[useSealedAuctionFHE] Contract seller:", sellerAddress);
                console.log("[useSealedAuctionFHE] Is current user seller?", ethersSigner?.address?.toLowerCase() === sellerAddress.toLowerCase());
                
                // Check if current user has view permission
                thisAuctionContract.canViewAfterEnd(ethersSigner?.address)
                  .then((hasPermission) => {
                    console.log("[useSealedAuctionFHE] User has view permission:", hasPermission);
                  })
                  .catch((e) => {
                    console.log("[useSealedAuctionFHE] Failed to check view permission:", e);
                  });
              })
              .catch((e) => {
                console.log("[useSealedAuctionFHE] Failed to get seller:", e);
              });
            
            // Get highest bid cipher (only available after finalization)
            // Use direct call to bypass permission issues
            thisAuctionContract.highestBidCipher()
              .then((highestBidHandle) => {
                console.log("[useSealedAuctionFHE] highestBidCipher()=" + highestBidHandle);
                if (
                  sameChain.current(thisChainId) &&
                  thisAuctionAddress === auctionRef.current?.address
                ) {
                  setHighestBidHandle(highestBidHandle);
                  console.log("[useSealedAuctionFHE] Got highestBidCipher handle:", highestBidHandle);
                }
              })
              .catch((e) => {
                console.log("[useSealedAuctionFHE] highestBidCipher() failed: " + e.message);
                setHighestBidHandle(undefined);
              });

            // Get winner cipher (only available after finalization)
            // Use direct call to bypass permission issues
            thisAuctionContract.winnerCipher()
              .then((winnerHandle) => {
                console.log("[useSealedAuctionFHE] winnerCipher()=" + winnerHandle);
                if (
                  sameChain.current(thisChainId) &&
                  thisAuctionAddress === auctionRef.current?.address
                ) {
                  setWinnerHandle(winnerHandle);
                  console.log("[useSealedAuctionFHE] Got winnerCipher handle:", winnerHandle);
                }
              })
              .catch((e) => {
                console.log("[useSealedAuctionFHE] winnerCipher() failed: " + e.message);
                setWinnerHandle(undefined);
              });
          } else {
            // Auction is still active, clear results
            console.log("[useSealedAuctionFHE] Auction still active, clearing results");
            setHighestBidHandle(undefined);
            setWinnerHandle(undefined);
          }
        }
      })
      .catch((e) => {
        console.log("[useSealedAuctionFHE] getState() failed: " + e);
      });

    isRefreshingRef.current = false;
    setIsRefreshing(false);
  }, [ethersReadonlyProvider, sameChain]);

  // Auto refresh
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Place bid
  const canPlaceBid = useMemo(() => {
    return (
      auction.address &&
      instance &&
      ethersSigner &&
      !isRefreshing &&
      !isPlacingBid &&
      (!state || state.isBidding) // Allow bid if no state loaded or if bidding is true
    );
  }, [auction.address, instance, ethersSigner, isRefreshing, isPlacingBid, state]);

  const placeBid = useCallback(
    (bidAmount: number) => {
      if (isRefreshingRef.current || isPlacingBidRef.current) {
        return;
      }

      if (!auction.address || !instance || !ethersSigner || bidAmount <= 0) {
        return;
      }

      const thisChainId = chainId;
      const thisAuctionAddress = auction.address;
      const thisEthersSigner = ethersSigner;
      const thisAuctionContract = new ethers.Contract(
        thisAuctionAddress,
        auction.abi,
        thisEthersSigner
      );

      isPlacingBidRef.current = true;
      setIsPlacingBid(true);
      setMessage(`Start placing bid ${bidAmount}...`);

      const run = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));

        const isStale = () =>
          thisAuctionAddress !== auctionRef.current?.address ||
          !sameChain.current(thisChainId) ||
          !sameSigner.current(thisEthersSigner);

        try {
          const input = instance.createEncryptedInput(
            thisAuctionAddress,
            thisEthersSigner.address
          );
          input.add64(bidAmount);

          const enc = await input.encrypt();

          if (isStale()) {
            setMessage(`Ignore placeBid`);
            return;
          }

          setMessage(`Call placeBid...`);

          const tx: ethers.TransactionResponse = await thisAuctionContract.placeBid(
            enc.handles[0],
            enc.inputProof
          );

          setMessage(`Wait for tx:${tx.hash}...`);

          const receipt = await tx.wait();

          setMessage(`Call placeBid completed status=${receipt?.status}`);

          if (isStale()) {
            setMessage(`Ignore placeBid`);
            return;
          }

          refreshState();
        } catch (e) {
          setMessage(`placeBid Failed! ${e}`);
        } finally {
          isPlacingBidRef.current = false;
          setIsPlacingBid(false);
        }
      };

      run();
    },
    [
      ethersSigner,
      auction.address,
      auction.abi,
      instance,
      chainId,
      refreshState,
      sameChain,
      sameSigner,
    ]
  );

  // Finalize
  const canFinalize = useMemo(() => {
    if (!auction.address || !ethersSigner || isRefreshing || isFinalizing || !state) {
      console.log("[useSealedAuctionFHE] canFinalize=false: missing requirements", {
        hasAddress: !!auction.address,
        hasSigner: !!ethersSigner,
        isRefreshing,
        isFinalizing,
        hasState: !!state
      });
      return false;
    }
    
    // Can finalize if:
    // 1. Auction is not already ended (ended = false)
    // 2. Current time >= endTime (auction time has expired)
    // Use local time as fallback, but smart contract will do the final check
    const currentTime = Math.floor(Date.now() / 1000);
    const endTime = Number(state._endTime);
    const timeExpired = currentTime >= endTime;
    const notAlreadyEnded = !state.isEnded;
    
    console.log("[useSealedAuctionFHE] canFinalize check:", {
      currentTime,
      endTime,
      timeExpired,
      isEnded: state.isEnded,
      notAlreadyEnded,
      result: timeExpired && notAlreadyEnded,
      note: "Smart contract will do final timestamp check"
    });
    
    // Only allow finalize if auction is not ended AND time has expired
    return notAlreadyEnded && timeExpired;
  }, [auction.address, ethersSigner, isRefreshing, isFinalizing, state]);

  const finalize = useCallback(() => {
    if (isRefreshingRef.current || isFinalizingRef.current) {
      return;
    }

    if (!auction.address || !ethersSigner) {
      return;
    }

    const thisChainId = chainId;
    const thisAuctionAddress = auction.address;
    const thisEthersSigner = ethersSigner;
    const thisAuctionContract = new ethers.Contract(
      thisAuctionAddress,
      auction.abi,
      thisEthersSigner
    );

    isFinalizingRef.current = true;
    setIsFinalizing(true);
    setMessage(`Start finalizing...`);

    const run = async () => {
      const isStale = () =>
        thisAuctionAddress !== auctionRef.current?.address ||
        !sameChain.current(thisChainId) ||
        !sameSigner.current(thisEthersSigner);

      try {
        // Check block timestamp before finalize
        setMessage(`Checking block timestamp...`);
        const block = await ethersReadonlyProvider?.getBlock('latest');
        const blockTimestamp = block?.timestamp || 0;
        const endTime = Number(state?._endTime || 0);
        
        console.log("[useSealedAuctionFHE] Block timestamp check:", {
          blockTimestamp,
          endTime,
          timeExpired: blockTimestamp >= endTime,
          localTime: Math.floor(Date.now() / 1000)
        });

        if (blockTimestamp < endTime) {
          setMessage(`Cannot finalize: Block timestamp ${blockTimestamp} < endTime ${endTime}`);
          return;
        }

        setMessage(`Call finalize...`);

        const tx: ethers.TransactionResponse = await thisAuctionContract.finalize();

        setMessage(`Wait for tx:${tx.hash}...`);

        const receipt = await tx.wait();

        setMessage(`Call finalize completed status=${receipt?.status}`);

        if (isStale()) {
          setMessage(`Ignore finalize`);
          return;
        }

        // Wait a bit for blockchain to update, then refresh
        setMessage(`Waiting for blockchain update...`);
        setTimeout(() => {
          refreshState();
          // Force another refresh after a bit more time to ensure state is updated
          setTimeout(() => {
            refreshState();
          }, 3000);
        }, 2000); // Wait 2 seconds
      } catch (e) {
        console.error("[useSealedAuctionFHE] Finalize error:", e);
        setMessage(`finalize Failed! ${e}`);
      } finally {
        isFinalizingRef.current = false;
        setIsFinalizing(false);
      }
    };

    run();
  }, [
    ethersSigner,
    auction.address,
    auction.abi,
    chainId,
    refreshState,
    sameChain,
    sameSigner,
    ethersReadonlyProvider,
    state,
  ]);

  // Grant view permission (only seller can do this)
  const grantView = useCallback(async (viewerAddress: string) => {
    if (!auction.address || !ethersSigner) {
      return;
    }

    const thisAuctionContract = new ethers.Contract(
      auction.address,
      auction.abi,
      ethersSigner
    );

    try {
      setMessage(`Granting view permission to ${viewerAddress}...`);
      const tx = await thisAuctionContract.grantView(viewerAddress);
      await tx.wait();
      setMessage(`View permission granted successfully`);
      refreshState(); // Refresh to get results
    } catch (e) {
      setMessage(`Grant view failed: ${e}`);
    }
  }, [auction.address, auction.abi, ethersSigner, refreshState]);

  // Fix seller view permission (emergency function)
  const fixSellerPermission = useCallback(async () => {
    if (!auction.address || !ethersSigner) {
      return;
    }

    const thisAuctionContract = new ethers.Contract(
      auction.address,
      auction.abi,
      ethersSigner
    );

    try {
      setMessage(`Fixing seller view permission...`);
      const tx = await thisAuctionContract.grantView(ethersSigner.address);
      await tx.wait();
      setMessage(`Seller permission fixed successfully`);
      refreshState(); // Refresh to get results
    } catch (e) {
      setMessage(`Fix seller permission failed: ${e}`);
    }
  }, [auction.address, auction.abi, ethersSigner, refreshState]);

  // Direct contract call to get results (bypass permission check)
  const getResultsDirectly = useCallback(async () => {
    if (!auction.address || !ethersSigner) {
      return;
    }

    const thisAuctionContract = new ethers.Contract(
      auction.address,
      auction.abi,
      ethersSigner
    );

    try {
      setMessage(`Getting results directly...`);
      
      // Try to call highestBidCipher directly
      const highestBid = await thisAuctionContract.highestBidCipher();
      console.log("[useSealedAuctionFHE] Direct highestBidCipher result:", highestBid);
      
      // Try to call winnerCipher directly
      const winner = await thisAuctionContract.winnerCipher();
      console.log("[useSealedAuctionFHE] Direct winnerCipher result:", winner);
      
      setMessage(`Results retrieved successfully`);
      setHighestBidHandle(highestBid);
      setWinnerHandle(winner);
      
      // Try to decrypt using FhevmDecryptionSignature (like FHECounter)
      if (instance && highestBid && winner && ethersSigner) {
        try {
          setMessage(`Decrypting results...`);
          
          // Create FhevmDecryptionSignature
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [auction.address as `0x${string}`],
            ethersSigner,
            fhevmDecryptionSignatureStorage
          );

          if (!sig) {
            setMessage("Unable to build FHEVM decryption signature");
            return;
          }

          setMessage("Call FHEVM userDecrypt...");

          // Decrypt both handles
          const res = await instance.userDecrypt(
            [
              { handle: highestBid, contractAddress: auction.address },
              { handle: winner, contractAddress: auction.address }
            ],
            sig.privateKey,
            sig.publicKey,
            sig.signature,
            sig.contractAddresses,
            sig.userAddress,
            sig.startTimestamp,
            sig.durationDays
          );

          setMessage("FHEVM userDecrypt completed!");

          // Set decrypted results
          if (res[highestBid]) {
            setClearHighestBid({ handle: highestBid, clear: res[highestBid] });
            console.log("[useSealedAuctionFHE] Decrypted highest bid:", res[highestBid]);
          }
          
          if (res[winner]) {
            setClearWinner({ handle: winner, clear: res[winner] });
            console.log("[useSealedAuctionFHE] Decrypted winner:", res[winner]);
          }

          setMessage(`Results decrypted successfully!`);
        } catch (decryptError) {
          console.log("[useSealedAuctionFHE] Decryption failed:", decryptError);
          setMessage(`Results retrieved but decryption failed: ${decryptError}`);
        }
      } else {
        console.log("[useSealedAuctionFHE] Results retrieved (encrypted handles)");
        setMessage(`Results retrieved successfully (encrypted handles)`);
      }
    } catch (e) {
      setMessage(`Direct call failed: ${e}`);
      console.log("[useSealedAuctionFHE] Direct call error:", e);
    }
  }, [auction.address, auction.abi, ethersSigner, instance]);

  return {
    contractAddress: auction.address,
    canRefresh,
    canPlaceBid,
    canFinalize,
    placeBid,
    finalize,
    grantView,
    fixSellerPermission,
    getResultsDirectly,
    refreshState,
    message,
    state,
    highestBidHandle,
    winnerHandle,
    clearHighestBid,
    clearWinner,
    isRefreshing,
    isPlacingBid,
    isFinalizing,
    isDeployed
  };
};
