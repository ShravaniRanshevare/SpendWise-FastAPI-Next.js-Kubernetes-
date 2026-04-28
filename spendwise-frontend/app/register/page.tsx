"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useAuthStore} from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function Register(){

	const [ email,setEmail] = useState("");
	const [ password, setPassword ] = useState("");
	const setToken = useAuthStore((s) => s.setToken);
	const router = useRouter();
	

	const handleRegister = async () => {
  try {
    const res = await api.post("/auth/register", {
      email,
      password,
    });

    console.log("REGISTER SUCCESS:", res.data);

    alert("User registered, you may log in!");
    router.push("/login");
  } catch (err: any) {
    console.error("REGISTER ERROR:", err.response?.data || err);
    alert("Registration failed");
  }
};




	return (

		<div className="flex items-center justify-center bg-cream w-full h-screen">
			<div className=" p-6 bg-sage rounded shadow w-80">
				<h2 className="text-3xl font-bold mb-6 text-white"> Register </h2>
				<input placeholder ="Enter Email" type = "text" 
					className="w-full border rounded p-2 mb-3 bg-white text-black"
					value={email}
					onChange={(e)=>{setEmail(e.target.value)}} required/> 
				<input placeholder="Enter Password" type="password"
					className="w-full border rounded p-2 mb-3 bg-white text-black"	
					value={password}
					onChange={(e)=> setPassword(e.target.value)} required/>
				<button 
					className="w-full bg-cream text-black rounded py-2"
					onClick={handleRegister}> Register </button>

				<p className="text-sm mt-3 text-center text-white"> Already have an account?{" "}
					<a href ="/login" className="text-white underline">
						Login </a>
				</p>

			</div>
		</div>


		);


}