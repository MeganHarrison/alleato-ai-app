import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/hooks/useAuth"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Navigation",
      url: "#",
      items: [
        {
          title: "Dashboard",
          url: "/",
        },
        {
          title: "System Architecture",
          url: "/architecture",
        },
        {
          title: "Projects",
          url: "/projects",
        },
        {
          title: "Project Insights",
          url: "/insights",
        },
        {
          title: "Chat",
          url: "/chatkit",
        },
      ],
    },
    {
      title: "Tables",
      url: "#",
      items: [
                {
          title: "Meetings",
          url: "/meetings",
        },
                {
          title: "Tasks",
          url: "/tasks",
        },
        {
          title: "Clients",
          url: "/clients",
        },
        {
          title: "Prospects",
          url: "/prospects",
          isActive: true,
        },
        {
          title: "Contacts",
          url: "/contacts",
        },
        {
          title: "Companies",
          url: "/companies",
        },
        {
          title: "Employees",
          url: "/employees",
        },
        {
          title: "Documents",
          url: "/documents",
        },
        {
          title: "Submittals",
          url: "/submittals",
        },
        {
          title: "Subcontractors",
          url: "/subcontractors",
        },
      ],
    },
    {
      title: "FM Global",
      url: "#",
      items: [
        {
          title: "Form",
          url: "#",
        },
      ],
    },
  ],
  user: {
    name: "John Doe",
    email: "john.doe@example.com", 
    avatar: "/placeholder.svg",
  },
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  const userData = user ? {
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    avatar: user.user_metadata?.avatar_url || ''
  } : data.user

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center">
                  <Image 
                    src="/Alleato Favicon.png" 
                    alt="Alleato Logo" 
                    width={32} 
                    height={32}
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Alleato Group</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-4">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url} className="font-medium">
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items?.length ? (
                  <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                    {item.items.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        <SidebarMenuSubButton asChild isActive={item.isActive}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
