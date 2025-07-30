import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useLoginUserMutation,
  useRegisterUserMutation,
} from "@/features/api/authApi";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Login = () => {
  const [signupInput, setSignupInput] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });
  const [activeTab, setActiveTab] = useState("login");

  const [
    registerUser,
    {
      data: registerData,
      error: registerError,
      isLoading: registerIsLoading,
      isSuccess: registerIsSuccess,
    },
  ] = useRegisterUserMutation();
  const [
    loginUser,
    {
      data: loginData,
      error: loginError,
      isLoading: loginIsLoading,
      isSuccess: loginIsSuccess,
    },
  ] = useLoginUserMutation();
  const navigate = useNavigate();

  const changeInputHandler = (e, type) => {
    const { name, value } = e.target;
    if (type === "signup") {
      setSignupInput({ ...signupInput, [name]: value });
    } else {
      setLoginInput({ ...loginInput, [name]: value });
    }
  };

  const handleRegistration = async (type) => {
    const inputData = type === "signup" ? signupInput : loginInput;
    const action = type === "signup" ? registerUser : loginUser;
    await action(inputData);
  };

  useEffect(() => {
    if (registerIsSuccess && registerData) {
      toast.success(registerData?.message || "Signup successful.");
      setActiveTab("login");
    }
    if (registerError) {
      toast.error(
        registerError?.data?.message ||
        registerError?.error ||
        "Signup Failed"
      );
    }
    if (loginIsSuccess && loginData) {
      toast.success(loginData?.message || "Login successful.");
      navigate("/");
    }
    if (loginError) {
      toast.error(
        loginError?.data?.message ||
        loginError?.error ||
        "Login Failed"
      );
    }
  }, [
    loginIsLoading,
    registerIsLoading,
    loginData,
    registerData,
    loginError,
    registerError,
  ]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Please enter your details</h1>
        </div>
        
        <Tabs value={activeTab} className="bg-white rounded-lg shadow-lg overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-gray-50">
            <TabsTrigger 
              value="signup" 
              className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:bg-slate-100"
              onClick={() => setActiveTab("signup")}
            >
              Signup
            </TabsTrigger>
            <TabsTrigger 
              value="login" 
              className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:bg-slate-100"
              onClick={() => setActiveTab("login")}
            >
              Login
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signup">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">Create Account</CardTitle>
                <CardDescription className="text-gray-500">
                  Join our community today
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRegistration("signup");
              }}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700">Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      value={signupInput.name}
                      onChange={(e) => changeInputHandler(e, "signup")}
                      placeholder="John Doe"
                      required
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={signupInput.email}
                      onChange={(e) => changeInputHandler(e, "signup")}
                      placeholder="john@example.com"
                      required
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        name="password"
                        value={signupInput.password}
                        onChange={(e) => changeInputHandler(e, "signup")}
                        placeholder="••••••••"
                        required
                        className="focus-visible:ring-blue-500 pr-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      At least 8 characters with a number
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={registerIsLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {registerIsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>
                  <p className="text-center text-sm text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("login")}
                      className="text-blue-600 hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="login">
            <Card className="border-0 shadow-none">
              <CardHeader>
                <CardTitle className="text-xl">Welcome Back</CardTitle>
                <CardDescription className="text-gray-500">
                  Enter your credentials to login
                </CardDescription>
              </CardHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleRegistration("login");
              }}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input
                      type="email"
                      name="email"
                      value={loginInput.email}
                      onChange={(e) => changeInputHandler(e, "login")}
                      placeholder="john@example.com"
                      required
                      className="focus-visible:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                    <div className="relative">
                      <Input
                        type="password"
                        name="password"
                        value={loginInput.password}
                        onChange={(e) => changeInputHandler(e, "login")}
                        placeholder="••••••••"
                        required
                        className="focus-visible:ring-blue-500 pr-10"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={loginIsLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loginIsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                  <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-blue-600 hover:underline"
                    >
                      Sign up
                    </button>
                  </p>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
