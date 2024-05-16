import Topbar from "@/components/ui/Topbar";
import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div>
      <Topbar />
      <div className="mt-8 flex justify-center">
        <SignIn path="/sign-in" />
      </div>
    </div>
  );
}
