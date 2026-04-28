"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [totalSpend, setTotalSpend] = useState<number | null>(0);
  const [recent, setRecent] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlySpend, setMonthlySpend] = useState<number | null>(0);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      delete api.defaults.params;

      try {
        const c = await api.get("/analytics/summary",{params:null});
        const m = await api.get("/analytics/monthly",{params:null});
        const r = await api.get("/expenses/recent",{params:null});
        const b = await api.get("/budgets/active",{params:null}); //fixed
        

        setTotalSpend(c.data.total_spent);
        setBreakdown([...c.data.breakdown]);
        setMonthlySpend(m.data.expense);//fixed
        setRecent([...r.data]);
        setBudgets([...b.data]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);

  }, [token, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl">
        Loading Dashboard..
      </div>
    );
  }

  return (
    <div className="p-8 bg-cream min-h-screen">
      <div className="items-center justify-center">
        <h1 className="text-3xl font-bold mb-6 text-forest underline"> SpendWise - moneytracker</h1>
      </div>
      <h2 className="text-2xl font-semibold mb-6 text-forest">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-6 bg-olive rounded shadow">
          <h3 className="text-lg font-semibold text-white">Total Spending</h3>
          <p className="text-xl font-bold mt-2 text-white">£{totalSpend}</p>
        </div>

        <div className="p-6 bg-olive rounded shadow">
          <h3 className="text-lg font-semibold text-white">Monthly Spending</h3>
          <p className="text-xl font-bold mt-2 text-white">£{monthlySpend}</p>
        </div>

        {/* Category breakdown */}
        <div className="p-6 bg-olive rounded shadow mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Category Breakdown</h3>
          <ul>
            {breakdown.map((b) => (
              <li key={b.category_id} className="flex justify-between py-2">
                <span className="text-white">{b.category_name}</span>
                <span className="font-semibold text-white">£{b.total}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Budgets */}
        <div className="p-6 bg-olive rounded shadow mb-6">
          <h3 className="text-lg font-semibold mb-4 text-white">Active Budgets</h3>
          <ul>
            {budgets.map((bud) => (
              <li key={bud.id} className="flex justify-between py-2">
                <span className="text-white">{bud.category_name}</span>
                <span className="font-semibold text-white">£{bud.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      


        {/* Recent expenses */}
        <div className="mt-6 bg-olive p-12 rounded shadow w-full">
          <h3 className="text-xl font-semibold mb-4 text-white">Recent Expenses</h3>
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 text-white">Description</th>
                <th className="py-2 text-white">Category</th>
                <th className="py-2 text-white">Amount</th>
                <th className="py-2 text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="py-2 text-white">{r.description}</td>
                  <td className="text-white">{r.category_name}</td>
                  <td className="text-white">${r.amount}</td>
                  <td className="text-white">{r.date ? new Date(r.date).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
  );
}
