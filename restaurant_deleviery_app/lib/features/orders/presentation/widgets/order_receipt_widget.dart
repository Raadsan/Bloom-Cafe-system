import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/colors.dart';

class OrderReceiptWidget extends StatelessWidget {
  final dynamic order;

  const OrderReceiptWidget({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final DateTime createdAt = DateTime.parse(order['createdAt']);
    final String formattedDate = DateFormat('dd/MM/yyyy HH:mm').format(createdAt);
    final List<dynamic> items = order['orderitem'] ?? [];

    return Container(
      margin: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 15),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 10),
              child: Column(
                children: [
                  const Icon(Icons.check_circle, color: Colors.green, size: 60),
                  const SizedBox(height: 15),
                  const Text(
                    "Order Receipt",
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, fontFamily: "Poppins"),
                  ),
                  Text(
                    "Thank you for your order!",
                    style: TextStyle(color: Colors.grey[500], fontSize: 14),
                  ),
                  const SizedBox(height: 30),
                  
                  _buildReceiptInfo("Order ID", "#${order['id']}"),
                  _buildReceiptInfo("Date", formattedDate),
                  _buildReceiptInfo("Order Type", (order['orderType'] ?? order['type'] ?? 'Eating').toString().toUpperCase()),
                  if (order['table'] != null)
                    _buildReceiptInfo("Table", "Table ${order['table']['number']}"),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: DottedLine(),
                  ),
                  
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Items",
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ),
                  const SizedBox(height: 15),
                  
                  ...items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            "${item['quantity']}x ${item['menuitem']['name']}",
                            style: const TextStyle(fontSize: 14, color: Color(0xFF1B3022)),
                          ),
                        ),
                        Text(
                          "\$${(double.parse(item['unitPrice'].toString()) * item['quantity']).toStringAsFixed(2)}",
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  )).toList(),
                  
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 20),
                    child: DottedLine(),
                  ),
                  
                  _buildSummaryRow("Subtotal", "\$${double.parse(order['total'].toString()).toStringAsFixed(2)}"),
                  _buildSummaryRow("Tax (0%)", "\$0.00"),
                  const SizedBox(height: 15),
                  _buildSummaryRow("Total Amount", "\$${double.parse(order['total'].toString()).toStringAsFixed(2)}", isTotal: true),
                  
                  const SizedBox(height: 40),
                  const Text(
                    "Scan this receipt at the counter if required.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey[500], fontSize: 13)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isTotal ? const Color(0xFF1B3022) : Colors.grey[600],
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 20 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
              color: isTotal ? AppColors.primaryColor : Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

class DottedLine extends StatelessWidget {
  const DottedLine({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(
        30,
        (index) => Expanded(
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 2),
            height: 1,
            color: Colors.grey[300],
          ),
        ),
      ),
    );
  }
}
