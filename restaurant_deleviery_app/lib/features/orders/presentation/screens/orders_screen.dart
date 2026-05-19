import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/controllers/auth_controller.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/screens/login_screen.dart';
import '../controllers/order_controller.dart';
import '../../../../core/theme/colors.dart';
import './order_tracking_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;
  String _selectedTab = 'All'; // 'All', 'Pending', 'InProgress', 'Completed'

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );

    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);

    _slideAnim = Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero)
        .animate(
          CurvedAnimation(parent: _animController, curve: Curves.easeOutCubic),
        );

    _animController.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthController>();
      if (auth.token != null) {
        context.read<OrderController>().fetchOrders(auth.token!);
      }
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  List<dynamic> _getFilteredOrders(List<dynamic> allOrders) {
    if (_selectedTab == 'All') return allOrders;
    return allOrders.where((order) {
      final status = order['status'].toString().toLowerCase();
      if (_selectedTab == 'Pending') {
        return status == 'pending';
      } else if (_selectedTab == 'InProgress') {
        return status == 'preparing' || status == 'ready';
      } else if (_selectedTab == 'Completed') {
        return status == 'served';
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthController>(
      builder: (context, auth, child) {
        // ── NOT LOGGED IN STATE ──────────────────────────────────────
        if (!auth.isAuthenticated) {
          return _buildNotLoggedIn(context);
        }

        // ── LOGGED IN STATE ──────────────────────────────────────────
        return Scaffold(
          backgroundColor: const Color(0xFFFAFAFA),
          appBar: AppBar(
            title: const Text(
              'My Orders',
              style: TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
                fontSize: 20,
                fontFamily: "Poppins",
              ),
            ),
            backgroundColor: Colors.white,
            elevation: 0,
            centerTitle: true,
            actions: [
              IconButton(
                icon: const Icon(
                  Icons.refresh_rounded,
                  color: AppColors.primaryColor,
                ),
                onPressed: () {
                  context.read<OrderController>().fetchOrders(auth.token!);
                },
              ),
            ],
          ),
          body: Consumer<OrderController>(
            builder: (context, orderController, child) {
              if (orderController.isLoading && orderController.orders.isEmpty) {
                return const Center(
                  child: CircularProgressIndicator(
                    color: AppColors.primaryColor,
                  ),
                );
              }

              final filteredOrders = _getFilteredOrders(orderController.orders);

              return Column(
                children: [
                  // Tab Selector at the top
                  _buildTabs(),

                  Expanded(
                    child: filteredOrders.isEmpty
                        ? _buildEmptyOrders()
                        : RefreshIndicator(
                            onRefresh: () async {
                              await orderController.fetchOrders(auth.token!);
                            },
                            color: AppColors.primaryColor,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              itemCount: filteredOrders.length,
                              itemBuilder: (context, index) {
                                final order = filteredOrders[index];
                                return _buildOrderCard(context, order);
                              },
                            ),
                          ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  // ── TABS SELECTOR ────────────────────────────────────────────────────
  Widget _buildTabs() {
    final tabs = ['All', 'Pending', 'InProgress', 'Completed'];
    return Container(
      height: 42,
      margin: const EdgeInsets.symmetric(vertical: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: tabs.length,
        itemBuilder: (context, index) {
          final tab = tabs[index];
          final isSelected = _selectedTab == tab;
          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedTab = tab;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 10),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [
                          AppColors.primaryColor,
                          AppColors.primaryColor,
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isSelected ? null : const Color(0xFFF1F1F1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                tab == 'InProgress' ? 'In Progress' : tab,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey[700],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  fontFamily: 'Poppins',
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  // ── NOT LOGGED IN WIDGET ─────────────────────────────────────────────
  Widget _buildNotLoggedIn(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 30),
              child: Column(
                children: [
                  const Spacer(flex: 2),

                  // Illustration circle
                  Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primaryColor.withValues(alpha: 0.06),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Outer ring
                        Container(
                          width: 130,
                          height: 130,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: AppColors.primaryColor.withValues(
                                alpha: 0.15,
                              ),
                              width: 2,
                            ),
                          ),
                        ),
                        // Icon
                        Container(
                          width: 90,
                          height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primaryColor.withValues(
                              alpha: 0.1,
                            ),
                          ),
                          child: const Icon(
                            IconlyBold.bag_2,
                            size: 42,
                            color: AppColors.primaryColor,
                          ),
                        ),
                        // Lock badge
                        Positioned(
                          bottom: 18,
                          right: 18,
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: const BoxDecoration(
                              color: AppColors.primaryColor,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.lock_rounded,
                              color: Colors.white,
                              size: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Title
                  const Text(
                    "Your Orders",
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                      fontFamily: "Poppins",
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Subtitle
                  Text(
                    "Sign in to view your order history,\ntrack active deliveries and re-order\nyour favourite meals.",
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                      fontFamily: "Poppins",
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 40),

                  // Sign In Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const LoginScreen(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryColor,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(18),
                        ),
                        elevation: 0,
                        shadowColor: Colors.transparent,
                      ),
                      child: const Text(
                        "Sign In to View Orders",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          fontFamily: "Poppins",
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Register hint
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        "Don't have an account? ",
                        style: TextStyle(
                          color: Colors.grey[500],
                          fontSize: 13,
                          fontFamily: "Poppins",
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => const LoginScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          "Sign Up",
                          style: TextStyle(
                            color: AppColors.primaryColor,
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: "Poppins",
                          ),
                        ),
                      ),
                    ],
                  ),

                  // Feature list
                  const SizedBox(height: 48),
                  _buildFeatureRow(
                    Icons.receipt_long_rounded,
                    "Order History",
                    "Browse all your past orders",
                  ),
                  const SizedBox(height: 18),
                  _buildFeatureRow(
                    Icons.local_shipping_rounded,
                    "Live Tracking",
                    "Track your order in real-time",
                  ),
                  const SizedBox(height: 18),
                  _buildFeatureRow(
                    Icons.replay_rounded,
                    "Quick Reorder",
                    "Reorder your favourites in one tap",
                  ),

                  const Spacer(flex: 3),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureRow(IconData icon, String title, String subtitle) {
    return Row(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: AppColors.primaryColor.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppColors.primaryColor, size: 20),
        ),
        const SizedBox(width: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
                fontFamily: "Poppins",
              ),
            ),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
                fontFamily: "Poppins",
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── EMPTY ORDERS ─────────────────────────────────────────────────────
  Widget _buildEmptyOrders() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.grey[100],
            ),
            child: Icon(IconlyLight.bag_2, size: 55, color: Colors.grey[300]),
          ),
          const SizedBox(height: 20),
          const Text(
            "No orders yet",
            style: TextStyle(
              fontSize: 18,
              color: Colors.black87,
              fontWeight: FontWeight.bold,
              fontFamily: "Poppins",
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Orders under this filter will appear here.",
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[500],
              fontFamily: "Poppins",
            ),
          ),
        ],
      ),
    );
  }

  // ── PREMIUM ORDER CARD ─────────────────────────────────────────────────
  Widget _buildOrderCard(BuildContext context, dynamic order) {
    final DateTime createdAt = DateTime.parse(order['createdAt']);
    final String formattedDate = DateFormat(
      'MMMM d - hh:mm a',
    ).format(createdAt);
    final String status = order['status'].toString();

    // Macaamilka wuxuu codsaday in midabada oo dhan laga dhigo AppColors.primaryColor
    // oo kaliya la kala qaabeeyo opacity-kooda (gaagaabiyo) iyadoo la isticmaalayo .withValues(alpha: ...)
    Color statusColor;
    Color badgeBgColor;
    String badgeText;

    switch (status.toLowerCase()) {
      case 'pending':
        statusColor = AppColors.primaryColor.withValues(alpha: 0.5);
        badgeBgColor = AppColors.primaryColor.withValues(alpha: 0.6);
        badgeText = "Pending";
        break;
      case 'preparing':
      case 'ready':
        statusColor = AppColors.primaryColor.withValues(alpha: 0.75);
        badgeBgColor = AppColors.primaryColor.withValues(alpha: 0.85);
        badgeText = "InProgress";
        break;
      case 'served':
        statusColor =
            AppColors.primaryColor; // Midabka guud ee buuxa 1.0 opacity
        badgeBgColor = AppColors.primaryColor;
        badgeText = "Completed";
        break;
      case 'cancelled':
        statusColor = AppColors.primaryColor.withValues(alpha: 0.25);
        badgeBgColor = AppColors.primaryColor.withValues(alpha: 0.35);
        badgeText = "Cancelled";
        break;
      default:
        statusColor = AppColors.primaryColor.withValues(alpha: 0.5);
        badgeBgColor = AppColors.primaryColor.withValues(alpha: 0.6);
        badgeText = status;
    }

    return GestureDetector(
      onTap: () {
        // Markii lagu dhufto kaarka, waxa toos loo geynayaa tracking page-kiisa!
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => OrderTrackingScreen(order: order),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Premium Left Colored Accent Bar (Primary color mixed opacity)
              Container(
                width: 6,
                decoration: BoxDecoration(
                  color: statusColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(16),
                    bottomLeft: Radius.circular(16),
                  ),
                ),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Row: Title & Badge
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Order #${order['id']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Color(0xFF212121),
                              fontFamily: 'Poppins',
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: badgeBgColor,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              badgeText,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Poppins',
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Calendar date
                      Row(
                        children: [
                          Icon(
                            Icons.calendar_month_outlined,
                            size: 16,
                            color: statusColor,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            formattedDate,
                            style: TextStyle(
                              color: statusColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Location / Table Label
                      Text(
                        order['table'] != null
                            ? 'For Table ${order['table']['number']}'
                            : (order['orderType'] == 'delivery'
                                  ? 'For Delivery Order'
                                  : 'For Takeaway Order'),
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 13,
                          fontFamily: 'Poppins',
                        ),
                      ),
                      const SizedBox(height: 12),

                      Divider(height: 1, color: Colors.grey[100]),
                      const SizedBox(height: 10),

                      // Items & Total
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${order['orderitem']?.length ?? 0} Items',
                            style: TextStyle(
                              color: Colors.grey[500],
                              fontSize: 12,
                              fontFamily: 'Poppins',
                            ),
                          ),
                          Text(
                            '\$${double.parse(order['total'].toString()).toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: AppColors.primaryColor,
                              fontFamily: 'Poppins',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
