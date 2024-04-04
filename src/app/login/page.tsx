import LoginForm from '@/components/ui/LoginForm';
import Sidebar from '@/components/ui/Sidebar';
import Topbar from '@/components/ui/Topbar'
import React from 'react'

export default function Login() {
  return (
    <div className='h-4/5'>
      <Topbar />
      <div className="flex flex-row">
        <Sidebar />
        <div className="flex flex-col mt-2 grow h-screen">
          <div className="pt-16 px-60">
            <h2 className="scroll-m-20 border-b pb-2 mb-2 text-3xl font-semibold tracking-tight first:mt-0">
              Login with your account
            </h2>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
