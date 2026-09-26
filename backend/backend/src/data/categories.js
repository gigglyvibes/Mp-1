/**
 * Static job category -> job list mapping.
 * Used to populate the Category dropdown and the dependent Job dropdown
 * on the Create Job form, and to seed the database.
 */
module.exports = [
  {
    category: "Shop Help",
    slug: "shop-help",
    jobs: [
      "Shop Assistant",
      "Stock Checking",
      "Price Tagging & Labeling",
      "Customer Support",
      "Tree / Plant Arrangement",
      "Goods Transport",
      "Trolley Handling",
    ],
  },
  {
    category: "Food & Cafe",
    slug: "food-and-cafe",
    jobs: [
      "Packaging Food Orders",
      "Cleaning Tables",
      "Kitchen Helper",
      "Serving Food",
      "Dishwashing Support",
    ],
  },
  {
    category: "Cleaning Helper",
    slug: "cleaning-helper",
    jobs: [
      "Room Cleaning",
      "Shop Cleaning",
      "Mopping",
      "Washing Foldable Clothes",
      "Dusting & Surface Cleaning",
    ],
  },
  {
    category: "Packaging & Warehouse",
    slug: "packaging-and-warehouse",
    jobs: [
      "Packing Products",
      "Arranging Products",
      "Labeling Products",
      "Sorting Goods",
      "Loading & Unloading",
      "Gift Pack Wrapping",
      "Barcode Scanning",
    ],
  },
  {
    category: "Office Micro Tasks",
    slug: "office-micro-tasks",
    jobs: [
      "Data Entry",
      "File Arrangement",
      "Calling & Follow-up",
      "Basic Computer Work",
      "Scanning & Photocopying",
      "Excel Sheet Work",
      "Mail Drafting",
    ],
  },
  {
    category: "Creative & Digital",
    slug: "creative-and-digital",
    jobs: [
      "Poster Design",
      "Logo Design",
      "Photo Editing",
      "Video Editing",
      "Thumbnail Design",
      "Caption Writing",
    ],
  },
  {
    category: "Academic Support",
    slug: "academic-support",
    jobs: [
      "PPT Making",
      "Assignment Formatting",
      "Notes Preparation",
      "Project Report Work",
    ],
  },
];
