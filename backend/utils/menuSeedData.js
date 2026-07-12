// Seed data for the menu DB — mirrors the Bengali dish names used across
// the app. Only used once, the first time the server starts against an
// empty database (see seedMenu() in menuItemController.js).

const CATEGORY_SEED = [
  {
    name: "Starters", icon: "🍲", bgColor: "#b73e3e",
    items: [
      { name: "Beguni", price: 90, type: "Vegetarian" },
      { name: "Piyaju", price: 80, type: "Vegetarian" },
      { name: "Fuchka", price: 100, type: "Vegetarian" },
      { name: "Shingara", price: 70, type: "Vegetarian" },
      { name: "Chicken Pakora", price: 150, type: "Non-Vegetarian" },
      { name: "Aloor Chop", price: 60, type: "Vegetarian" },
    ],
  },
  {
    name: "Main Course", icon: "🍛", bgColor: "#5b45b0",
    items: [
      { name: "Morog Polao", price: 280, type: "Non-Vegetarian" },
      { name: "Kacchi Biryani", price: 350, type: "Non-Vegetarian" },
      { name: "Bhuna Khichuri", price: 180, type: "Vegetarian" },
      { name: "Ilish Bhapa", price: 450, type: "Non-Vegetarian" },
      { name: "Chingri Malai Curry", price: 400, type: "Non-Vegetarian" },
      { name: "Kosha Mangsho", price: 380, type: "Non-Vegetarian" },
    ],
  },
  {
    name: "Beverages", icon: "🍹", bgColor: "#7f167f",
    items: [
      { name: "Cha (Tea)", price: 20, type: "Hot" },
      { name: "Borhani", price: 60, type: "Cold" },
      { name: "Lassi", price: 90, type: "Cold" },
      { name: "Lebur Sharbat", price: 50, type: "Cold" },
      { name: "Mattha", price: 70, type: "Cold" },
      { name: "Faluda", price: 130, type: "Cold" },
    ],
  },
  {
    name: "Soups", icon: "🍜", bgColor: "#735f32",
    items: [
      { name: "Murgir Jhol Soup", price: 130, type: "Non-Vegetarian" },
      { name: "Sabji Jhol", price: 100, type: "Vegetarian" },
      { name: "Mixed Vegetable Soup", price: 110, type: "Vegetarian" },
      { name: "Chicken Corn Soup", price: 140, type: "Non-Vegetarian" },
      { name: "Mushroom Soup", price: 120, type: "Vegetarian" },
      { name: "Doi Soup", price: 100, type: "Vegetarian" },
    ],
  },
  {
    name: "Desserts", icon: "🍰", bgColor: "#1d2569",
    items: [
      { name: "Roshogolla", price: 80, type: "Vegetarian" },
      { name: "Mishti Doi", price: 70, type: "Vegetarian" },
      { name: "Chomchom", price: 90, type: "Vegetarian" },
      { name: "Payesh", price: 100, type: "Vegetarian" },
    ],
  },
  {
    name: "Snacks", icon: "🥟", bgColor: "#285430",
    items: [
      { name: "Chotpoti", price: 90, type: "Vegetarian" },
      { name: "Jhalmuri", price: 50, type: "Vegetarian" },
      { name: "Bhuna Khichuri Tehari", price: 160, type: "Non-Vegetarian" },
    ],
  },
  {
    name: "Mocktails", icon: "🥤", bgColor: "#b73e3e",
    items: [
      { name: "Tetuler Sharbot", price: 60, type: "Mocktail" },
      { name: "Boroi Sharbot", price: 60, type: "Mocktail" },
      { name: "Aam Pora Sharbot", price: 70, type: "Mocktail" },
      { name: "Doi Sharbot", price: 65, type: "Mocktail" },
      { name: "Faluda Special", price: 140, type: "Mocktail" },
      { name: "Tok Doi Lassi", price: 90, type: "Mocktail" },
    ],
  },
  {
    name: "Salads", icon: "🥗", bgColor: "#5b45b0",
    items: [
      { name: "Shosha Salad", price: 50, type: "Vegetarian" },
      { name: "Piyaj Kasundi Salad", price: 60, type: "Vegetarian" },
      { name: "Tok Salad", price: 70, type: "Vegetarian" },
      { name: "Murgir Salad", price: 130, type: "Non-Vegetarian" },
    ],
  },
];

module.exports = { CATEGORY_SEED };
