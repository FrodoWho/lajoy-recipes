"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { NavBar } from "@/components/nav-bar";
import { Footer } from "@/components/footer";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Recipe } from "@/lib/types";
import { categoryLabels, type RecipeCategory } from "@/lib/types";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchData() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");

      // Get or create profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name ?? "");
        setBio(profileData.bio ?? "");
        setAvatarUrl(profileData.avatar_url ?? "");
        setAvatarPreview(profileData.avatar_url ?? "");
      } else {
        // Create empty profile
        await supabase.from("profiles").insert({ id: user.id });
        setProfile({ id: user.id, display_name: null, bio: null, avatar_url: null });
      }

      // Get recipe stats
      const { data: recipesData } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      setRecipes(recipesData ?? []);
      setLoading(false);
    }

    fetchData();
  }, [supabase, router]);

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecteer een afbeelding");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Afbeelding moet kleiner zijn dan 2MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let newAvatarUrl = avatarUrl;

    // Upload avatar if changed
    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `avatars/${profile!.id}.${fileExt}`;
      const { error } = await supabase.storage
        .from("recipes")
        .upload(fileName, avatarFile, { cacheControl: "3600", upsert: true });

      if (error) {
        console.error(error);
        toast.error("Avatar uploaden mislukt");
      } else {
        const { data: urlData } = supabase.storage.from("recipes").getPublicUrl(fileName);
        newAvatarUrl = urlData.publicUrl + "?t=" + Date.now(); // cache bust
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName || null,
        bio: bio || null,
        avatar_url: newAvatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile!.id);

    if (error) {
      toast.error("Profiel opslaan mislukt");
      console.error(error);
    } else {
      toast.success("Profiel bijgewerkt!");
      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
    }

    setSaving(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordNew !== passwordConfirm) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }
    if (passwordNew.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwordNew });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Wachtwoord gewijzigd!");
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
      setShowPasswordSection(false);
    }
    setChangingPassword(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!confirm("Weet je zeker dat je je account wilt verwijderen? Dit verwijdert ook al je recepten en kan niet ongedaan worden.")) return;

    toast.error("Neem contact op met support om je account te verwijderen.");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <NavBar onSignOut={handleSignOut} />
        <div className="flex-grow flex items-center justify-center pt-28">
          <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse" aria-hidden="true">person</span>
        </div>
      </div>
    );
  }

  // Stats
  const totalRecipes = recipes.length;
  const totalFavorites = recipes.filter((r) => r.is_favorite).length;
  const categoryCounts: Partial<Record<RecipeCategory, number>> = {};
  recipes.forEach((r) => {
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1;
  });
  const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0];
  const memberSince = profile ? new Date(recipes[recipes.length - 1]?.created_at ?? Date.now()).toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Toaster position="top-center" richColors />
      <NavBar onSignOut={handleSignOut} />

      <main id="main-content" className="pt-28 pb-20 px-4 sm:px-6 max-w-3xl mx-auto w-full flex-grow">
        <header className="mb-10">
          <span className="font-label text-secondary-lajoy tracking-widest uppercase text-xs">
            Jouw profiel
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-on-surface tracking-tight mt-2">
            Account
          </h1>
        </header>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Avatar & Name */}
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <div
              className="relative w-24 h-24 rounded-full overflow-hidden bg-surface-container-highest shrink-0 cursor-pointer group"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                className="hidden"
                aria-label="Avatar uploaden"
              />
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-outline-variant/40" aria-hidden="true">person</span>
                </div>
              )}
              <div className="absolute inset-0 bg-on-surface/0 group-hover:bg-on-surface/30 transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">photo_camera</span>
              </div>
            </div>

            <div className="flex-grow space-y-4 w-full">
              <div>
                <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-2">Weergavenaam</label>
                <input
                  className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Hoe wil je genoemd worden?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-2">E-mailadres</label>
                <input
                  className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 outline-none text-on-surface-variant"
                  value={email}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-2">Over mij</label>
            <textarea
              className="w-full bg-surface-container-highest border-none rounded-lg font-sans text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 min-h-[3rem] resize-none overflow-hidden"
              placeholder="Vertel iets over jezelf en je culinaire passie..."
              value={bio}
              onChange={(e) => { setBio(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              ref={(el) => { if (el && bio) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } }}
            />
          </div>

          {/* Save button */}
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-white px-8 py-3 rounded-full font-label text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Opslaan..." : "Profiel Opslaan"}
          </button>
        </form>

        {/* Stats */}
        <div className="mt-12 pt-8 border-t border-outline-variant/20">
          <h2 className="font-heading text-xl font-bold text-on-surface mb-6">Jouw statistieken</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container-low p-5 rounded-xl text-center">
              <p className="text-2xl font-heading font-bold text-primary">{totalRecipes}</p>
              <p className="font-label text-xs uppercase tracking-widest text-outline mt-1">Recepten</p>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl text-center">
              <p className="text-2xl font-heading font-bold text-secondary-lajoy">{totalFavorites}</p>
              <p className="font-label text-xs uppercase tracking-widest text-outline mt-1">Favorieten</p>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl text-center">
              <p className="text-2xl font-heading font-bold text-primary">
                {topCategory ? categoryLabels[topCategory[0] as RecipeCategory] : "—"}
              </p>
              <p className="font-label text-xs uppercase tracking-widest text-outline mt-1">Meeste</p>
            </div>
            <div className="bg-surface-container-low p-5 rounded-xl text-center">
              <p className="text-lg font-heading font-bold text-on-surface">{memberSince}</p>
              <p className="font-label text-xs uppercase tracking-widest text-outline mt-1">Lid sinds</p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="mt-8 pt-8 border-t border-outline-variant/20">
          <button
            onClick={() => setShowPasswordSection(!showPasswordSection)}
            className="flex items-center gap-3 w-full text-left group"
          >
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">lock</span>
            <span className="font-heading text-xl font-bold text-on-surface flex-grow">Wachtwoord wijzigen</span>
            <span className={`material-symbols-outlined text-outline-variant transition-transform ${showPasswordSection ? "rotate-180" : ""}`} aria-hidden="true">expand_more</span>
          </button>

          <div className={`grid transition-all duration-300 ease-in-out ${showPasswordSection ? "grid-rows-[1fr] opacity-100 mt-6" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="overflow-hidden">
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-2">Nieuw wachtwoord</label>
                  <input
                    type="password"
                    className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Minimaal 6 tekens"
                    value={passwordNew}
                    onChange={(e) => setPasswordNew(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div>
                  <label className="font-label text-[10px] uppercase tracking-[0.15em] text-outline block mb-2">Bevestig wachtwoord</label>
                  <input
                    type="password"
                    className="w-full bg-surface-container-highest border-none rounded-lg font-label text-sm py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Herhaal nieuw wachtwoord"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="bg-secondary-lajoy text-white px-6 py-3 rounded-full font-label text-sm font-medium hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {changingPassword ? "Wijzigen..." : "Wachtwoord Wijzigen"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-8 pt-8 border-t border-outline-variant/20">
          <h2 className="font-heading text-xl font-bold text-on-surface mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-error-lajoy" aria-hidden="true">warning</span>
            Gevarenzone
          </h2>
          <p className="text-on-surface-variant text-sm font-label mb-4">
            Deze acties zijn permanent en kunnen niet ongedaan worden gemaakt.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 rounded-full font-label text-sm font-medium border border-error-lajoy/30 text-error-lajoy hover:bg-error-container/30 transition-all active:scale-95"
          >
            Account Verwijderen
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
