"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

export default function ExpensesPage() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [editExp, setEditExp] = useState(false);
  const [addExpense, setAddExpense] = useState(false);
  const [exp, setExp] = useState<any>(null);
  const [expID, setExpID] = useState<number>(0);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const [descFilter, setDescFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");

  const [categories, setCategories] = useState<any[]>([]);

  const paymentOptions = [
    "Cash",
    "Card",
    "UPI",
    "Bank Transfer",
    "Credit Card",
    "Debit Card",
  ];

  // ---------------- FETCH EXPENSES ----------------
  const fetchExpenses = async () => {
    try {
      const res = await api.get("/expenses");
      setExpenses([...res.data]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SEARCH EXPENSES ----------------
  const searchExpenses = async () => {
    try {
      const res = await api.get("/expenses/search", {
        params: { query: search },
      });
      setExpenses([...res.data]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- FILTERS ----------------
  const applyFilters = async () => {
    try {
      const res = await api.get("/expenses/searchall", {
        params: {
          description: descFilter || undefined,
          category_name: catFilter || undefined,
          payment_method: paymentFilter || undefined,
        },
      });
      setExpenses([...res.data]);

    } catch (err) {
      console.error(err);
    }
  };

  const clearFilters = () => {
    setDescFilter("");
    setCatFilter("");
    setPaymentFilter("");
    fetchExpenses();
  };

  // ---------------- INITIAL LOAD ----------------
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const load = async () => {
      try {
        const res = await api.get("/categories");
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
    fetchExpenses();
  }, [token, router]);

  // ---------------- SEARCH DEBOUNCE ----------------
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search.trim() === "") fetchExpenses();
      else searchExpenses();
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl bg-cream">
        Loading Expenses...
      </div>
    );
  }

  return (
    <div className="p-8 bg-cream min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-forest">Expenses</h1>

        <button
          className="bg-forest text-white px-4 py-2 rounded"
          onClick={() => setAddExpense(true)}
        >
          Add Expense
        </button>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="bg-beige rounded shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <input
            type="text"
            placeholder="Search Expenses..."
            className="w-full p-2 border rounded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="bg-cream text-black px-4 py-2 rounded ml-4"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>
        </div>

        {showFilters && (
          <div className="bg-beige p-4 rounded shadow mt-4">
            <input
              placeholder="Description"
              value={descFilter}
              className="w-full p-2 border rounded mb-3"
              onChange={(e) => setDescFilter(e.target.value)}
            />

            <select
              className="w-full p-2 border rounded mb-3"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="" className="text-white">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              className="w-full p-2 border rounded mb-3"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="" className="text-white">All Payment Methods</option>
              {paymentOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex gap-3">
              <button
                className="bg-forest text-white px-4 py-2 rounded"
                onClick={applyFilters}
              >
                Apply Filters
              </button>

              <button
                className="bg-forest text-white px-4 py-2 rounded"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <table className="w-full rounded bg-olive">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 text-white">Description</th>
            <th className="py-2 text-white">Category</th>
            <th className="py-2 text-white">Amount</th>
            <th className="py-2 text-white">Payment</th>
            <th className="py-2 text-white">Date</th>
            <th className="py-2 text-white">Actions</th>
          </tr>
        </thead>

        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id} className="border-b">
              <td className="py-2 text-white">{exp.description}</td>
              <td className="text-white">{exp.category_id}</td>
              <td className="text-white">{exp.amount}</td>
              <td className="text-white">{exp.payment_method}</td>
              <td className="text-white">{exp.date ? new Date(exp.date).toLocaleDateString() : "—"}</td>

              <td className="flex gap-3 py-2">
                <button
                  className="bg-sandstone text-black px-3 py-1 rounded"
                  onClick={() => {
                    if (!exp) return;   
                    setEditExp(true);
                    setExpID(exp.id);
                    setExp({
                    category_id: exp.category_id,
                    amount: exp.amount,
                    currency: exp.currency,
                    date: exp.date,
                    description: exp.description,
                    payment_method: exp.payment_method
                    });

                  }}
                >
                  Edit
                </button>

                <button
                  className="bg-sandstone text-black px-3 py-1 rounded"
                  onClick={async () => {
                    await api.delete(`/expenses/${exp.id}`);
                    fetchExpenses();
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {expenses.length === 0 && (
        <div className="text-center py-6 text-gray-500">No expenses found</div>
      )}

      {/* EDIT MODAL */}
      <Modal open={editExp} onClose={() => setEditExp(false)}>
        <div className="bg-sage p-6 rounded shadow w-98">
          <h2 className="text-xl font-semibold mb-4 text-white">Edit Expense</h2>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const category_id = Number(
               (form.elements.namedItem("category_id") as HTMLInputElement).value
                );
              const amount = Number(
              (form.elements.namedItem("amount") as HTMLInputElement).value
              );
              const currency = (form.elements.namedItem("currency") as HTMLInputElement).value;
              const date = (form.elements.namedItem("date") as HTMLInputElement).value;
              const description = (
              form.elements.namedItem("description") as HTMLInputElement
              ).value;
              const payment_method = (form.elements.namedItem("payment_method") as HTMLInputElement)
              .value;
              if (!expID) {
              alert("Expense ID missing — cannot edit");
              return;
              }

              const payload = {
                category_id,
                amount,
                currency,
                date,
                description,
                payment_method
              };


              const res = await api.put(`/expenses/${expID}`, payload);
              if (res.status===200){
                alert("Expense has been updated");
                setEditExp(false);
                setExp(null);
                setExpID(0);
                fetchExpenses();

          }
          else{
              alert("Expense not updated, try later");
              setEditExp(false);
              setExp(null);
              setExpID(0);
              fetchExpenses();
          }

            }}
          >
            <input
              defaultValue={exp?.category_id || ""}
              name="category_id"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={exp?.amount || ""}
              name="amount"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={exp?.currency || ""}
              name="currency"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={exp?.date?.split("T")[0] || ""}
              name="date"
              className="w-full p-2 border rounded mb-3 text-white"
              type="date"
            />

            <input
              defaultValue={exp?.description || ""}
              name="description"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              defaultValue={exp?.payment_method || ""}
              name="payment_method"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <button type="submit" className="bg-olive text-white px-3 py-2 rounded">
              Save Changes
            </button>
          </form>
        </div>
      </Modal>

      {/* ADD MODAL */}
      <Modal open={addExpense} onClose={() => setAddExpense(false)}>
        <div className="bg-sage p-6 rounded shadow w-98">
          <h3 className="text-2xl font-semibold mb-4 text-white">Add Expense</h3>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;

              const category_id = Number(
               (form.elements.namedItem("category_id") as HTMLInputElement).value
                );
               const amount = Number(
                (form.elements.namedItem("amount") as HTMLInputElement).value
                );
                const currency = (form.elements.namedItem("currency") as HTMLInputElement).value;
                const date = (form.elements.namedItem("date") as HTMLInputElement).value;
                const description = (
                form.elements.namedItem("description") as HTMLInputElement
                ).value;
                 const payment = (form.elements.namedItem("payment") as HTMLInputElement)
                .value;

                const res = await api.post("/expenses", {
                  category_id,
                  amount,
                  currency,
                  date,
                  description,
                  payment_method: payment,
                  });

                if (res.status === 200) {
                setAddExpense(false);
                fetchExpenses();
                  }
                  }}
                    >

            <input
              placeholder="Category ID"
              name="category_id"
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
              placeholder="Currency"
              name="currency"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              placeholder="Date"
              name="date"
              className="w-full p-2 border rounded mb-3 text-white"
              type="date"
            />

            <input
              placeholder="Description"
              name="description"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <input
              placeholder="Payment Method"
              name="payment"
              className="w-full p-2 border rounded mb-3 text-white"
              type="text"
            />

            <button type="submit" className="bg-olive text-white px-3 py-2 rounded">
              Add Expense
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
