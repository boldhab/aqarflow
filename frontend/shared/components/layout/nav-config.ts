import {
  LayoutDashboard,
  Building2,
  Users,
  CalendarCheck2,
  Handshake,
  ExternalLink,
  LucideIcon,
} from 'lucide-react';

export interface SubNavItem {
  id: string;
  label: string;
  href: string;
  badge?: string;
  badgeVariant?: 'default' | 'orange' | 'emerald';
  roles?: ('ADMIN' | 'AGENT')[];
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'default' | 'orange' | 'emerald';
  items?: SubNavItem[];
  roles?: ('ADMIN' | 'AGENT')[];
  external?: boolean;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
  roles?: ('ADMIN' | 'AGENT')[];
}

export const WORKSPACE_NAVIGATION: NavSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    id: 'properties-section',
    title: 'Inventory',
    items: [
      {
        id: 'properties',
        label: 'Properties',
        href: '/inventory',
        icon: Building2,
        badge: 'Live',
        badgeVariant: 'emerald',
        items: [
          {
            id: 'properties-all',
            label: 'All Properties',
            href: '/inventory',
          },
          {
            id: 'properties-sale',
            label: 'For Sale',
            href: '/inventory?purpose=SALE',
          },
          {
            id: 'properties-rent',
            label: 'For Rent',
            href: '/inventory?purpose=RENT',
          },
        ],
      },
    ],
  },
  {
    id: 'crm-section',
    title: 'CRM & Pipeline',
    items: [
      {
        id: 'leads',
        label: 'Leads & CRM',
        href: '/leads',
        icon: Users,
        items: [
          {
            id: 'leads-all',
            label: 'All Inquiries',
            href: '/leads',
          },
          {
            id: 'leads-pipeline',
            label: 'Pipeline Kanban',
            href: '/leads?view=pipeline',
          },
        ],
      },
      {
        id: 'visits',
        label: 'Property Visits',
        href: '/visits',
        icon: CalendarCheck2,
      },
      {
        id: 'deals',
        label: 'Deals & Revenue',
        href: '/deals',
        icon: Handshake,
      },
    ],
  },
  { id: 'operations', title: 'Operations', items: [
    {id:'contacts',label:'Contacts',href:'/contacts',icon:Users},
    {id:'rentals',label:'Rental portfolio',href:'/rentals',icon:Building2},
    {id:'invoices',label:'Invoices',href:'/finance/invoices',icon:Handshake},
    {id:'rent-schedule',label:'Rent schedule',href:'/rentals/schedule',icon:CalendarCheck2},
    {id:'payments',label:'Payments',href:'/finance/payments',icon:Handshake},
    {id:'expenses',label:'Expenses',href:'/finance/expenses',icon:Handshake},
    {id:'commissions',label:'Commissions',href:'/finance/commissions',icon:Handshake},
    {id:'maintenance',label:'Maintenance',href:'/maintenance',icon:Building2},
    {id:'reports',label:'Reports',href:'/reports',icon:LayoutDashboard,roles:['ADMIN']},
    {id:'users',label:'Staff management',href:'/users',icon:Users,roles:['ADMIN']},
    {id:'settings',label:'Agency settings',href:'/settings',icon:Building2,roles:['ADMIN']},
    {id:'audit',label:'Audit history',href:'/settings/audit',icon:CalendarCheck2,roles:['ADMIN']},
  ]},
  {
    id: 'shortcuts',
    title: 'Shortcuts',
    items: [
      {
        id: 'public-portal',
        label: 'Public Marketplace',
        href: '/',
        icon: ExternalLink,
        external: true,
      },
    ],
  },
];
