"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({ email: z.string().email(), password: z.string().min(8), fullName: z.string().min(2).optional() });
type Values = z.infer<typeof schema>;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", fullName: "" } });

  async function submit(values: Values) {
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "register") {
        const domain = process.env.NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN;
        if (domain && !values.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) throw new Error(`Use your @${domain} university email.`);
        const { error } = await supabase.auth.signUp({ email: values.email, password: values.password, options: { data: { full_name: values.fullName } } });
        if (error) throw error;
        setMessage("Check your university email to verify the account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
        if (error) throw error;
        const requested = new URLSearchParams(window.location.search).get("next");
        const destination = requested && requested.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard";
        router.push(destination);
        router.refresh();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    }
  }

  return <form className="card mx-auto max-w-md p-7" onSubmit={form.handleSubmit(submit)}>
    <h1 className="text-2xl font-black">{mode === "login" ? "Welcome back" : "Create university account"}</h1>
    <p className="mt-2 text-sm muted">{mode === "login" ? "Access your reports, matches and claims." : "Registration requires a verified university email."}</p>
    {mode === "register" && <label className="mt-6 block"><span className="label">Full name</span><input className="input" autoComplete="name" {...form.register("fullName")} /></label>}
    <label className="mt-5 block"><span className="label">University email</span><input className="input" type="email" autoComplete="email" {...form.register("email")} /><small className="text-red-600">{form.formState.errors.email?.message}</small></label>
    <label className="mt-5 block"><span className="label">Password</span><input className="input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...form.register("password")} /><small className="text-red-600">{form.formState.errors.password?.message}</small></label>
    {mode === "login" && <Link className="mt-3 block text-right text-sm font-semibold text-blue-600" href="/forgot-password">Forgot password?</Link>}
    {message && <p role="status" className="mt-4 rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">{message}</p>}
    <button className="btn-primary mt-6 w-full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? "Please wait…" : mode === "login" ? "Log in" : "Register"}</button>
    <p className="mt-5 text-center text-sm muted">{mode === "login" ? <>New here? <Link className="font-bold text-blue-600" href="/register">Create an account</Link></> : <>Already registered? <Link className="font-bold text-blue-600" href="/login">Log in</Link></>}</p>
  </form>;
}
