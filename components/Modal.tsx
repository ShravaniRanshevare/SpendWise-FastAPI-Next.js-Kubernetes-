"use client";

import React from "react";

export default function Modal({
	open,onClose,children,
}: { open: boolean; onClose: ()=> void ; children: React.ReactNode;}){
	if (!open) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
			<div className="bg-cream rounded shadow-lg p-6 relative w-[90%] max-w-lg">
				<button className="absolute top-2 right-2 text-gray-600 hover:text-black"
					onClick={onClose}> x </button>
					{children}
			</div>
		</div>

		);
}