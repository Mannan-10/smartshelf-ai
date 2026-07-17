export type AppRole = 'OWNER' | 'STAFF' | 'ADMIN';

export type NavigationItem = {
    label: string,
    href: string,
    description: string,
    roles: AppRole[];
};

export const ADMIN_ROLES: AppRole[] = ['OWNER', 'ADMIN'];
export const ALL_ROLES: AppRole[] = ['OWNER', 'ADMIN', 'STAFF'];

export const NavigationItems: NavigationItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        description: 'Overview of inventory and alerts',
        roles: ALL_ROLES,
    },
    {
        label: 'Products',
        href: '/products',
        description: 'Manage products catalog and stock',
        roles: ALL_ROLES,
    },
    {
        label: 'Inventory',
        href: '/inventory',
        description: 'Stock, reorder, and expiry tracking',
        roles: ALL_ROLES,
    },
    {
        label: 'Reports',
        href: '/reports',
        description: 'Profit, wastage, and demand reports',
        roles: ['OWNER', 'ADMIN'],
    },
    {
        label: 'Admin',
        href: '/admin',
        description: 'Admin-only controls and staff management',
        roles: ['OWNER', 'ADMIN'],
    },
    {
        label: 'Settings',
        href: '/settings',
        description: 'Shop and account settings',
        roles: ['OWNER', 'ADMIN'],
    },
    {
        label: 'Vendors',
        href: '/vendors',
        description: 'Manage supplier and vendor details',
        roles: ALL_ROLES,
    },
    {
        label: 'Sales',
        href: '/sales',
        description: 'Manage sales and customer transactions',
        roles: ALL_ROLES,
    },
    {
        label: 'Purchases',
        href: '/purchases',
        description: 'Manage purchase orders and restocks',
        roles: ALL_ROLES,
    },
    {
        label: 'Forecast',
        href: '/forecast',
        description: 'AI-driven inventory predictions',
        roles: ALL_ROLES,
    },
    {
        label: 'Alerts',
        href: '/alerts',
        description: 'Low stock and expiry notifications',
        roles: ALL_ROLES,
    },
]

export function isAppRole(value: unknown): value is AppRole {
    return value === 'OWNER' || value === 'STAFF' || value === 'ADMIN';
}

export function isAdminRole(role: AppRole) {
    return ADMIN_ROLES.includes(role);
}

export function getNavigationItemsForRole(role: AppRole) {
    return NavigationItems.filter(item => item.roles.includes(role));
}