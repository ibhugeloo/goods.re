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
import { demoItems, emptyItem } from "./data";
import { isDemoItem, loadItems, markSeeded, removeItem, removeItems, replaceItems, saveItem } from "./db";

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

const viewEntries = [
  ["owned", "Mes achats", "Achats", Check],
  ["wishlist", "Wishlist", "Wishlist", ArrowDown],
  ["suggestion", "Suggestions", "Idées", Lightbulb],
  ["all", "Tous les objets", "Tous", SquaresFour],
];

const statusLabels = {
  owned: "Dans la collection",
  wishlist: "À acquérir",
  suggestion: "À considérer",
};

function StatusIcon({ size = 12, status }) {
  if (status === "owned") return <Check aria-hidden="true" size={size} weight="bold" />;
  if (status === "suggestion") return <Lightbulb aria-hidden="true" size={size} weight="bold" />;
  return <ArrowDown aria-hidden="true" size={size} weight="bold" />;
}

// Garantie : seuls « bientôt » et « expirée » méritent une pastille sur la carte.
function warrantyState(item) {
  if (item.status !== "owned" || !item.warrantyUntil) return null;
  const end = new Date(`${item.warrantyUntil}T12:00:00`);
  if (Number.isNaN(end.getTime())) return null;

  const days = Math.round((end.getTime() - Date.now()) / 86400000);
  if (days < 0) return { days, flag: true, label: "Garantie expirée", tone: "expired" };
  if (days <= 90) return { days, flag: true, label: `Garantie · ${days} j`, tone: "soon" };
  return { days, flag: false, label: `Garantie · ${formatDate(item.warrantyUntil)}`, tone: "ok" };
}

// Écart entre le prix constaté et le prix cible d'un objet convoité.
function priceGap(item) {
  if (item.status === "owned") return null;
  const current = numericValue(item.currentValue);
  const target = numericValue(item.targetPrice);
  if (current === "" || target === "") return null;

  const diff = Math.round(current - target);
  if (diff <= 0) return { diff, label: "Au prix cible", reached: true };
  return { diff, label: `${money.format(diff)} au-dessus`, reached: false };
}

function StorageNote({ className, onExport, onResetDemo, showReset }) {
  return (
    <div className={className}>
      <p className="sidebar-footnote"><i /> Stockage local uniquement</p>
      <div className="storage-actions">
        <button className="text-link" onClick={onExport} type="button">Exporter une sauvegarde</button>
        {showReset && (
          <button className="text-link" onClick={onResetDemo} type="button">Retirer les exemples</button>
        )}
      </div>
    </div>
  );
}

function IntroPanel({
  activeView,
  brand,
  brands,
  categories,
  category,
  compact,
  counts,
  onBrand,
  onCategory,
  onExport,
  onResetDemo,
  onSearch,
  onToggleCompact,
  onView,
  search,
  showReset,
}) {
  const storage = { onExport, onResetDemo, showReset };

  return (
    <aside className={compact ? "archive-sidebar compact" : "archive-sidebar"}>
      <header className="sidebar-brand">
        <button
          aria-expanded={!compact}
          aria-label={compact ? "Déplier le sommaire" : "Replier le sommaire"}
          className="sidebar-toggle"
          onClick={onToggleCompact}
          title={compact ? "Déplier le sommaire" : "Replier le sommaire"}
          type="button"
        >
          <SidebarSimple aria-hidden="true" size={18} weight="regular" />
        </button>
        <div>
          <strong>Goods</strong>
          <span>Archives</span>
        </div>
      </header>

      <div className="sidebar-section">
        <p className="sidebar-label">Collection</p>
        <nav className="archive-views" aria-label="Vues de la collection">
          {viewEntries.map(([value, label, , Icon]) => (
            <button aria-label={label} className={activeView === value ? "active" : ""} key={value} onClick={() => onView(value)} title={label} type="button">
              <Icon aria-hidden="true" className="view-icon" size={15} weight="regular" />
              <span>{label}</span>
              <small>{String(counts[value]).padStart(2, "0")}</small>
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
        <StorageNote className="sidebar-storage" {...storage} />
      </div>

      <div className="mobile-toolbar">
        <nav className="mobile-views" aria-label="Vues de la collection">
          {viewEntries.map(([value, label, short, Icon]) => (
            <button aria-label={label} className={activeView === value ? "active" : ""} key={value} onClick={() => onView(value)} type="button">
              <Icon aria-hidden="true" size={13} weight="regular" />
              <span>{short}</span>
              <small>{String(counts[value]).padStart(2, "0")}</small>
            </button>
          ))}
        </nav>

        <label className="search-field mobile-search">
          <MagnifyingGlass aria-hidden="true" size={16} weight="regular" />
          <span className="sr-only">Rechercher dans la collection</span>
          <input onChange={(event) => onSearch(event.target.value)} placeholder="Rechercher" type="search" value={search} />
        </label>

        <div className="mobile-chips" role="group" aria-label="Filtrer par catégorie">
          <button className={category === "all" ? "chip active" : "chip"} onClick={() => onCategory("all")} type="button">Toutes</button>
          {categories.map((name) => (
            <button className={category === name ? "chip active" : "chip"} key={name} onClick={() => onCategory(name)} type="button">{name}</button>
          ))}
        </div>

      </div>
    </aside>
  );
}

function ProductCard({ index, item, onOpen }) {
  const displayValue = item.status === "owned" ? item.currentValue : item.targetPrice || item.currentValue;
  const valueLabel = item.status === "owned" ? "Valeur" : item.targetPrice ? "Cible" : "Prix";
  const warranty = warrantyState(item);
  const gap = priceGap(item);

  return (
    <article className={`object-card ${item.status}`}>
      <button
        aria-label={`Ouvrir la fiche ${item.name}`}
        className="card-hit"
        onClick={() => onOpen(item)}
        type="button"
      />
      <div className="object-stage">
        <div className="object-stamp">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span className="object-status">
            <StatusIcon status={item.status} />
            {statusLabels[item.status] ?? statusLabels.wishlist}
          </span>
        </div>

        <div className="product-visual">
          {item.image ? (
            <img alt={item.name} loading="lazy" src={item.image} />
          ) : (
            <ImageSquare aria-hidden="true" className="image-placeholder" size={42} weight="thin" />
          )}
        </div>

        {warranty?.flag && <p className={`card-flag ${warranty.tone}`}>{warranty.label}</p>}
        {gap && <p className={gap.reached ? "card-flag reached" : "card-flag"}>{gap.label}</p>}
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

function DetailRow({ children, label, tone = "" }) {
  if (!children) return null;
  return (
    <div className={tone ? `detail-row ${tone}` : "detail-row"}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function ItemDetail({ item, onClose, onDelete, onEdit, onStatus }) {
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

  const warranty = warrantyState(item);
  const gap = priceGap(item);
  const owned = item.status === "owned";
  const promotion = item.status === "suggestion"
    ? { label: "Passer en wishlist", status: "wishlist" }
    : item.status === "wishlist"
      ? { label: "Marquer comme acheté", status: "owned" }
      : null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="detail-title" aria-modal="true" className="item-modal item-detail" role="dialog">
        <header className="modal-header">
          <div>
            <p className="modal-kicker">
              <StatusIcon size={11} status={item.status} />
              {statusLabels[item.status] ?? statusLabels.wishlist}
            </p>
            <h1 id="detail-title">{item.name}</h1>
            <p className="detail-brand">{item.brand || "Sans marque"}{item.category ? ` · ${item.category}` : ""}</p>
          </div>
          <button aria-label="Fermer" className="icon-button" onClick={onClose} type="button">
            <X aria-hidden="true" size={17} weight="regular" />
          </button>
        </header>

        <div className="detail-body">
          <div className={`detail-visual ${item.status}`}>
            {item.image ? (
              <img alt={item.name} src={item.image} />
            ) : (
              <ImageSquare aria-hidden="true" className="image-placeholder" size={46} weight="thin" />
            )}
          </div>

          {item.notes && (
            <blockquote className="detail-notes">{item.notes}</blockquote>
          )}

          <dl className="detail-list">
            {owned ? (
              <>
                <DetailRow label="Payé">{item.purchasePrice === "" ? null : formatMoney(item.purchasePrice)}</DetailRow>
                <DetailRow label="Valeur estimée">{item.currentValue === "" ? null : formatMoney(item.currentValue)}</DetailRow>
                <DetailRow label="Acheté le">{item.purchaseDate ? formatDate(item.purchaseDate) : null}</DetailRow>
                <DetailRow label="Garantie" tone={warranty?.flag ? warranty.tone : ""}>
                  {warranty ? (warranty.tone === "expired" ? `Expirée le ${formatDate(item.warrantyUntil)}` : `Jusqu’au ${formatDate(item.warrantyUntil)}`) : null}
                </DetailRow>
                <DetailRow label="Où">{item.location || null}</DetailRow>
              </>
            ) : (
              <>
                <DetailRow label="Prix constaté">{item.currentValue === "" ? null : formatMoney(item.currentValue)}</DetailRow>
                <DetailRow label="Prix cible">{item.targetPrice === "" ? null : formatMoney(item.targetPrice)}</DetailRow>
                <DetailRow label="Écart" tone={gap?.reached ? "reached" : ""}>{gap ? gap.label : null}</DetailRow>
                <DetailRow label="Priorité">{item.priority || null}</DetailRow>
                <DetailRow label="Repéré le">{item.addedDate ? formatDate(item.addedDate) : null}</DetailRow>
              </>
            )}
            <DetailRow label="État">{item.condition || null}</DetailRow>
            <DetailRow label="Vendeur">{item.retailer || null}</DetailRow>
          </dl>

          {item.url && (
            <a className="detail-link" href={item.url} rel="noreferrer" target="_blank">
              <ArrowSquareOut aria-hidden="true" size={15} weight="regular" />
              Voir la fiche produit
            </a>
          )}
        </div>

        <footer className="modal-footer detail-footer">
          <button className="danger-button" onClick={() => onDelete(item)} type="button">
            <Trash aria-hidden="true" size={15} weight="regular" />
            Supprimer
          </button>
          <div>
            {promotion && (
              <button className="secondary-button" onClick={() => onStatus(item, promotion.status)} type="button">
                {promotion.label}
              </button>
            )}
            <button className="secondary-button" onClick={() => onEdit(item)} type="button">
              <PencilSimple aria-hidden="true" size={15} weight="regular" />
              Éditer
            </button>
          </div>
        </footer>
      </section>
    </div>
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
              <button className="danger-button" onClick={() => onDelete(draft)} type="button">
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

function ConfirmDialog({ request, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    const escape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", escape);
    confirmRef.current?.focus();
    return () => document.removeEventListener("keydown", escape);
  }, [onCancel]);

  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section aria-labelledby="confirm-title" aria-modal="true" className="confirm-dialog" role="alertdialog">
        <h2 id="confirm-title">{request.title}</h2>
        <p>{request.body}</p>
        <div className="confirm-actions">
          <button className="secondary-button" onClick={onCancel} type="button">Annuler</button>
          <button
            className={request.tone === "danger" ? "danger-button solid" : "primary-button"}
            onClick={request.onConfirm}
            ref={confirmRef}
            type="button"
          >
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

const emptyStates = {
  owned: {
    title: "Aucun achat archivé",
    body: "Ajoutez un objet que vous possédez : lieu, garantie et notes d’entretien resteront à portée.",
  },
  wishlist: {
    title: "Wishlist vide",
    body: "La wishlist rassemble ce que vous comptez acheter. Fixez un prix cible pour suivre l’écart.",
  },
  suggestion: {
    title: "Aucune suggestion",
    body: "Les suggestions sont les objets gardés sous le coude : idée cadeau, envie pas encore mûre. Passez-les en wishlist quand le désir devient réel.",
  },
  all: {
    title: "Collection vide",
    body: "Rien n’est enregistré dans ce navigateur. Ajoutez une pièce, importez une sauvegarde ou repartez des exemples.",
  },
};

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
  const [detailItem, setDetailItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const [notice, setNotice] = useState("");
  const importRef = useRef(null);

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

  useEffect(() => {
    if (category !== "all" && !categories.includes(category)) setCategory("all");
  }, [categories, category]);

  const counts = {
    all: items.length,
    owned: items.filter((item) => item.status === "owned").length,
    wishlist: items.filter((item) => item.status === "wishlist").length,
    suggestion: items.filter((item) => item.status === "suggestion").length,
  };

  const demoIds = useMemo(() => items.filter((item) => isDemoItem(item.id)).map((item) => item.id), [items]);
  const isFiltered = search.trim() !== "" || category !== "all" || brand !== "all";

  const handleSave = async (item) => {
    await saveItem(item);
    setItems((current) => {
      const exists = current.some((entry) => entry.id === item.id);
      return exists ? current.map((entry) => entry.id === item.id ? item : entry) : [item, ...current];
    });
    setEditingItem(null);
    setDetailItem((current) => (current && current.id === item.id ? item : current));
    setNotice(
      item.status === "owned"
        ? "Achat enregistré"
        : item.status === "suggestion"
          ? "Suggestion enregistrée"
          : "Wishlist mise à jour",
    );
  };

  const handleStatus = async (item, status) => {
    const next = { ...item, status };
    if (status === "owned" && !next.purchaseDate) next.purchaseDate = new Date().toISOString().slice(0, 10);
    await saveItem(next);
    setItems((current) => current.map((entry) => (entry.id === next.id ? next : entry)));
    setDetailItem(next);
    setNotice(status === "owned" ? "Déplacé dans les achats" : "Déplacé dans la wishlist");
  };

  const handleDelete = (item) => {
    setConfirmation({
      body: `« ${item.name} » sera retiré définitivement de ce navigateur. Cette action ne peut pas être annulée.`,
      confirmLabel: "Supprimer",
      onConfirm: async () => {
        await removeItem(item.id);
        setItems((current) => current.filter((entry) => entry.id !== item.id));
        setConfirmation(null);
        setEditingItem(null);
        setDetailItem(null);
        setNotice("Fiche supprimée");
      },
      title: "Supprimer cette fiche ?",
      tone: "danger",
    });
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

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed) || parsed.some((item) => !item.id || !item.name)) throw new Error("format");
    } catch {
      setNotice("Fichier JSON invalide");
      return;
    }

    setConfirmation({
      body: items.length > 0
        ? `L’import remplace la collection : ${items.length} objet${items.length > 1 ? "s" : ""} enregistré${items.length > 1 ? "s" : ""} seront écrasés par ${parsed.length} objet${parsed.length > 1 ? "s" : ""}. Exportez une sauvegarde avant si besoin.`
        : `${parsed.length} objet${parsed.length > 1 ? "s" : ""} seront chargés dans ce navigateur.`,
      confirmLabel: "Remplacer",
      onConfirm: async () => {
        await replaceItems(parsed);
        markSeeded();
        setItems(parsed);
        setActiveView("all");
        setCategory("all");
        setBrand("all");
        setSearch("");
        setConfirmation(null);
        setNotice("Collection importée");
      },
      title: "Remplacer la collection ?",
      tone: "danger",
    });
  };

  const handleResetDemo = () => {
    setConfirmation({
      body: `Les ${demoIds.length} objets d’exemple seront supprimés. Vos propres fiches sont conservées.`,
      confirmLabel: "Retirer",
      onConfirm: async () => {
        await removeItems(demoIds);
        markSeeded();
        setItems((current) => current.filter((entry) => !isDemoItem(entry.id)));
        setConfirmation(null);
        setNotice("Exemples retirés");
      },
      title: "Retirer les exemples ?",
      tone: "danger",
    });
  };

  const handleRestoreDemo = async () => {
    await replaceItems(demoItems);
    markSeeded();
    setItems(demoItems);
    setNotice("Exemples rechargés");
  };

  const emptyState = isFiltered
    ? { body: "Aucun objet ne correspond à cette recherche ou à ce filtre.", title: "Aucun résultat" }
    : emptyStates[activeView];

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
            onBrand={setBrand}
            onCategory={setCategory}
            onExport={handleExport}
            onResetDemo={handleResetDemo}
            onSearch={setSearch}
            onToggleCompact={() => setCompact((value) => !value)}
            onView={setActiveView}
            search={search}
            showReset={demoIds.length > 0}
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
                  <input onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher" type="search" value={search} />
                </label>
                <button className="primary-button desktop-add" onClick={() => setEditingItem({ ...emptyItem })} type="button"><Plus aria-hidden="true" size={16} /> <span>Ajouter</span></button>
                <button aria-label="Exporter la collection" className="icon-button" onClick={handleExport} title="Exporter la collection" type="button">
                  <DownloadSimple aria-hidden="true" size={16} weight="regular" />
                </button>
                <button aria-label="Importer une collection" className="icon-button" onClick={() => importRef.current?.click()} title="Importer une collection" type="button">
                  <UploadSimple aria-hidden="true" size={16} weight="regular" />
                </button>
                <input accept="application/json" className="hidden-input" onChange={handleImport} ref={importRef} type="file" />
              </div>
            </header>

            <section className="inventory-section" id="inventory" aria-live="polite">
              <div className="object-grid">
                {!ready ? (
                  <div className="empty-state"><span>Chargement de la collection</span></div>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => (
                    <ProductCard index={index} item={item} key={item.id} onOpen={setDetailItem} />
                  ))
                ) : (
                  <div className="empty-state">
                    {activeView === "suggestion" && !isFiltered
                      ? <Lightbulb aria-hidden="true" size={28} weight="thin" />
                      : <ImageSquare aria-hidden="true" size={28} weight="thin" />}
                    <strong>{emptyState.title}</strong>
                    <p>{emptyState.body}</p>
                    <div className="empty-actions">
                      <button className="secondary-button" onClick={() => setEditingItem({ ...emptyItem, status: activeView === "all" ? "wishlist" : activeView })} type="button">Ajouter un objet</button>
                      {items.length === 0 && !isFiltered && (
                        <button className="secondary-button" onClick={handleRestoreDemo} type="button">Charger les exemples</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <StorageNote
          className="mobile-storage"
          onExport={handleExport}
          onResetDemo={handleResetDemo}
          showReset={demoIds.length > 0}
        />

        <footer className="archive-footer">
          <span>OBJETS · Archive personnelle</span>
          <span>{new Date().getFullYear()} · Données locales</span>
        </footer>

        <button aria-label="Ajouter une pièce" className="mobile-add-button" onClick={() => setEditingItem({ ...emptyItem })} type="button">
          <Plus aria-hidden="true" size={20} weight="regular" />
        </button>

        {detailItem && !editingItem && (
          <ItemDetail
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onDelete={handleDelete}
            onEdit={(item) => setEditingItem(item)}
            onStatus={handleStatus}
          />
        )}

        {editingItem && (
          <ItemModal
            initialItem={editingItem}
            onClose={() => setEditingItem(null)}
            onDelete={handleDelete}
            onSave={handleSave}
          />
        )}

        {confirmation && <ConfirmDialog onCancel={() => setConfirmation(null)} request={confirmation} />}

        {notice && <div className="notice" role="status">{notice}</div>}
      </main>
    </>
  );
}
