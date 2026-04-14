import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?login=app");
  }

  // Get user's co-ownerships (as initiator or member)
  const { data: memberOf } = await supabase
    .from("members")
    .select("syndicate_id, ownership_bps, name, syndicates(id, name, aircraft_tail_number, aircraft_type, status)")
    .eq("email", user.email!)
    .order("created_at", { ascending: false });

  const coOwnerships = memberOf?.filter((m) => m.syndicates) || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <svg width="22" height="22" viewBox="0 0 28 28" fill="none" className="text-black">
              <path d="M14 2L26 8v12l-12 6L2 20V8l12-6z" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M14 8l6 3v6l-6 3-6-3v-6l6-3z" fill="currentColor" opacity="0.3"/>
              <path d="M14 11l3 1.5v3L14 17l-3-1.5v-3L14 11z" fill="currentColor"/>
            </svg>
            <span className="text-black font-semibold text-lg tracking-tight">TailStake</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-semibold text-black tracking-[-0.03em]">Dashboard</h1>
            <p className="text-gray-500 mt-1">Your aircraft co-ownerships</p>
          </div>
          <a
            href="/app/syndicate/new"
            className="inline-flex items-center gap-2 rounded-full bg-black hover:bg-gray-800 px-6 py-3 text-sm font-medium text-white transition-colors"
          >
            New Co-Ownership
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </a>
        </div>

        {coOwnerships.length === 0 ? (
          <div className="rounded-[2rem] bg-gray-50 p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-6">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-black mb-2">No co-ownerships yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Set up your first aircraft co-ownership. Define the rules, split the costs,
              protect everyone with a proper legal agreement.
            </p>
            <a
              href="/app/syndicate/new"
              className="inline-flex items-center gap-2 rounded-full bg-black hover:bg-gray-800 px-8 py-4 text-base font-medium text-white transition-colors"
            >
              Create Your First Co-Ownership
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coOwnerships.map((m: any) => {
              const s = m.syndicates;
              return (
                <a
                  key={m.syndicate_id}
                  href={`/app/syndicate/${m.syndicate_id}`}
                  className="rounded-[1.5rem] border border-gray-200 bg-white p-6 hover:shadow-lg hover:border-gray-300 transition-all block"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-black text-lg">{s.aircraft_tail_number}</p>
                      <p className="text-gray-500 text-sm">{s.aircraft_type}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      s.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : s.status === "pending_signatures"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      {s.status === "active" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      {s.status === "pending_signatures" && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                      {s.status?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">{s.name}</p>
                    <p className="text-sm font-semibold text-black tabular-nums">
                      {(m.ownership_bps / 100).toFixed(2)}%
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
