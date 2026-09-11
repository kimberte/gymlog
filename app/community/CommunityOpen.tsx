"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type WorkoutDay = {
  id?: string;
  user_id: string;
  workout_date?: string;
  date?: string;
  title?: string;
  name?: string;
  notes?: string;
};

type Profile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  community_share_enabled?: boolean | null;
};

function displayName(profile?: Profile) {
  const first = String(profile?.first_name ?? "").trim();
  const last = String(profile?.last_name ?? "").trim();
  if (!first) return "Gym Log Member";
  return last ? `${first} ${last[0].toUpperCase()}.` : first;
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CommunityOpen() {
  const [workouts, setWorkouts] = useState<WorkoutDay[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [sharing, setSharing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const today = useMemo(todayKey, []);

  async function load() {
    setLoading(true);
    setMessage("");
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) {
      setWorkouts([]);
      setLoading(false);
      setMessage("Sign in to see today's community workouts.");
      return;
    }

    const profileResult = await supabase
      .from("profiles")
      .select("id, first_name, last_name, community_share_enabled")
      .eq("id", userId)
      .maybeSingle();

    if (profileResult.data) {
      setSharing(profileResult.data.community_share_enabled !== false);
    }

    const { data, error } = await supabase
      .from("workout_days")
      .select("*")
      .eq("workout_date", today)
      .order("created_at", { ascending: false });

    if (error) {
      // Some versions of the app use `date` rather than `workout_date`.
      const fallback = await supabase
        .from("workout_days")
        .select("*")
        .eq("date", today)
        .order("created_at", { ascending: false });
      if (fallback.error) {
        setMessage("Community workouts are unavailable right now.");
        setWorkouts([]);
      } else {
        setWorkouts((fallback.data ?? []) as WorkoutDay[]);
      }
    } else {
      setWorkouts((data ?? []) as WorkoutDay[]);
    }

    const ids = Array.from(new Set(((data ?? []) as WorkoutDay[]).map((w) => w.user_id).filter(Boolean)));
    if (ids.length) {
      const p = await supabase
        .from("profiles")
        .select("id, first_name, last_name, community_share_enabled")
        .in("id", ids);
      const map: Record<string, Profile> = {};
      (p.data ?? []).forEach((row) => {
        map[row.id] = row as Profile;
      });
      setProfiles(map);
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSharing() {
    const next = !sharing;
    setSharing(next);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from("profiles")
      .update({ community_share_enabled: next })
      .eq("id", userId);

    if (error) {
      setSharing(!next);
      setMessage("We couldn't update your sharing preference.");
    } else if (!next) {
      setMessage("Your workouts are no longer shared with the community.");
      setWorkouts((items) => items.filter((item) => item.user_id !== userId));
    } else {
      setMessage("Your workouts are now shared with the community.");
    }
  }

  return (
    <main className="community-open-page">
      <section className="community-open-hero">
        <div>
          <p className="eyebrow">GYM LOG COMMUNITY</p>
          <h1>Today's workouts</h1>
          <p>See what the Gym Log community is training today.</p>
        </div>
        <div className="community-share-control">
          <span>
            <strong>Share my workouts</strong>
            <small>Your sharing is on by default. You can turn it off anytime.</small>
          </span>
          <button type="button" aria-pressed={sharing} onClick={toggleSharing} className={sharing ? "on" : ""}>
            <span />
          </button>
        </div>
      </section>

      {message && <div className="community-open-message">{message}</div>}

      <section className="community-open-feed">
        <div className="community-open-feed-heading">
          <div>
            <h2>Training today</h2>
            <p>{loading ? "Loading workouts…" : `${workouts.length} workout${workouts.length === 1 ? "" : "s"} logged today`}</p>
          </div>
        </div>

        {!loading && workouts.length === 0 ? (
          <div className="community-empty">
            <div className="community-empty-icon">+</div>
            <h3>No community workouts yet</h3>
            <p>Be one of the first people to log a workout today.</p>
          </div>
        ) : (
          <div className="community-open-grid">
            {workouts.map((workout) => {
              const profile = profiles[workout.user_id];
              const title = String(workout.title ?? workout.name ?? "Workout").trim() || "Workout";
              return (
                <article className="community-workout-card" key={workout.id ?? `${workout.user_id}-${title}`}>
                  <div className="community-workout-person">
                    <div className="community-avatar">{displayName(profile).slice(0, 1).toUpperCase()}</div>
                    <div>
                      <strong>{displayName(profile)}</strong>
                      <span>Training today</span>
                    </div>
                  </div>
                  <h3>{title}</h3>
                  {workout.notes && <p>{workout.notes}</p>}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
