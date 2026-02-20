"use client";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { getWorkoutMediaSignedUrl } from "../lib/workoutMedia";
import { isCommunityShareEnabled, setCommunityShareEnabled } from "../lib/communityShare";

type Tab = "feed" | "friends" | "requests";

type Profile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

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

type FeedItem = WorkoutDayRow & {
  email?: string;
  first_name?: string | null;
  last_name?: string | null;
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

function timeAgoShort(iso: string | null | undefined) {
  if (!iso) return "";
  const t = new Date(iso);
  const ms = Date.now() - t.getTime();
  if (!Number.isFinite(ms)) return "";
  const s = Math.floor(ms / 1000);
  if (s < 60) return "now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  if (email.length <= 34) return email;
  return `${email.slice(0, 16)}...${email.slice(-14)}`;
}

function formatDisplayName(it: { first_name?: any; last_name?: any; email?: any; user_id?: any }) {
  const first = String(it?.first_name ?? "").trim();
  const last = String(it?.last_name ?? "").trim();

  if (first) {
    const li = last ? ` ${last[0].toUpperCase()}.` : "";
    return `${first}${li}`;
  }

  const email = String(it?.email ?? "").trim();
  if (email) return clampEmail(email);

  return String(it?.user_id ?? "").trim();
}

function badgeLetterFor(it: { first_name?: any; email?: any }) {
  const first = String(it?.first_name ?? "").trim();
  if (first) return first[0].toUpperCase();

  const email = String(it?.email ?? "").trim();
  if (email) return email[0].toUpperCase();

  return "?";
}

const BRAND_GREY_CARD = "rgba(255,255,255,0.06)";
const BRAND_GREY_CARD_STRONG = "rgba(255,255,255,0.08)";
const BORDER = "1px solid rgba(255,255,255,0.12)";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [toast, setToast] = useState<string | null>(null);

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  const [shareEnabled, setShareEnabled] = useState(false);

  // Display name (optional)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameBusy, setNameBusy] = useState(false);

  // Search
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);

  // Friends + requests
  const [friends, setFriends] = useState<Profile[]>([]);
  const [incoming, setIncoming] = useState<
    (FriendRequestRow & { from_email?: string; from_first?: string | null; from_last?: string | null })[]
  >([]);
  const [outgoing, setOutgoing] = useState<
    (FriendRequestRow & { to_email?: string; to_first?: string | null; to_last?: string | null })[]
  >([]);

  // Feed
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showPast, setShowPast] = useState(false);
  const [showFuture, setShowFuture] = useState(false);

  // Modal
  const [openItem, setOpenItem] = useState<FeedItem | null>(null);
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

  // Ensure profiles row exists (and keep email updated)
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

  // Load my saved name
  useEffect(() => {
    (async () => {
      if (!sessionUserId) return;
      try {
        const { data } = await supabase.from("profiles").select("first_name,last_name").eq("id", sessionUserId).maybeSingle();

        setFirstName(String((data as any)?.first_name ?? ""));
        setLastName(String((data as any)?.last_name ?? ""));
      } catch {
        // ignore
      }
    })();
  }, [sessionUserId]);

  // Persist share toggle
  useEffect(() => {
    setCommunityShareEnabled(shareEnabled);
  }, [shareEnabled]);

  async function saveName() {
    if (!sessionUserId) return;
    if (nameBusy) return;

    setNameBusy(true);
    try {
      const fn = firstName.trim();
      const ln = lastName.trim();

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: fn ? fn : null,
          last_name: ln ? ln : null,
        })
        .eq("id", sessionUserId);

      if (error) throw error;
      showToast("Saved");
      await loadFeed();
      await loadFriendsAndRequests();
    } catch {
      showToast("Save failed");
    } finally {
      setNameBusy(false);
    }
  }

  async function loadFriendsAndRequests() {
    if (!sessionUserId) return;
    try {
      // Requests incoming/outgoing
      const { data: reqs, error: rErr } = await supabase
        .from("friend_requests")
        .select("id,from_user,to_user,status,created_at")
        .or(`to_user.eq.${sessionUserId},from_user.eq.${sessionUserId}`)
        .order("created_at", { ascending: false });
      if (rErr) throw rErr;

      const inReq = (reqs ?? []).filter((r: any) => r.to_user === sessionUserId);
      const outReq = (reqs ?? []).filter((r: any) => r.from_user === sessionUserId);

      // Friends can be represented either by explicit friendships rows OR by accepted requests.
      // (We keep this resilient because different Supabase policies/RPC implementations may
      // write one but not the other.)
      const accepted = (reqs ?? []).filter((r: any) => r.status === "accepted");

      // friendships may be missing depending on DB/RLS, so treat them as optional.
      let friendshipIds: string[] = [];
      try {
        const { data: fr, error: frErr } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", sessionUserId);
        if (!frErr) friendshipIds = (fr ?? []).map((r: any) => String(r.friend_id));
      } catch {
        // ignore
      }

      const acceptedIds = accepted.map((r: any) =>
        String(r.from_user) === String(sessionUserId) ? String(r.to_user) : String(r.from_user)
      );

      const friendIds = Array.from(new Set([...friendshipIds, ...acceptedIds])).filter(Boolean);

      if (friendIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email,first_name,last_name").in("id", friendIds);
        setFriends((ps ?? []) as any);
      } else {
        setFriends([]);
      }

      // Map IDs -> profile (email + name)
      const needIds = Array.from(new Set([...inReq.map((r: any) => String(r.from_user)), ...outReq.map((r: any) => String(r.to_user))]));

      let map: Record<string, Profile> = {};
      if (needIds.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email,first_name,last_name").in("id", needIds);
        for (const p of ps ?? []) {
          map[String((p as any).id)] = {
            id: String((p as any).id),
            email: String((p as any).email ?? ""),
            first_name: (p as any).first_name ?? null,
            last_name: (p as any).last_name ?? null,
          };
        }
      }

      setIncoming(
        inReq.map((r: any) => {
          const prof = map[String(r.from_user)];
          return {
            ...(r as any),
            from_email: prof?.email,
            from_first: prof?.first_name ?? null,
            from_last: prof?.last_name ?? null,
          };
        })
      );

      setOutgoing(
        outReq.map((r: any) => {
          const prof = map[String(r.to_user)];
          return {
            ...(r as any),
            to_email: prof?.email,
            to_first: prof?.first_name ?? null,
            to_last: prof?.last_name ?? null,
          };
        })
      );
    } catch {
      // ignore
    }
  }

  async function loadFeed() {
    if (!sessionUserId) return;
    try {
      // Determine friends from accepted requests (and optionally friendships rows if present)
      const { data: reqs } = await supabase
        .from("friend_requests")
        .select("from_user,to_user,status")
        .or(`to_user.eq.${sessionUserId},from_user.eq.${sessionUserId}`);

      const accepted = (reqs ?? []).filter((r: any) => r.status === "accepted");
      const acceptedIds = accepted.map((r: any) =>
        String(r.from_user) === String(sessionUserId) ? String(r.to_user) : String(r.from_user)
      );

      let friendshipIds: string[] = [];
      try {
        const { data: fr } = await supabase.from("friendships").select("friend_id").eq("user_id", sessionUserId);
        friendshipIds = (fr ?? []).map((r: any) => String(r.friend_id));
      } catch {
        // ignore
      }

      const ids = Array.from(new Set([...friendshipIds, ...acceptedIds])).filter(Boolean);

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

      // attach email + name
      const need = Array.from(new Set((data ?? []).map((r: any) => String(r.user_id))));
      let map: Record<string, { email: string; first_name?: string | null; last_name?: string | null }> = {};

      if (need.length) {
        const { data: ps } = await supabase.from("profiles").select("id,email,first_name,last_name").in("id", need);
        for (const p of ps ?? []) {
          map[String((p as any).id)] = {
            email: String((p as any).email ?? ""),
            first_name: (p as any).first_name ?? null,
            last_name: (p as any).last_name ?? null,
          };
        }
      }

      setFeed(
        (data ?? []).map((r: any) => {
          const prof = map[String(r.user_id)];
          return {
            ...(r as any),
            email: prof?.email,
            first_name: prof?.first_name ?? null,
            last_name: prof?.last_name ?? null,
          } as FeedItem;
        })
      );
    } catch {
      // ignore
    }
  }

  // load on auth ready
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

    const targetId = String(searchResult.id);

    // Already friends?
    try {
      const { data: fr, error: frErr } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", sessionUserId)
        .eq("friend_id", targetId)
        .maybeSingle();

      if (frErr && (frErr as any).code !== "PGRST116") throw frErr;
      if (fr) {
        showToast("You're Friends");
        return;
      }
    } catch {
      // continue
    }

    try {
      // Check any existing request between these two users (either direction)
      const { data: existing, error: exErr } = await supabase
        .from("friend_requests")
        .select("id,from_user,to_user,status")
        .or(`and(from_user.eq.${sessionUserId},to_user.eq.${targetId}),and(from_user.eq.${targetId},to_user.eq.${sessionUserId})`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (exErr) throw exErr;
      const ex = (existing ?? [])[0] as any | undefined;

      if (ex) {
        if (ex.status === "pending") {
          if (String(ex.from_user) === String(sessionUserId)) showToast("Request Pending");
          else showToast("They already requested you");
          return;
        }

        if (ex.status === "accepted") {
          showToast("You're Friends");
          return;
        }

        // declined/other: remove old row so user can request again
        await supabase.from("friend_requests").delete().eq("id", ex.id);
      }

      const { error } = await supabase.from("friend_requests").insert({
        from_user: sessionUserId,
        to_user: targetId,
        status: "pending",
      });

      if (error) throw error;

      showToast("Request sent");
      setSearchResult(null);
      setSearchEmail("");
      await loadFriendsAndRequests();
    } catch (e: any) {
      const msg = String(e?.message || "");
      const code = String(e?.code || "");
      if (code === "23505" || msg.toLowerCase().includes("duplicate key")) {
        showToast("Request Pending");
        return;
      }
      showToast(e?.message || "Request failed");
    }
  }

  async function acceptRequest(reqId: number, fromUser: string) {
    if (!sessionUserId) return;
    // Always mark accepted in friend_requests, and attempt to ensure a friendship row exists
    // for the current user (so Friends tab + Feed work even if RPC doesn't write friendships).
    try {
      const rpc = await supabase.rpc("accept_friend_request", { req_id: reqId });
      if ((rpc as any)?.error) throw (rpc as any).error;
    } catch {
      // ignore RPC failures; we still proceed with client-side acceptance below
    }

    // Make sure request is accepted
    await supabase.from("friend_requests").update({ status: "accepted" }).eq("id", reqId);

    // Best-effort create the local friendship row (me -> other). If your RLS blocks this,
    // accepted requests will still power Friends/Feed (see loaders above).
    try {
      await supabase
        .from("friendships")
        .upsert({ user_id: sessionUserId, friend_id: fromUser }, { onConflict: "user_id,friend_id" } as any);
    } catch {
      // ignore
    }

    showToast("Friend added");
    await loadFriendsAndRequests();
    await loadFeed();
  }

  async function declineRequest(reqId: number) {
    await supabase.from("friend_requests").update({ status: "declined" }).eq("id", reqId);
    showToast("Declined");
    await loadFriendsAndRequests();
  }

  async function withdrawRequest(reqId: number) {
    try {
      const { error } = await supabase.from("friend_requests").delete().eq("id", reqId);
      if (error) throw error;
      showToast("Request withdrawn");
      await loadFriendsAndRequests();
    } catch (e: any) {
      showToast(e?.message || "Could not withdraw");
    }
  }

  async function removeFriend(friendId: string) {
    if (!sessionUserId) return;
    try {
      const rpc = await supabase.rpc("remove_friend", { other: friendId });
      if ((rpc as any)?.error) throw (rpc as any).error;
      showToast("Removed");
    } catch {
      await supabase.from("friendships").delete().eq("user_id", sessionUserId).eq("friend_id", friendId);
      // Also remove any accepted friend request row (either direction) so we don't keep treating as friends.
      await supabase
        .from("friend_requests")
        .delete()
        .or(
          `and(from_user.eq.${sessionUserId},to_user.eq.${friendId},status.eq.accepted),and(from_user.eq.${friendId},to_user.eq.${sessionUserId},status.eq.accepted)`
        );
      showToast("Removed (may be one-way without RPC)");
    }
    await loadFriendsAndRequests();
    await loadFeed();
  }

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const feedByDate = useMemo(() => {
    const m: Record<string, FeedItem[]> = {};
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
        {/* Header matches calendar page (back + brand on left) */}
        <header className="top-bar" style={{ padding: 0, marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <a
              href="/"
              className="icon-btn"
              title="Back to calendar"
              aria-label="Back to calendar"
              style={{
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1, opacity: 0.95 }}>←</span>
            </a>

            <div className="brand" style={{ minWidth: 0 }}>
              <img src="/icons/gym-app-logo-color-40x40.png" alt="Gym Log" className="brand-logo" width={20} height={20} />
              <h1 style={{ whiteSpace: "nowrap" }}>Gym Log</h1>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.1 }}>Community</div>
            <div style={{ opacity: 0.8, fontSize: 13, marginTop: 2 }}>Friends only - Today +/- 7 days</div>
          </div>
        </header>

        {/* Share toggle */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: 14,
              background: BRAND_GREY_CARD,
              border: BORDER,
              flex: "0 0 auto",
            }}
            title="Share your saved workouts to friends"
          >
            <span style={{ fontSize: 13, opacity: 0.95, fontWeight: 900 }}>Share my workouts</span>
            <button
              type="button"
              role="switch"
              aria-checked={shareEnabled}
              onClick={() => setShareEnabled((v) => !v)}
              style={{
                width: 46,
                height: 26,
                borderRadius: 999,
                border: BORDER,
                background: shareEnabled ? "rgba(255,87,33,0.75)" : "rgba(0,0,0,0.22)",
                display: "inline-flex",
                alignItems: "center",
                padding: 3,
                cursor: "pointer",
                transition: "background 0.15s ease, transform 0.08s ease",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.85)",
                  transform: shareEnabled ? "translateX(20px)" : "translateX(0px)",
                  transition: "transform 0.15s ease",
                }}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            marginTop: 12,
            borderRadius: 14,
            border: BORDER,
            background: BRAND_GREY_CARD,
            overflow: "hidden",
          }}
        >
          {(
            [
              ["feed", "Feed"],
              ["friends", "Friends"],
              ["requests", "Requests"],
            ] as Array<[Tab, string]>
          ).map(([k, label], idx) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                flex: "1 1 0%",
                padding: "10px 12px",
                border: "none",
                background: tab === k ? BRAND_GREY_CARD_STRONG : "transparent",
                color: "var(--text)",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: tab === k ? "inset 0 -2px 0 var(--accent)" : "none",
                borderLeft: idx === 0 ? "none" : BORDER,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* FEED */}
        {tab === "feed" && (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                border: BORDER,
                background: BRAND_GREY_CARD,
                borderRadius: 16,
                padding: 12,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 6, opacity: 0.95 }}>Your display name (optional)</div>
              <div style={{ opacity: 0.82, fontSize: 13, marginBottom: 10 }}>
                Friends will see this instead of your email (ex: <b>John S.</b>). Search and requests still use email.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  style={{
                    flex: "1 1 180px",
                    minWidth: 0,
                    padding: "10px 12px",
                    height: 40,
                    borderRadius: 12,
                    border: BORDER,
                    background: "rgba(0,0,0,0.18)",
                    color: "var(--text)",
                  }}
                />
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  style={{
                    flex: "1 1 180px",
                    minWidth: 0,
                    padding: "10px 12px",
                    height: 40,
                    borderRadius: 12,
                    border: BORDER,
                    background: "rgba(0,0,0,0.18)",
                    color: "var(--text)",
                  }}
                />
                <button
                  onClick={saveName}
                  disabled={nameBusy}
                  style={{
                    padding: "10px 14px",
                    height: 40,
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.10)",
                    background: "var(--accent)",
                    color: "#111",
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {nameBusy ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <h2 style={{ margin: 0, fontSize: 16, opacity: 0.95 }}>Today</h2>
              <button
                onClick={loadFeed}
                style={{
                  padding: "9px 12px",
                  borderRadius: 12,
                  border: BORDER,
                  background: BRAND_GREY_CARD_STRONG,
                  color: "var(--text)",
                  fontWeight: 750,
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
              {(feedByDate[todayKey] ?? []).length === 0 ? (
                <div style={{ opacity: 0.8, fontSize: 14 }}>No workouts shared today.</div>
              ) : (
                (feedByDate[todayKey] ?? []).map((it) => (
                  <FeedRow key={`${it.user_id}-${it.date_key}`} item={it} onOpen={() => setOpenItem(it)} />
                ))
              )}
            </div>

            <SectionToggle title="Last 7 Days" open={showPast} onToggle={() => setShowPast((v) => !v)} />
            {showPast && (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {pastKeys.length === 0 ? (
                  <div style={{ opacity: 0.8, fontSize: 14 }}>No workouts in the last 7 days.</div>
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

            <SectionToggle title="Next 7 Days" open={showFuture} onToggle={() => setShowFuture((v) => !v)} />
            {showFuture && (
              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                {futureKeys.length === 0 ? (
                  <div style={{ opacity: 0.8, fontSize: 14 }}>No upcoming workouts.</div>
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

        {/* FRIENDS */}
        {tab === "friends" && (
          <div style={{ marginTop: 14 }}>
            <div style={{ border: BORDER, background: BRAND_GREY_CARD, borderRadius: 16, padding: 12 }}>
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
                    border: BORDER,
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
                    border: BORDER,
                    background: BRAND_GREY_CARD_STRONG,
                    color: "var(--text)",
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {searchBusy ? "Searching..." : "Search"}
                </button>
              </div>

              {searchResult && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    borderRadius: 14,
                    border: BORDER,
                    background: BRAND_GREY_CARD,
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis" }}>{searchResult.email}</div>
                    <div style={{ opacity: 0.8, fontSize: 13 }}>Send friend request?</div>
                  </div>
                  <button
                    onClick={sendRequest}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.10)",
                      background: "var(--accent)",
                      color: "#111",
                      fontWeight: 900,
                      flex: "0 0 auto",
                    }}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            <div style={{ marginTop: 14 }}>
              <h2 style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.95 }}>Your Friends</h2>
              {friends.length === 0 ? (
                <div style={{ opacity: 0.8, fontSize: 14 }}>No friends yet.</div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {friends
                    .slice()
                    .sort((a, b) => (a.email || "").localeCompare(b.email || ""))
                    .map((f) => (
                      <div
                        key={f.id}
                        style={{
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 16,
                          background: "rgba(255,255,255,0.06)",
                          padding: 12,
                        }}
                      >
                        <PersonRow
                          profile={f}
                          compact
                          right={
                            <button
                              onClick={() => removeFriend(f.id)}
                              style={{
                                padding: "9px 12px",
                                borderRadius: 12,
                                border: BORDER,
                                background: BRAND_GREY_CARD_STRONG,
                                color: "var(--text)",
                                fontWeight: 750,
                                flex: "0 0 auto",
                              }}
                            >
                              Remove
                            </button>
                          }
                        />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* REQUESTS */}
        {tab === "requests" && (
          <div style={{ marginTop: 14 }}>
            <h2 style={{ margin: "0 0 8px", fontSize: 16, opacity: 0.95 }}>Incoming Requests</h2>

            {incoming.filter((r) => r.status === "pending").length === 0 ? (
              <div style={{ opacity: 0.8, fontSize: 14 }}>No requests.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {incoming
                  .filter((r) => r.status === "pending")
                  .map((r) => {
                    const prof: Profile = {
                      id: r.from_user,
                      email: r.from_email ?? String(r.from_user),
                      first_name: r.from_first ?? null,
                      last_name: r.from_last ?? null,
                    };

                    return (
                      <div
                        key={r.id}
                        style={{
                          border: BORDER,
                          borderRadius: 16,
                          background: BRAND_GREY_CARD,
                          padding: 12,
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                          <PersonRow profile={prof} compact subtitle="Incoming - Pending" />
                        </div>

                        <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
                          <button
                            onClick={() => acceptRequest(r.id, r.from_user)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: 12,
                              border: "1px solid rgba(0,0,0,0.10)",
                              background: "var(--accent)",
                              color: "#111",
                              fontWeight: 900,
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineRequest(r.id)}
                            style={{
                              padding: "9px 12px",
                              borderRadius: 12,
                              border: BORDER,
                              background: BRAND_GREY_CARD_STRONG,
                              color: "var(--text)",
                              fontWeight: 750,
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            <h2 style={{ margin: "18px 0 8px", fontSize: 16, opacity: 0.95 }}>Sent Requests</h2>

            {outgoing.filter((r) => r.status === "pending").length === 0 ? (
              <div style={{ opacity: 0.8, fontSize: 14 }}>No sent requests.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {outgoing
                  .filter((r) => r.status === "pending")
                  .map((r) => {
                    const prof: Profile = {
                      id: r.to_user,
                      email: r.to_email ?? String(r.to_user),
                      first_name: r.to_first ?? null,
                      last_name: r.to_last ?? null,
                    };

                    return (
                      <div
                        key={r.id}
                        style={{
                          border: BORDER,
                          borderRadius: 16,
                          background: BRAND_GREY_CARD,
                          padding: 12,
                        }}
                      >
                        <PersonRow
                          profile={prof}
                          subtitle="Sent - Pending"
                          right={
                            <button
                              onClick={() => withdrawRequest(r.id)}
                              style={{
                                padding: "9px 12px",
                                borderRadius: 12,
                                border: BORDER,
                                background: BRAND_GREY_CARD_STRONG,
                                color: "var(--text)",
                                fontWeight: 750,
                                flex: "0 0 auto",
                              }}
                            >
                              Withdraw
                            </button>
                          }
                        />
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL */}
      {openItem && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenItem(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10,12,14,0.45)",
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
              border: BORDER,
              background: "#2f343f",
              color: "var(--text)",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
            }}
          >
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.10)",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                flex: "0 0 auto",
              }}
            >
              <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.18)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    flex: "0 0 auto",
                  }}
                >
                  {badgeLetterFor(openItem)}
                </div>

                <div style={{ minWidth: 0, paddingTop: 1 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 16,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={formatDisplayName(openItem)}
                    >
                      {formatDisplayName(openItem)}
                    </div>
                    <div style={{ opacity: 0.78, fontWeight: 850, whiteSpace: "nowrap", fontSize: 13 }}>
                      {formatStackDate(openItem.date_key)}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      opacity: 0.8,
                      fontWeight: 750,
                      fontSize: 13,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={openItem.email ? openItem.email : openItem.user_id}
                  >
                    {openItem.email ? clampEmail(openItem.email) : openItem.user_id}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOpenItem(null)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.08)",
                  color: "var(--text)",
                  fontSize: 22,
                  lineHeight: "40px",
                  flex: "0 0 auto",
                }}
                aria-label="Close"
                title="Close"
              >
                ×
              </button>
            </div>

            <div style={{ padding: 16, overflowY: "auto" }}>
              <div style={{ fontSize: 26, fontWeight: 950, margin: "2px 0 10px", wordBreak: "break-word" }}>
                {openItem.title || "Workout"}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(Array.isArray(openItem.entries) ? openItem.entries : []).slice(0, 6).map((e: any, idx: number) => {
                  const t = String(e?.title ?? "").trim();
                  const dayTitle = String(openItem.title ?? "").trim();
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
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      {t && t !== dayTitle && (
                        <div style={{ fontWeight: 850, fontSize: 16, marginBottom: 6, wordBreak: "break-word" }}>{t}</div>
                      )}

                      {kind && path && (
                        <div style={{ marginTop: t && t !== dayTitle ? 10 : 2 }}>
                          {url ? (
                            kind === "image" ? (
                              <img src={url} alt="Workout photo" style={{ width: "100%", borderRadius: 12, maxHeight: 420, objectFit: "cover" }} />
                            ) : (
                              <video src={url} controls style={{ width: "100%", borderRadius: 12, maxHeight: 420 }} />
                            )
                          ) : (
                            <div style={{ opacity: 0.85, fontSize: 13, display: "inline-flex", gap: 8, alignItems: "center" }}>
                              <span style={{ color: "var(--accent)", fontWeight: 900 }}>●</span>
                              Media loading...
                            </div>
                          )}
                        </div>
                      )}

                      {notes && (
                        <div style={{ marginTop: kind && path ? 10 : 0, whiteSpace: "pre-wrap", opacity: 0.92, wordBreak: "break-word" }}>
                          {notes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(Array.isArray(openItem.entries) ? openItem.entries : []).length > 6 && (
                <div style={{ marginTop: 12, opacity: 0.8, fontSize: 13 }}>Showing first 6 entries...</div>
              )}
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
            border: BORDER,
            background: "#2f343f",
            color: "#fff",
            fontWeight: 800,
            zIndex: 99999,
            maxWidth: "calc(100vw - 24px)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
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
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text)",
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <span>{props.title}</span>
      <span style={{ opacity: 0.8, color: "var(--accent)", fontWeight: 900 }}>{props.open ? "Hide" : "Tap to load"}</span>
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
      <div style={{ fontWeight: 900, opacity: 0.9, marginBottom: 8 }}>{props.label}</div>
      <div style={{ display: "grid", gap: 8 }}>
        {props.items.map((it) => (
          <FeedRow key={`${it.user_id}-${it.date_key}-${it.updated_at}`} item={it as any} onOpen={() => props.onOpen(it)} />
        ))}
      </div>
    </div>
  );
}

function PersonRow(props: { profile: Profile; right?: ReactNode; subtitle?: string; compact?: boolean }) {
  const { profile } = props;
  const display = formatDisplayName(profile);
  const letter = badgeLetterFor(profile);
  const email = String(profile.email ?? "").trim();

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", minWidth: 0 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
        <div
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 950,
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text)",
            flex: "0 0 auto",
          }}
        >
          {letter}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 950, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={display}>
            {display}
          </div>

          <div
            style={{
              marginTop: 4,
              opacity: 0.82,
              fontWeight: 750,
              fontSize: 13,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={email}
          >
            {email}
          </div>

          {props.subtitle && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 900, opacity: 0.82 }}>{props.subtitle}</div>}
        </div>
      </div>

      {props.right ? <div style={{ flex: "0 0 auto" }}>{props.right}</div> : null}
    </div>
  );
}

function FeedRow(props: { item: FeedItem; onOpen: () => void }) {
  const it = props.item;
  const title = it.title || "Workout";

  const displayName = formatDisplayName(it);
  const letter = badgeLetterFor(it);
  const when = timeAgoShort(it.updated_at);

  const showMedia = !!(it.has_photo || it.has_video);
  const mediaKind: "photo" | "video" | null = it.has_video ? "video" : it.has_photo ? "photo" : null;

  const MediaIcon = ({ kind }: { kind: "photo" | "video" }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: 14, height: 14 }}
      aria-hidden="true"
    >
      {kind === "photo" ? (
        <>
          <path d="M6.75 7.5h2.25l1.5-2.25h3l1.5 2.25h2.25A2.25 2.25 0 0 1 21 9.75v7.5A2.25 2.25 0 0 1 18.75 19.5H6.75A2.25 2.25 0 0 1 4.5 17.25v-7.5A2.25 2.25 0 0 1 6.75 7.5Z" />
          <path d="M12 10.5a3 3 0 1 0 0 6a3 3 0 0 0 0-6Z" />
        </>
      ) : (
        <>
          <path d="M3.75 7.5A2.25 2.25 0 0 1 6 5.25h9A2.25 2.25 0 0 1 17.25 7.5v9A2.25 2.25 0 0 1 15 18.75H6A2.25 2.25 0 0 1 3.75 16.5v-9Z" />
          <path d="M17.25 10.2l3-1.7v7l-3-1.7v-1.9" />
        </>
      )}
    </svg>
  );

  return (
    <button
      onClick={props.onOpen}
      style={{
        textAlign: "left",
        padding: 12,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.06)",
        color: "var(--text)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        justifyContent: "space-between",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
        <div
          aria-hidden="true"
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 950,
            background: "rgba(0,0,0,0.22)",
            border: "1px solid rgba(255,255,255,0.12)",
            color: "var(--text)",
            flex: "0 0 auto",
          }}
        >
          {letter}
        </div>

        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ minWidth: 0, flex: "1 1 auto" }}>
              <div
                style={{
                  fontWeight: 950,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={title}
              >
                {title}
              </div>
            </div>

            {when ? (
              <span
                style={{
                  fontSize: 12,
                  opacity: 0.7,
                  fontWeight: 900,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                  flex: "0 0 auto",
                }}
                title={it.updated_at}
              >
                {showMedia && mediaKind ? <MediaIcon kind={mediaKind} /> : null}
                {when}
              </span>
            ) : null}
          </div>

          <div
            style={{
              marginTop: 4,
              opacity: 0.82,
              fontWeight: 750,
              fontSize: 13,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={displayName}
          >
            {displayName}
          </div>
        </div>
      </div>
    </button>
  );
}
