"use client";

import { useEffect, useState, type FormEvent } from "react";

type DuelistProfile = {
  username: string;
  favoriteArchetype: string;
  photo: string;
};

const defaultProfile: DuelistProfile = {
  username: "Duelist",
  favoriteArchetype: "",
  photo: "",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(defaultProfile);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("yugioh-duelist-profile");
        if (!stored) return;
        const parsed: unknown = JSON.parse(stored);
        if (!parsed || typeof parsed !== "object") throw new Error("Saved duelist profile has an invalid format.");
        const value = parsed as Partial<DuelistProfile>;
        setProfile({
          username: typeof value.username === "string" ? value.username : defaultProfile.username,
          favoriteArchetype: typeof value.favoriteArchetype === "string" ? value.favoriteArchetype : defaultProfile.favoriteArchetype,
          photo: typeof value.photo === "string" ? value.photo : "",
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not load your profile.");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      window.localStorage.setItem("yugioh-duelist-profile", JSON.stringify(profile));
      setSaved(true);
      setError("");
      window.setTimeout(() => setSaved(false), 2200);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your profile.");
    }
  }

  return (
    <main className="profile-shell">
      <section className="profile-card">
        <div className="profile-preview">
          <div className="profile-orb">
            {profile.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photo} alt={`${profile.username} avatar`} onError={(event) => { event.currentTarget.style.display = "none"; }} />
            ) : <span>{profile.username.charAt(0).toUpperCase() || "遊"}</span>}
          </div>
          <p className="eyebrow">DUELIST IDENTITY</p>
          <h1>{profile.username || "Duelist"}</h1>
          <p>Favorite archetype</p>
          <strong>{profile.favoriteArchetype}</strong>
        </div>
        <form className="profile-form" onSubmit={saveProfile}>
          <p className="eyebrow">Your archive</p>
          <h2>Duelist profile</h2>
          <label>Display name
            <input maxLength={28} required value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} />
          </label>
          <label>Favorite archetype
            <input maxLength={50} value={profile.favoriteArchetype} onChange={(event) => setProfile({ ...profile, favoriteArchetype: event.target.value })} placeholder="Name your favorite deck" />
          </label>
          <label>Avatar image URL
            <input type="url" value={profile.photo} onChange={(event) => setProfile({ ...profile, photo: event.target.value })} placeholder="https://..." />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="primary-button">{saved ? "Profile saved" : "Save profile"}</button>
        </form>
      </section>
    </main>
  );
}
