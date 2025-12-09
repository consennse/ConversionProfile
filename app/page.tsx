"use client";

import { useState, ChangeEvent, useEffect } from "react";
import axios from "axios";
import Image from "next/image";

export default function Page() {
  const [form, setForm] = useState({
    source_url: "",
    ftp_host: "",
    ftp_username: "",
    ftp_password: "",
    ftp_target_path: "",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const backend = "https://waldeapi.fly.dev";
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get(`${backend}/scheduler-status`);
  
        // If scheduler was running, show status & pre-fill form
        if (res.data.running && res.data.config) {
          setResponse({ message: "Scheduler is already running" });
          setForm(res.data.config);
        } else {
          setResponse({ message: "Scheduler is stopped" });
        }
      } catch (e) {
        console.error("Status error:", e);
      }
    };
  
    fetchStatus();
  }, []);
  
  useEffect(() => {
    // Prevent page unload completely
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return false; // completely blocks unload silently
    };
  
    // Prevent F5 / Ctrl+R / Cmd+R
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase(); // safe check
      if (
        key === "f5" ||                          // F5
        (key === "r" && (e.ctrlKey || e.metaKey)) // Ctrl+R or Cmd+R
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
  
    // Prevent right-click reload or navigation (optional)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
  
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("contextmenu", handleContextMenu);
  
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);
  
  
  // Apply blurred background


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleApiError = (error: unknown): any => {
    if (axios.isAxiosError(error)) {
      return error.response?.data ?? { error: error.message };
    }
    return { error: String(error) };
  };

  // Generic API call handler
  const callApi = async (url: string, data?: any) => {
    setLoading(true);
    try {
      const res = await axios.post(url, data);
      console.log("Backend response:", res.data);
      setResponse(res.data);
    } catch (error) {
      console.error("API error:", error);
      setResponse(handleApiError(error));
    }
    setLoading(false);
  };

  const runNow = () => callApi(`${backend}/process-feed`, form);
  const startScheduler = () => callApi(`${backend}/start-scheduler`, form);
  const stopScheduler = () => callApi(`${backend}/stop-scheduler`);

  // Helper to extract text from response
  const getResponseText = (resp: any) => {
    if (!resp) return "No response yet.";
  
    // If there is a message, return it
    if (resp.message) return resp.message;
  
    // Otherwise, display a summary of the response
    if (resp.status || resp.removed_images || resp.ftp_target_path) {
      return `Status: ${resp.status || "-"}\nRemoved images: ${resp.removed_images || 0}\nFTP Path: ${resp.ftp_target_path || "-"}`;
    }
  
    // Fallback for text or AI-style responses
    if (resp.text) return resp.text;
    if (resp.choices?.[0]?.message?.content) return resp.choices[0].message.content;
  
    // Fallback: stringify the entire object
    return JSON.stringify(resp, null, 2);
  };
  
  

  return (
    <div className="wrapper">
      <div>
        <Image src="/logo.png" alt="logo" width={37} height={29} />
      </div>

      <div className="form">
        <div className="heading">
          <h1>Conversion Profile (FGP)</h1>
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 form-values">
          <div className="left1">
            <label>Source Feed HTTP(S) URL</label>
            <input
              type="text"
              name="source_url"
              value={form.source_url}
              onChange={handleChange}
              className="w-full border-b border-gray-400 bg-transparent text-grey focus:outline-none  py-1 text-sm"
              placeholder="Enter Feed URL"
            />
          </div>

          <div className="left1">
            <label>Target Feed FTP URL </label>
            <text className="minitext">(e.g.: feed.walde.ch)</text>
            <input
              type="text"
              name="ftp_host"
              value={form.ftp_host}
              onChange={handleChange}
              className="w-full border-b border-gray-400 bg-transparent text-grey focus:outline-none py-1 text-sm"
              placeholder="Enter FTP URL"
            />
          </div>

          <div className="leftright">
            <div className="login">
              <label>FTP Username</label>
              <input
                type="text"
                name="ftp_username"
                value={form.ftp_username}
                onChange={handleChange}
                className="w-full border-b border-gray-400 bg-transparent text-grey focus:outline-none py-1 text-sm"
                placeholder="Enter Username"
              />
            </div>

            <div className="login">
              <label>FTP Password</label>
              <input
                type="password"
                name="ftp_password"
                value={form.ftp_password}
                onChange={handleChange}
                className="w-full border-b border-gray-400 bg-transparent text-grey focus:outline-none py-1 text-sm"
                placeholder="Enter Password"
              />
            </div>
          </div>

          <div className="left1">
            <label>Target File Name </label>
            <text className="minitext">(e.g.: fgp.xml)</text>
            <input
              type="text"
              name="ftp_target_path"
              value={form.ftp_target_path}
              onChange={handleChange}
              className="w-full border-b border-gray-400 bg-transparent text-grey focus:outline-none py-1 text-sm"
              placeholder="Enter File Name"
            />
          </div>
        </div>
        <div className="status">
  <h3>Scheduler Status:</h3>
  <pre>{response ? getResponseText(response) : "Loading..."}</pre>
</div>

        {/* Buttons */}
        <div className="buttons">
          <button onClick={startScheduler} disabled={loading} className="button">
            {loading ? "Starting..." : "Start Scheduler"}
          </button>
          <button onClick={runNow} disabled={loading} className="button2">
            {loading ? "Processing..." : "Run Now"}
          </button>
          <button onClick={stopScheduler} disabled={loading} className="button">
            Stop Scheduler
          </button>
        </div>

        {/* Response */}
        <div className="response">
          <h2>Response:</h2>
          <pre>{getResponseText(response)}</pre>

        </div>
      </div>
    </div>
  );
}
