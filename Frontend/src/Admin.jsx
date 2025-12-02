import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:5000";

const Admin = () => {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("VERIFICATION_PENDING");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const navigate = useNavigate();

  const fetchTickets = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tickets/all-tickets`);
      setTickets(res.data);
    } catch (error) {
      if (error.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 2000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleChangePassword = async () => {
    const newPass = prompt("Enter New Password (min 6 chars):");
    if (!newPass) return;
    if (newPass.length < 6) return alert("Password too short");

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        newPassword: newPass,
      });
      if (res.data.success) alert("Password Changed Successfully!");
    } catch (e) {
      alert("Failed to change password");
    }
  };

  const handleStatus = async (ticketId, status) => {
    let reason = "";
    if (status === "REJECTED") {
      reason = prompt("Rejection Reason (Visible to user):");
      if (reason === null) return;
      if (!reason) reason = "Verification Failed";
    } else {
      if (!window.confirm("Approve this booking?")) return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/tickets/update-status`, {
        ticketId,
        status,
        reason,
      });
      fetchTickets();
    } catch (e) {
      alert("Action Failed");
    }
  };

  const filtered = tickets.filter((t) => {
    const matchStatus = filter === "ALL" ? true : t.paymentStatus === filter;
    const str = searchTerm.toLowerCase();
    const matchSearch =
      t.mainGuest.firstName.toLowerCase().includes(str) ||
      t.mainGuest.phone.includes(str) ||
      t.transactionId.includes(str) ||
      t.members.some((m) => m.name.toLowerCase().includes(str));

    return matchStatus && matchSearch && t.paymentStatus !== "INITIATED";
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-32 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-4 rounded-lg shadow-sm sticky top-20 z-30 border border-gray-200 mb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Event Dashboard</h1>
              <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide animate-pulse">
                ● Live
              </span>
            </div>
            <button
              onClick={handleChangePassword}
              className="text-[10px] border border-gray-300 hover:bg-black hover:text-white px-3 py-1 rounded font-bold uppercase transition"
            >
              Change Password
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {[
              {
                id: "VERIFICATION_PENDING",
                label: "Pending",
                bg: "bg-yellow-400",
                text: "text-yellow-900",
              },
              {
                id: "PAID",
                label: "Approved",
                bg: "bg-green-600",
                text: "text-white",
              },
              {
                id: "REJECTED",
                label: "Rejected",
                bg: "bg-red-600",
                text: "text-white",
              },
              {
                id: "ALL",
                label: "All Records",
                bg: "bg-gray-800",
                text: "text-white",
              },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`px-4 py-2 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
                  filter === btn.id
                    ? `${btn.bg} ${btn.text} shadow-md`
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {btn.label} (
                {
                  tickets.filter((t) =>
                    btn.id === "ALL"
                      ? t.paymentStatus !== "INITIATED"
                      : t.paymentStatus === btn.id
                  ).length
                }
                )
              </button>
            ))}
          </div>

          <input
            className="w-full mt-3 p-3 border border-gray-200 rounded bg-gray-50 text-sm focus:bg-white focus:border-black outline-none transition-all"
            placeholder="🔎 Search Name, Phone, or UTR..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Ticket List */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div
              key={t.ticketId}
              className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-base">
                    {t.mainGuest.firstName} {t.mainGuest.lastName}
                  </h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    {t.mainGuest.surname}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    t.paymentStatus === "PAID"
                      ? "bg-green-100 text-green-700"
                      : t.paymentStatus === "REJECTED"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {t.paymentStatus.replace("VERIFICATION_", "")}
                </span>
              </div>

              <div className="text-xs space-y-2 mb-4 flex-grow">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-400 text-[9px] uppercase">Phone</p>
                    <p className="font-mono font-bold">{t.mainGuest.phone}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-gray-400 text-[9px] uppercase">Email</p>
                    <p className="truncate">{t.mainGuest.email}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-blue-50 p-2 rounded border border-blue-100">
                  <div>
                    <p className="text-blue-400 text-[9px] uppercase font-bold">
                      UTR / Transaction ID
                    </p>
                    <p className="font-mono font-bold text-blue-900 text-sm">
                      {t.transactionId || "---"}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(t.transactionId)
                    }
                    className="text-[9px] bg-white px-2 py-1 rounded text-blue-600 border border-blue-200 uppercase font-bold"
                  >
                    Copy
                  </button>
                </div>

                <div className="flex justify-between pt-1">
                  <span>Amount Paid:</span>
                  <span className="font-bold text-lg">₹{t.totalAmount}</span>
                </div>
              </div>

              {/* Members Expand */}
              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === t.ticketId ? null : t.ticketId)
                  }
                  className="w-full text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-black flex justify-between items-center"
                >
                  {1 + t.members.length} Guests in Group{" "}
                  <span>{expandedId === t.ticketId ? "▲" : "▼"}</span>
                </button>

                {expandedId === t.ticketId && (
                  <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                    <div className="flex justify-between text-xs border-b border-gray-200 pb-1 mb-1">
                      <span className="font-bold">
                        1. {t.mainGuest.firstName}
                      </span>
                      <span className="text-gray-500">Main</span>
                    </div>
                    {t.members.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span>
                          {i + 2}. {m.name}
                        </span>
                        <span className="font-mono text-gray-400">
                          {m.phone}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason Display */}
              {t.paymentStatus === "REJECTED" && (
                <div className="mt-3 p-2 bg-red-50 text-red-700 text-xs rounded border border-red-100">
                  <strong>Note:</strong> {t.rejectionReason}
                </div>
              )}

              {/* Action Buttons */}
              {t.paymentStatus === "VERIFICATION_PENDING" && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => handleStatus(t.ticketId, "PAID")}
                    className="bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold text-xs uppercase tracking-widest transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatus(t.ticketId, "REJECTED")}
                    className="bg-white text-red-600 border border-red-200 hover:bg-red-50 py-3 rounded font-bold text-xs uppercase tracking-widest transition"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              No records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
