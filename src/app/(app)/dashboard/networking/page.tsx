import { Network } from "lucide-react";
import { PlaceholderScreen } from "@/components/shared/PlaceholderScreen";

/*
 * NetworkingPage
 * Networking surface — in beta, not yet functional.
 */
export default function NetworkingPage() {
  return (
    <PlaceholderScreen
      icon={Network}
      tag="beta"
      title="Networking"
      description="Connect with people at companies you're applying to. Currently in beta."
    />
  );
}
