import { Settings, HelpCircle, X } from 'lucide-react';

export const Sidebar = ({
  COLORS,
  sidebarOpen,
  setSidebarOpen,
  activeMenu,
  setActiveMenu,
  menuItems
}) => {
  return (
    <>
      {/* ── Sidebar Overlay (mobile) ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex lg:flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ backgroundColor: COLORS.bgSidebar, borderRight: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center gap-3 h-20 px-6 border-b" style={{ borderColor: COLORS.border }}>
          <div className="flex flex-col">
            <span className="text-xl font-bold" style={{ color: COLORS.skyBlue }}>Budget Master</span>
            <span className="text-xs font-medium" style={{ color: COLORS.textSecondary }}>Strategic Planning</span>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1">
          {menuItems.map((item, idx) => (
            <a 
              key={idx} 
              href="#" 
              onClick={(e) => { e.preventDefault(); setActiveMenu(item.name); setSidebarOpen(false); }}
              className="flex items-center gap-3 px-6 py-3 transition-all relative group"
            >
              {activeMenu === item.name && (
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: COLORS.skyBlue }}></div>
              )}
              <div 
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${activeMenu === item.name ? 'opacity-100' : ''}`}
                style={{ backgroundColor: COLORS.activeBg }}
              ></div>
              <item.icon className="w-5 h-5 relative z-10" style={{ color: activeMenu === item.name ? COLORS.skyBlue : item.color }} />
              <span className="font-medium text-sm relative z-10" style={{ color: activeMenu === item.name ? COLORS.skyBlue : COLORS.textPrimary }}>{item.name}</span>
            </a>
          ))}

          <div className="mt-auto pt-4 border-t" style={{ borderColor: COLORS.border }}>
            <a href="#" className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-white/5">
              <Settings className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              <span className="font-medium text-sm" style={{ color: COLORS.textSecondary }}>Settings</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-white/5">
              <HelpCircle className="w-5 h-5" style={{ color: COLORS.textSecondary }} />
              <span className="font-medium text-sm" style={{ color: COLORS.textSecondary }}>Support</span>
            </a>
          </div>
        </nav>
      </aside>
    </>
  );
};
