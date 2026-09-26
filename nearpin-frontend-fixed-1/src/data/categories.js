/**
 * Mirrors backend/src/data/categories.js so the UI has an instant,
 * offline-safe fallback while /api/v1/categories loads.
 */
export const CATEGORIES = [
  { category: "Shop Help", slug: "shop-help", icon: "🛍️", jobs: ["Shop Assistant", "Stock Checking", "Price Tagging & Labeling", "Customer Support", "Tree / Plant Arrangement", "Goods Transport", "Trolley Handling"] },
  { category: "Food & Cafe", slug: "food-and-cafe", icon: "☕", jobs: ["Packaging Food Orders", "Cleaning Tables", "Kitchen Helper", "Serving Food", "Dishwashing Support"] },
  { category: "Cleaning Helper", slug: "cleaning-helper", icon: "🧹", jobs: ["Room Cleaning", "Shop Cleaning", "Mopping", "Washing Foldable Clothes", "Dusting & Surface Cleaning"] },
  { category: "Packaging & Warehouse", slug: "packaging-and-warehouse", icon: "📦", jobs: ["Packing Products", "Arranging Products", "Labeling Products", "Sorting Goods", "Loading & Unloading", "Gift Pack Wrapping", "Barcode Scanning"] },
  { category: "Office Micro Tasks", slug: "office-micro-tasks", icon: "🖥️", jobs: ["Data Entry", "File Arrangement", "Calling & Follow-up", "Basic Computer Work", "Scanning & Photocopying", "Excel Sheet Work", "Mail Drafting"] },
  { category: "Creative & Digital", slug: "creative-and-digital", icon: "🎨", jobs: ["Poster Design", "Logo Design", "Photo Editing", "Video Editing", "Thumbnail Design", "Caption Writing"] },
  { category: "Academic Support", slug: "academic-support", icon: "📚", jobs: ["PPT Making", "Assignment Formatting", "Notes Preparation", "Project Report Work"] },
];
