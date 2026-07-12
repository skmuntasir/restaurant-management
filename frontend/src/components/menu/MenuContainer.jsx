import React, { useState, useEffect } from "react";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { MdToggleOn, MdToggleOff } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { addNotification } from "../../redux/slices/notificationsSlice";
import { enqueueSnackbar } from "notistack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCategories, getMenuItems, toggleMenuItemAvailability } from "../../https";

const MenuContainer = () => {
  const dispatch     = useDispatch();
  const queryClient  = useQueryClient();
  const user         = useSelector((s) => s.user);
  const canToggle    = ["admin", "cashier", "Admin", "Cashier"].includes(user?.role);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quantities, setQuantities] = useState({});

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

  const categories = categoriesRes?.data?.data || [];
  const allItems   = itemsRes?.data?.data    || [];

  useEffect(() => {
    if (!selectedCategory && categories.length > 0) setSelectedCategory(categories[0]);
  }, [categories, selectedCategory]);

  const itemsForSelected = allItems.filter((item) => item.category?._id === selectedCategory?._id);

  const getQty = (id) => quantities[id] || 0;
  const increment = (id) =>
    setQuantities((p) => ({ ...p, [id]: Math.min((p[id] || 0) + 1, 10) }));
  const decrement = (id) =>
    setQuantities((p) => ({ ...p, [id]: Math.max((p[id] || 0) - 1, 0) }));

  const handleAddToCart = (item) => {
    const qty = getQty(item._id);
    if (qty === 0) { enqueueSnackbar("Please select quantity first!", { variant: "warning" }); return; }
    dispatch(addItems({
      id: `${item._id}-${Date.now()}`,
      menuItem: item._id,
      name: item.name,
      pricePerQuantity: item.price,
      quantity: qty,
      price: item.price * qty,
    }));
    setQuantities((p) => ({ ...p, [item._id]: 0 }));
    enqueueSnackbar(`${item.name} added to cart!`, { variant: "success" });
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

  if (categoriesLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center flex-1">
        <p className="text-[#ababab] text-sm">Loading menu…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Categories */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 px-4 py-2 shrink-0">
        {categories.map((cat) => (
          <div
            key={cat._id}
            className={`flex flex-col items-start justify-between p-3 rounded-xl h-[78px] cursor-pointer transition-transform hover:scale-[1.02] ${
              selectedCategory?._id === cat._id ? "ring-2 ring-[#F6B100]" : ""
            }`}
            style={{ backgroundColor: cat.bgColor }}
            onClick={() => { setSelectedCategory(cat); setQuantities({}); }}
          >
            <div className="flex items-center justify-between w-full">
              <h1 className="text-[#f5f5f5] text-sm font-semibold">{cat.icon} {cat.name}</h1>
              {selectedCategory?._id === cat._id && <GrRadialSelected className="text-white" size={16} />}
            </div>
            <p className="text-[#e5e5e5]/80 text-xs font-medium">
              {allItems.filter((i) => i.category?._id === cat._id).length} Items
            </p>
          </div>
        ))}
      </div>

      <hr className="border-[#2a2a2a] border-t-2 mt-2 shrink-0" />

      {/* Items */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 px-4 py-4 overflow-y-auto flex-1 scrollbar-thin">
        {itemsForSelected.length === 0 && (
          <p className="text-[#ababab] text-sm col-span-full text-center mt-8">No dishes in this category yet.</p>
        )}
        {itemsForSelected.map((item) => (
          <div
            key={item._id}
            className={`flex flex-col items-start justify-between p-4 rounded-xl border transition-colors min-h-[120px] ${
              item.isAvailable
                ? "bg-[#1a1a1a] border-transparent hover:bg-[#2a2a2a] hover:border-[#333]"
                : "bg-[#161616] border-transparent opacity-60"
            }`}
          >
            <div className="flex items-start justify-between w-full">
              <h1 className="text-[#f5f5f5] text-base font-semibold leading-snug">{item.name}</h1>
              <div className="flex items-center gap-1 ml-2 shrink-0">
                {/* Availability toggle — admin & cashier only */}
                {canToggle && (
                  <button
                    onClick={() => toggleMutation.mutate(item._id)}
                    disabled={toggleMutation.isPending}
                    title={item.isAvailable ? "Mark unavailable" : "Mark available"}
                    className="transition-colors"
                  >
                    {item.isAvailable
                      ? <MdToggleOn  className="text-[#02ca3a]" size={22} />
                      : <MdToggleOff className="text-[#ababab]" size={22} />}
                  </button>
                )}
                <button
                  onClick={() => item.isAvailable && handleAddToCart(item)}
                  disabled={!item.isAvailable}
                  className="bg-[#2e4a40] text-[#02ca3a] p-2 rounded-lg hover:bg-[#345548] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FaShoppingCart size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              {item.type && <span className="text-[#ababab] text-[11px]">{item.type}</span>}
              {!item.isAvailable && (
                <span className="text-red-400 text-[10px] font-bold bg-red-500/10 px-1.5 py-0.5 rounded">
                  Unavailable
                </span>
              )}
            </div>

            <div className="flex items-center justify-between w-full mt-3">
              <p className="text-[#f5f5f5] text-lg font-bold">৳{item.price}</p>
              {item.isAvailable && (
                <div className="flex items-center bg-[#1f1f1f] px-2 py-1.5 rounded-lg gap-3">
                  <button onClick={() => decrement(item._id)} className="text-yellow-500 text-lg font-bold w-5">&minus;</button>
                  <span className="text-white text-sm font-semibold w-4 text-center">{getQty(item._id)}</span>
                  <button onClick={() => increment(item._id)} className="text-yellow-500 text-lg font-bold w-5">&#43;</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuContainer;
