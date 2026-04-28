"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

type Budget = {
  id: number;
  user_id: number;
  category_id: number;
  category_name: string;
  amount: number;
  start: string;
  till_date: string;
  progress?: {
    budget_id: number;
    amount: number;
    spent: number;
    remaining: number;
    percentage_used: number;
  };
};

export default function BudgetsPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const [addBudget, setAddBudget] = useState(false);
  const [editBud, setEditBud] = useState(false);

  const [bud, setBud] = useState<Budget | null>(null);
  const [budID, setBudID] = useState<number>(0);

  const [showActive, setShowActive] = useState(false);

  // ---------------- PROGRESS BAR ----------------
  const ProgressBar = ({ value }: { value: number }) => {
    const percent = Math.min(Math.max(value, 0), 100);

    let color = "bg-beige";
    if (percent > 90) color = "bg-forest";
    else if (percent > 60) color = "bg-sandstone";

    return (
      <div className="w-full bg-gray-200 rounded h-3">
        <div
          className={`${color} h-3 rounded`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    );
  };

  // ---------------- FETCH PROGRESS ----------------
  const fetchProgress = async (id: number) => {
    try {
      const res = await api.get(`/budgets/${id}/progress`);
      return res.data;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  // ---------------- FETCH ALL BUDGETS ----------------
  const fetchBudgets = async () => {
    try {
      const res = await api.get("/budgets");
      const data = res.data;

      const withProgress = await Promise.all(
        data.map(async (b: Budget) => {
          const p = await fetchProgress(b.id);
          return { ...b, progress: p };
        })
      );

      setBudgets(withProgress || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FETCH ACTIVE BUDGETS ----------------
  const activeBudgets = async () => {
    try {
      const res = await api.get("/budgets/active");
      const data = res.data;

      const withProgress = await Promise.all(
        data.map(async (b: Budget) => {
          const p = await fetchProgress(b.id);
          return { ...b, progress: p };
        })
      );

      setBudgets(withProgress || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (showActive) activeBudgets();
    else fetchBudgets();
  }, [token, router, showActive]);

  if (loading) {
    return (
      <div className="text-3xl font-bold p-8">
        Loading Budgets...
      </div>
    );
  }

  return (
    <div className="p-8 bg-cream min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-forest">Budgets</h1>

        <div className="flex gap-3">
          <button
            className="bg-forest text-white px-4 py-2 rounded"
            onClick={() => setAddBudget(true)}
          >
            Add Budget
          </button>

          <button
            className="bg-forest text-white px-4 py-2 rounded"
            onClick={() => setShowActive(!showActive)}
          >
            {showActive ? "Show All Budgets" : "Show Active Budgets"}
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-olive rounded">
      <table className="w-full ">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 text-white">Progress</th>
            <th className="py-2 text-white">Category ID</th>
            <th className="py-2 text-white">Category Name</th>
            <th className="py-2 text-white">Amount</th>
            <th className="py-2 text-white">Start</th>
            <th className="py-2 text-white">End</th>
            <th className="py-2 text-white">Actions</th>
          </tr>
        </thead>

        <tbody>
          {budgets.map((b) => (
            <tr key={b.id} className="border-b">
              <td className="py-2 w-48">
                {b.progress && b.progress.percentage_used != null && (
                  <div>
                    <ProgressBar value={b.progress.percentage_used} />

                    <div className="text-sm text-white mt-1">
                      Spent: ${b.progress.spent}/{b.progress.amount}
                    </div>

                    <div className="text-xs text-white">
                      Remaining: ${b.progress.remaining}
                    </div>
                  </div>
                )}
              </td>

              <td className="text-white">{b.category_id}</td>
              <td className="text-white">{b.category_name}</td>
              <td className="text-white">{b.amount}</td>
              <td className="text-white">{b.start ? new Date(b.start).toLocaleDateString() : "—"}</td>
              <td className="text-white">{b.till_date ? new Date(b.till_date).toLocaleDateString() : "—"}</td>

              <td className="flex gap-3 py-2">
                <button
                  className="bg-sandstone text-black px-3 py-1 rounded"
                  onClick={() => {
                    setEditBud(true);
                    setBudID(b.id);
                    setBud(b);
                  }}
                >
                  Edit
                </button>

                <button
                  className="bg-sandstone text-black px-3 py-1 rounded"
                  onClick={async () => {
                    await api.delete(`/budgets/${b.id}`);
                    fetchBudgets();
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {budgets.length === 0 && (
        <div className="text-center py-6 text-black">
          No budgets found
        </div>
      )}

      {/* EDIT MODAL */}
      <Modal open={editBud} onClose={() => setEditBud(false)}>
        <div className="bg-sage p-6 rounded shadow w-96">
          <h2 className="text-2xl font-semibold mb-4 text-white">Edit Budget</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const category_id = Number(
              (form.elements.namedItem("category_id") as HTMLInputElement).value
              );
              const category_name = (form.elements.namedItem("category_name") as HTMLInputElement).value;
              const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
              const start = (form.elements.namedItem("start") as HTMLInputElement).value;
              const till_date = (form.elements.namedItem("till_date") as HTMLInputElement).value;


              const payload = {
                category_id,
                category_name,
                amount,
                start,
                till_date

              };

              await api.put(`/budgets/${budID}`, payload);

              setEditBud(false);
              setBud(null);
              setBudID(0);
              fetchBudgets();
            }}
          >
            <input
              defaultValue={bud?.category_id || ""}
              name="category_id"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={bud?.category_name || ""}
              name="category_name"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={bud?.amount || ""}
              name="amount"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={bud?.start?.split("T")[0] || ""}
              name="start"
              className="w-full p-2 border rounded mb-3 text-white"
              type="date"
            />

            <input
              defaultValue={bud?.till_date?.split("T")[0] || ""}
              name="till_date"
              className="w-full p-2 border rounded mb-3 text-white"
              type="date"
            />

            <button
              type="submit"
              className="bg-olive text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </form>
        </div>
      </Modal>

      {/* ADD MODAL */}
      <Modal open={addBudget} onClose={() => setAddBudget(false)}>
        <div className="bg-sage p-6 rounded shadow w-96">
          <h3 className="text-2xl font-semibold mb-4 text-white">Add Budget</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const category_id = Number(
              (form.elements.namedItem("category_id") as HTMLInputElement).value
              );
              const category_name = (form.elements.namedItem("category_name") as HTMLInputElement).value;
              const amount = Number((form.elements.namedItem("amount") as HTMLInputElement).value);
              const start = (form.elements.namedItem("start") as HTMLInputElement).value;
              const till_date = (form.elements.namedItem("till_date") as HTMLInputElement).value;


              const payload = {
                category_id,
                category_name,
                amount,
                start,
                till_date,
              };

              await api.post("/budgets", payload);

              setAddBudget(false);
              fetchBudgets();
            }}
          >
            <input
              placeholder="Category ID"
              name="category_id"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              placeholder="Category Name"
              name="category_name"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              placeholder="Amount"
              name="amount"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              placeholder="Start Date"
              name="start"
              className="w-full p-2 border rounded mb-3 text-white"
              type="date"
            />

            <input
              placeholder="End Date"
              name="till_date"
              className="w-full p-2 border rounded mb-3 text-white" 
              type="date"
            />

            <button
              type="submit"
              className="bg-olive text-white px-4 py-2 rounded"
            >
              Add Budget
            </button>
          </form>
        </div>
      </Modal>
    </div>
    </div>
  );
}
