import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/colors.dart';
import '../../presentation/controllers/notification_controller.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../orders/presentation/controllers/order_controller.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final orderController = context.read<OrderController>();
      final notificationController = context.read<NotificationController>();
      
      // Try to get customerId from orders
      if (orderController.orders.isNotEmpty) {
        final lastOrder = orderController.orders.first;
        if (lastOrder['customerId'] != null) {
          notificationController.setCustomerId(lastOrder['customerId']);
          notificationController.fetchNotifications();
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(IconlyLight.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Color(0xFF2D3E2D),
            fontWeight: FontWeight.w500,
            fontFamily: "Poppins",
          ),
        ),
        centerTitle: true,
        actions: [
          Consumer<NotificationController>(
            builder: (context, controller, child) {
              if (controller.notifications.isEmpty) return const SizedBox();
              return TextButton(
                onPressed: () => controller.markAllAsRead(),
                child: const Text("Read All", style: TextStyle(color: AppColors.primaryColor)),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationController>(
        builder: (context, controller, child) {
          if (controller.currentCustomerId == null) {
            return const Center(child: Text("No order history found to track notifications."));
          }

          if (controller.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (controller.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(IconlyLight.notification, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 15),
                  Text("No notifications yet", style: TextStyle(color: Colors.grey[500])),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: controller.notifications.length,
            itemBuilder: (context, index) {
              final notification = controller.notifications[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 15),
                child: _buildNotificationItem(
                  context,
                  notification,
                  controller,
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildNotificationItem(
    BuildContext context,
    dynamic notification,
    NotificationController controller,
  ) {
    final DateTime createdAt = DateTime.parse(notification['createdAt']);
    final String timeStr = DateFormat('MMM d, h:mm a').format(createdAt);
    final bool isUnread = notification['isRead'] == false;

    return GestureDetector(
      onTap: () {
        if (isUnread) {
          controller.markAsRead(notification['id']);
        }
      },
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isUnread ? Colors.white : const Color(0xFFF8FBF8),
          borderRadius: BorderRadius.circular(22),
          border: Border.all(
            color: isUnread ? AppColors.primaryColor.withOpacity(0.2) : Colors.white,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.015),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        notification['title'],
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          fontFamily: "Poppins",
                          color: Color(0xFF1B3022),
                        ),
                      ),
                      if (isUnread)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.redAccent,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notification['message'],
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 12,
                      height: 1.5,
                      fontFamily: "Poppins",
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    timeStr,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 10,
                      fontFamily: "Poppins",
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
