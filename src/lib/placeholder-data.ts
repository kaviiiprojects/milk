
import type { Product, Customer, Sale, StatsData, SalesChartData, FullReportEntry, ActivityItem, Vehicle } from "./types";
import { format } from "date-fns";
import { ShoppingCart, Package, UserPlus } from "lucide-react"; // Added this line

export const placeholderProducts: Product[] = [
  { id: "prod001", name: "Yoghurt", category: "Yogurt", price: 1.50, wholesalePrice: 1.30, stock: 100, imageUrl: "https://images.unsplash.com/photo-1685967836586-aaefdda7b517?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHx5b2d1cnQlMjBwcm9kdWN0fGVufDB8fHx8MTc1MDA5Mjk4MXww&ixlib=rb-4.1.0&q=80&w=1080", description: "Classic creamy yoghurt.", sku: "YOG001", reorderLevel: 20, aiHint: "yogurt product" },
  { id: "prod002", name: "Jelly Yoghurt", category: "Yogurt", price: 1.80, wholesalePrice: 1.60, stock: 80, imageUrl: "https://images.unsplash.com/photo-1709620054862-c2eb5b9dbefc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx5b2d1cnQlMjBwcm9kdWN0fGVufDB8fHx8MTc1MDA5Mjk4MXww&ixlib=rb-4.1.0&q=80&w=1080", description: "Yoghurt with fruit jelly.", sku: "YOG002", reorderLevel: 15, aiHint: "yogurt product" },
  { id: "prod003", name: "Drinking Yoghurt", category: "Yogurt", price: 2.00, wholesalePrice: 1.80, stock: 90, imageUrl: "https://images.unsplash.com/photo-1658216175344-d6963871967f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx5b2d1cnQlMjBwcm9kdWN0fGVufDB8fHx8MTc1MDA5Mjk4MXww&ixlib=rb-4.1.0&q=80&w=1080", description: "Refreshing drinkable yoghurt.", sku: "YOG003", reorderLevel: 20, aiHint: "yogurt product" },
  { id: "prod004", name: "Chocolate Drink", category: "Drink", price: 2.50, wholesalePrice: 2.20, stock: 70, imageUrl: "https://images.unsplash.com/photo-1648220818316-876d53dad8d5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwyfHxkcmluayUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Rich chocolate flavored milk drink.", sku: "DRK001", reorderLevel: 15, aiHint: "drink product" },
  { id: "prod005", name: "Glue Cola", category: "Drink", price: 1.20, wholesalePrice: 1.00, stock: 120, imageUrl: "https://images.unsplash.com/photo-1718963781294-11f37a1392df?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHxkcmluayUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "A popular cola beverage.", sku: "DRK002", reorderLevel: 25, aiHint: "drink product" },
  { id: "prod006", name: "Milk Ice Packet", category: "Ice Cream", price: 1.00, wholesalePrice: 0.80, stock: 150, imageUrl: "https://images.unsplash.com/photo-1687162330786-ce3b9a54be46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxpY2UlMjBjcmVhbSUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Frozen milk ice treat.", sku: "ICE001", reorderLevel: 30, aiHint: "ice cream" },
  { id: "prod007", name: "Chocolate Ice Packet", category: "Ice Cream", price: 1.20, wholesalePrice: 1.00, stock: 140, imageUrl: "https://images.unsplash.com/photo-1718573140843-e901a4eb3001?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxpY2UlMjBjcmVhbSUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Frozen chocolate ice treat.", sku: "ICE002", reorderLevel: 30, aiHint: "ice cream" },
  { id: "prod008", name: "Watalappan", category: "Dessert", price: 3.50, wholesalePrice: 3.20, stock: 50, imageUrl: "https://images.unsplash.com/photo-1724931641963-f4a12f8fd3e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8ZGVzc2VydCUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgyfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Traditional coconut custard pudding.", sku: "DES001", reorderLevel: 10, aiHint: "dessert product" },
  { id: "prod009", name: "Jelly Pudding", category: "Dessert", price: 2.80, wholesalePrice: 2.50, stock: 60, imageUrl: "https://images.unsplash.com/photo-1705301698338-3a1fe206296e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHxkZXNzZXJ0JTIwcHJvZHVjdHxlbnwwfHx8fDE3NTAwOTI5ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080", description: "Colorful fruit jelly pudding.", sku: "DES002", reorderLevel: 10, aiHint: "dessert product" },
  { id: "prod010", name: "Faluda", category: "Drink", price: 3.00, wholesalePrice: 2.70, stock: 40, imageUrl: "https://images.unsplash.com/photo-1718963781424-bca62b27b0d9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxkcmluayUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Sweet rose-flavored milk drink with vermicelli and basil seeds.", sku: "DRK003", reorderLevel: 10, aiHint: "drink product" },
  { id: "prod011", name: "Iced Coffee", category: "Drink", price: 2.20, wholesalePrice: 2.00, stock: 60, imageUrl: "https://images.unsplash.com/photo-1718963781251-a663621c8eeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxkcmluayUyMHByb2R1Y3R8ZW58MHx8fHwxNzUwMDkyOTgxfDA&ixlib=rb-4.1.0&q=80&w=1080", description: "Chilled coffee beverage.", sku: "DRK004", reorderLevel: 15, aiHint: "drink product" },
  { id: "prod012", name: "Curd", category: "Curd", price: 4.00, wholesalePrice: 3.70, stock: 70, imageUrl: "https://images.unsplash.com/photo-1628952061849-b386b4ecf709?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxjdXJkJTIwcHJvZHVjdHxlbnwwfHx8fDE3NTAwOTI5ODF8MA&ixlib=rb-4.1.0&q=80&w=1080", description: "Thick and creamy curd.", sku: "CRD001", reorderLevel: 15, aiHint: "curd product" },
];

export const placeholderCustomers: Customer[] = [
  { id: "1", name: "Retail LK", phone: "077-1234567", address: "12 Galle Rd, Colombo", shopName: "Colombo Super", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Retail%20LK` },
  { id: "2", name: "Kandy Foods", phone: "071-7654321", address: "34 Temple St, Kandy", shopName: "Kandy Central Mart", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Kandy%20Foods` },
  { id: "3", name: "Nuwara Eliya Grocers", phone: "070-5558888", shopName: "Highland Grocers", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Nuwara%20Eliya%20Grocers` },
  { id: "4", name: "Jaffna Traders", phone: "076-9990000", address: "7 Market Sq, Jaffna", avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Jaffna%20Traders` },
];

const calculateSaleDetails = (items: CartItem[], discountPercentage: number): Pick<Sale, 'subTotal' | 'discountAmount' | 'totalAmount'> => {
  const subTotal = items.reduce((sum, item) => sum + item.appliedPrice * item.quantity, 0);
  const discountAmount = subTotal * (discountPercentage / 100);
  const totalAmount = subTotal - discountAmount;
  return { subTotal, discountAmount, totalAmount };
};

export const placeholderSales: Sale[] = [
  (() => {
    const items: CartItem[] = [
      { ...placeholderProducts[0], quantity: 2, appliedPrice: placeholderProducts[0].price, saleType: 'retail' },
      { ...placeholderProducts[1], quantity: 1, appliedPrice: placeholderProducts[1].price, saleType: 'retail' },
      { ...placeholderProducts[4], quantity: 5, appliedPrice: placeholderProducts[4].wholesalePrice || placeholderProducts[4].price, saleType: 'wholesale' },
    ];
    const discountPercentage = 5; // 5% discount
    const { subTotal, discountAmount, totalAmount } = calculateSaleDetails(items, discountPercentage);
    return {
      id: "SALE-001",
      customerId: "1",
      customerName: "Retail LK",
      items,
      subTotal,
      discountPercentage,
      discountAmount,
      totalAmount,
      paymentMethod: "Card",
      saleDate: new Date(Date.now() - 86400000 * 2.5), // 2.5 days ago
      staffId: "staff001"
    };
  })(),
  (() => {
    const items: CartItem[] = [
      { ...placeholderProducts[7], quantity: 1, appliedPrice: placeholderProducts[7].price, saleType: 'retail' },
      { ...placeholderProducts[11], quantity: 1, appliedPrice: placeholderProducts[11].price, saleType: 'retail' },
    ];
    const discountPercentage = 0;
    const { subTotal, discountAmount, totalAmount } = calculateSaleDetails(items, discountPercentage);
    const cashGiven = Math.ceil(totalAmount / 10) * 10; // Example: round up to nearest 10
    return {
      id: "SALE-002",
      customerId: "2",
      customerName: "Kandy Foods",
      items,
      subTotal,
      discountPercentage,
      discountAmount,
      totalAmount,
      paymentMethod: "Cash",
      cashGiven: cashGiven,
      balanceReturned: cashGiven - totalAmount,
      saleDate: new Date(Date.now() - 86400000 * 1.2), // 1.2 days ago
      staffId: "staff002"
    };
  })(),
  (() => {
    const items: CartItem[] = [
      { ...placeholderProducts[5], quantity: 3, appliedPrice: placeholderProducts[5].price, saleType: 'retail' },
    ];
    const discountPercentage = 10; // 10% discount
    const { subTotal, discountAmount, totalAmount } = calculateSaleDetails(items, discountPercentage);
    const amountPaidOnCredit = totalAmount / 2; // Paid half
    return {
      id: "SALE-003",
      customerId: "3", // Assuming credit sale needs a customer
      customerName: "Nuwara Eliya Grocers",
      items,
      subTotal,
      discountPercentage,
      discountAmount,
      totalAmount,
      paymentMethod: "Credit",
      amountPaidOnCredit: amountPaidOnCredit,
      remainingCreditBalance: totalAmount - amountPaidOnCredit,
      saleDate: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      staffId: "staff001"
    };
  })(),
];

export function generatePlaceholderStats(): StatsData {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return {
    totalSales: placeholderSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalCustomers: placeholderCustomers.length,
    lowStockItems: placeholderProducts.filter(p => p.stock <= (p.reorderLevel || 10)).length,
    revenueToday: placeholderSales
      .filter(s => s.saleDate >= todayStart)
      .reduce((sum, sale) => sum + sale.totalAmount, 0),
  };
}


export const placeholderSalesChartData: SalesChartData[] = [
  { name: "Mon", sales: 400 },
  { name: "Tue", sales: 300 },
  { name: "Wed", sales: 200 },
  { name: "Thu", sales: 278 },
  { name: "Fri", sales: 189 },
  { name: "Sat", sales: 239 },
  { name: "Sun", sales: 349 },
];

export const placeholderMonthlySalesData: SalesChartData[] = [
  { name: "Jan", sales: 2400 },
  { name: "Feb", sales: 1398 },
  { name: "Mar", sales: 9800 },
  { name: "Apr", sales: 3908 },
  { name: "May", sales: 4800 },
  { name: "Jun", sales: 3800 },
  { name: "Jul", sales: 4300 },
];


export function generatePlaceholderFullReportData(): FullReportEntry[] {
  const reportData: FullReportEntry[] = [];
  placeholderSales.forEach(sale => {
    sale.items.forEach(item => {
      reportData.push({
        saleId: sale.id,
        saleDate: format(sale.saleDate, "yyyy-MM-dd"),
        saleTime: format(sale.saleDate, "HH:mm:ss"),
        customerName: sale.customerName || "N/A",
        productSku: item.sku || "N/A",
        productName: item.name,
        productCategory: item.category,
        quantity: item.quantity,
        appliedPrice: item.appliedPrice,
        lineTotal: item.quantity * item.appliedPrice,
        saleType: item.saleType,
        paymentMethod: sale.paymentMethod,
        staffId: sale.staffId,
      });
    });
  });
  return reportData.sort((a,b) => new Date(b.saleDate + 'T' + b.saleTime).getTime() - new Date(a.saleDate + 'T' + a.saleTime).getTime());
}

export const placeholderFullReportData: FullReportEntry[] = generatePlaceholderFullReportData();

// For RecentActivity component
const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase();

const tempProductForActivity = placeholderProducts[4]; // Glue Cola
export const recentActivities: ActivityItem[] = [
  ...placeholderSales.slice(0, 2).map((sale, index): ActivityItem => ({
    id: `sale-${sale.id}`,
    type: "sale",
    title: `Sale #${sale.id.slice(0,4)} to ${sale.customerName || 'Guest'}`,
    description: `${sale.items.length} items, Total: Rs. ${sale.totalAmount.toFixed(2)}`,
    timestamp: sale.saleDate,
    icon: ShoppingCart,
    avatarFallback: sale.customerName ? getInitials(sale.customerName) : 'G',
  })),
  {
    id: "prod-1",
    type: "new_product",
    title: `New Product Added: ${tempProductForActivity.name}`,
    description: `Category: ${tempProductForActivity.category}, Price: Rs. ${tempProductForActivity.price.toFixed(2)}`,
    timestamp: new Date(Date.now() - 86400000 * 0.5), // Half day ago
    icon: Package,
    avatarUrl: tempProductForActivity.imageUrl,
    avatarFallback: tempProductForActivity.category[0],
    aiHint: tempProductForActivity.aiHint,
  },
  {
    id: "cust-1",
    type: "new_customer",
    title: `New Customer Registered: ${placeholderCustomers[2].name}`,
    description: `Phone: ${placeholderCustomers[2].phone}${placeholderCustomers[2].shopName ? ', Shop: ' + placeholderCustomers[2].shopName : ''}`,
    timestamp: new Date(Date.now() - 86400000 * 1.5), // 1.5 days ago
    icon: UserPlus,
    avatarFallback: getInitials(placeholderCustomers[2].name),
  },
].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

export const placeholderVehicles: Vehicle[] = [
  { id: "veh001", vehicleNumber: "VAN-001", driverName: "Sunil Perera", notes: "Primary delivery van" },
  { id: "veh002", vehicleNumber: "TRK-002", driverName: "Kamal Silva", notes: "Handles bulk orders" },
  { id: "veh003", vehicleNumber: "BIK-003", driverName: "Nimal Fernando", notes: "Quick local deliveries" },
];
