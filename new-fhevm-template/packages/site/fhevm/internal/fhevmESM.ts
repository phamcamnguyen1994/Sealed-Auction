export async function createFhevmInstanceESM(
  providerOrUrl: any,
  abortSignal?: AbortSignal
): Promise<{ instance: any; aclAddress: `0x${string}` }> {
  // Try ESM import first, fallback to UMD if not available
  let initSDK: any, createInstance: any, SepoliaConfig: any;

  try {
    const sdk = await import('@zama-fhe/relayer-sdk/web');
    initSDK = sdk.initSDK;
    createInstance = sdk.createInstance;
    SepoliaConfig = sdk.SepoliaConfig;
    console.log('Using ESM import');
  } catch (error) {
    console.log('ESM import failed, using UMD fallback:', error);
    // Fallback to UMD
    const window = globalThis as any;
    if (!window.relayerSDK) {
      throw new Error('Relayer SDK not available');
    }
    initSDK = window.relayerSDK.initSDK;
    createInstance = window.relayerSDK.createInstance;
    SepoliaConfig = window.relayerSDK.SepoliaConfig;
    console.log('Using UMD fallback');
  }

  // Initialize SDK
  await initSDK();
  
  // Create instance with Sepolia config
  const config = {
    ...SepoliaConfig,
    network: providerOrUrl,
  };
  
  const instance = await createInstance(config);
  
  // Debug: Check instance config
  console.log('FHEVM cfg:', config);
  console.log('ACL Address:', SepoliaConfig.aclContractAddress);
  
  return { instance, aclAddress: SepoliaConfig.aclContractAddress as `0x${string}` };
}
