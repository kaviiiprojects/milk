
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  View,
  PlusSquare,
  FileText,
  ClipboardList,
  Warehouse,
  UserCheck,
  PanelLeft,
  X,
  Maximize,
  Minimize,
  Settings,
  ReceiptText, 
  CalendarClock,
  Truck, 
  ListPlus, 
  MapPin, 
  UserCog,
  Undo2, 
  Beaker,
  Wallet,
  Calculator,
} from "lucide-react";

import {
  SidebarProvider as NewSidebarProvider,
  Sidebar as AppNewSidebar,
  SidebarHeader as AppNewSidebarHeader,
  SidebarContent as AppNewSidebarContent,
  SidebarFooter as AppNewSidebarFooter,
  useSidebarContext,
  sidebarVars,
} from "@/components/ui/sidebar";

import { UserProfile } from "@/components/UserProfile";
import { useAuth } from "@/contexts/AuthContext";
import type { NavItemConfig, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GlobalPreloaderScreen } from "@/components/GlobalPreloaderScreen";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"; 
import { Button } from "@/components/ui/button";
import { useFullscreen } from "@/contexts/FullscreenContext";

const CustomInventoryIcon = ({ className: propClassName }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("lucide lucide-archive", propClassName)}
  >
    <rect width="20" height="5" x="2" y="3" rx="1"></rect>
    <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"></path>
    <path d="M10 12h4"></path>
  </svg>
);

const ALL_NAV_ITEMS: NavItemConfig[] = [
  { id: "dashboard", href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, allowedRoles: ["admin"] },
  { id: "products", href: "/app/products", label: "Products", icon: Package, allowedRoles: ["admin"] },
  { id: "customers", href: "/app/customers", label: "Customers", icon: Users, allowedRoles: ["admin", "cashier"] },
  { id: "sales", href: "/app/sales", label: "Sales (POS)", icon: ShoppingCart, allowedRoles: ["admin", "cashier"] },
  { id: "samples", href: "/app/samples", label: "Issue Samples", icon: Beaker, allowedRoles: ["admin", "cashier"] },
  {
    id: "invoicing",
    label: "Invoicing",
    icon: ReceiptText,
    allowedRoles: ["admin", "cashier"],
    children: [
      { id: "standard-invoice", href: "/app/invoicing", label: "Standard Invoice", icon: ReceiptText, allowedRoles: ["admin", "cashier"] },
      { id: "return-invoice", href: "/app/invoicing/returns", label: "Return Invoice", icon: Undo2, allowedRoles: ["admin", "cashier"] },
    ],
  },
  { id: "returns", href: "/app/returns", label: "Returns", icon: Undo2, allowedRoles: ["admin", "cashier"] },
  {
    id: "inventory",
    label: "Inventory",
    icon: CustomInventoryIcon,
    allowedRoles: ["admin", "cashier"],
    children: [
      { id: "view-stock", href: "/app/inventory/view-stock", label: "View Stock", icon: View, allowedRoles: ["admin", "cashier"] },
      { id: "manage-stock", href: "/app/inventory/manage-stock", label: "Manage Stock", icon: PlusSquare, allowedRoles: ["admin"] },
    ]
  },
  { id: "expenses", href: "/app/expenses", label: "Expenses", icon: Wallet, allowedRoles: ["admin", "cashier"] },
  {
    id: "vehicles",
    label: "Vehicles",
    icon: Truck,
    allowedRoles: ["admin"],
    children: [
      { id: "manage-vehicles", href: "/app/vehicles/manage", label: "Add/Manage Vehicles", icon: ListPlus, allowedRoles: ["admin"] },
      { id: "track-vehicles", href: "/app/vehicles/track", label: "Track Vehicles", icon: MapPin, allowedRoles: ["admin"] },
    ]
  },
  {
    id: "reports",
    label: "Reports",
    icon: FileText,
    allowedRoles: ["admin"],
    children: [
      { id: "day-end-report", href: "/app/reports/day-end-report", label: "Day End Report", icon: CalendarClock, allowedRoles: ["admin"] },
      { id: "full-report", href: "/app/reports/full-report", label: "Full Report", icon: ClipboardList, allowedRoles: ["admin"] },
      { id: "stock-report", href: "/app/reports/stock-report", label: "Stock Report", icon: Warehouse, allowedRoles: ["admin"] },
      { id: "customer-report", href: "/app/reports/customer-report", label: "Customer Report", icon: UserCheck, allowedRoles: ["admin"] },
      { id: "vehicle-report", href: "/app/reports/vehicle-report", label: "Vehicle Report", icon: Truck, allowedRoles: ["admin"] },
    ]
  },
  { id: "daily-count", href: "/app/daily-count", label: "Daily Count", icon: Calculator, allowedRoles: ["admin", "cashier"] },
  { id: "user-management", href: "/app/user-management", label: "User Management", icon: UserCog, allowedRoles: ["admin"] },
  { id: "settings", href: "/app/settings", label: "Settings", icon: Settings, allowedRoles: ["admin", "cashier"] },
];

function calculateCurrentPageLabel(pathname: string, userRole: UserRole | undefined, currentNavItems: NavItemConfig[]): string {
    if (!userRole) return "N Group Products";

    const findLabel = (items: NavItemConfig[], currentPath: string): string | null => {
        for (const item of items) {
            if (item.href && currentPath === item.href) {
                return item.label;
            }
            if (item.children) {
                const childLabel = findLabel(item.children, currentPath);
                if (childLabel) return childLabel;
            }
        }
        return null;
    }

    let label = findLabel(currentNavItems, pathname);
    if (label) return label;

    for (const item of currentNavItems) {
        if (item.children) {
            for (const child of item.children) {
                if (child.href && pathname.startsWith(child.href)) {
                    if (pathname === child.href) return child.label;
                    const specificChildLabel = findLabel(item.children, pathname);
                    if (specificChildLabel) return specificChildLabel;
                    return child.label;
                }
            }
        }
        if (item.href && pathname.startsWith(item.href) && pathname !== item.href) {
             const segments = pathname.split('/');
             const itemSegments = item.href.split('/');
             if (segments.length > itemSegments.length && segments[2] === itemSegments[2]) {
                return item.label;
             }
        }
    }
    
    const primarySegment = pathname.split('/')[2];
    const secondarySegment = pathname.split('/')[3];

    if (primarySegment && secondarySegment) {
      const parentItem = currentNavItems.find(item => item.id === primarySegment);
      if (parentItem && parentItem.children) {
        const childItem = parentItem.children.find(child => child.href && child.href.endsWith(secondarySegment));
        if (childItem) return childItem.label;
      }
    }
    
    const fallbackItem = currentNavItems.find(item => item.id === primarySegment);
    if (fallbackItem) return fallbackItem.label;

    return "N Group Products";
}


function AppShell({ children }: { children: React.ReactNode }) {
  const {
    isMobile,
    isCollapsed,
    toggleCollapse,
    openMobile,
    setOpenMobile,
    navItems,
    userRole,
    activePath
  } = useSidebarContext();

  const { isAppFullScreen, toggleAppFullScreen } = useFullscreen();

  const currentPageLabel = useMemo(
    () => calculateCurrentPageLabel(activePath, userRole, navItems),
    [activePath, userRole, navItems]
  );

  const sidebarActualContent = (
    <React.Fragment>
      <AppNewSidebarHeader>
        <span className={cn(
          "font-headline font-bold",
          isCollapsed && !isMobile ? "hidden" : "text-xl text-primary"
        )}>
          N Group Products
        </span>
      </AppNewSidebarHeader>
      <AppNewSidebarContent />
      <AppNewSidebarFooter>
      {(!isCollapsed || isMobile) && (
          <p className="text-xs text-sidebar-foreground/70">
            Design, Development & Hosting by Limidora
          </p>
      )}
      </AppNewSidebarFooter>
    </React.Fragment>
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <div id="app-shell-root" className="flex flex-col h-full bg-background">
          <SheetContent
            side="left"
            className="p-0 w-[280px] flex flex-col data-[state=closed]:duration-200 data-[state=open]:duration-300 bg-sidebar text-sidebar-foreground border-r-0"
          >
            <SheetTitle className="sr-only">Main Navigation</SheetTitle>
            <AppNewSidebar className="flex-1 overflow-y-auto">
              {sidebarActualContent}
            </AppNewSidebar>
          </SheetContent>

          <div className="flex-1 flex flex-col overflow-x-hidden">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="h-9 px-3 text-sm font-bold" onClick={() => setOpenMobile(true)}>
                  + MENU
                </Button>
                <h1 className="text-xl font-semibold font-headline hidden sm:block">
                  {currentPageLabel}
                </h1>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleAppFullScreen}
                  className="h-9 w-9 inline-flex"
                  title={isAppFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isAppFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  <span className="sr-only">{isAppFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}</span>
                </Button>
                <UserProfile />
              </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 overflow-y-auto bg-muted/30 min-h-0">
              {children}
            </main>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <div id="app-shell-root" className="flex h-full bg-background">
      <AppNewSidebar
        className={cn(
          "h-full border-r border-sidebar-border",
          "transition-all duration-300 ease-in-out",
          isCollapsed ? `w-[${sidebarVars.collapsed}]` : `w-[${sidebarVars.expanded}]`
        )}
      >
        {sidebarActualContent}
      </AppNewSidebar>

      <div
        className={cn(
          "flex-1 flex flex-col overflow-auto",
          "transition-all duration-300 ease-in-out"
        )}
      >
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur-sm sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleCollapse}>
              {isCollapsed ? <PanelLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
              <span className="sr-only">{isCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
            </Button>
            <h1 className="text-xl font-semibold font-headline hidden sm:block">
              {currentPageLabel}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAppFullScreen}
              className="h-9 w-9 inline-flex"
              title={isAppFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isAppFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              <span className="sr-only">{isAppFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}</span>
            </Button>
            <UserProfile />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-muted/30">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobileView = useIsMobile();
  const [openMobileSidebar, setOpenMobileSidebar] = useState(false);

  useEffect(() => {
    if (currentUser === undefined) return;

    if (!currentUser && !pathname.startsWith('/_next/')) {
      router.replace("/");
    }
  }, [currentUser, router, pathname]);

  if (currentUser === undefined || isMobileView === undefined) {
    return <GlobalPreloaderScreen message="Initializing..." />;
  }

  if (!currentUser && !pathname.startsWith('/_next/')) {
    return <GlobalPreloaderScreen message="Redirecting to login..." />;
  }

  const userRole = currentUser?.role;
  const currentNavItemsForUser = userRole
    ? ALL_NAV_ITEMS.filter(item => {
        const hasAllowedRole = item.allowedRoles.includes(userRole);
        if (item.children) {
          const filteredChildren = item.children.filter(child => child.allowedRoles.includes(userRole));
          return hasAllowedRole && filteredChildren.length > 0;
        }
        return hasAllowedRole;
      }).map(item => {
        if (item.children) {
          return {
            ...item,
            children: item.children.filter(child => child.allowedRoles.includes(userRole as UserRole))
          };
        }
        return item;
      })
    : [];


  return (
    <NewSidebarProvider
      navItems={currentNavItemsForUser}
      userRole={userRole}
      isMobile={isMobileView}
      openMobile={openMobileSidebar}
      setOpenMobile={setOpenMobileSidebar}
    >
      <AppShell>{children}</AppShell>
    </NewSidebarProvider>
  );
}
