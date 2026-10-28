import React, { useState, useMemo, memo, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaShoppingCart, FaCheck } from "react-icons/fa";
import { FiSearch, FiX } from "react-icons/fi";
import { MdToggleOn, MdToggleOff, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { enqueueSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, getMenuItems, getPopularItems, toggleMenuItemAvailability } from "../../https";
import Skeleton from "../ui/Skeleton";

/**
 * Category chips in a padded row that lines up with the search bar below.
 * When the chips don't all fit, small arrow buttons appear at both ends
 * (instead of the chips running off the edge of the window).
 */
const ChipRow = ({ children }) => {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ overflow: false, atStart: true, atEnd: true });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdge({
      overflow: el.scrollWidth > el.clientWidth + 1,
      atStart: el.scrollLeft <= 1,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const scrollBy = (dir) => ref.current?.scrollBy({ left: dir * Math.max(240, ref.current.clientWidth * 0.7), behavior: "smooth" });

  const arrow = (dir, disabled, Icon, label) => (
    <button
      type="button"
      onClick={() => scrollBy(dir)}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tint/10 bg-tint/5 text-ink transition-colors hover:bg-tint/10 disabled:opacity-30 disabled:hover:bg-tint/5"
    >
      <Icon size={22} />
    </button>
  );

  return (
    <div className="shrink-0 px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2">
        {edge.overflow && arrow(-1, edge.atStart, MdChevronLeft, "Scroll categories left")}
        <div
          ref={ref}
          onScroll={measure}
          className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide"
          role="tablist"
          aria-label="Menu categories"
        >
          {children}
        </div>
        {edge.overflow && arrow(1, edge.atEnd, MdChevronRight, "Scroll categories right")}
      </div>
    </div>
  );
};

const MAX_QTY = 10;
const POPULAR_ID = "popular";
const ALL_ID = "all";
const LOW_STOCK = 5;

const TYPE_FILTERS = [
  { id: "all",    label: "All" },
  { id: "veg",    label: "Veg",     dot: "bg-green-500" },
  { id: "nonveg", label: "Non-veg", dot: "bg-red-500" },
  { id: "drinks", label: "Drinks",  dot: "bg-sky-400" },
];
const matchesType = (item, filter) => {
  if (filter === "veg") return item.type === "Vegetarian";
  if (filter === "nonveg") return item.type === "Non-Vegetarian";
  if (filter === "drinks") return ["Hot", "Cold", "Mocktail"].includes(item.type);
  return true;
};

const SORTS = [
  { id: "menu",  label: "Menu order" },
  { id: "name",  label: "Name A–Z" },
  { id: "low",   label: "Price: low → high" },
  { id: "high",  label: "Price: high → low" },
];
const sortItems = (list, sort) => {
  if (sort === "menu") return list;
  const copy = [...list];
  if (sort === "name") copy.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "low") copy.sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  if (sort === "high") copy.sort((a, b) => b.price - a.price || a.name.localeCompare(b.name));
  return copy;
};

// Green / red marker like the veg / non-veg symbol on printed menus; drinks get a temperature dot.
const TYPE_DOT = {
  Vegetarian: "bg-green-500",
  "Non-Vegetarian": "bg-red-500",
  Hot: "bg-orange-500",
  Cold: "bg-sky-400",
  Mocktail: "bg-violet-400",
};
const TypeBadge = ({ type }) => (
  <span className="flex items-center gap-1.5 text-[11px] text-ink-2">
    {TYPE_DOT[type] && <span className={`inline-block h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />}
    {type}
  </span>
);

/**
 * One dish. Its quantity lives in its OWN state so tapping + on one dish only
 * re-renders that card (memo). In `viewOnly` mode the card is a plain menu
 * entry — no quantity stepper or add-to-cart button.
 */
const DishCard = memo(function DishCard({ item, canToggle, onAdd, onToggle, toggling, showCategory, viewOnly }) {
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const hasStock = typeof item.stock === "number";
  const soldOut = hasStock && item.stock <= 0;
  const lowStock = hasStock && item.stock > 0 && item.stock <= LOW_STOCK;
  const maxQty = hasStock ? Math.max(1, Math.min(MAX_QTY, item.stock)) : MAX_QTY;
  const orderable = item.isAvailable && !soldOut;
  const accent = item.category?.bgColor;

  const add = () => {
    onAdd(item, qty);
    setQty(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`glass-card group flex min-h-[132px] flex-col overflow-hidden p-4 pl-5 transition-all ${
        orderable ? "hover:-translate-y-1 hover:!border-[#F6B100]/40" : "opacity-60"
      }`}
    >
      {/* category colour edge */}
      {accent && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />}

      <div className="flex w-full items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold leading-snug text-ink">{item.name}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {item.type && <TypeBadge type={item.type} />}
            {showCategory && item.category && (
              <span className="text-[10px] text-ink-3">{item.category.icon} {item.category.name}</span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 empty:hidden">
            {!item.isAvailable && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">Unavailable</span>
            )}
            {item.isAvailable && soldOut && (
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">Out of stock</span>
            )}
            {orderable && lowStock && (
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-300">Only {item.stock} left</span>
            )}
          </div>
        </div>
        {/* Availability toggle — admin & cashier only */}
        {canToggle && (
          <button
            onClick={() => onToggle(item._id)}
            disabled={toggling}
            title={item.isAvailable ? "Mark unavailable" : "Mark available"}
            aria-label={item.isAvailable ? `Mark ${item.name} unavailable` : `Mark ${item.name} available`}
            className="shrink-0 transition-transform hover:scale-110"
          >
            {item.isAvailable
              ? <MdToggleOn  className="text-[#02ca3a]" size={28} />
              : <MdToggleOff className="text-ink-2" size={28} />}
          </button>
        )}
      </div>

      <div className="mt-auto flex w-full items-center justify-between gap-2 pt-4">
        <p className="font-num text-xl font-bold text-gold">৳{item.price}</p>
        {!viewOnly && orderable && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border border-tint/10 bg-shade/25 px-1 py-0.5">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label={`Decrease ${item.name} quantity`}
                className="h-6 w-6 rounded-full text-lg font-bold leading-none text-accent hover:bg-tint/10 max-sm:h-8 max-sm:w-8"
              >&minus;</button>
              <span className="w-5 text-center text-sm font-semibold text-ink max-sm:w-6">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                aria-label={`Increase ${item.name} quantity`}
                className="h-6 w-6 rounded-full text-lg font-bold leading-none text-accent hover:bg-tint/10 max-sm:h-8 max-sm:w-8"
              >&#43;</button>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={add}
              aria-label={`Add ${item.name} to cart`}
              className={`rounded-full p-2.5 transition-colors max-sm:p-3 ${
                justAdded ? "bg-[#02ca3a] text-[#0b2a12]" : "bg-[#F6B100] text-[#1a1a1a] hover:bg-[#FFD25E]"
              }`}
            >
              {justAdded ? <FaCheck size={15} /> : <FaShoppingCart size={15} />}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

const Chip = ({ active, onClick, label, count, color }) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? "border-[#F6B100] bg-[#F6B100] text-[#1a1a1a] shadow-glow"
        : "border-tint/10 bg-tint/5 text-ink hover:border-tint/25 hover:bg-tint/10"
    }`}
  >
    {color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
    {label}
    <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/15" : "bg-shade/20 text-ink-2"}`}>{count}</span>
  </button>
);

const SectionHeading = ({ category, count }) => (
  <div className="col-span-full mt-2 flex items-center gap-3 first:mt-0">
    <span
      className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
      style={{ backgroundColor: `${category.bgColor || "#5b45b0"}33` }}
      aria-hidden="true"
    >
      {category.icon || "🍽️"}
    </span>
    <h2 className="font-display text-lg font-bold text-ink">{category.name}</h2>
    <span className="rounded-full border border-tint/10 bg-tint/5 px-2 py-0.5 text-[11px] font-semibold text-ink-2">{count}</span>
    <span className="gold-rule ml-1 flex-1 opacity-50" />
  </div>
);

/**
 * The dish browser. `viewOnly` turns it into a read-only menu (no cart), used
 * when nobody is building an order; otherwise it is the order-builder menu.
 */
const MenuContainer = ({ viewOnly = false }) => {
  const dispatch     = useDispatch();
  const queryClient  = useQueryClient();
  const role         = useSelector((s) => s.user?.role);
  const canToggle    = ["admin", "cashier"].includes(role?.toLowerCase());

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("menu");
  const [hideUnavailable, setHideUnavailable] = useState(false);

  const { data: categoriesRes, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });
  const { data: itemsRes, isLoading: itemsLoading } = useQuery({
    queryKey: ["menu-items"],
    queryFn: () => getMenuItems(),
    // Refetch every 30s so availability changes by another terminal show up
    refetchInterval: 30000,
  });

  // "Popular" chip: the dishes ordered most, kept only if they are still on the menu.
  const { data: popularRes } = useQuery({
    queryKey: ["popular-items", "menu"],
    queryFn: () => getPopularItems(12),
    staleTime: 60000,
  });

  const categories = useMemo(() => categoriesRes?.data?.data || [], [categoriesRes]);
  const allItems   = useMemo(() => itemsRes?.data?.data    || [], [itemsRes]);

  const popularItems = useMemo(() => {
    const byName = new Map(allItems.map((i) => [i.name, i]));
    return (popularRes?.data?.data || []).map((p) => byName.get(p.name)).filter(Boolean);
  }, [popularRes, allItems]);
  const showPopular = popularItems.length > 0;

  // Reading the menu starts on "All dishes"; building an order starts on the first category.
  const activeId = selectedId ?? (viewOnly ? ALL_ID : categories[0]?._id ?? ALL_ID);
  const popularSelected = activeId === POPULAR_ID && showPopular;
  const allSelected = activeId === ALL_ID || (activeId === POPULAR_ID && !showPopular);
  const selectedCategory = categories.find((c) => c._id === activeId) || null;

  const countByCategory = useMemo(() => {
    const m = {};
    allItems.forEach((i) => { const id = i.category?._id; if (id) m[id] = (m[id] || 0) + 1; });
    return m;
  }, [allItems]);

  const query = search.trim().toLowerCase();
  const filtersActive = typeFilter !== "all" || hideUnavailable || sort !== "menu";

  // Everything that survives the search / type / availability filters.
  const filteredItems = useMemo(() => {
    let list;
    if (query) {
      list = allItems.filter((i) => i.name.toLowerCase().includes(query) || i.category?.name?.toLowerCase().includes(query));
    } else if (popularSelected) list = popularItems;
    else if (allSelected) list = allItems;
    else list = allItems.filter((i) => i.category?._id === selectedCategory?._id);

    return list.filter((i) => matchesType(i, typeFilter) && (!hideUnavailable || (i.isAvailable && i.stock !== 0)));
  }, [allItems, query, popularSelected, popularItems, allSelected, selectedCategory, typeFilter, hideUnavailable]);

  // "All dishes" without a search reads like a printed menu: one section per category.
  const grouped = allSelected && !query && !popularSelected;
  const sections = useMemo(() => {
    if (!grouped) return [];
    return categories
      .map((cat) => ({ cat, items: sortItems(filteredItems.filter((i) => i.category?._id === cat._id), sort) }))
      .filter((s) => s.items.length > 0);
  }, [grouped, categories, filteredItems, sort]);
  const flatItems = useMemo(() => (grouped ? [] : sortItems(filteredItems, sort)), [grouped, filteredItems, sort]);

  const resetFilters = () => { setTypeFilter("all"); setHideUnavailable(false); setSort("menu"); setSearch(""); };

  const handleAddToCart = (item, qty) => {
    dispatch(addItems({
      id: `${item._id}-${Date.now()}`,
      menuItem: item._id,
      name: item.name,
      pricePerQuantity: item.price,
      quantity: qty,
      price: Math.round(item.price * qty * 100) / 100,
    }));
  };

  const toggleMutation = useMutation({
    mutationFn: (itemId) => toggleMenuItemAvailability(itemId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      const item = res.data.data;
      enqueueSnackbar(res.data.message, { variant: "success" });
      dispatch(addNotification({
        type: item.isAvailable ? "item_available" : "item_unavailable",
        title: item.isAvailable ? `${item.name} is back` : `${item.name} marked unavailable`,
        message: item.isAvailable
          ? `${item.name} can now be ordered again.`
          : `${item.name} has been 86'd — removed from ordering.`,
      }));
    },
    onError: (err) =>
      enqueueSnackbar(err?.response?.data?.message || "Failed to toggle availability!", { variant: "error" }),
  });

  const gridCols = viewOnly
    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex gap-2 px-4 py-2 sm:px-6">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-28 shrink-0 rounded-full" />)}
        </div>
        <div className={`grid ${gridCols} gap-4 px-4 py-4 sm:px-6`}>
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-[132px] rounded-[20px]" />)}
        </div>
      </div>
    );
  }

  const shown = grouped ? sections.reduce((n, s) => n + s.items.length, 0) : flatItems.length;
  const renderCard = (item, showCategory) => (
    <DishCard
      key={item._id}
      item={item}
      canToggle={canToggle}
      onAdd={handleAddToCart}
      onToggle={toggleMutation.mutate}
      toggling={toggleMutation.isPending}
      showCategory={showCategory}
      viewOnly={viewOnly}
    />
  );

  return (
    <div className="flex flex-col h-full">
      {/* Categories — one scrollable row of chips */}
      <ChipRow>
        <Chip
          active={!query && allSelected}
          onClick={() => { setSelectedId(ALL_ID); setSearch(""); }}
          label="All dishes"
          count={allItems.length}
        />
        {showPopular && (
          <Chip
            active={!query && popularSelected}
            onClick={() => { setSelectedId(POPULAR_ID); setSearch(""); }}
            label="🔥 Popular"
            count={popularItems.length}
          />
        )}
        {categories.map((cat) => (
          <Chip
            key={cat._id}
            active={!query && !popularSelected && !allSelected && selectedCategory?._id === cat._id}
            onClick={() => { setSelectedId(cat._id); setSearch(""); }}
            label={`${cat.icon || ""} ${cat.name}`.trim()}
            count={countByCategory[cat._id] || 0}
            color={cat.bgColor}
          />
        ))}
      </ChipRow>

      {/* Search + filters */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-4 pt-3 sm:px-6">
        <label className="flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-tint/10 bg-tint/5 px-4 py-2.5 text-sm backdrop-blur transition-colors focus-within:border-[#F6B100]/60 focus-within:bg-tint/10">
          <FiSearch className="text-ink-2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes or categories…"
            aria-label="Search dishes"
            className="flex-1 bg-transparent text-ink placeholder-ink-4 focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search" className="text-ink-2 hover:text-ink">
              <FiX />
            </button>
          )}
        </label>

        {/* Dish type */}
        <div className="flex items-center gap-1 rounded-full border border-tint/10 bg-tint/5 p-1" role="group" aria-label="Dish type">
          {TYPE_FILTERS.map((t) => {
            const on = typeFilter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                aria-pressed={on}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  on ? "bg-[#F6B100] text-[#1a1a1a]" : "text-ink-2 hover:text-ink"
                }`}
              >
                {t.dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />}
                {t.label}
              </button>
            );
          })}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          aria-label="Sort dishes"
          className="cursor-pointer rounded-full border border-tint/10 bg-surface px-3 py-2 text-xs font-semibold text-ink focus:border-[#F6B100]/60 focus:outline-none"
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <button
          onClick={() => setHideUnavailable((v) => !v)}
          aria-pressed={hideUnavailable}
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
            hideUnavailable ? "border-[#F6B100] bg-[#F6B100]/15 text-accent" : "border-tint/10 bg-tint/5 text-ink-2 hover:text-ink"
          }`}
        >
          Available only
        </button>
      </div>

      {/* Result count */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 text-xs text-ink-3 sm:px-6">
        <p aria-live="polite">
          {shown} dish{shown !== 1 ? "es" : ""}
          {query && <> matching “{search.trim()}”</>}
          {!query && selectedCategory && <> in {selectedCategory.name}</>}
        </p>
        {(filtersActive || query) && (
          <button onClick={resetFilters} className="font-semibold text-accent hover:underline">Reset filters</button>
        )}
      </div>

      <div className="gold-rule mx-4 mt-3 shrink-0 opacity-60 sm:mx-6" />

      {/* Items */}
      <div className={`grid ${gridCols} flex-1 auto-rows-max content-start gap-4 overflow-y-auto px-4 py-4 scrollbar-thin sm:px-6`}>
        {shown === 0 && (
          <div className="col-span-full mt-10 text-center">
            <p className="text-4xl">🍽️</p>
            <p className="mt-2 text-sm text-ink-2">
              {query
                ? `No dishes match “${search.trim()}”.`
                : filtersActive
                  ? "No dishes match these filters."
                  : popularSelected ? "No popular dishes yet." : "No dishes in this category yet."}
            </p>
            {(filtersActive || query) && (
              <button onClick={resetFilters} className="mt-3 rounded-full border border-tint/10 bg-tint/5 px-4 py-1.5 text-xs font-semibold text-ink hover:bg-tint/10">
                Reset filters
              </button>
            )}
          </div>
        )}

        {grouped
          ? sections.map(({ cat, items }) => (
              <React.Fragment key={cat._id}>
                <SectionHeading category={cat} count={items.length} />
                {items.map((item) => renderCard(item, false))}
              </React.Fragment>
            ))
          : flatItems.map((item) => renderCard(item, Boolean(query) || popularSelected))}
      </div>
    </div>
  );
};

export default MenuContainer;
