"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getWorkoutMediaSignedUrl } from "../lib/workoutMedia";
import { isCommunityShareEnabled, setCommunityShareEnabled } from "../lib/communityShare";

type Tab = "feed" | "friends" | "requests";

type Profile = { id: string; email: string };

type FriendRequestRow = {
  id: number;
  from_user: string;
  to_user: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
};

type WorkoutDayRow = {
  user_id: string;
  date_key: string;
  title: string | null;
  entries: any[];
  has_photo: boolean;
  has_video: boolean;
  updated_at: string;
};

function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function formatStackDate(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function clampEmail(email: string) {
  // mobile-friendly
  if (email.length <= 34) return email;
  return `${email.slice(0, 16)}…${email.slice(-14)}`;
}

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [toast, setToast] = useState<string | null>(null);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [shareEnabled, setShareEnabled] = useState(false);

  // Search
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);

  // Friends + requests
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<(FriendRequestRow & { from_email?: string })[]>([]);
  const [outgoing, setOutgoing] = useState<(FriendRequestRow & { to_email?: string })[]>([]);

  // Feed
  const [feed, setFeed] = useState<(WorkoutDayRow & { email?: string })[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  // Modal
  const [openItem, setOpenItem] = useState<(WorkoutDayRow & { email?: string }) | null>(null);
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});
  const mediaBusyRef = useRef(false);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  }

  // Init auth
  useEffect(() => {
    setShareEnabled(isCommunityShareEnabled());

    let unsub: any = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      setSessionUserId(u?.id ?? null);
      setSessionEmail((u?.email as any) ?? null);

      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        setSessionUserId(user?.id ?? null);
        setSessionEmail((user?.email as any) ?? null);
      });
    })();

    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // Ensure profiles row exists (new table)
  useEffect(() => {
    (async () => {
      if (!sessionUserId || !sessionEmail) return;
      try {
        await supabase.from("profiles").upsert({ id: sessionUserId, email: sessionEmail }, { onConflict: "id" });
      } catch {
        // ignore
      }
    })();
  }, [sessionUserId, sessionEmail]);

  // Persist share toggle
  useEffect(() => {
    setCommunityShareEnabled(shareEnabled);
  }, [shareEnabled]);

  async function loadFriendsAndRequests() {
    if (!sessionUserId) return;
    try {
      // Friends
      const { data: fr, error: frErr } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", sessionUserId);
      if (frErr) throw frErr;
      const ids = (fr ?? []).map((r: any) => String(r.friend_id));

      if (ids.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email").in("id", ids);
        setFriends((ps ?? []) as any);
      } else {
        setFriends([]);
      }

      // Requests incoming/outgoing
      const { data: reqs, error: rErr } = await supabase
        .from("friend_requests")
        .select("id,from_user,to_user,status,created_at")
        .or(`to_user.eq.${sessionUserId},from_user.eq.${sessionUserId}`)
        .order("created_at", { ascending: false });
      if (rErr) throw rErr;

      const inReq = (reqs ?? []).filter((r: any) => r.to_user === sessionUserId);
      const outReq = (reqs ?? []).filter((r: any) => r.from_user === sessionUserId);

      // Map IDs -> emails
      const needIds = Array.from(
        new Set([
          ...inReq.map((r: any) => String(r.from_user)),
          ...outReq.map((r: any) => String(r.to_user)),
        ])
      );
      let map: Record<string, string> = {};
      if (needIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email").in("id", needIds);
        for (const p of ps ?? []) map[String((p as any).id)] = String((p as any).email);
      }

      setIncoming(inReq.map((r: any) => ({ ...(r as any), from_email: map[String(r.from_user)] })));
      setOutgoing(outReq.map((r: any) => ({ ...(r as any), to_email: map[String(r.to_user)] })));
    } catch {
      // ignore
    }
  }

  async function loadFeed() {
    if (!sessionUserId) return;
    try {
      const { data: fr } = await supabase.from("friendships").select("friend_id").eq("user_id", sessionUserId);
      const ids = (fr ?? []).map((r: any) => String(r.friend_id));
      if (!ids.length) {
        setFeed([]);
        return;
      }

      const today = new Date();
      const start = toDateKey(addDays(today, -7));
      const end = toDateKey(addDays(today, 7));

      const { data, error } = await supabase
        .from("workout_days")
        .select("user_id,date_key,title,entries,has_photo,has_video,updated_at")
        .in("user_id", ids)
        .gte("date_key", start)
        .lte("date_key", end)
        .order("date_key", { ascending: true })
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // attach emails
      const need = Array.from(new Set((data ?? []).map((r: any) => String(r.user_id))));
      let map: Record<string, string> = {};
      if (need.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email").in("id", need);
        for (const p of ps ?? []) map[String((p as any).id)] = String((p as any).email);
      }
      setFeed((data ?? []).map((r: any) => ({ ...(r as any), email: map[String(r.user_id)] })));
    } catch {
      // ignore
    }
  }

  // load on tab switch
  useEffect(() => {
    if (!sessionUserId) return;
    void loadFriendsAndRequests();
    void loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionUserId]);

  async function doSearch() {
    const q = searchEmail.trim();
    setSearchResult(null);
    if (!q) return;
    if (!sessionUserId) {
      showToast("Sign in to add friends");
      return;
    }
    setSearchBusy(true);
    try {
      const { data, error } = await supabase.from("profiles").select("id,email").ilike("email", q).limit(1);
      if (error) throw error;
      const found = (data ?? [])[0] as any;
      if (!found) {
        showToast("No user found");
        return;
      }
      if (String(found.id) === sessionUserId) {
        showToast("That's you");
        return;
      }
      setSearchResult({ id: String(found.id), email: String(found.email) });
    } catch {
      showToast("Search failed");
    } finally {
      setSearchBusy(false);
    }
  }

  async function sendRequest() {
    if (!sessionUserId || !searchResult) return;
    try {
      const { error } = await supabase.from("friend_requests").insert({
        from_user: sessionUserId,
        to_user: searchResult.id,
      });
      if (error) throw error;
      showToast("Request sent");
      setSearchResult(null);
      setSearchEmail("");
      await loadFriendsAndRequests();
    } catch (e: any) {
      const msg = e?.message || "Request failed";
      showToast(msg);
    }
  }

  async function acceptRequest(reqId: number, fromUser: string) {
    if (!sessionUserId) return;
    try {
      // Prefer RPC if you added it; otherwise best-effort fallback.
      const rpc = await supabase.rpc("accept_friend_request", { req_id: reqId });
      if ((rpc as any)?.error) throw (rpc as any).error;
      showToast("Friend added");
    } catch {
      // fallback: mark accepted + insert my direction (other direction requires RPC)
      await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", reqId);
      await supabase.from("friendships").insert({ user_id: sessionUserId, friend_id: fromUser });
      showToast("Accepted (ask friend to add you back if needed)");
    }
    await loadFriendsAndRequests();
    await loadFeed();
  }

  async function declineRequest(reqId: number) {
    await supabase.from("friend_requests").update({ status: "declined" }).eq("id", reqId);
    showToast("Declined");
    await loadFriendsAndRequests();
  }

  async function removeFriend(friendId: string) {
    if (!sessionUserId) return;
    try {
      const rpc = await supabase.rpc("remove_friend", { other: friendId });
      if ((rpc as any)?.error) throw (rpc as any).error;
      showToast("Removed");
    } catch {
      await supabase.from("friendships").delete().eq("user_id", sessionUserId).eq("friend_id", friendId);
      showToast("Removed (may be one-way without RPC)");
    }
    await loadFriendsAndRequests();
    await loadFeed();
  }

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const feedByDate = useMemo(() => {
    const m: Record<string, (WorkoutDayRow & { email?: string })[]> = {};
    for (const item of feed) {
      const k = item.date_key;
      if (!m[k]) m[k] = [];
      m[k].push(item);
    }
    return m;
  }, [feed]);

  const pastKeys = useMemo(() => {
    const keys = Object.keys(feedByDate).filter((k) => k < todayKey && k >= toDateKey(addDays(new Date(), -7)));
    keys.sort();
    return keys;
  }, [feedByDate, todayKey]);

  const futureKeys = useMemo(() => {
    const keys = Object.keys(feedByDate).filter((k) => k > todayKey && k <= toDateKey(addDays(new Date(), 7)));
    keys.sort();
    return keys;
  }, [feedByDate, todayKey]);

  async function hydrateMediaUrls(item: WorkoutDayRow) {
    if (mediaBusyRef.current) return;
    mediaBusyRef.current = true;
    try {
      const next: Record<string, string> = {};
      const entries = Array.isArray(item.entries) ? item.entries : [];
      for (const e of entries) {
        const m = e?.media;
        const path = String(m?.path || "");
        if (!path) continue;
        if (mediaUrls[path]) continue;
        try {
          const url = await getWorkoutMediaSignedUrl(path, 600);
          next[path] = url;
        } catch {
          // ignore
        }
      }
      if (Object.keys(next).length) setMediaUrls((prev) => ({ ...prev, ...next }));
    } finally {
      mediaBusyRef.current = false;
    }
  }

  useEffect(() => {
    if (!openItem) return;
    void hydrateMediaUrls(openItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openItem]);

  return (
    <div style={{ padding: 14, overflowX: "hidden" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22 }}>Community</h1>
            <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>
              Friends only • Today ± 7 days
            </div>
          </div>

          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              flex: "0 0 auto",
            }}
            title="Share your saved workouts to friends"
          >
            <span style={{ fontSize: 13, opacity: 0.9 }}>Share my workouts</span>
            <input
              type="checkbox"
              checked={shareEnabled}
              onChange={(e) => setShareEnabled(e.target.checked)}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {([
            ["feed", "Feed"],
            ["friends", "Friends"],
            ["requests", "Requests"],
          ] as Array<[Tab, string]>).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: tab === k ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)",
                color: "var(--text)",
                fontWeight: 650,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "friends" && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 16,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Search email to add friend"
                  style={{
                    flex: "1 1 240px",
                    minWidth: 0,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.18)",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={doSearch}
                  disabled={searchBusy}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "var(--text)",
                    fontWeight: 650,
                    flex: "0 0 auto",
                  }}
                >
                  {searchBusy ? "Searching…" : "Search"}
                </button>
              </div>

              {searchResult && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.10)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {searchResult.email}
                    </div>
                    <div style={{ opacity: 0.75, fontSize: 13 }}>Send friend request?</div>
                  </div>
                  <button
                    onClick={sendRequest}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "var(--accent)",
                      color: "#111",
                      fontWeight: 800,
                      flex: "0 0 auto",
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.9 }}>Your Friends</h2>
              {friends.length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 14 }}>No friends yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {friends
                    .slice()
                    .sort((a, b) => a.email.localeCompare(b.email))
                    .map((f) => (
                      <div
                        key={f.id}
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 12,
                          borderRadius: 16,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>{f.email}</div>
                        </div>
                        <button
                          onClick={() => removeFriend(f.id)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text)",
                            fontWeight: 650,
                            flex: "0 0 auto",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "requests" && (
          <div style={{ marginTop: 14 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.9 }}>Incoming Requests</h2>
            {incoming.filter((r) => r.status === "pending").length === 0 ? (
              <div style={{ opacity: 0.75, fontSize: 14 }}>No requests.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {incoming
                  .filter((r) => r.status === "pending")
                  .map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: 12,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {r.from_email ?? r.from_user}
                        </div>
                        <div style={{ opacity: 0.75, fontSize: 13 }}>Wants to add you</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
                        <button
                          onClick={() => acceptRequest(r.id, r.from_user)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "var(--accent)",
                            color: "#111",
                            fontWeight: 800,
                          }}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineRequest(r.id)}
                          style={{
                            padding: "9px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "var(--text)",
                            fontWeight: 650,
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <h2 style={{ margin: "18px 0 8px", fontSize: 16, opacity: 0.9 }}>Sent Requests</h2>
            {outgoing.filter((r) => r.status === "pending").length === 0 ? (
              <div style={{ opacity: 0.75, fontSize: 14 }}>No sent requests.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {outgoing
                  .filter((r) => r.status === "pending")
                  .map((r) => (
                    <div
                      key={r.id}
                      style={{
                        padding: 12,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.10)",
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontWeight: 750, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.to_email ?? r.to_user}
                      </div>
                      <div style={{ opacity: 0.75, fontSize: 13 }}>Pending</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {tab === "feed" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16, opacity: 0.9 }}>Today</h2>
              <button
                onClick={loadFeed}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  fontWeight: 650,
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {(feedByDate[todayKey] ?? []).length === 0 ? (
                <div style={{ opacity: 0.75, fontSize: 14 }}>No workouts shared today.</div>
              ) : (
                (feedByDate[todayKey] ?? []).map((it) => (
                  <FeedRow key={`${it.user_id}-${it.date_key}`} item={it} onOpen={() => setOpenItem(it)} />
                ))
              )}
            </div>

            <SectionToggle
              title="Last 7 Days"
              open={showPast}
              onToggle={() => setShowPast((v) => !v)}
            />
            {showPast && (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {pastKeys.length === 0 ? (
                  <div style={{ opacity: 0.75, fontSize: 14 }}>No workouts in the last 7 days.</div>
                ) : (
                  pastKeys.map((k) => (
                    <DateGroup
                      key={k}
                      label={formatStackDate(k)}
                      items={feedByDate[k] ?? []}
                      onOpen={(it) => setOpenItem(it)}
                    />
                  ))
                )}
              </div>
            )}

            <SectionToggle
              title="Next 7 Days"
              open={showFuture}
              onToggle={() => setShowFuture((v) => !v)}
            />
            {showFuture && (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {futureKeys.length === 0 ? (
                  <div style={{ opacity: 0.75, fontSize: 14 }}>No upcoming workouts.</div>
                ) : (
                  futureKeys.map((k) => (
                    <DateGroup
                      key={k}
                      label={formatStackDate(k)}
                      items={feedByDate[k] ?? []}
                      onOpen={(it) => setOpenItem(it)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {openItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            zIndex: 9999,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(820px, calc(100vw - 24px))",
              maxHeight: "calc(100vh - 24px)",
              overflow: "hidden",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              backdropFilter: "blur(10px)",
              color: "var(--text)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flex: "0 0 auto",
              }}
            >
              <div style={{ fontWeight: 800 }}>Workout</div>
              <button
                onClick={() => setOpenItem(null)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.06)",
                  color: "var(--text)",
                  fontSize: 22,
                  lineHeight: "40px",
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: 16, overflowY: "auto" }}>
              <div style={{ opacity: 0.85, fontWeight: 650, wordBreak: "break-word" }}>
                {openItem.email ? clampEmail(openItem.email) : openItem.user_id} • {formatStackDate(openItem.date_key)}
              </div>

              <div style={{ fontSize: 28, fontWeight: 850, marginTop: 8, wordBreak: "break-word" }}>
                {openItem.title || "Workout"}
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {(Array.isArray(openItem.entries) ? openItem.entries : []).slice(0, 3).map((e: any, idx: number) => {
                  const t = String(e?.title ?? "").trim();
                  const notes = String(e?.notes ?? "").trim();
                  const m = e?.media;
                  const path = String(m?.path || "");
                  const kind = m?.kind;
                  const url = path ? mediaUrls[path] : "";

                  return (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 16,
                        padding: 14,
                        background: "rgba(0,0,0,0.18)",
                        overflow: "hidden",
                      }}
                    >
                      {t && <div style={{ fontWeight: 850, fontSize: 18, marginBottom: 6, wordBreak: "break-word" }}>{t}</div>}
                      {notes && (
                        <div style={{ whiteSpace: "pre-wrap", opacity: 0.92, wordBreak: "break-word" }}>{notes}</div>
                      )}

                      {kind && path && (
                        <div style={{ marginTop: 10 }}>
                          {url ? (
                            kind === "image" ? (
                              <img
                                src={url}
                                alt="Workout photo"
                                style={{ width: "100%", borderRadius: 12, maxHeight: 420, objectFit: "cover" }}
                              />
                            ) : (
                              <video
                                src={url}
                                controls
                                style={{ width: "100%", borderRadius: 12, maxHeight: 420 }}
                              />
                            )
                          ) : (
                            <div style={{ opacity: 0.75, fontSize: 14 }}>
                              Media is loading…
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed",
            left: "50%",
            bottom: 18,
            transform: "translateX(-50%)",
            padding: "10px 14px",
            borderRadius: 14,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(10px)",
            color: "#fff",
            fontWeight: 700,
            zIndex: 99999,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function SectionToggle(props: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={props.onToggle}
      style={{
        marginTop: 14,
        width: "100%",
        textAlign: "left",
        padding: "12px 14px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        color: "var(--text)",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <span>{props.title}</span>
      <span style={{ opacity: 0.8 }}>{props.open ? "Hide" : "Tap to load"}</span>
    </button>
  );
}

function DateGroup(props: {
  label: string;
  items: (WorkoutDayRow & { email?: string })[];
  onOpen: (it: WorkoutDayRow & { email?: string }) => void;
}) {
  return (
    <div>
      <div style={{ fontWeight: 850, opacity: 0.85, marginBottom: 8 }}>{props.label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {props.items.map((it) => (
          <FeedRow key={`${it.user_id}-${it.date_key}-${it.updated_at}`} item={it} onOpen={() => props.onOpen(it)} />
        ))}
      </div>
    </div>
  );
}

function FeedRow(props: { item: WorkoutDayRow & { email?: string }; onOpen: () => void }) {
  const it = props.item;
  const title = it.title || "Workout";
  return (
    <button
      onClick={props.onOpen}
      style={{
        textAlign: "left",
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.04)",
        color: "var(--text)",
        display: "flex",
        gap: 10,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ minWidth: 0, flex: "1 1 auto" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 750, wordBreak: "break-word" }}>{it.email ?? it.user_id}</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{ fontWeight: 850, wordBreak: "break-word" }}>{title}</span>
        </div>
      </div>

      <div style={{ display: "inline-flex", gap: 8, flex: "0 0 auto", alignItems: "center" }}>
        {it.has_photo && (
          <span
            title="Photo"
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              fontSize: 13,
            }}
          >
            📷
          </span>
        )}
        {it.has_video && (
          <span
            title="Video"
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              fontSize: 13,
            }}
          >
            🎥
          </span>
        )}
      </div>
    </button>
  );
}
