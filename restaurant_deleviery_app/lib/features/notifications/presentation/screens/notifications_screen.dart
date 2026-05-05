import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import '../../../../core/theme/colors.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

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
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _buildDateHeader("Today"),
          const SizedBox(height: 15),
          _buildNotificationItem(
            "Order Delivered",
            "Your order #2140 from Maria's Kitchen has been delivered successfully.",
            "2 min ago",
            true,
          ),
          const SizedBox(height: 15),
          _buildNotificationItem(
            "15% Discount Voucher",
            "You just received a new discount voucher. Use it on your next order!",
            "1 hour ago",
            true,
          ),
          const SizedBox(height: 25),
          _buildDateHeader("Yesterday"),
          const SizedBox(height: 15),
          _buildNotificationItem(
            "Payment Successful",
            "Your payment of \$18.44 for order #2139 was successful.",
            "Yesterday, 10:30 PM",
            false,
          ),
          const SizedBox(height: 15),
          _buildNotificationItem(
            "New Menu Added",
            "Check out our new Spicy Pepperoni Pizza now available in the menu.",
            "Yesterday, 02:15 PM",
            false,
          ),
        ],
      ),
    );
  }

  Widget _buildDateHeader(String title) {
    return Text(
      title,
      style: TextStyle(
        fontSize: 14,
        color: Colors.grey[600],
        fontWeight: FontWeight.w500,
        fontFamily: "Poppins",
      ),
    );
  }

  Widget _buildNotificationItem(
    String title,
    String desc,
    String time,
    bool isUnread,
  ) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FBF8), // Soft off-white green tint
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: Colors.white, width: 1.5),
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
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w500,
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
                  desc,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                    height: 1.5,
                    fontFamily: "Poppins",
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  time,
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
    );
  }
}
