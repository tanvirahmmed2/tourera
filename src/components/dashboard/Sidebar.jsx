import Link from 'next/link';
import LogoutButton from './LogoutButton';

const PANELS = {
  owner: {
    badgeText: 'Owner',
    panelName: 'Owner Panel',
    navLinks: [
      {
        section: 'Overview',
        links: [
          { href: '/control/owner', label: 'Dashboard', icon: '🏠' },
          { href: '/control/owner/analytics', label: 'Analytics', icon: '📊' },
        ],
      },
      {
        section: 'SaaS Management',
        links: [
          { href: '/control/owner/tenants', label: 'Tenants', icon: '🏢' },
          { href: '/control/owner/users', label: 'Users', icon: '👥' },
          { href: '/control/owner/packages', label: 'Packages', icon: '📦' },
          { href: '/control/owner/subscriptions', label: 'Subscriptions', icon: '🔄' },
          { href: '/control/owner/payments', label: 'Payments', icon: '💰' },
        ],
      },
      {
        section: 'Support',
        links: [
          { href: '/control/owner/support', label: 'Support Tickets', icon: '🎫' },
        ],
      },
    ]
  },
  manager: {
    badgeText: 'Manager',
    panelName: 'Manager Panel',
    navLinks: [
      {
        section: 'Overview',
        links: [
          { href: '/control/manager', label: 'Dashboard', icon: '🏠' },
          { href: '/control/manager/analytics', label: 'Analytics', icon: '📊' },
        ],
      },
      {
        section: 'SaaS Management',
        links: [
          { href: '/control/manager/tenants', label: 'Tenants', icon: '🏢' },
          { href: '/control/manager/packages', label: 'Packages', icon: '📦' },
          { href: '/control/manager/purchases', label: 'Purchases', icon: '🛒' },
        ],
      },
      {
        section: 'Support',
        links: [
          { href: '/control/manager/support', label: 'Support Tickets', icon: '🎫' },
          { href: '/control/manager/reviews', label: 'Reviews', icon: '⭐' },
        ],
      },
    ]
  },
  support: {
    badgeText: 'Support',
    panelName: 'Support Panel',
    navLinks: [
      {
        section: 'Dashboard',
        links: [
          { href: '/control/support', label: 'Support Tickets', icon: '🎫' },
        ],
      },
    ]
  },
  customer: {
    badgeText: 'SaaS Account',
    panelName: 'Customer Panel',
    navLinks: [
      {
        section: 'Overview',
        links: [
          { href: '/dashboard', label: 'Workspaces', icon: '🏢' },
          { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: '🔄' },
          { href: '/dashboard/billing', label: 'Billing & Invoices', icon: '💳' },
        ],
      },
      {
        section: 'Account',
        links: [
          { href: '/dashboard/profile', label: 'Profile Settings', icon: '⚙️' },
          { href: '/dashboard/support', label: 'Support Tickets', icon: '🎫' },
          { href: '/dashboard/reviews', label: 'Platform Review', icon: '⭐' },
        ],
      }
    ]
  }
};

export default function Sidebar({ session, panelType }) {
  const panel = PANELS[panelType] || PANELS.customer;

  return (
    <aside className="w-[260px] bg-bg-2 border-r border-slate-200/80 flex flex-col shrink-0">
      <div className="p-6 border-b border-slate-200/80 bg-gradient-to-br from-[#8b5cf6]/[0.02] to-transparent">
        {panel.badgeText && (
          <div className="inline-flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-md px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-violet-750 mb-3 shadow-sm shadow-violet-100/10">
            ⚡ {panel.badgeText}
          </div>
        )}
        <Link href="/" className="block text-xl font-extrabold bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] text-transparent bg-clip-text no-underline">
          Tourbin
        </Link>
        <div className="text-[10px] text-text-3 font-semibold mt-1">{panel.panelName}</div>
      </div>

      <nav className="py-5 px-3 flex flex-col gap-2 flex-1 overflow-y-auto">
        {panel.navLinks.map((groupOrLink, i) => {
          // If it has a 'section' property, it's a group of links
          if (groupOrLink.section) {
            return (
              <div key={groupOrLink.section} className="flex flex-col gap-1">
                <div className="text-[10px] uppercase tracking-wider text-text-3 font-bold mt-3 mb-1.5 ml-2.5">
                  {groupOrLink.section}
                </div>
                {groupOrLink.links.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-[13px] font-semibold text-text-2 transition-all duration-200 no-underline hover:bg-violet-50/60 hover:text-violet-700"
                  >
                    <span className="text-base w-5 text-center shrink-0 filter drop-shadow-[0_2px_4px_rgba(139,92,246,0.08)]">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            );
          }
          // Otherwise it's a direct link
          return (
            <Link 
              key={groupOrLink.href} 
              href={groupOrLink.href} 
              className="flex items-center gap-3 py-2.5 px-3.5 rounded-xl text-[13px] font-semibold text-text-2 transition-all duration-200 no-underline hover:bg-violet-50/60 hover:text-violet-700"
            >
              <span className="text-base w-5 text-center shrink-0 filter drop-shadow-[0_2px_4px_rgba(139,92,246,0.08)]">{groupOrLink.icon}</span>
              <span>{groupOrLink.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 bg-gradient-to-t from-[#8b5cf6]/[0.01] to-transparent">
        <div className="flex items-center gap-3 mb-4 pl-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center font-extrabold text-xs text-white shrink-0 shadow-md">
            {session?.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="text-xs font-bold text-text leading-none truncate max-w-[150px]">{session?.name || 'User'}</div>
            <div className="text-[9px] text-[#8b5cf6] font-semibold tracking-wider uppercase mt-1">{panel.badgeText || 'Account'}</div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
