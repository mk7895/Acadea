import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getApiBase } from "@/lib/api-base";
import {
  fetchAdminArticles,
  type ArticleEditorRecord,
} from "@/lib/article-api";
import {
  ARTICLE_CATEGORIES,
  estimateReadMinutes,
  normalizeArticleSlug,
  type ArticleCategory,
} from "@/lib/article-content";

const API_BASE = getApiBase();
const ADMIN_TOKEN_KEY = "acadea-admin-session";

type EditorState = {
  id?: number;
  sortOrder: number;
  category: ArticleCategory;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  markdown: string;
  relatedSlugs: string[];
  isPublished: boolean;
};

const emptyEditor: EditorState = {
  sortOrder: 0,
  category: "Poradniki",
  title: "",
  slug: "",
  excerpt: "",
  coverImage: "",
  markdown: "",
  relatedSlugs: [],
  isPublished: true,
};

function toEditorState(article: ArticleEditorRecord): EditorState {
  return {
    id: article.id,
    sortOrder: article.sortOrder,
    category: article.category,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    coverImage: article.coverImage,
    markdown: article.markdown,
    relatedSlugs: article.relatedSlugs,
    isPublished: article.isPublished,
  };
}

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Nie udało się odczytać pliku."));
    reader.readAsDataURL(file);
  });
}

export default function AdminArticles() {
  const entrySecret = new URLSearchParams(window.location.search).get("secret")?.trim() ?? "";
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY) ?? "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [articles, setArticles] = useState<ArticleEditorRecord[]>([]);
  const [selectedId, setSelectedId] = useState<number | "new">("new");
  const [editor, setEditor] = useState<EditorState>(emptyEditor);
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void fetch(`${API_BASE}/admin/auth/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data: { authenticated?: boolean }) => {
        if (!cancelled && !data.authenticated) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          setToken("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    void fetchAdminArticles(token)
      .then((rows) => {
        if (!cancelled) {
          setArticles(rows);
          if (selectedId === "new") {
            return;
          }
          const current = rows.find((row) => row.id === selectedId);
          if (current) {
            setEditor(toEditorState(current));
          }
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Nie udało się pobrać artykułów.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedId]);

  const readMin = useMemo(() => estimateReadMinutes(editor.markdown), [editor.markdown]);

  if (!entrySecret) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] pt-28 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-[28px] shadow-sm border border-[#e7e1d6] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78] mb-3">
            Panel redakcyjny
          </p>
          <h1 className="text-3xl font-bold text-primary mb-3">Brak dostępu</h1>
          <p className="text-sm text-gray-500">
            Ten panel wymaga ukrytego sekretu w adresie URL.
          </p>
        </div>
      </div>
    );
  }

  const sortedArticles = useMemo(
    () =>
      [...articles].sort((a, b) =>
        a.sortOrder === b.sortOrder ? a.title.localeCompare(b.title) : a.sortOrder - b.sortOrder,
      ),
    [articles],
  );

  async function handleLogin() {
    setLoginError("");
    const response = await fetch(`${API_BASE}/admin/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entrySecret,
        password,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { token?: string; error?: string };
    if (!response.ok || !data.token) {
      setLoginError(data.error ?? "Logowanie nie powiodło się.");
      return;
    }

    localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
    setToken(data.token);
    setPassword("");
  }

  function logout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setToken("");
    setStatus("");
  }

  function startNewArticle() {
    setSelectedId("new");
    setEditor(emptyEditor);
    setStatus("");
  }

  function selectArticle(article: ArticleEditorRecord) {
    setSelectedId(article.id);
    setEditor(toEditorState(article));
    setStatus("");
  }

  async function saveArticle() {
    setIsSaving(true);
    setStatus("");

    const payload = {
      ...editor,
      slug: normalizeArticleSlug(editor.slug),
    };

    const response = await fetch(
      editor.id ? `${API_BASE}/admin/articles/${editor.id}` : `${API_BASE}/admin/articles`,
      {
        method: editor.id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const data = (await response.json().catch(() => ({}))) as ArticleEditorRecord & { error?: string };
    setIsSaving(false);

    if (!response.ok) {
      setStatus(data.error ?? "Nie udało się zapisać artykułu.");
      return;
    }

    setStatus("Artykuł zapisany.");
    const rows = await fetchAdminArticles(token);
    setArticles(rows);
    const saved = rows.find((row) => row.id === data.id);
    if (saved) {
      setSelectedId(saved.id);
      setEditor(toEditorState(saved));
    }
  }

  async function deleteArticle() {
    if (!editor.id) {
      startNewArticle();
      return;
    }

    if (!window.confirm("Usunąć ten artykuł?")) {
      return;
    }

    const response = await fetch(`${API_BASE}/admin/articles/${editor.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      setStatus("Nie udało się usunąć artykułu.");
      return;
    }

    setStatus("Artykuł usunięty.");
    const rows = await fetchAdminArticles(token);
    setArticles(rows);
    startNewArticle();
  }

  async function uploadCoverImage(file: File) {
    const dataUrl = await fileToDataUrl(file);
    const response = await fetch(`${API_BASE}/admin/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        dataUrl,
      }),
    });

    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Upload nie powiódł się.");
    }

    setEditor((current) => ({
      ...current,
      coverImage: data.url!,
    }));
  }

  async function uploadBodyImage(file: File) {
    const dataUrl = await fileToDataUrl(file);
    const response = await fetch(`${API_BASE}/admin/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename: file.name,
        mimeType: file.type,
        dataUrl,
      }),
    });

    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) {
      throw new Error(data.error ?? "Upload nie powiódł się.");
    }

    const snippet = `\n\n![${file.name}](${data.url})\n`;
    setEditor((current) => ({
      ...current,
      markdown: `${current.markdown}${snippet}`,
    }));
    markdownRef.current?.focus();
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f4f1ea] pt-28 pb-16 px-4">
        <div className="max-w-md mx-auto bg-white rounded-[28px] shadow-sm border border-[#e7e1d6] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9b8e78] mb-3">
            Panel redakcyjny
          </p>
          <h1 className="text-3xl font-bold text-primary mb-3">Zaloguj się</h1>
          <p className="text-sm text-gray-500 mb-6">
            To wejście działa tylko pod ukrytym adresem i dodatkowo wymaga hasła administratora.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Hasło administratora"
            className="w-full h-12 px-4 rounded-2xl border border-[#ded7c9] focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {loginError ? <p className="mt-3 text-sm text-red-600">{loginError}</p> : null}
          <button
            onClick={handleLogin}
            className="mt-5 w-full h-12 rounded-2xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
          >
            Wejdź do panelu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f3ec] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-white rounded-[28px] border border-[#e8e0d4] p-5 h-fit xl:sticky xl:top-28">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#9b8e78] font-semibold">
                  Artykuły
                </p>
                <h2 className="text-2xl font-bold text-primary">Baza wiedzy</h2>
              </div>
              <button
                onClick={startNewArticle}
                className="shrink-0 px-4 py-2 rounded-full bg-accent text-primary font-semibold"
              >
                Nowy
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {sortedArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => selectArticle(article)}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition-colors ${
                    selectedId === article.id
                      ? "border-primary bg-primary/5"
                      : "border-[#eee6d8] hover:border-primary/40 bg-[#fcfbf8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[#998b73]">
                      {article.category}
                    </span>
                    <span className={`text-[11px] font-semibold ${article.isPublished ? "text-green-700" : "text-amber-700"}`}>
                      {article.isPublished ? "Opublikowany" : "Szkic"}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary leading-snug">{article.title}</p>
                </button>
              ))}
            </div>
          </aside>

          <main className="bg-white rounded-[32px] border border-[#e8e0d4] p-6 md:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#9b8e78] font-semibold mb-2">
                  Edytor
                </p>
                <h1 className="text-3xl font-bold text-primary">
                  {editor.id ? "Edytuj artykuł" : "Nowy artykuł"}
                </h1>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={logout}
                  className="px-5 py-3 rounded-full border border-[#d8cfbf] text-primary font-semibold"
                >
                  Wyloguj
                </button>
                <button
                  onClick={deleteArticle}
                  className="px-5 py-3 rounded-full border border-red-200 text-red-700 font-semibold"
                >
                  Usuń
                </button>
                <button
                  onClick={saveArticle}
                  disabled={isSaving}
                  className="px-6 py-3 rounded-full bg-primary text-white font-semibold disabled:opacity-60"
                >
                  {isSaving ? "Zapisywanie…" : "Zapisz artykuł"}
                </button>
              </div>
            </div>

            {status ? <p className="mb-5 text-sm text-primary">{status}</p> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-primary">Tytuł</span>
                <input
                  value={editor.title}
                  onChange={(e) => setEditor((current) => ({ ...current, title: e.target.value }))}
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-[#ded7c9]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Slug</span>
                <input
                  value={editor.slug}
                  onChange={(e) => setEditor((current) => ({ ...current, slug: e.target.value }))}
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-[#ded7c9]"
                  placeholder="/nowy-artykul"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Kategoria</span>
                <select
                  value={editor.category}
                  onChange={(e) =>
                    setEditor((current) => ({
                      ...current,
                      category: e.target.value as ArticleCategory,
                    }))
                  }
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-[#ded7c9] bg-white"
                >
                  {ARTICLE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-primary">Kolejność</span>
                <input
                  type="number"
                  min={0}
                  value={editor.sortOrder}
                  onChange={(e) =>
                    setEditor((current) => ({
                      ...current,
                      sortOrder: Number(e.target.value || 0),
                    }))
                  }
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-[#ded7c9]"
                />
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-sm font-semibold text-primary">Lead / zajawka</span>
              <textarea
                value={editor.excerpt}
                onChange={(e) => setEditor((current) => ({ ...current, excerpt: e.target.value }))}
                className="mt-2 w-full min-h-28 px-4 py-3 rounded-2xl border border-[#ded7c9]"
              />
            </label>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 mt-4 items-end">
              <label className="block">
                <span className="text-sm font-semibold text-primary">Zdjęcie główne</span>
                <input
                  value={editor.coverImage}
                  onChange={(e) => setEditor((current) => ({ ...current, coverImage: e.target.value }))}
                  className="mt-2 w-full h-12 px-4 rounded-2xl border border-[#ded7c9]"
                  placeholder="https://... lub upload poniżej"
                />
              </label>
              <label className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-[#f1ece2] text-primary font-semibold cursor-pointer">
                Wgraj okładkę
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      await uploadCoverImage(file);
                      setStatus("Zdjęcie główne wgrane.");
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Upload nie powiódł się.");
                    } finally {
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-3 text-sm font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={editor.isPublished}
                  onChange={(e) => setEditor((current) => ({ ...current, isPublished: e.target.checked }))}
                />
                Artykuł opublikowany
              </label>
              <span className="text-sm text-gray-500">Szacowany czas czytania: {readMin} min</span>
            </div>

            <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-sm font-semibold text-primary">Treść artykułu (Markdown)</span>
                  <label className="inline-flex items-center justify-center h-10 px-4 rounded-full bg-[#f1ece2] text-primary text-sm font-semibold cursor-pointer">
                    Wgraj obraz do treści
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          await uploadBodyImage(file);
                          setStatus("Obraz dodany do treści.");
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Upload nie powiódł się.");
                        } finally {
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                </div>
                <textarea
                  ref={markdownRef}
                  value={editor.markdown}
                  onChange={(e) => setEditor((current) => ({ ...current, markdown: e.target.value }))}
                  className="w-full min-h-[540px] px-4 py-4 rounded-[24px] border border-[#ded7c9] font-mono text-sm"
                  placeholder="# Tytuł artykułu"
                />
              </div>

              <div className="space-y-6">
                <section className="rounded-[24px] border border-[#ece3d6] bg-[#fcfbf8] p-5">
                  <h2 className="text-lg font-bold text-primary mb-4">Czytaj też</h2>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {sortedArticles
                      .filter((article) => article.slug !== normalizeArticleSlug(editor.slug || "/"))
                      .map((article) => {
                        const checked = editor.relatedSlugs.includes(article.slug);
                        return (
                          <label key={article.id} className="flex items-start gap-3 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setEditor((current) => ({
                                  ...current,
                                  relatedSlugs: e.target.checked
                                    ? [...current.relatedSlugs, article.slug]
                                    : current.relatedSlugs.filter((value) => value !== article.slug),
                                }))
                              }
                            />
                            <span>
                              <span className="block font-semibold text-primary">{article.title}</span>
                              <span className="block text-gray-500">{article.slug}</span>
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </section>

                <section className="rounded-[24px] border border-[#ece3d6] bg-white p-5">
                  <h2 className="text-lg font-bold text-primary mb-4">Podgląd</h2>
                  {editor.coverImage ? (
                    <div className="rounded-2xl overflow-hidden aspect-[16/8] bg-gray-100 mb-4">
                      <img src={editor.coverImage} alt={editor.title || "Okładka"} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-bold text-primary mb-3">{editor.title || "Nowy artykuł"}</h3>
                  <p className="text-sm text-gray-500 mb-4">{editor.excerpt}</p>
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-primary prose-a:text-primary"
                  >
                    <ReactMarkdown>{editor.markdown || "Podgląd pojawi się tutaj."}</ReactMarkdown>
                  </div>
                </section>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
