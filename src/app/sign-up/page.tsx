import Topbar from "@/components/ui/Topbar";
import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div>
      <Topbar />
      <div className="mt-8 flex justify-center">
        <SignUp path="/sign-up" />
      </div>
    </div>
  );
}
