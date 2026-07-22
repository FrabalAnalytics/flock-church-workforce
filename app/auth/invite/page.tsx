import { InviteAcceptance } from "@/components/invite-acceptance";

export const metadata = {
  title: "Accept invitation",
  description: "Accept a secure Flock workspace invitation.",
  robots: { index: false, follow: false },
};

export default function InvitePage() {
  return <InviteAcceptance />;
}
