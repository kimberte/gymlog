"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { ensureProfileRow, loadShareEnabled, saveShareEnabled } from "../lib/communityShare";

type Profile = { id: string; email: string };

type FriendRequest = {
  id: number;
  from_user: string;
  from_email?: string;
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

function dateKeyOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

function formatPretty(key: string) {
  const [y, m, d] = key.split("-").map((x) => Number(x));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: any }) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.55)",
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 760,
          width: "100%",
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "var(--panel)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
        }}
      >
        <div
          className="modal-header"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            background: "var(--panel)",
            backdropFilter: "blur(10px)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, opacity: 0.9 }}>Workout</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
        <div className="modal-body" style={{ padding: 14 }}>{children}</div>
      </div>
    </div>
  );
}

function isRenderableImageSrc(src: string) {
  const s = String(src || "").trim();
  if (!s) return false;
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("data:image/")) return true;
  // blob: URLs are local/session-only and will break in community views.
  if (s.startsWith("blob:")) return false;
  return false;
}

export default function CommunityPage() {
  const [tab, setTab] = useState<"feed" | "friends" | "requests">("feed");
  const [toast, setToast] = useState<string | null>(null);

  const [signedIn, setSignedIn] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  const [shareEnabled, setShareEnabledState] = useState(false);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Profile[]>([]);

  const [feedRows, setFeedRows] = useState<WorkoutDayRow[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  const [openItem, setOpenItem] = useState<null | { who: string; email: string; row: WorkoutDayRow }>(null);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1400);
  }

  useEffect(() => {
    setShareEnabledState(loadShareEnabled());
  }, []);

  // auth state (community is optional)
  useEffect(() => {
    let unsub: { data?: { subscription?: { unsubscribe: () => void } } } | null = null;

    async function init() {
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      setSignedIn(Boolean(u));
      setMyId(u?.id ?? null);
      if (u) {
        // best-effort: create profiles row
        ensureProfileRow();
      }

      unsub = supabase.auth.onAuthStateChange((_event, session) => {
        const user = session?.user;
        setSignedIn(Boolean(user));
        setMyId(user?.id ?? null);
        if (user) ensureProfileRow();
      });
    }

    init();
    return () => {
      try {
        unsub?.data?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, []);

  // Load friends + requests on entry
  useEffect(() => {
    if (!signedIn || !myId) return;
    refreshFriendsAndRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, myId]);

  async function refreshFriendsAndRequests() {
    if (!myId) return;

    // incoming requests
    const { data: reqs } = await supabase
      .from("friend_requests")
      .select("id,from_user,to_user,status,created_at")
      .eq("to_user", myId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const incomingReqs = (reqs ?? []) as FriendRequest[];
    // Attach sender email for display
    const fromIds = Array.from(new Set(incomingReqs.map((r) => r.from_user).filter(Boolean)));
    if (fromIds.length) {
      const { data: fromProfiles } = await supabase.from("profiles").select("id,email").in("id", fromIds);
      const map = new Map<string, string>();
      (fromProfiles ?? []).forEach((p: any) => map.set(p.id, p.email));
      setIncoming(incomingReqs.map((r) => ({ ...r, from_email: map.get(r.from_user) })));
    } else {
      setIncoming(incomingReqs);
    }

    // friends list
    const { data: fs } = await supabase.from("friendships").select("friend_id").eq("user_id", myId);
    const ids = (fs ?? []).map((r: any) => r.friend_id).filter(Boolean);
    if (!ids.length) {
      setFriends([]);
      return;
    }

    const { data: profs } = await supabase.from("profiles").select("id,email").in("id", ids);
    const sorted = (profs ?? [])
      .map((p: any) => ({ id: p.id, email: p.email }))
      .sort((a, b) => a.email.localeCompare(b.email));
    setFriends(sorted);
  }

  async function runSearch() {
    const email = searchEmail.trim().toLowerCase();
    setSearchError(null);
    setSearchResult(null);
    if (!email) return;
    if (!signedIn) {
      setSearchError("Sign in from Settings first to add friends.");
      return;
    }
    if (!myId) return;

    setSearchBusy(true);
    try {
      const { data, error } = await supabase.from("profiles").select("id,email").eq("email", email).maybeSingle();
      if (error) throw error;
      if (!data) {
        setSearchError("No user found with that email.");
        return;
      }
      if (data.id === myId) {
        setSearchError("That’s you 🙂");
        return;
      }
      setSearchResult({ id: data.id, email: data.email });
    } catch {
      setSearchError("Search failed. Check your profiles policies.");
    } finally {
      setSearchBusy(false);
    }
  }

  async function sendRequest(to: Profile) {
    if (!myId) return;
    try {
      const { error } = await supabase
        .from("friend_requests")
        .insert({ from_user: myId, to_user: to.id, status: "pending" });
      if (error) throw error;
      showToast("Friend request sent");
      setSearchResult(null);
      setSearchEmail("");
    } catch {
      showToast("Could not send request");
    }
  }

  async function acceptRequest(req: FriendRequest) {
    try {
      // Prefer RPC if you add it later; fall back to partial accept
      const rpc = await supabase.rpc("accept_friend_request", { req_id: req.id });
      if (!rpc.error) {
        showToast("Friend added");
        await refreshFriendsAndRequests();
        await loadFeed();
        return;
      }

      // Fallback: mark accepted + add MY direction. The sender will be prompted to refresh later.
      await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", req.id);
      await supabase.from("friendships").insert({ user_id: req.to_user, friend_id: req.from_user });
      showToast("Accepted (one-way until sender refreshes)");
      await refreshFriendsAndRequests();
      await loadFeed();
    } catch {
      showToast("Could not accept");
    }
  }

  async function declineRequest(req: FriendRequest) {
    try {
      await supabase.from("friend_requests").update({ status: "declined" }).eq("id", req.id);
      showToast("Declined");
      await refreshFriendsAndRequests();
    } catch {
      showToast("Could not decline");
    }
  }

  async function removeFriend(friendId: string) {
    try {
      const rpc = await supabase.rpc("remove_friend", { other: friendId });
      if (rpc.error) {
        // fallback: remove only my direction
        if (myId) await supabase.from("friendships").delete().eq("user_id", myId).eq("friend_id", friendId);
      }
      showToast("Removed");
      await refreshFriendsAndRequests();
      await loadFeed();
    } catch {
      showToast("Could not remove");
    }
  }

  async function loadFeed() {
    if (!myId) return;
    setLoadingFeed(true);
    try {
      const { data: fs } = await supabase.from("friendships").select("friend_id").eq("user_id", myId);
      const ids = (fs ?? []).map((r: any) => r.friend_id).filter(Boolean);
      if (!ids.length) {
        setFeedRows([]);
        return;
      }

      const today = new Date();
      const minKey = dateKeyOf(addDays(today, -7));
      const maxKey = dateKeyOf(addDays(today, 7));

      const { data: rows } = await supabase
        .from("workout_days")
        .select("user_id,date_key,title,entries,has_photo,has_video,updated_at")
        .in("user_id", ids)
        .gte("date_key", minKey)
        .lte("date_key", maxKey)
        .order("date_key", { ascending: true });

      setFeedRows((rows ?? []) as any);
    } catch {
      setFeedRows([]);
    } finally {
      setLoadingFeed(false);
    }
  }

  useEffect(() => {
    if (!signedIn || !myId) return;
    loadFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, myId]);

  const emailById = useMemo(() => {
    const m = new Map<string, string>();
    friends.forEach((f) => m.set(f.id, f.email));
    return m;
  }, [friends]);

  const todayKey = useMemo(() => dateKeyOf(new Date()), []);

  const rowsByDate = useMemo(() => {
    const map = new Map<string, WorkoutDayRow[]>();
    for (const r of feedRows) {
      if (!map.has(r.date_key)) map.set(r.date_key, []);
      map.get(r.date_key)!.push(r);
    }
    // sort within date by email
    for (const [k, list] of map.entries()) {
      list.sort((a, b) => (emailById.get(a.user_id) ?? "").localeCompare(emailById.get(b.user_id) ?? ""));
      map.set(k, list);
    }
    return map;
  }, [feedRows, emailById]);

  function setShareEnabled(v: boolean) {
    setShareEnabledState(v);
    saveShareEnabled(v);
    showToast(v ? "Sharing enabled" : "Sharing disabled");
  }

  function renderFeedSection(keys: string[]) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {keys.map((k) => {
          const items = rowsByDate.get(k) ?? [];
          if (!items.length) return null;
          return (
            <div key={k} style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12 }}>
              <div style={{ opacity: 0.9, fontWeight: 700, marginBottom: 8 }}>{formatPretty(k)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((r, idx) => {
                  const email = emailById.get(r.user_id) ?? "";
                  return (
                    <div
                      key={`${r.user_id}-${idx}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => setOpenItem({ who: r.user_id, email, row: r })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setOpenItem({ who: r.user_id, email, row: r });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontSize: 13, opacity: 0.9, flex: "0 0 auto" }}>{email}</div>
                      <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, opacity: 0.9 }}>
                        {r.has_photo && <span title="Photo">📷</span>}
                        {r.has_video && <span title="Video">🎥</span>}
                      </div>
                      <div style={{ flex: "0 0 auto", fontWeight: 700 }}>{r.title || "Workout"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const pastKeys = useMemo(() => {
    const t = new Date();
    const keys: string[] = [];
    for (let i = -7; i <= -1; i++) keys.push(dateKeyOf(addDays(t, i)));
    return keys;
  }, []);

  const futureKeys = useMemo(() => {
    const t = new Date();
    const keys: string[] = [];
    for (let i = 1; i <= 7; i++) keys.push(dateKeyOf(addDays(t, i)));
    return keys;
  }, []);

  return (
    <>
      <header className="top-bar">
        <div className="brand">
          <img
            src="/icons/gym-app-logo-color-40x40.png"
            alt="Gym Log"
            className="brand-logo"
            width={20}
            height={20}
          />
          <h1>Community</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href="/" className="icon-btn" style={{ textDecoration: "none", padding: "8px 10px" }}>
            Back
          </a>
        </div>
      </header>

      <div style={{ padding: "14px 16px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <button
          className={tab === "feed" ? "primary" : "secondary"}
          onClick={() => setTab("feed")}
          type="button"
        >
          Feed
        </button>
        <button
          className={tab === "friends" ? "primary" : "secondary"}
          onClick={() => setTab("friends")}
          type="button"
        >
          Friends
        </button>
        <button
          className={tab === "requests" ? "primary" : "secondary"}
          onClick={() => setTab("requests")}
          type="button"
        >
          Requests
          {incoming.length > 0 ? ` (${incoming.length})` : ""}
        </button>
      </div>

      <div style={{ padding: "0 16px 18px" }}>
        {!signedIn && (
          <div style={{ opacity: 0.9, padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
            Sign in from <b>Settings</b> on the main calendar to use Community.
          </div>
        )}

        {signedIn && (
          <div style={{
            marginTop: 12,
            padding: "12px 12px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.10)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}>
            <div>
              <div style={{ fontWeight: 800 }}>Share my workouts</div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Off by default. Only shares days you save.</div>
            </div>
            <button className={shareEnabled ? "primary" : "secondary"} onClick={() => setShareEnabled(!shareEnabled)}>
              {shareEnabled ? "Sharing on" : "Sharing off"}
            </button>
          </div>
        )}

        {tab === "friends" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Add friend by email</div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="friend@email.com"
                  style={{ flex: "1 1 260px" }}
                />
                <button className="primary" onClick={runSearch} disabled={searchBusy}>
                  {searchBusy ? "Searching…" : "Search"}
                </button>
              </div>
              {searchError && <div style={{ marginTop: 10, opacity: 0.85 }}>{searchError}</div>}
              {searchResult && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 700 }}>{searchResult.email}</div>
                  <button className="primary" onClick={() => sendRequest(searchResult)}>
                    Add Friend
                  </button>
                </div>
              )}
            </div>

            <div style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Friends</div>
              {friends.length === 0 ? (
                <div style={{ opacity: 0.8 }}>No friends yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {friends.map((f) => (
                    <div
                      key={f.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 10px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{f.email}</div>
                      <button className="secondary" onClick={() => removeFriend(f.id)}>
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
          <div style={{ marginTop: 16, padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Friend requests</div>
            {incoming.length === 0 ? (
              <div style={{ opacity: 0.8 }}>No pending requests.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {incoming.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      alignItems: "center",
                      padding: "10px 10px",
                      borderRadius: 10,
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{r.from_email || r.from_user}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="primary" onClick={() => acceptRequest(r)}>
                        Accept
                      </button>
                      <button className="secondary" onClick={() => declineRequest(r)}>
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
              Tip: For best mutual sharing, add the optional RPC <code>accept_friend_request(req_id)</code>.
            </div>
          </div>
        )}

        {tab === "feed" && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Feed</div>
              <button className="secondary" onClick={loadFeed} disabled={loadingFeed}>
                {loadingFeed ? "Loading…" : "Refresh"}
              </button>
            </div>

            <div style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Last 7 Days</div>
              <button className="stacked-toggle-btn" type="button" onClick={() => setShowPast((s) => !s)}>
                {showPast ? "Hide" : "Tap to load view"}
              </button>
              {showPast && <div style={{ marginTop: 10 }}>{renderFeedSection(pastKeys)}</div>}
            </div>

            <div style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Today</div>
              {renderFeedSection([todayKey])}
              {(!rowsByDate.get(todayKey) || rowsByDate.get(todayKey)!.length === 0) && (
                <div style={{ opacity: 0.75, marginTop: 10 }}>No shared workouts today.</div>
              )}
            </div>

            <div style={{ padding: "12px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.10)" }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Next 7 Days</div>
              <button className="stacked-toggle-btn" type="button" onClick={() => setShowFuture((s) => !s)}>
                {showFuture ? "Hide" : "Tap to load"}
              </button>
              {showFuture && <div style={{ marginTop: 10 }}>{renderFeedSection(futureKeys)}</div>}
            </div>
          </div>
        )}
      </div>

      <Modal open={Boolean(openItem)} onClose={() => setOpenItem(null)}>
        {openItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ opacity: 0.85, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <b style={{ wordBreak: "break-word" }}>{openItem.email || openItem.who}</b>
              <span style={{ opacity: 0.8 }}>• {formatPretty(openItem.row.date_key)}</span>
            </div>

            <div style={{ fontWeight: 900, fontSize: 20, lineHeight: 1.15 }}>
              {openItem.row.title || (openItem.row.entries?.[0]?.title ? String(openItem.row.entries[0].title) : "Workout")}
            </div>

            <div style={{ opacity: 0.85, fontSize: 13 }}>
              {openItem.row.has_photo ? "📷 Photo" : ""} {openItem.row.has_video ? "🎥 Video" : ""}
            </div>

            {/* Top media preview (best-effort) */}
            {(() => {
              const entries = (openItem.row.entries ?? []) as any[];
              const firstImg = entries.find((e) => e?.media?.kind === "image" && isRenderableImageSrc(e?.media?.path))?.media?.path;
              if (!firstImg) return null;
              return (
                <img
                  src={firstImg}
                  alt="Workout photo"
                  style={{ width: "100%", borderRadius: 12, maxHeight: 360, objectFit: "cover" }}
                  onError={(ev) => {
                    const img = ev.currentTarget as HTMLImageElement;
                    img.style.display = "none";
                  }}
                />
              );
            })()}

            <div style={{ marginTop: 6 }}>
              {(openItem.row.entries ?? []).map((e: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 10px",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.10)",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{String(e?.title ?? "Workout").trim() || "Workout"}</div>
                  {String(e?.notes ?? "").trim() && (
                    <div style={{ marginTop: 6, whiteSpace: "pre-wrap", opacity: 0.9, wordBreak: "break-word" }}>
                      {String(e.notes)}
                    </div>
                  )}

                  {/* image preview (best-effort) */}
                  {e?.media?.kind === "image" && e?.media?.path &&
                    (isRenderableImageSrc(e.media.path) ? (
                      <img
                        src={e.media.path}
                        alt="Workout"
                        style={{ marginTop: 10, width: "100%", borderRadius: 12, maxHeight: 320, objectFit: "cover" }}
                        onError={(ev) => {
                          const img = ev.currentTarget as HTMLImageElement;
                          img.style.display = "none";
                        }}
                      />
                    ) : (
                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                        Photo is not available (it was saved locally on the other device).
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
