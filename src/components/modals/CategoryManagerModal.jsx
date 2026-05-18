import React from 'react';
import { X, Check, Plus, MinusCircle, Edit2, ChevronRight, Star } from 'lucide-react';
import { 
  Home, ShoppingBag, Car, HeartPulse, GraduationCap, Utensils, 
  Tv, Compass, HelpCircle, AlertCircle, Award, Briefcase, 
  Coffee, Gift, Landmark, Phone, Receipt, Settings, 
  ShoppingCart, ShieldAlert, Sparkles, Smile, MessageCircle, PiggyBank,
  CheckCircle2, Flame, Scissors, Zap, Shield, Trash2, Dumbbell, Plane
} from 'lucide-react';

const DEFAULT_AVAILABLE_ICONS = [
  { name: 'Home', icon: Home },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Car', icon: Car },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Utensils', icon: Utensils },
  { name: 'Tv', icon: Tv },
  { name: 'Compass', icon: Compass },
  { name: 'Award', icon: Award },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Coffee', icon: Coffee },
  { name: 'Gift', icon: Gift },
  { name: 'Landmark', icon: Landmark },
  { name: 'Phone', icon: Phone },
  { name: 'Receipt', icon: Receipt },
  { name: 'Settings', icon: Settings },
  { name: 'ShoppingCart', icon: ShoppingCart },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Smile', icon: Smile },
  { name: 'MessageCircle', icon: MessageCircle },
  { name: 'PiggyBank', icon: PiggyBank },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'Flame', icon: Flame },
  { name: 'Scissors', icon: Scissors },
  { name: 'Zap', icon: Zap },
  { name: 'Shield', icon: Shield },
  { name: 'Trash2', icon: Trash2 },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'Plane', icon: Plane }
];

export const CategoryManagerModal = ({
  isCategoriesManagerOpen,
  setIsCategoriesManagerOpen,
  categories,
  handleDeleteCategory,
  handleStartEditCategory,
  handleOpenSubCategoriesManager,
  handleStartAddCategory,
  
  // Add Category State
  isAddCategoryOpen,
  setIsAddCategoryOpen,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  handleSaveNewCategory,

  // Edit Category State
  isEditCategoryOpen,
  setIsEditCategoryOpen,
  editingCategory,
  setEditingCategory,
  editCategoryName,
  setEditCategoryName,
  editCategoryIcon,
  setEditCategoryIcon,
  handleSaveCategoryEdit,

  // Subcategory management state
  isSubCategoriesManagerOpen,
  setIsSubCategoriesManagerOpen,
  activeParentCategory,
  setActiveParentCategory,
  handleDeleteSubCategory,
  handleStartEditSubCategory,
  handleStartAddSubCategory,

  // Add Subcategory State
  isAddSubCategoryOpen,
  setIsAddSubCategoryOpen,
  newSubCategoryName,
  setNewSubCategoryName,
  newSubCategoryIcon,
  setNewSubCategoryIcon,
  handleSaveNewSubCategory,

  // Edit Subcategory State
  isEditSubCategoryOpen,
  setIsEditSubCategoryOpen,
  editingSubCategory,
  setEditingSubCategory,
  editSubCategoryName,
  setEditSubCategoryName,
  editSubCategoryIcon,
  setEditSubCategoryIcon,
  handleSaveEditSubCategory,

  AVAILABLE_ICONS = DEFAULT_ALL_ICONS => DEFAULT_AVAILABLE_ICONS
}) => {
  return (
    <>
      {/* 1. Main Categories List Modal */}
      {isCategoriesManagerOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button onClick={() => setIsCategoriesManagerOpen(false)} className="hover:opacity-80 transition-opacity">
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Categories</h2>
              <div className="w-7"></div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-300 bg-white">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                    >
                      <MinusCircle className="w-6 h-6 fill-red-500 text-white" />
                    </button>
                    <cat.icon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-800">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <button 
                      onClick={() => handleStartEditCategory(cat)}
                      className="hover:text-gray-600 transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenSubCategoriesManager(cat)}
                      className="hover:text-gray-600 transition-colors cursor-pointer"
                      title="Manage Subcategories"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-300">
              <button 
                onClick={handleStartAddCategory}
                className="flex items-center gap-2 text-[#22C55E] hover:text-[#16A34A] transition-colors text-sm font-bold cursor-pointer"
              >
                <Plus className="w-5 h-5 bg-[#22C55E] text-white rounded-full p-0.5" />
                Add new Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Category Modal */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button 
                onClick={() => {
                  setIsAddCategoryOpen(false);
                }} 
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Add Category</h2>
              <button 
                onClick={handleSaveNewCategory} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Check className="w-7 h-7 bg-gray-500 rounded-full p-1 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</span>
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Enter category name..."
                  className="w-full text-center px-4 py-2 border rounded shadow-inner text-base font-semibold text-[#1F2937] bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              {/* Icon Selection Grid */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Select Icon</span>
                <div className="grid grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto bg-white p-3 rounded-lg border border-gray-300">
                  <button
                    onClick={() => setNewCategoryIcon(Star)}
                    className={`col-span-2 p-2 rounded-lg flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                      newCategoryIcon === Star
                        ? 'border-2 border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    No Icon
                  </button>

                  {DEFAULT_AVAILABLE_ICONS.map((item, idx) => {
                    const IconComponent = item.icon;
                    const isSelected = newCategoryIcon === IconComponent;
                    return (
                      <button
                        key={idx}
                        onClick={() => setNewCategoryIcon(IconComponent)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-red-500 bg-red-50'
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-red-500 font-bold' : 'text-gray-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Edit Category Modal */}
      {isEditCategoryOpen && editingCategory && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button 
                onClick={() => {
                  setIsEditCategoryOpen(false);
                  setEditingCategory(null);
                }} 
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Edit Category</h2>
              <button 
                onClick={handleSaveCategoryEdit} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Check className="w-7 h-7 bg-gray-500 rounded-full p-1 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</span>
                <input 
                  type="text" 
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full text-center px-4 py-2 border rounded shadow-inner text-base font-semibold text-[#1F2937] bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              {/* Icon Selection Grid */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Select Icon</span>
                <div className="grid grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto bg-white p-3 rounded-lg border border-gray-300">
                  <button
                    onClick={() => setEditCategoryIcon(Star)}
                    className={`col-span-2 p-2 rounded-lg flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                      editCategoryIcon === Star
                        ? 'border-2 border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    No Icon
                  </button>

                  {DEFAULT_AVAILABLE_ICONS.map((item, idx) => {
                    const IconComponent = item.icon;
                    const isSelected = editCategoryIcon === IconComponent;
                    return (
                      <button
                        key={idx}
                        onClick={() => setEditCategoryIcon(IconComponent)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-red-500 bg-red-50'
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-red-500 font-bold' : 'text-gray-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. SubCategories List Manager Modal */}
      {isSubCategoriesManagerOpen && activeParentCategory && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button 
                onClick={() => {
                  setIsSubCategoriesManagerOpen(false);
                  setActiveParentCategory(null);
                }} 
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>{activeParentCategory.name}</h2>
              <div className="w-7"></div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[300px] overflow-y-auto divide-y divide-gray-300 bg-white">
              {activeParentCategory.subCategories?.map((sub) => {
                const SubIcon = sub.icon || activeParentCategory.icon || Star;
                return (
                  <div key={sub.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleDeleteSubCategory(sub.id)}
                        className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                      >
                        <MinusCircle className="w-6 h-6 fill-red-500 text-white" />
                      </button>
                      <SubIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-800">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <button 
                        onClick={() => handleStartEditSubCategory(sub)}
                        className="hover:text-gray-600 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-6 py-4 border-t border-gray-300">
              <button 
                onClick={handleStartAddSubCategory}
                className="flex items-center gap-2 text-[#22C55E] hover:text-[#16A34A] transition-colors text-sm font-bold cursor-pointer"
              >
                <Plus className="w-5 h-5 bg-[#22C55E] text-white rounded-full p-0.5" />
                Add new SubCategory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add SubCategory Modal */}
      {isAddSubCategoryOpen && activeParentCategory && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button 
                onClick={() => {
                  setIsAddSubCategoryOpen(false);
                }} 
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Add SubCategory</h2>
              <button 
                onClick={handleSaveNewSubCategory} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Check className="w-7 h-7 bg-gray-500 rounded-full p-1 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</span>
                <input 
                  type="text" 
                  value={newSubCategoryName}
                  onChange={(e) => setNewSubCategoryName(e.target.value)}
                  placeholder="Enter subcategory name..."
                  className="w-full text-center px-4 py-2 border rounded shadow-inner text-base font-semibold text-[#1F2937] bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              {/* Icon Selection Grid */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Select Icon</span>
                <div className="grid grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto bg-white p-3 rounded-lg border border-gray-300">
                  <button
                    onClick={() => setNewSubCategoryIcon(activeParentCategory.icon || Star)}
                    className={`col-span-2 p-2 rounded-lg flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                      newSubCategoryIcon === (activeParentCategory.icon || Star)
                        ? 'border-2 border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    No Icon
                  </button>

                  {DEFAULT_AVAILABLE_ICONS.map((item, idx) => {
                    const IconComponent = item.icon;
                    const isSelected = newSubCategoryIcon === IconComponent;
                    return (
                      <button
                        key={idx}
                        onClick={() => setNewSubCategoryIcon(IconComponent)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-red-500 bg-red-50'
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-red-500 font-bold' : 'text-gray-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Edit SubCategory Modal */}
      {isEditSubCategoryOpen && activeParentCategory && editingSubCategory && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm text-left">
          <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-[#E5E7EB] text-[#1F2937]">
            {/* Modal Header */}
            <div className="bg-[#374151] px-6 py-4 flex items-center justify-between text-white border-b border-gray-600">
              <button 
                onClick={() => {
                  setIsEditSubCategoryOpen(false);
                  setEditingSubCategory(null);
                }} 
                className="hover:opacity-80 transition-opacity"
              >
                <X className="w-7 h-7 bg-gray-500 rounded-full p-1" />
              </button>
              <h2 className="text-xl font-bold text-center flex-1" style={{ color: '#4FD1F5' }}>Edit SubCategory</h2>
              <button 
                onClick={handleSaveEditSubCategory} 
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <Check className="w-7 h-7 bg-gray-500 rounded-full p-1 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Name</span>
                <input 
                  type="text" 
                  value={editSubCategoryName}
                  onChange={(e) => setEditSubCategoryName(e.target.value)}
                  className="w-full text-center px-4 py-2 border rounded shadow-inner text-base font-semibold text-[#1F2937] bg-white border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500" 
                />
              </div>

              {/* Icon Selection Grid */}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 text-center">Select Icon</span>
                <div className="grid grid-cols-6 gap-2.5 max-h-[220px] overflow-y-auto bg-white p-3 rounded-lg border border-gray-300">
                  <button
                    onClick={() => setEditSubCategoryIcon(activeParentCategory.icon || Star)}
                    className={`col-span-2 p-2 rounded-lg flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                      editSubCategoryIcon === (activeParentCategory.icon || Star)
                        ? 'border-2 border-red-500 bg-red-50 text-red-500'
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    No Icon
                  </button>

                  {DEFAULT_AVAILABLE_ICONS.map((item, idx) => {
                    const IconComponent = item.icon;
                    const isSelected = editSubCategoryIcon === IconComponent;
                    return (
                      <button
                        key={idx}
                        onClick={() => setEditSubCategoryIcon(IconComponent)}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all hover:bg-gray-100 cursor-pointer ${
                          isSelected
                            ? 'border-2 border-red-500 bg-red-50'
                            : 'border border-gray-200 bg-gray-50'
                        }`}
                        title={item.name}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-red-500 font-bold' : 'text-gray-600'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
