import 'package:flutter/material.dart';
import 'package:iconly/iconly.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../controllers/order_controller.dart';
import '../../../../core/theme/colors.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text(
          'My Orders',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.green),
            onPressed: () => context.read<OrderController>().fetchOrders(),
          ),
        ],
      ),
      body: Consumer<OrderController>(
        builder: (context, orderController, child) {
          if (orderController.isLoading && orderController.orders.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Colors.green));
          }

          if (orderController.orders.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(IconlyLight.bag_2, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  const Text(
                    "No orders found",
                    style: TextStyle(fontSize: 18, color: Colors.grey, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => orderController.fetchOrders(),
            color: Colors.green,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: orderController.orders.length,
              itemBuilder: (context, index) {
                final order = orderController.orders[index];
                return _buildOrderCard(context, order);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, dynamic order) {
    final DateTime createdAt = DateTime.parse(order['createdAt']);
    final String formattedDate = DateFormat('dd MMM yyyy, hh:mm a').format(createdAt);
    final String status = order['status'].toString();
    
    Color statusColor;
    switch (status.toLowerCase()) {
      case 'pending': statusColor = Colors.orange; break;
      case 'preparing': statusColor = Colors.blue; break;
      case 'ready': statusColor = Colors.purple; break;
      case 'served': statusColor = Colors.green; break;
      case 'cancelled': statusColor = Colors.red; break;
      default: statusColor = Colors.grey;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Icon(
                            IconlyBold.bag_2,
                            color: statusColor,
                            size: 22,
                          ),
                        ),
                        const SizedBox(width: 15),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Order #${order['id']}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: Color(0xFF1B3022),
                              ),
                            ),
                            Text(
                              formattedDate,
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(height: 1, color: Color(0xFFF1F1F1)),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildOrderInfo('Items', '${order['items']?.length ?? 0} Items'),
                    _buildOrderInfo('Total Price', '\$${double.parse(order['total'].toString()).toStringAsFixed(2)}', isPrice: true),
                  ],
                ),
              ],
            ),
          ),
          InkWell(
            onTap: () {
              // Navigate to tracking or details
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 18),
              decoration: BoxDecoration(
                color: AppColors.primaryColor,
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
              ),
              child: const Center(
                child: Text(
                  'Track Order',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderInfo(String label, String value, {bool isPrice = false}) {
    return Column(
      crossAxisAlignment: isPrice ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.grey[500],
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: isPrice ? AppColors.primaryColor : const Color(0xFF1B3022),
          ),
        ),
      ],
    );
  }
}
