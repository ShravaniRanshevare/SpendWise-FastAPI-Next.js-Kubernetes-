"use client"

import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const setToken = useAuthStore((s) => s.setToken);
	const router = useRouter();

	const handleLogin = async () => {
		const res = await api.post("/auth/login", { 
			
				email: email, 
				password: password }
				);
		setToken(res.data.access_token);
		router.push("/dashboard");

	};


	return (
		<div className=" flex items-center justify-center h-screen bg-cream">
			<div className=" p-6 bg-sage rounded shadow w-80">
				<h1 className= "text-xl font-bold mb-4 text-white"> Login </h1>

				<input className="w-full p-2 border rounded mb-3 bg-white text-black" placeholder=" Email " 
					value={email}
					type="text"
				 	onChange={(e)=> setEmail(e.target.value)}

				 />
				 <input className="w-full p-2 border rounded mb-3 bg-white text-black" placeholder=" Password"
				 	type="password"
				 	value={password}
				 	onChange={(e)=> setPassword(e.target.value)}
				 />
				 <button onClick={handleLogin} className="w-full bg-cream text-black p-2 rounded">
				 	Login </button>

				 <p className="text-sm mt-3 text-center text-white">
				 	Don't have an account?{" "}
				 	<a href="/register" className="text-white-600 underline"> Register </a>
				 </p>
			</div>
		</div>
	);


}