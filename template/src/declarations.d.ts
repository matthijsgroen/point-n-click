interface Window {
  webkitAudioContext: typeof AudioContext;
}

declare module "url:*" {
  const value: string;
  export default value;
}
