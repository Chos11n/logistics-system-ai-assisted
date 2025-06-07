export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'manager' | 'operator' | 'customer';
  permissions: Permission[];
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
}

export const PERMISSIONS = {
  CUSTOMER_MANAGEMENT: { id: 'customer_management', name: '客户管理', description: '管理客户信息' },
  TRUCK_MANAGEMENT: { id: 'truck_management', name: '货车管理', description: '管理货车信息' },
  ACCOUNT_MANAGEMENT: { id: 'account_management', name: '账户管理', description: '管理用户账户' },
  EMERGENCY_SHIPMENT: { id: 'emergency_shipment', name: '紧急送出', description: '使用紧急送出功能' },
  WAREHOUSE_ACCESS: { id: 'warehouse_access', name: '仓库访问', description: '访问仓库页面' },
  INPUT_CARGO: { id: 'input_cargo', name: '录入货物', description: '录入货物信息' },
  VIEW_HISTORY: { id: 'view_history', name: '查看历史', description: '查看历史记录' },
  VIEW_TRUCKS: { id: 'view_trucks', name: '查看装车', description: '查看装车详情' },
  HOME_ACCESS: { id: 'home_access', name: '首页访问', description: '访问首页' }
};

export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.CUSTOMER_MANAGEMENT,
    PERMISSIONS.TRUCK_MANAGEMENT,
    PERMISSIONS.EMERGENCY_SHIPMENT,
    PERMISSIONS.WAREHOUSE_ACCESS,
    PERMISSIONS.INPUT_CARGO,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.VIEW_TRUCKS,
    PERMISSIONS.HOME_ACCESS
  ],
  operator: [
    PERMISSIONS.EMERGENCY_SHIPMENT,
    PERMISSIONS.TRUCK_MANAGEMENT,
    PERMISSIONS.WAREHOUSE_ACCESS,
    PERMISSIONS.INPUT_CARGO,
    PERMISSIONS.VIEW_HISTORY,
    PERMISSIONS.VIEW_TRUCKS,
    PERMISSIONS.HOME_ACCESS
  ],
  customer: [
    PERMISSIONS.INPUT_CARGO,
    PERMISSIONS.HOME_ACCESS
  ]
};

export const getRoleDisplayName = (role: User['role']): string => {
  switch (role) {
    case 'admin': return '超级管理员';
    case 'manager': return '管理员';
    case 'operator': return '操作员';
    case 'customer': return '客户';
    default: return '未知';
  }
};