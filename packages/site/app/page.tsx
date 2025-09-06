import { FHECounterDemo } from "@/components/FHECounterDemo";
import SealedAuctionUI from "@/components/SealedAuctionUI";
import { SealedAuctionFHE } from "@/components/SealedAuctionFHE";

export default function Home() {
  return (
    <main className="">
      <div className="flex flex-col gap-8 items-center sm:items-start w-full px-3 md:px-0">
        <SealedAuctionFHE />
      </div>
    </main>
  );
}
