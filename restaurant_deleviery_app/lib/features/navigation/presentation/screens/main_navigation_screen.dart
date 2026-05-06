import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:restaurant_delivery_app/features/cart/presentation/screens/cart_screen.dart';
import 'package:restaurant_delivery_app/features/home/presentation/screens/home_screen.dart';
import 'package:restaurant_delivery_app/features/orders/presentation/screens/order_tracking_screen.dart';
import 'package:restaurant_delivery_app/features/settings/presentation/screens/settings_screen.dart';
import 'package:restaurant_delivery_app/features/scan/presentation/screens/scan_payment_screen.dart';
import 'package:restaurant_delivery_app/features/orders/presentation/screens/orders_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const OrdersScreen(), // Orders Screen
    const CartScreen(), // Carts
    const SettingsScreen(), // Profile
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      floatingActionButton: Container(
        height: 65,
        width: 65,
        decoration: BoxDecoration(
          color: const Color(0xFF4CAF50), // Green scan button
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.green.withOpacity(0.3),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: IconButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ScanPaymentScreen()),
            );
          },
          icon: const Icon(IconlyBold.scan, color: Colors.white, size: 30),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: Colors.white,
        padding: EdgeInsets.zero,
        notchMargin: 10,
        shape: const CircularNotchedRectangle(),
        child: SizedBox(
          height: 70,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(IconlyBold.home, IconlyLight.home, 'Home', 0),
              _buildNavItem(IconlyBold.document, IconlyLight.document, 'Orders', 1),
              const SizedBox(width: 40), // Space for FAB
              _buildNavItem(IconlyBold.buy, IconlyLight.buy, 'Carts', 2),
              _buildNavItem(IconlyBold.profile, IconlyLight.profile, 'Profile', 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    IconData activeIcon,
    IconData inactiveIcon,
    String label,
    int index,
  ) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentIndex = index;
        });
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
              isSelected ? activeIcon : inactiveIcon,
              color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[400],
              size: 24,
            ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? const Color(0xFF4CAF50) : Colors.grey[400],
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
}
