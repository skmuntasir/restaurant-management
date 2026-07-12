import butterChicken from '../assets/images/butter-chicken-4.jpg';
import palakPaneer from '../assets/images/Saag-Paneer-1.jpg';
import biryani from '../assets/images/hyderabadibiryani.jpg';
import masalaDosa from '../assets/images/masala-dosa.jpg';
import choleBhature from '../assets/images/chole-bhature.jpg';
import rajmaChawal from '../assets/images/rajma-chawal-1.jpg';
import paneerTikka from '../assets/images/paneer-tika.webp';
import gulabJamun from '../assets/images/gulab-jamun.webp';
import pooriSabji from '../assets/images/poori-sabji.webp';
import roganJosh from '../assets/images/rogan-josh.jpg';

// Popular dishes — Bengali / Bangladeshi cuisine names
export const popularDishes = [
  { id: 1, image: butterChicken, name: 'Morog Bhuna', numberOfOrders: 250 },
  { id: 2, image: palakPaneer, name: 'Shak Bhaji', numberOfOrders: 190 },
  { id: 3, image: biryani, name: 'Kacchi Biryani', numberOfOrders: 300 },
  { id: 4, image: masalaDosa, name: 'Khichuri', numberOfOrders: 220 },
  { id: 5, image: choleBhature, name: 'Luchi Alur Dom', numberOfOrders: 270 },
  { id: 6, image: rajmaChawal, name: 'Bhuna Khichuri', numberOfOrders: 180 },
  { id: 7, image: paneerTikka, name: 'Tikka Kabab', numberOfOrders: 210 },
  { id: 8, image: gulabJamun, name: 'Roshogolla', numberOfOrders: 310 },
  { id: 9, image: pooriSabji, name: 'Luchi Torkari', numberOfOrders: 140 },
  { id: 10, image: roganJosh, name: 'Kosha Mangsho', numberOfOrders: 160 },
];

export const startersItem = [
  { id: 1, name: "Beguni", price: 90, category: "Vegetarian" },
  { id: 2, name: "Piyaju", price: 80, category: "Vegetarian" },
  { id: 3, name: "Fuchka", price: 100, category: "Vegetarian" },
  { id: 4, name: "Shingara", price: 70, category: "Vegetarian" },
  { id: 5, name: "Chicken Pakora", price: 150, category: "Non-Vegetarian" },
  { id: 6, name: "Aloor Chop", price: 60, category: "Vegetarian" },
];

export const mainCourse = [
  { id: 1, name: "Morog Polao", price: 280, category: "Non-Vegetarian" },
  { id: 2, name: "Kacchi Biryani", price: 350, category: "Non-Vegetarian" },
  { id: 3, name: "Bhuna Khichuri", price: 180, category: "Vegetarian" },
  { id: 4, name: "Ilish Bhapa", price: 450, category: "Non-Vegetarian" },
  { id: 5, name: "Chingri Malai Curry", price: 400, category: "Non-Vegetarian" },
  { id: 6, name: "Kosha Mangsho", price: 380, category: "Non-Vegetarian" },
];

export const beverages = [
  { id: 1, name: "Cha (Tea)", price: 20, category: "Hot" },
  { id: 2, name: "Borhani", price: 60, category: "Cold" },
  { id: 3, name: "Lassi", price: 90, category: "Cold" },
  { id: 4, name: "Lebur Sharbat", price: 50, category: "Cold" },
  { id: 5, name: "Mattha", price: 70, category: "Cold" },
  { id: 6, name: "Faluda", price: 130, category: "Cold" },
];

export const soups = [
  { id: 1, name: "Murgir Jhol Soup", price: 130, category: "Non-Vegetarian" },
  { id: 2, name: "Sabji Jhol", price: 100, category: "Vegetarian" },
  { id: 3, name: "Mixed Vegetable Soup", price: 110, category: "Vegetarian" },
  { id: 4, name: "Chicken Corn Soup", price: 140, category: "Non-Vegetarian" },
  { id: 5, name: "Mashroom Soup", price: 120, category: "Vegetarian" },
  { id: 6, name: "Doi Soup", price: 100, category: "Vegetarian" },
];

export const desserts = [
  { id: 1, name: "Roshogolla", price: 80, category: "Vegetarian" },
  { id: 2, name: "Mishti Doi", price: 70, category: "Vegetarian" },
  { id: 3, name: "Chomchom", price: 90, category: "Vegetarian" },
  { id: 4, name: "Payesh", price: 100, category: "Vegetarian" },
];

// Bengali street-food snacks (replaces "Pizzas")
export const snacks = [
  { id: 1, name: "Chotpoti", price: 90, category: "Vegetarian" },
  { id: 2, name: "Jhalmuri", price: 50, category: "Vegetarian" },
  { id: 3, name: "Bhuna Khichuri Tehari", price: 160, category: "Non-Vegetarian" },
];

// Mocktails & Sharbat (replaces "Alcoholic Drinks")
export const mocktails = [
  { id: 1, name: "Tetuler Sharbot", price: 60, category: "Mocktail" },
  { id: 2, name: "Boroi Sharbot", price: 60, category: "Mocktail" },
  { id: 3, name: "Aam Pora Sharbot", price: 70, category: "Mocktail" },
  { id: 4, name: "Doi Sharbot", price: 65, category: "Mocktail" },
  { id: 5, name: "Faluda Special", price: 140, category: "Mocktail" },
  { id: 6, name: "Tok Doi Lassi", price: 90, category: "Mocktail" },
];

export const salads = [
  { id: 1, name: "Shosha Salad", price: 50, category: "Vegetarian" },
  { id: 2, name: "Piyaj Kasundi Salad", price: 60, category: "Vegetarian" },
  { id: 3, name: "Tok Salad", price: 70, category: "Vegetarian" },
  { id: 4, name: "Murgir Salad", price: 130, category: "Non-Vegetarian" },
];

export const menus = [
  { id: 1, name: "Starters", bgColor: "#b73e3e", icon: "🍲", items: startersItem },
  { id: 2, name: "Main Course", bgColor: "#5b45b0", icon: "🍛", items: mainCourse },
  { id: 3, name: "Beverages", bgColor: "#7f167f", icon: "🍹", items: beverages },
  { id: 4, name: "Soups", bgColor: "#735f32", icon: "🍜", items: soups },
  { id: 5, name: "Desserts", bgColor: "#1d2569", icon: "🍰", items: desserts },
  { id: 6, name: "Snacks", bgColor: "#285430", icon: "🥟", items: snacks },
  { id: 7, name: "Mocktails", bgColor: "#b73e3e", icon: "🥤", items: mocktails },
  { id: 8, name: "Salads", bgColor: "#5b45b0", icon: "🥗", items: salads },
];
