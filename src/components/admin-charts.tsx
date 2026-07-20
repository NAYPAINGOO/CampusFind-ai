"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { categoryAnalytics, monthlyTrend } from "@/lib/demo-data";

export function AdminCharts() {
  return <div className="grid gap-5 lg:grid-cols-2">
    <section className="card p-5"><h2 className="font-black">Monthly report trend</h2><p className="mt-1 text-sm muted">Lost, found and returned items</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="lost" stroke="#2563eb" fill="#bfdbfe" /><Area type="monotone" dataKey="found" stroke="#16a34a" fill="#bbf7d0" /><Area type="monotone" dataKey="returned" stroke="#7c3aed" fill="#ddd6fe" /></AreaChart></ResponsiveContainer></div></section>
    <section className="card p-5"><h2 className="font-black">Reports by category</h2><p className="mt-1 text-sm muted">Share of active reports</p><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryAnalytics}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" hide /><YAxis /><Tooltip /><Bar dataKey="value" fill="#2563eb" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></section>
  </div>;
}
