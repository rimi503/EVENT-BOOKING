import React, { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

const Scanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    const onScanSuccess = async (decodedText) => {
      scanner.clear();
      setScanResult(decodedText);

      try {
        // Backend ko call karo
        const res = await axios.post(
          "http://localhost:5000/api/tickets/verify",
          { ticketId: decodedText }
        );

        if (res.data.success) {
          // Success: Poora Data set karo (Backend se jo "data" object aaya)
          setStatus({
            type: "success",
            msg: res.data.message,
            details: res.data.data, // { name, members, totalPax }
          });
        } else {
          // Error: Fake ticket / Unpaid
          setStatus({
            type: "error",
            msg: res.data.message || "Invalid Ticket",
          });
        }
      } catch (error) {
        const errorMsg = error.response
          ? error.response.data.message
          : "Server Error";
        setStatus({ type: "error", msg: errorMsg });
      }
    };

    scanner.render(onScanSuccess, (err) => console.log(err));

    return () => {
      scanner.clear().catch((err) => console.error(err));
    };
  }, []);

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        📷 Gate Scanner
      </h2>

      <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
        {!scanResult ? (
          <div
            id="reader"
            className="overflow-hidden rounded-xl bg-gray-100"
          ></div>
        ) : (
          // Result Box
          <div
            className={`text-center p-6 rounded-xl border-2 ${
              status?.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="text-6xl mb-4">
              {status?.type === "success" ? "✅" : "❌"}
            </div>

            <h3 className="text-2xl font-extrabold tracking-wide uppercase">
              {status?.type === "success" ? "ACCESS GRANTED" : "ACCESS DENIED"}
            </h3>

            {/* Error Message */}
            {status?.type === "error" && (
              <p className="mt-2 text-lg font-bold">{status.msg}</p>
            )}

            {/* Success Details (Ticket Info) */}
            {status?.type === "success" && status.details && (
              <div className="mt-6 text-left bg-white/60 p-4 rounded-xl space-y-3 shadow-sm border border-green-100">
                {/* Booker Name */}
                <div>
                  <span className="text-xs uppercase tracking-wider font-bold opacity-60">
                    Booked By
                  </span>
                  <div className="text-xl font-bold text-gray-800">
                    {status.details.name}
                  </div>
                </div>

                {/* Total Count */}
                <div className="flex items-center justify-between border-t border-green-200 pt-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold opacity-60">
                      Total Entry
                    </span>
                    <div className="text-lg font-bold text-green-700">
                      {status.details.totalPax} People
                    </div>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>

                {/* Guest Names List */}
                {status.details.members &&
                  status.details.members.length > 0 && (
                    <div className="border-t border-green-200 pt-2">
                      <span className="text-xs uppercase tracking-wider font-bold opacity-60">
                        Guest List
                      </span>
                      <ul className="list-disc list-inside text-sm font-semibold text-gray-700 mt-1">
                        {status.details.members.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <button
              onClick={handleReset}
              className={`mt-6 w-full py-4 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 ${
                status?.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Scan Next Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
