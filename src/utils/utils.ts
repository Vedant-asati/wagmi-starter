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
export function handleGenerateImage(prompt: string) {
    console.log(prompt);
  }
  