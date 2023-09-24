export function delay(delayInMs: number) {
  return new Promise((resolve) => setTimeout(resolve, delayInMs));
}
