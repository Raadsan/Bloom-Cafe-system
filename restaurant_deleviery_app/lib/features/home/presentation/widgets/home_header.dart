import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:restaurant_delivery_app/features/cart/presentation/controllers/cart_controller.dart';
import 'package:restaurant_delivery_app/features/auth/presentation/controllers/auth_controller.dart';
import 'package:restaurant_delivery_app/features/notifications/presentation/controllers/notification_controller.dart';

import 'package:restaurant_delivery_app/features/notifications/presentation/screens/notifications_screen.dart';
import 'package:restaurant_delivery_app/features/orders/presentation/controllers/order_controller.dart';

class HomeHeader extends StatelessWidget {
  const HomeHeader({super.key});

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final orderController = context.read<OrderController>();
      final notificationController = context.read<NotificationController>();
      if (orderController.orders.isNotEmpty &&
          notificationController.currentCustomerId == null) {
        final lastOrder = orderController.orders.first;
        if (lastOrder['customerId'] != null) {
          notificationController.setCustomerId(lastOrder['customerId']);
          notificationController.fetchNotifications();
        }
      }
    });

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Left Side: Delivery/Dining Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Deliver now",
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[500],
                    fontFamily: "Poppins",
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 2),
                Consumer<CartController>(
                  builder: (context, cart, child) {
                    final table = cart.currentTable;
                    return GestureDetector(
                      onTap: () {
                        // Could trigger dining selection sheet
                      },
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              table != null
                                  ? "Dining at ${table['name']}"
                                  : "Somalia, Mogadishu",
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.black,
                                fontFamily: "Poppins",
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          Icon(
                            Icons.keyboard_arrow_down,
                            size: 18,
                            color: Colors.grey[800],
                          ),
                          if (table != null)
                            GestureDetector(
                              onTap: () => cart.clearTable(),
                              child: const Padding(
                                padding: EdgeInsets.only(left: 8),
                                child: Icon(
                                  Icons.close,
                                  size: 14,
                                  color: Colors.red,
                                ),
                              ),
                            ),
                        ],
                      ),
                    );
                  },
                ),
              ],
            ),
          ),

          // Right Side: Notification Icon
          Consumer2<NotificationController, AuthController>(
            builder: (context, notification, auth, child) {
              return GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const NotificationsScreen(),
                    ),
                  );
                },
                child: Stack(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.grey[200]!, width: 1),
                      ),
                      child: Icon(
                        Icons.notifications_none_rounded,
                        color: Colors.black87,
                        size: 24,
                      ),
                    ),
                    if (notification.unreadCount > 0)
                      Positioned(
                        right: 2,
                        top: 2,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            notification.unreadCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
