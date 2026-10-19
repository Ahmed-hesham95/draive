import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/Input";
import { UserIcon, MailIcon , LockIcon } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useApp } from "../context/AppContext";

const Login = ({ mode = "login" }) => {
  const isRegister = mode === "register";
  const navigate = useNavigate();
  const {login, register} = useApp();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const updateField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const ok = isRegister ? await register(form.name, form.email, form.password) : 
    await login(form.email, form.password);
    setIsLoading(false);
    if(ok) navigate("/");
  }


  return (
    <div className="min-h-screen text-zinc-900 flex flex-col md:flex-row">
      {/* Left Hero Brand Panel */}
      <div
        className="md:w-1/2 p-8 md:p-12 lg:p-16 bg-linear-to-br from-orange-50
      via-zinc-100 justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 bd-[url('/pattern.svg')]"></div>
        <div className="z-10 relative flex items-center gap-3">
          <img src="/logo.svg" alt="" className="max-h-9" />
          <span className="text-4xl font-medium uppercase text-zinc-900">
            Drive
          </span>
        </div>
        <div className="z-10 relative my-12 space-y-6">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl tracking-tight
          text-zinc-900 leading-tight"
          >
            Secure, Simple & Fast <br />
            <span className="text-orange-600">Cloud Storage.</span>{" "}
          </h2>
          <p className="text-sm md:text-base text-zinc-600 max-w-md leading-relaxed">
            Store your files securely in our drive, organize into folders, share
            with permissions and access anywhere.
          </p>
        </div>
        <div className="z-10 relative text-sm text-zinc-500">
          © 2026 Ahmed Fox. All rights reserved.
        </div>
      </div>
      {/* Right Form Panel */}
      <div className="md:w-1/2 p-8 md:p-12 lg:p-16 flex items-center justify-center bg-white">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          <div className="">
            <h3 className="text-2xl font-medium text-zinc-900">
              {isRegister ? "Create an account" : "Welcome back!"}
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              {isRegister
                ? "Enter your details below to get started with 1 GB free storage."
                : "Enter your credentials to access your Drive."}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
                {isRegister && (
                  <Input 
                  label="Full name"
                  icon={UserIcon}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                  />
                )}
                <Input 
                  label="Email address"
                  type="email"
                  icon={MailIcon}
                  placeholder="Enter your email address"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                  />
                  <Input 
                    label="Password"
                    type="password"
                    icon={LockIcon}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                    />
                    <Button type="submit" variant="primary" isLoading={isLoading} className="w-full py-3">
                        <span className="font-medium text-base">
                            {isRegister ? "Create Account" : "Sign in to Drive"}
                        </span>
                    </Button>
          </form>
          <div className="text-center pt-2">
            {isRegister ? (
              <p className="text-xs text-zinc-500">
                Already have an account?{" "}
                <Link to="/login" className="text-orange-600 font-semibold
                hover:underline">
                sign in here
                </Link>
              </p>
            ) : (
              <p className="text-xs text-zinc-500">
                Don't have an account?{" "}
                <Link to="/register" className="text-orange-600 font-semibold
                hover:underline">
                create one here
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
