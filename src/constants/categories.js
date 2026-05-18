// ============================================================
// CATEGORY CONSTANTS
// ============================================================
// This file defines:
//   - INCOME_CATEGORIES  : Category + sub-category structure for income entries
//   - AVAILABLE_ICONS    : All Lucide icons selectable by the user when creating
//                          custom categories or sub-categories
//   - ALL_MONTHS         : Month name array used across date selectors
// ============================================================

import {
  Briefcase, Landmark, TrendingUp, Gift, Coins, Home, Lightbulb,
  ShoppingBag, ShoppingCart, Music, Fuel, Umbrella, Star, Edit2,
  Utensils, GraduationCap, Bike, Phone, Globe, Lock, Monitor, Mail,
  Wrench, Scissors, Shirt, Dumbbell, Tv, Heart, Compass, Coffee,
  BedDouble, BookOpen, Car, Wallet, Users, Trash2, Activity
} from 'lucide-react';

// All 12 months used for month selectors/filters across the app
export const ALL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// ============================================================
// INCOME CATEGORIES
// ============================================================
// Each category has:
//   id            - unique identifier
//   name          - displayed category label
//   icon          - Lucide icon component
//   subCategories - list of sub-categories (each also has id, name, icon)
// ============================================================
export const INCOME_CATEGORIES = [
  {
    id: 'inc-1',
    name: 'Salary',
    icon: Briefcase,
    subCategories: [
      { id: 'is1', name: 'Regular Salary', icon: Briefcase },
      { id: 'is2', name: 'Bonus', icon: Briefcase },
    ],
  },
  {
    id: 'inc-2',
    name: 'Business',
    icon: Landmark,
    subCategories: [
      { id: 'is3', name: 'Consulting', icon: Landmark },
      { id: 'is4', name: 'Product Sales', icon: Landmark },
    ],
  },
  {
    id: 'inc-3',
    name: 'Investment',
    icon: TrendingUp,
    subCategories: [
      { id: 'is5', name: 'Dividends', icon: TrendingUp },
      { id: 'is6', name: 'Interest', icon: TrendingUp },
      { id: 'is7', name: 'Rental Income', icon: Home },
    ],
  },
  {
    id: 'inc-4',
    name: 'Gifts/Grants',
    icon: Gift,
    subCategories: [
      { id: 'is8', name: 'Birthday Gift', icon: Gift },
      { id: 'is9', name: 'Government Grant', icon: Gift },
    ],
  },
  {
    id: 'inc-5',
    name: 'Others',
    icon: Coins,
    subCategories: [
      { id: 'is10', name: 'General Income', icon: Coins },
    ],
  },
];

// ============================================================
// AVAILABLE ICONS
// ============================================================
// All icons a user can pick when creating a custom category.
// Each object has:
//   name - label shown in the icon picker
//   icon - the actual Lucide icon component to render
// ============================================================
export const AVAILABLE_ICONS = [
  { name: 'Home',          icon: Home },
  { name: 'Lightbulb',    icon: Lightbulb },
  { name: 'ShoppingBag',  icon: ShoppingBag },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Music',        icon: Music },
  { name: 'Fuel',         icon: Fuel },
  { name: 'Landmark',     icon: Landmark },
  { name: 'BedDouble',    icon: BedDouble },
  { name: 'BookOpen',     icon: BookOpen },
  { name: 'Briefcase',    icon: Briefcase },
  { name: 'Car',          icon: Car },
  { name: 'Coins',        icon: Coins },
  { name: 'Wallet',       icon: Wallet },
  { name: 'Users',        icon: Users },
  { name: 'Coffee',       icon: Coffee },
  { name: 'Utensils',     icon: Utensils },
  { name: 'Trash2',       icon: Trash2 },
  { name: 'Gift',         icon: Gift },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Bike',         icon: Bike },
  { name: 'Phone',        icon: Phone },
  { name: 'Globe',        icon: Globe },
  { name: 'Lock',         icon: Lock },
  { name: 'Monitor',      icon: Monitor },
  { name: 'Mail',         icon: Mail },
  { name: 'Umbrella',     icon: Umbrella },
  { name: 'Wrench',       icon: Wrench },
  { name: 'Scissors',     icon: Scissors },
  { name: 'Shirt',        icon: Shirt },
  { name: 'Dumbbell',     icon: Dumbbell },
  { name: 'Tv',           icon: Tv },
  { name: 'Heart',        icon: Heart },
  { name: 'Compass',      icon: Compass },
  { name: 'Activity',     icon: Activity },
];
