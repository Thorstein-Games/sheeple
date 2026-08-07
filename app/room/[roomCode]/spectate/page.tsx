import SpectatePageClient from "./SpectatePageClient";

export async function generateStaticParams() {
  return [{ roomCode: "_" }];
}

export default function SpectatePage() {
  return <SpectatePageClient />;
}
