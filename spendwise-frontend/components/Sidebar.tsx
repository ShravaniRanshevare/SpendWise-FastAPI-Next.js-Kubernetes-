"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar(){
	const path = usePathname();

	const linkClass = (href: string) =>
	`block px-4 py-2 rounded mb-2 ${path===href ? "bg-sandstone text-black": 
	"bg-beige text-black"}`;

	return (
		<div className="w-64 h-screen bg-forest shadow p-10">
			<h2 className="text-2xl font-bold mb-6 text-white"> Spendwise </h2>

			<Link href="/dashboard" className={linkClass("/dashboard")}>
			Dashboard </Link>

			<Link href="/expenses" className={linkClass("/expenses")}>
			Expenses </Link>

			<Link href="/budgets" className={linkClass("/budgets")}>
			Budgets </Link>

			<Link href="/categories" className={linkClass("/categories")}>
			Categories </Link>

		</div>

		);
}