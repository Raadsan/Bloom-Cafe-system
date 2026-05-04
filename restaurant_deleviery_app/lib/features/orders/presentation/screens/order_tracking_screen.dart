import 'package:flutter/material.dart';

class OrderTrackingScreen extends StatelessWidget {
  const OrderTrackingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Text(
          'Order Tracking Screen',
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
