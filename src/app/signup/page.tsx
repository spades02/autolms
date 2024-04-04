import { SignupForm } from '@/components/ui/SignupForm'
import React from 'react'
import Topbar from '@/components/ui/Topbar';
import Sidebar from '@/components/ui/Sidebar';

export default function Signup() {
  return (
    <div>
      <Topbar />
      <div className="flex flex-row">
        <Sidebar/>
        <div className="flex flex-col mt-2 grow h-screen">
          <div className="pt-16 px-60">
            <h2 className="scroll-m-20 border-b pb-2 mb-2 text-3xl font-semibold tracking-tight first:mt-0">
              Sign up with email
            </h2>
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
