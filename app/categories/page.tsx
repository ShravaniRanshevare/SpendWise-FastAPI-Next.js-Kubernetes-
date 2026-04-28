"use client";

import {useState,useEffect} from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import  Modal from "@/components/Modal";


type Category = {
	id: number;
	user_id:number;
	name:string;
	created_at: string;
}

export default function CategoryPage(){
	const token = useAuthStore((s)=> s.token);
	const router = useRouter();
	const [loading ,setLoading] = useState(true);
	const [categories,setCategories] = useState<any[]>([]);
	const [cat,setCat] = useState<any>(null);
	const [editCategory,setEditCategory] = useState(false);
	const [addCategory,setAddCategory] = useState(false);
	const [merge,setMerge] = useState(false);
	const [source,setSource] = useState<number>(0);
	const [target,setTarget] = useState<number>(0);


	const fetchCategories = async()=>{
		try{
			const res = await api.get("/categories");
			setCategories(res.data|| []);
		}
		catch(err){
			console.error(err);
		}finally{
			setLoading(false);
		}

	};

	useEffect(()=> {
		if (!token){
			router.push("/login");
			return;
		}
		fetchCategories();
	},[token,router]);


if (loading){
	return (
		<div className="text-3xl font-bold mb-6">
			Loading...
		</div>
		);

}
return (

<div className="p-8 bg-cream min-h-screen"> 
<div className="flex items-center justify-between mb-6">
	<h1 className="text-3xl font-bold mb-6 text-forest"> Categories </h1>
	<div className="flex justify-between items-center">
	<button className="bg-forest px-4 py-2 text-white border rounded"
		onClick={()=> setAddCategory(true)}> Add Category </button>
	<button className="bg-forest text-white px-4 py-2 border rounded"
		onClick={()=> setMerge(true)}> Merge Categories </button>
	</div>
	</div>
	<table className="w-full bg-olive rounded">
		<thead>
			<tr className="border-b text-left">
				<th className="py-2 text-white"> ID </th>
				<th className="py-2 text-white"> Name </th>
				<th className="py-2 text-white"> Created At </th>
				<th className="py-2 text-white">Actions</th>
			</tr>
		</thead>
		<tbody >
			{categories?.map((c)=>(
				<tr key={c.id} className="border-b">
					<td className="text-white"> {c.id} </td>
					<td className="text-white"> {c.name} </td>
					<td className="text-white"> {new Date(c.created_at).toLocaleDateString()}</td>
					<td className="flex gap-3 py-2">
					<button className="bg-sandstone text-black px-3 py-1 rounded"
						onClick={()=> {setEditCategory(true); setCat(c);}}>
						Edit Category </button>
					<button className="bg-sandstone text-black px-3 py-1 rounded"
						onClick={ async()=> {
							const res = await api.delete(`/categories/${c.id}`);
							if (res.status === 200){
								alert("Category deleted");
								fetchCategories();
							}
							else{
								alert("Could no delete category");
								fetchCategories();
							}
						}}> Delete Category </button>
					</td>
				</tr>

				))}
		</tbody>
	</table>
	<Modal open={editCategory} onClose={()=>setEditCategory(false)}>
		<div className="bg-sage p-8 border shadow w-96">
			<h2 className="text-3xl font-bold mb-6 text-white"> Edit Category </h2>
			<form onSubmit={ async(e)=>{
				e.preventDefault();
					const form = e.target as HTMLFormElement;
					const cat_name= ((form.elements.namedItem("name") as HTMLInputElement).value);

					const res = await api.put(`/categories/${cat.id}`,{
						
						name: cat_name,
					});
					if (res.status===200){
						alert("Category has been updated");
						setEditCategory(false);
						setCat(null);
						fetchCategories();

					}
					else{
						alert("Category not updated, try later");
						setEditCategory(false);
						setCat(null);
						fetchCategories();
					}

				}} >

				<input defaultValue={cat ?.name|| ""} 
					name="name" className="w-full p-2 border rounded mb-3 text-white" type="text" required/>
				<button type="submit" className="w-full px-4 py-2 rounded bg-olive text-white">
					Edit Category </button>
			</form>
		</div>
	</Modal>
	<Modal open={addCategory} onClose={()=>setAddCategory(false)}>
		<div className="bg-sage p-8 border shadow rounded w-96">
			<h3 className="text-3xl font-bold mb-6 text-white"> Add Category </h3>
			<form onSubmit={ async(e)=>{
				e.preventDefault();
					const form = e.target as HTMLFormElement;
					const cat_name= ((form.elements.namedItem("name") as HTMLInputElement).value);
					


					const res = await api.post(`/categories/`,{
						
						name: cat_name,
						
					});
					if (res.status===200){
						alert("Category has been added");
						setAddCategory(false);
						fetchCategories();

					}
					else{
						alert("Trouble adding category, try later");
						setAddCategory(false);
						fetchCategories();
					}

				}} >

				<input placeholder="Enter Category Name"
					name="name" className="w-full p-2 border rounded mb-3 text-white" type="text" required/>
				<button type="submit" className="w-full px-4 py-2 rounded bg-olive text-white">
					Add Category </button>
			</form>
		</div>
	</Modal>
	<Modal open={merge} onClose={()=>setMerge(false)}>
		<div className="bg-sage border shadow rounded w-115">
			<h4 className="text-2xl font-bold mb-6 text-white"> Merge Categories </h4>
			<p className="text-lg font-semibold mb-4 text-white"> Source Category Dropdown </p>
			<select
				className="w-full p-2 border rounded mb-3"
				value={source}
				onChange={(e)=> setSource(Number((e.target.value)))}>
			<option value="" className="text-white">Select Category</option>
			{categories?.map((c)=>(
				<option key={c.id} value={c.id}> {c.name} </option>

			))}
		</select>
			<p className="text-lg font-semibold mb-4 text-white"> Target Category Dropdown </p>
			<select
				className="w-full p-2 border rounded mb-3"
				value={target}
				onChange={(e)=> setTarget(Number((e.target.value)))}>
				<option value="" className="text-white">Select Category</option>
			{categories?.filter((c)=> c.id !== Number(source))
				.map((c)=>(
				<option key={c.id} value={c.id}> {c.name} </option>

			))}
		</select>
			<button className="bg-olive px-4 py-2 rounded text-white"
				onClick={async()=>{
					if (!source || !target) {
            		alert("Please select both categories");
            		return;
          			}
					const res = await api.post("/categories/merge",
						{ 
							source_id:Number(source),
							target_id:Number(target),
						});
					if (res.status===200){
						alert("Categories have been merged!");
						setMerge(false);
						fetchCategories();
					}
					else{
						alert("Try again later");
						setMerge(false);
						fetchCategories();
					}
				}}> Merge </button>
		</div>
	</Modal>
</div>


	);




}