
"use client";

import * as React from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
} from "@/components/ui/accordion";
// Removed SheetTitle import as it's no longer used directly here for mobile header
import { cn } from "@/lib/utils";
import type { NavItemConfig, UserRole } from "@/lib/types";

export const SIDEBAR_WIDTH_EXPANDED = "256px";
export const SIDEBAR_WIDTH_COLLAPSED = "80px";

// sidebarVars is exported for AppShell to use
export const sidebarVars = {
  expanded: SIDEBAR_WIDTH_EXPANDED,
  collapsed: SIDEBAR_WIDTH_COLLAPSED,
};

interface SidebarContextProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  isMobile: boolean;
  activePath: string;
  userRole?: UserRole;
  navItems: NavItemConfig[];
  defaultOpenAccordion?: string;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = React.createContext<SidebarContextProps | undefined>(undefined);

export function useSidebarContext() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

interface SidebarProviderProps {
  children: React.ReactNode;
  navItems: NavItemConfig[];
  userRole?: UserRole;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SidebarProvider({
  children,
  navItems,
  userRole,
  isMobile,
  openMobile,
  setOpenMobile
}: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const currentNavItemsForUser = userRole
    ? navItems.filter(item => item.allowedRoles.includes(userRole))
    : [];

  const defaultOpenAccordion = userRole ? currentNavItemsForUser.find(item => item.children && item.children.filter(child => child.allowedRoles.includes(userRole)).some(child => child.href && pathname.startsWith(child.href!)))?.id : undefined;

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: isMobile ? false : isCollapsed,
        toggleCollapse,
        isMobile,
        activePath: pathname,
        userRole,
        navItems: currentNavItemsForUser,
        defaultOpenAccordion,
        openMobile,
        setOpenMobile,
      }}
    >
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar text-sidebar-foreground",
      className
    )}>
      {children}
    </div>
  );
}

export function SidebarHeader({ children, className }: { children: React.ReactNode, className?: string }) {
  const { isCollapsed, isMobile } = useSidebarContext();

  // Removed conditional SheetTitle rendering for mobile.
  // The SheetContent in AppShell will use aria-label for its accessible name.
  const HeaderContent = children;

  return (
    <div className={cn(
        "h-16 flex items-center border-b border-sidebar-border",
        isCollapsed && !isMobile ? "justify-center px-2" : "px-4 justify-start",
        className
      )}
    >
      {HeaderContent}
    </div>
  );
}

export function SidebarContent({ className }: { className?: string }) {
  const { navItems } = useSidebarContext();

  return (
    <ScrollArea className={cn("flex-1", className)}>
      <nav className="px-2 py-4 space-y-1">
        {navItems.map((item) => (
          <SidebarNavItem key={item.id} item={item} />
        ))}
      </nav>
    </ScrollArea>
  );
}

interface SidebarNavItemProps {
  item: NavItemConfig;
}

function SidebarNavItem({ item }: SidebarNavItemProps) {
  const { isCollapsed, activePath, userRole, defaultOpenAccordion, isMobile, setOpenMobile, toggleCollapse } = useSidebarContext();
  const Icon = item.icon;

  const checkIsActive = (path: string, navHref?: string) => {
    if (!navHref) return false;
    if (navHref === "/app/dashboard") return path === navHref;
    return path === navHref || (navHref !== "/" && path.startsWith(navHref + '/'));
  };

  const isActive = item.href
    ? checkIsActive(activePath, item.href)
    : (item.children && userRole ? item.children.filter(c => c.allowedRoles.includes(userRole)).some(child => child.href && checkIsActive(activePath, child.href)) : false);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleAccordionTriggerClick = () => {
    if (isCollapsed && !isMobile) {
      toggleCollapse();
    }
  };

  if (item.children && item.children.length > 0) {
    const filteredChildren = userRole ? item.children.filter(child => child.allowedRoles.includes(userRole)) : [];
    if (filteredChildren.length === 0) return null;

    const isParentOfActiveChild = filteredChildren.some(child => child.href && checkIsActive(activePath, child.href));
    const accordionDefaultValue = defaultOpenAccordion === item.id || (isParentOfActiveChild && !defaultOpenAccordion) ? item.id : undefined;

    return (
      <Accordion type="single" collapsible className="w-full" defaultValue={accordionDefaultValue}>
        <AccordionItem value={item.id} className="border-b-0">
          <Tooltip disableHoverableContent={!isCollapsed || isMobile}>
            <TooltipTrigger asChild>
              <RadixAccordionTrigger
                onClick={handleAccordionTriggerClick}
                className={cn(
                  "flex items-center w-full rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
                  "transition-colors duration-150 group",
                  isCollapsed && !isMobile ? "justify-center h-12" : "justify-between h-11 px-3 py-2",
                  isActive && !isCollapsed && "bg-sidebar-primary/20 text-sidebar-primary",
                  isActive && isCollapsed && !isMobile && "bg-sidebar-primary text-sidebar-primary-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5 shrink-0", isActive && isCollapsed && !isMobile ? "text-sidebar-primary-foreground" : isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
                  {(!isCollapsed || isMobile) && <span className="truncate text-sidebar-foreground group-hover:text-sidebar-accent-foreground">{item.label}</span>}
                </div>
              </RadixAccordionTrigger>
            </TooltipTrigger>
            {isCollapsed && !isMobile && <TooltipContent side="right">{item.label}</TooltipContent>}
          </Tooltip>
          {(!isCollapsed || isMobile) && (
            <AccordionContent className="pl-6 pt-1 pb-0">
              <ul className="space-y-0.5 border-l border-sidebar-border ml-3 pl-3">
                {filteredChildren.map(child => (
                  <li key={child.id}>
                    <Link
                      href={child.href!}
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sidebar-foreground/80",
                        checkIsActive(activePath, child.href) && "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      )}
                    >
                      {child.icon && <child.icon className="h-4 w-4 text-sidebar-foreground/60 shrink-0" />}
                      <span className="truncate">{child.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          )}
        </AccordionItem>
      </Accordion>
    );
  }

  return (
    <Tooltip disableHoverableContent={!isCollapsed || isMobile}>
      <TooltipTrigger asChild>
        <Link
          href={item.href!}
          onClick={handleLinkClick}
          className={cn(
            "flex items-center gap-3 rounded-md text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring group",
            "transition-colors duration-150",
            isCollapsed && !isMobile ? "justify-center h-12" : "px-3 py-2 h-11",
            isActive && !isCollapsed && "bg-sidebar-primary/20 text-sidebar-primary",
            isActive && isCollapsed && !isMobile && "bg-sidebar-primary text-sidebar-primary-foreground"
          )}
        >
          <Icon className={cn("h-5 w-5 shrink-0", isActive && isCollapsed && !isMobile ? "text-sidebar-primary-foreground" : isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70 group-hover:text-sidebar-accent-foreground")} />
          {(!isCollapsed || isMobile) && <span className="truncate text-sidebar-foreground group-hover:text-sidebar-accent-foreground">{item.label}</span>}
        </Link>
      </TooltipTrigger>
      {isCollapsed && !isMobile && <TooltipContent side="right">{item.label}</TooltipContent>}
    </Tooltip>
  );
}

export function SidebarFooter({ children, className }: { children: React.ReactNode, className?: string }) {
   const { isCollapsed, isMobile } = useSidebarContext();
  return (
    <div className={cn(
        "p-4 border-t border-sidebar-border mt-auto",
        isCollapsed && !isMobile ? "text-center" : "px-4",
        className
      )}
    >
      {children}
    </div>
  );
}
