'use client'

import Input from "@/components/input";
import Button from "@/components/button";
import SocialLogin from "@/components/social-login";
import { CreateAccount } from "./actions";
import { useActionState } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";


export default function Home() {
  const [state,dispatch] = useActionState(CreateAccount, null);
  return (
    <div className="flex flex-col gap-10 py-8 px-6">
        <div className="flex flex-col gap-2 font-medium">
            <h1 className="text-2xl">안녕하세요!</h1>
            <h2 className="text-xl">Fill in the form below to join!</h2>
        </div>

        <form action={dispatch} className="flex flex-col gap-3">
          <Input name="username" type="text" placeholder="Username" required={true} errors={state?.fieldErrors.username} minLength={3} maxLength={10}/>
          <Input name="email" type="email" placeholder="Email" required={true} errors={state?.fieldErrors.email}/>
          <Input name="password" type="password" placeholder="Password" required={true} errors={state?.fieldErrors.password} minLength={PASSWORD_MIN_LENGTH} maxLength={12}/>
          <Input name="passwordConfirm" type="password" placeholder="Confirm Password" required={true} errors={state?.fieldErrors.passwordConfirm} minLength={PASSWORD_MIN_LENGTH} maxLength={12}/>
            <Button text="Create account"/>
        </form>
        <SocialLogin/>

    </div>
  );
}