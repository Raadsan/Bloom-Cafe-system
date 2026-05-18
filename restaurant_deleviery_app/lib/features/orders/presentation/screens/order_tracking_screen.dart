import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../controllers/order_controller.dart';
import '../../../../core/theme/colors.dart';
import '../widgets/order_receipt_widget.dart';

class OrderTrackingScreen extends StatelessWidget {
  final dynamic order;

  const OrderTrackingScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(IconlyLight.arrow_left, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          "Track Order #${order['id']}",
          style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(IconlyLight.document, color: Colors.green),
            onPressed: () => _showReceipt(context, order),
          ),
        ],
      ),
      body: Consumer<OrderController>(
        builder: (context, controller, child) {
          // Find the latest version of this order from the controller
          final currentOrder = controller.orders.firstWhere(
            (o) => o['id'] == order['id'],
            orElse: () => order,
          );
          
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildStatusHeader(currentOrder),
                const SizedBox(height: 30),
                _buildTrackingTimeline(currentOrder),
                const SizedBox(height: 40),
                _buildOrderSummaryCard(context, currentOrder),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showReceipt(BuildContext context, dynamic order) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => OrderReceiptWidget(order: order),
    );
  }

  Widget _buildStatusHeader(dynamic order) {
    String status = order['status'] ?? 'pending';
    String title = "";
    String subtitle = "";
    IconData icon = IconlyBold.time_circle;
    Color color = Colors.orange;

    switch (status.toLowerCase()) {
      case 'pending':
        title = "Waiting for Confirmation";
        subtitle = "The restaurant is reviewing your order";
        icon = IconlyBold.time_circle;
        color = Colors.orange;
        break;
      case 'preparing':
        title = "Chef is Cooking";
        subtitle = "Your meal is being prepared with care";
        icon = IconlyBold.category;
        color = Colors.blue;
        break;
      case 'ready':
        title = "Order is Ready!";
        subtitle = "Your food is ready for pick up / delivery";
        icon = IconlyBold.tick_square;
        color = Colors.purple;
        break;
      case 'served':
        title = "Order Served";
        subtitle = "Enjoy your delicious meal!";
        icon = IconlyBold.heart;
        color = Colors.green;
        break;
      case 'cancelled':
        title = "Order Cancelled";
        subtitle = "This order has been cancelled";
        icon = IconlyBold.close_square;
        color = Colors.red;
        break;
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 40),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1B3022)),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildTrackingTimeline(dynamic order) {
    String currentStatus = (order['status'] ?? 'pending').toString().toLowerCase();
    
    final statuses = [
      {'id': 'pending', 'label': 'Order Placed', 'icon': IconlyLight.document},
      {'id': 'preparing', 'label': 'Preparing', 'icon': IconlyLight.category},
      {'id': 'ready', 'label': 'Ready', 'icon': IconlyLight.tick_square},
      {'id': 'served', 'label': 'Completed', 'icon': IconlyLight.heart},
    ];

    int currentIndex = statuses.indexWhere((s) => s['id'] == currentStatus);
    if (currentIndex == -1 && currentStatus != 'cancelled') currentIndex = 0;

    return Column(
      children: List.generate(statuses.length, (index) {
        bool isCompleted = index <= currentIndex;
        bool isLast = index == statuses.length - 1;
        bool isCurrent = index == currentIndex;

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: isCompleted ? AppColors.primaryColor : Colors.grey[200],
                    shape: BoxShape.circle,
                    border: isCurrent ? Border.all(color: AppColors.primaryColor.withOpacity(0.2), width: 8) : null,
                  ),
                  child: Icon(
                    isCompleted ? Icons.check : Icons.circle,
                    size: 15,
                    color: isCompleted ? Colors.white : Colors.grey[400],
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 50,
                    color: index < currentIndex ? AppColors.primaryColor : Colors.grey[200],
                  ),
              ],
            ),
            const SizedBox(width: 20),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    statuses[index]['label'] as String,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: isCompleted ? FontWeight.bold : FontWeight.normal,
                      color: isCompleted ? const Color(0xFF1B3022) : Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 4),
                  if (isCurrent)
                    Text(
                      "Current Stage",
                      style: TextStyle(fontSize: 12, color: AppColors.primaryColor, fontWeight: FontWeight.w600),
                    )
                  else if (isCompleted)
                    const Text(
                      "Finished",
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                ],
              ),
            ),
            Icon(statuses[index]['icon'] as IconData, color: isCompleted ? AppColors.primaryColor : Colors.grey[300], size: 22),
          ],
        );
      }),
    );
  }

  Widget _buildOrderSummaryCard(BuildContext context, dynamic order) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Order Summary", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Order Type", style: TextStyle(color: Colors.grey[600])),
              Text(
                (order['type'] ?? 'Eating').toString().toUpperCase(),
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
              ),
            ],
          ),
          if (order['table'] != null) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("Table Number", style: TextStyle(color: Colors.grey[600])),
                Text(
                  "Table ${order['table']['number']}",
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ],
          const Divider(height: 30),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Total Pay", style: TextStyle(fontWeight: FontWeight.bold)),
              Text(
                "\$${double.parse(order['total'].toString()).toStringAsFixed(2)}",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.primaryColor),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
