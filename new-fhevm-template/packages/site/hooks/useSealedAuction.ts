import { useMemo } from "react";
import { ethers } from "ethers";
import artifact from "../contracts/SealedAuction.json";

type SealedAuctionArtifact = {
	name: string;
	address: string;
	chainId: number;
	abi: any[];
};

export function useSealedAuction(provider: ethers.BrowserProvider | null) {
	const { address, abi } = artifact as SealedAuctionArtifact;
	return useMemo(() => {
		if (!provider || !address) return null;
		return new ethers.Contract(address, abi, provider);
	}, [provider, address]);
}


