import { ethers } from "ethers";
/**
 * Converts a date string to seconds since the Unix epoch.
 * @param dateString - The date string in the format "YYYY-MM-DD".
 * @returns The number of seconds since the Unix epoch.
 */
export function dateToSeconds(dateString: string): number {
  const date = new Date(dateString);
  return Math.floor(date.getTime() / 1000);
}
// TODO: Handle galadriel interacion with ethers using set envs

/**
* Generates AI image.
* @param dateString - The date string in the format "YYYY-MM-DD".
* @returns The number of seconds since the Unix epoch.
*/
export async function generateImage(prompt: string | null) {
  console.log(prompt);

  // Environment variables
  const contractAddress = process.env.NEXT_PUBLIC_QUICKSTART_CONTRACT_ADDRESS!;
  const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY_GALADRIEL!;

  // Set up provider and signer
  const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_GALADRIEL_RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Contract ABI
  const contractABI = [
    "function initializeDalleCall(string memory message) public returns (uint)",
    "function lastResponse() public view returns (string)"
  ];

  // Create a contract instance
  const contract = new ethers.Contract(contractAddress, contractABI, wallet);

  try {
    // Send transaction
    const transactionResponse = await contract.initializeDalleCall(prompt);
    const receipt = await transactionResponse.wait();
    console.log(`Txn: https://explorer.galadriel.com/tx/${receipt.hash}`);
    console.log(`Image generation started`);

    // Polling for response
    let lastResponse = await contract.lastResponse();
    let newResponse = lastResponse;

    console.log("Waiting for response: ");
    while (newResponse === lastResponse) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      newResponse = await contract.lastResponse();
      console.log("...");
    }

    console.log(`Image generated with URL: ${newResponse}`);
    return newResponse;
  } catch (error) {
    console.error("Error generating image:", error);
  }
}

// Utility function to convert URL to File object
export async function urlToFile(url: string): Promise<File> {
  const response = await fetch(`/api/ai-image/${url.split('/').pop()}`);
  const data = await response.blob();
  const filename = url.split('/').pop() || 'ai-generated-image.png';
  return new File([data], filename, { type: 'image/png' });
}