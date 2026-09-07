import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowSquareOut,
  Check,
  DownloadSimple,
  ImageSquare,
  Lightbulb,
  MagnifyingGlass,
  PencilSimple,
  Plus,
  SidebarSimple,
  SquaresFour,
  Trash,
  UploadSimple,
  X,
} from "@phosphor-icons/react";
import { emptyItem } from "./data";
import { loadItems, removeItem, replaceItems, saveItem } from "./db";

const money = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatMoney(value) {
  return value === "" || value === null || value === undefined
    ? "Non renseigné"
    : money.format(Number(value));
}

function formatDate(value) {
  if (!value) return "Sans date";
  return date.format(new Date(`${value}T12:00:00`));
}

function numericValue(value) {
  if (value === "" || value === null || value === undefined) return "";
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : "";
}

const viewLabels = {
  owned: "Mes achats",
  wishlist: "Wishlist",
  suggestion: "Suggestions",
  all: "Tous les objets",
};

function IntroPanel({
  activeView,
  brand,
  brands,
  categories,
  category,
  compact,
  counts,
  onAdd,
  onBrand,
  onCategory,
  onExport,
  onImport,
  onSearch,
  onToggleCompact,
  onView,
  search,
}) {
  const importRef = useRef(null);
  return (
    <aside className={compact ? "archive-sidebar compact" : "archive-sidebar"}>
      <header className="sidebar-brand">
        <span className="brand-mark" aria-hidden="true">G/01</span>
        <div>
          <strong>Goods</strong>
          <span>Personal archive</span>
        </div>
        <button
          aria-expanded={!compact}
          aria-label={compact ? "Déplier le sommaire" : "Replier le sommaire"}
          className="sidebar-toggle"
          onClick={onToggleCompact}
          title={compact ? "Déplier le sommaire" : "Replier le sommaire"}
          type="button"
        >
          <SidebarSimple aria-hidden="true" size={16} weight="regular" />
        </button>
      </header>

      <div className="sidebar-section">
        <p className="sidebar-label">Collection</p>
        <nav className="archive-views" aria-label="Vues de la collection">
          {[
            ["owned", "Mes achats", counts.owned, Check],
            ["wishlist", "Wishlist", counts.wishlist, ArrowDown],
            ["suggestion", "Suggestions", counts.suggestion, Lightbulb],
            ["all", "Tous les objets", counts.all, SquaresFour],
          ].map(([value, label, count, Icon]) => (
            <button aria-label={label} className={activeView === value ? "active" : ""} key={value} onClick={() => onView(value)} title={label} type="button">
              <Icon aria-hidden="true" className="view-icon" size={15} weight="regular" />
              <span>{label}</span>
              <small>{String(count).padStart(2, "0")}</small>
            </button>
          ))}
        </nav>
      </div>

      <div className="sidebar-section sidebar-filters">
        <p className="sidebar-label">Filtrer par catégorie</p>
        <button className={category === "all" ? "filter-link active" : "filter-link"} onClick={() => onCategory("all")} type="button">Toutes</button>
        {categories.map((name) => <button className={category === name ? "filter-link active" : "filter-link"} key={name} onClick={() => onCategory(name)} type="button">{name}</button>)}
      </div>

      {brands.length > 0 && (
        <div className="sidebar-section sidebar-filters sidebar-brands">
          <p className="sidebar-label">Top marques</p>
          <button className={brand === "all" ? "filter-link brand-link active" : "filter-link brand-link"} onClick={() => onBrand("all")} type="button">
            <span>Toutes</span>
          </button>
          {brands.map(([name, count]) => (
            <button className={brand === name ? "filter-link brand-link active" : "filter-link brand-link"} key={name} onClick={() => onBrand(name)} type="button">
              <span>{name}</span>
              <small>{String(count).padStart(2, "0")}</small>
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-bottom">
        <button aria-label="Ajouter un objet" className="sidebar-add" onClick={onAdd} title="Ajouter un objet" type="button"><Plus aria-hidden="true" size={16} /> <span>Ajouter un objet</span></button>
        <div className="sidebar-tools">
          <button onClick={onExport} type="button"><DownloadSimple aria-hidden="true" size={15} /> Exporter</button>
          <button onClick={() => importRef.current?.click()} type="button"><UploadSimple aria-hidden="true" size={15} /> Importer</button>
          <input accept="application/json" className="hidden-input" onChange={onImport} ref={importRef} type="file" />
        </div>
        <p className="sidebar-footnote"><i /> Stockage local uniquement</p>
      </div>

      <div className="mobile-filter-row">
        <label className="search-field">
          <MagnifyingGlass aria-hidden="true" size={16} weight="regular" />
          <span className="sr-only">Rechercher dans la collection</span>
          <input onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher" type="search" value={search} />
        </label>
        <button className="primary-button" onClick={onAdd} type="button"><Plus aria-hidden="true" size={16} /></button>
      </div>
    </aside>
  );
}

function ProductCard({ index, item, onEdit }) {
  const displayValue = item.status === "owned" ? item.currentValue : item.targetPrice || item.currentValue;
  const valueLabel = item.status === "owned" ? "Valeur" : item.targetPrice ? "Cible" : "Prix";

  return (
    <article className={`object-card ${item.status}`}>
      <div className="object-stage">
        <div className="object-stamp">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="object-status">
            {item.status === "owned" ? <Check size={12} weight="bold" /> : item.status === "suggestion" ? <Lightbulb size={12} weight="bold" /> : <ArrowDown size={12} weight="bold" />}
            {item.status === "owned" ? "Dans la collection" : item.status === "suggestion" ? "Suggestion" : "À acquérir"}
          </span>
        </div>
        <button aria-label={`Modifier ${item.name}`} className="edit-button" onClick={() => onEdit(item)} type="button">
          <PencilSimple aria-hidden="true" size={16} weight="regular" />
        </button>

        <div className="product-visual">
          {item.image ? (
            <img alt={item.name} loading="lazy" src={item.image} />
          ) : (
            <ImageSquare aria-hidden="true" className="image-placeholder" size={42} weight="thin" />
          )}
        </div>
      </div>

      <div className="object-caption">
        <div className="object-title">
          <p>{item.brand || "Sans marque"}</p>
          <h2>{item.name}</h2>
        </div>
        <div className="object-ledger">
          <span>{valueLabel}</span>
          <strong>{formatMoney(displayValue)}</strong>
          <small>{item.status === "owned" ? formatDate(item.purchaseDate) : item.priority || "À suivre"}</small>
        </div>
      </div>
    </article>
  );
}

function Field({ children, className = "", label }) {
  return (
    <label className={`form-field ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ItemModal({ initialItem, onClose, onDelete, onSave }) {
  const [draft, setDraft] = useState(initialItem);
  const fileRef = useRef(null);

  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", escape);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", escape);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const handleImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    onSave({
      ...draft,
      id: draft.id || crypto.randomUUID(),
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      category: draft.category.trim() || "Autre",
      purchasePrice: numericValue(draft.purchasePrice),
      currentValue: numericValue(draft.currentValue),
      targetPrice: numericValue(draft.targetPrice),
    });
  };

  const isLocalImage = draft.image?.startsWith("data:");

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="modal-title" aria-modal="true" className="item-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">{draft.id ? "Modifier la fiche" : "Nouvelle pièce"}</p>
            <h1 id="modal-title">{draft.name || "Ajouter à la collection"}</h1>
          </div>
          <button aria-label="Fermer" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={17} weight="regular" />
          </button>
        </header>

        <form onSubmit={submit}>
          <div className="status-switch" role="group" aria-label="Statut de l’objet">
            <button
              className={draft.status === "owned" ? "active" : ""}
              onClick={() => update("status", "owned")}
              type="button"
            >
              Acheté
            </button>
            <button
              className={draft.status === "wishlist" ? "active" : ""}
              onClick={() => update("status", "wishlist")}
              type="button"
            >
              Wishlist
            </button>
            <button
              className={draft.status === "suggestion" ? "active" : ""}
              onClick={() => update("status", "suggestion")}
              type="button"
            >
              Suggestion
            </button>
          </div>

          <div className="form-grid">
            <Field className="span-two" label="Nom">
              <input autoFocus onChange={(event) => update("name", event.target.value)} required value={draft.name} />
            </Field>
            <Field label="Marque">
              <input onChange={(event) => update("brand", event.target.value)} value={draft.brand} />
            </Field>
            <Field label="Catégorie">
              <input onChange={(event) => update("category", event.target.value)} value={draft.category} />
            </Field>
            <Field label="Prix d’achat">
              <div className="money-input"><input min="0" onChange={(event) => update("purchasePrice", event.target.value)} step="0.01" type="number" value={draft.purchasePrice} /><span>€</span></div>
            </Field>
            <Field label="Valeur actuelle">
              <div className="money-input"><input min="0" onChange={(event) => update("currentValue", event.target.value)} step="0.01" type="number" value={draft.currentValue} /><span>€</span></div>
            </Field>
            <Field label="Prix cible">
              <div className="money-input"><input min="0" onChange={(event) => update("targetPrice", event.target.value)} step="0.01" type="number" value={draft.targetPrice} /><span>€</span></div>
            </Field>
            <Field label={draft.status === "owned" ? "Date d’achat" : "Date d’ajout"}>
              <input
                onChange={(event) => update(draft.status === "owned" ? "purchaseDate" : "addedDate", event.target.value)}
                type="date"
                value={draft.status === "owned" ? draft.purchaseDate : draft.addedDate}
              />
            </Field>
            <Field label={draft.status === "owned" ? "Garantie jusqu’au" : "Priorité"}>
              {draft.status === "owned" ? (
                <input onChange={(event) => update("warrantyUntil", event.target.value)} type="date" value={draft.warrantyUntil} />
              ) : (
                <select onChange={(event) => update("priority", event.target.value)} value={draft.priority}>
                  <option>Basse</option>
                  <option>Moyenne</option>
                  <option>Haute</option>
                </select>
              )}
            </Field>
            <Field label="État">
              <select onChange={(event) => update("condition", event.target.value)} value={draft.condition}>
                <option>Neuf</option>
                <option>Excellent</option>
                <option>Très bon</option>
                <option>Bon</option>
                <option>Patiné</option>
                <option>À réparer</option>
              </select>
            </Field>
            <Field label="Vendeur">
              <input onChange={(event) => update("retailer", event.target.value)} value={draft.retailer} />
            </Field>
            <Field label="Emplacement">
              <input onChange={(event) => update("location", event.target.value)} value={draft.location} />
            </Field>
            <Field className="span-two" label="Lien produit">
              <div className="linked-input">
                <input onChange={(event) => update("url", event.target.value)} placeholder="https://" type="url" value={draft.url} />
                {draft.url && (
                  <a aria-label="Ouvrir le lien produit" href={draft.url} rel="noreferrer" target="_blank">
                    <ArrowSquareOut aria-hidden="true" size={16} weight="regular" />
                  </a>
                )}
              </div>
            </Field>
            <Field className="span-two" label="Photo">
              <div className="image-field">
                <input
                  onChange={(event) => update("image", event.target.value)}
                  placeholder={isLocalImage ? "Image locale importée" : "URL de l’image"}
                  value={isLocalImage ? "" : draft.image}
                />
                <button onClick={() => fileRef.current?.click()} type="button">
                  <UploadSimple aria-hidden="true" size={15} weight="regular" />
                  Importer
                </button>
                <input accept="image/*" className="hidden-input" onChange={handleImage} ref={fileRef} type="file" />
              </div>
            </Field>
            <Field className="span-two" label="Notes">
              <textarea onChange={(event) => update("notes", event.target.value)} rows="3" value={draft.notes} />
            </Field>
          </div>

          <footer className="modal-footer">
            {draft.id ? (
              <button className="danger-button" onClick={() => onDelete(draft.id)} type="button">
                <Trash aria-hidden="true" size={15} weight="regular" />
                Supprimer
              </button>
            ) : <span />}
            <div>
              <button className="secondary-button" onClick={onClose} type="button">Annuler</button>
              <button className="primary-button" type="submit">Enregistrer</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}

export function App() {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState("owned");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [compact, setCompact] = useState(() => {
    try {
      return window.localStorage.getItem("goods.sidebar-compact") === "1";
    } catch {
      return false;
    }
  });
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    loadItems()
      .then(setItems)
      .catch(() => setNotice("Impossible de charger les données locales"))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("goods.sidebar-compact", compact ? "1" : "0");
    } catch {
      // stockage indisponible, le repli reste valable pour la session
    }
  }, [compact]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const categories = useMemo(
    () => [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr")),
    [items],
  );

  const brands = useMemo(() => {
    const tally = new Map();
    for (const item of items) {
      const name = item.brand?.trim();
      if (!name) continue;
      tally.set(name, (tally.get(name) ?? 0) + 1);
    }
    return [...tally.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
      .slice(0, 5);
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return items.filter((item) => {
      const viewMatch = activeView === "all" || item.status === activeView;
      const categoryMatch = category === "all" || item.category === category;
      const brandMatch = brand === "all" || item.brand?.trim() === brand;
      const searchMatch = !query || [item.name, item.brand, item.category, item.notes]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase("fr").includes(query));
      return viewMatch && categoryMatch && brandMatch && searchMatch;
    });
  }, [activeView, brand, category, items, search]);

  useEffect(() => {
    if (brand !== "all" && !brands.some(([name]) => name === brand)) setBrand("all");
  }, [brand, brands]);

  const counts = {
    all: items.length,
    owned: items.filter((item) => item.status === "owned").length,
    wishlist: items.filter((item) => item.status === "wishlist").length,
    suggestion: items.filter((item) => item.status === "suggestion").length,
  };

  const handleSave = async (item) => {
    await saveItem(item);
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current];
    });
    setEditingItem(null);
    setNotice(
      item.status === "owned"
        ? "Achat enregistré"
        : item.status === "suggestion"
          ? "Suggestion enregistrée"
          : "Wishlist mise à jour",
    );
  };

  const handleDelete = async (id) => {
    await removeItem(id);
    setItems((current) => current.filter((item) => item.id !== id));
    setEditingItem(null);
    setNotice("Fiche supprimée");
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `collection-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Collection exportée");
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.name)) throw new Error("format");
      await replaceItems(parsed);
      setItems(parsed);
      setActiveView("all");
      setCategory("all");
      setBrand("all");
      setSearch("");
      setNotice("Collection importée");
    } catch {
      setNotice("Fichier JSON invalide");
    }
  };

  return (
    <>
      <a className="skip-link" href="#inventory">Aller à l’inventaire</a>
      <main id="content">
        <div className={compact ? "app-shell compact" : "app-shell"}>
          <IntroPanel
            activeView={activeView}
            categories={categories}
            category={category}
            brand={brand}
            brands={brands}
            compact={compact}
            counts={counts}
            onAdd={() => setEditingItem({ ...emptyItem })}
            onBrand={setBrand}
            onCategory={setCategory}
            onExport={handleExport}
            onImport={handleImport}
            onSearch={setSearch}
            onToggleCompact={() => setCompact((value) => !value)}
            onView={setActiveView}
            search={search}
          />

          <div className="archive-workspace">
            <header className="workspace-header">
              <div>
                <p className="workspace-kicker">Collection · {String(counts.all).padStart(2, "0")} objets</p>
                <h1>{viewLabels[activeView]}</h1>
              </div>
              <div className="workspace-actions">
                <label className="search-field desktop-search">
                  <MagnifyingGlass aria-hidden="true" size={16} weight="regular" />
                  <span className="sr-only">Rechercher dans la collection</span>
                  <input onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher" type="search" value={search} />
                </label>
                <button className="primary-button" onClick={() => setEditingItem({ ...emptyItem })} type="button"><Plus aria-hidden="true" size={16} /> <span>Ajouter</span></button>
              </div>
            </header>

            <section className="inventory-section" id="inventory" aria-live="polite">
              <div className="object-grid">
                {!ready ? (
                  <div className="empty-state"><span>Chargement de la collection</span></div>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <ProductCard index={index} item={item} key={item.id} onEdit={setEditingItem} />
                  ))
                ) : (
                  <div className="empty-state">
                    <ImageSquare aria-hidden="true" size={28} weight="thin" />
                    <span>Aucun objet dans cette sélection</span>
                    <button className="secondary-button" onClick={() => setEditingItem({ ...emptyItem })} type="button">Ajouter un objet</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <footer className="archive-footer">
          <span>OBJETS · Archive personnelle</span>
          <span>{new Date().getFullYear()} · Données locales</span>
        </footer>

      <button aria-label="Ajouter une pièce" className="mobile-add-button" onClick={() => setEditingItem({ ...emptyItem })} type="button">
        <Plus aria-hidden="true" size={18} weight="regular" />
      </button>

        {editingItem && (
          <ItemModal
            initialItem={editingItem}
            onClose={() => setEditingItem(null)}
            onDelete={handleDelete}
            onSave={handleSave}
          />
        )}

        {notice && <div className="notice" role="status">{notice}</div>}
      </main>
    </>
  );
}
