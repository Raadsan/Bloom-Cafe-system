import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class PaymentRemoteDataSource {
  // ── GET PAYMENT METHODS ────────────────────────────────────────────────────
  Future<List<dynamic>> getPaymentMethods() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/payments/methods'),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) return data['data'] ?? [];
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  // ── CREATE PAYMENT REQUEST (any method except Waafi direct) ───────────────
  Future<Map<String, dynamic>?> createPaymentRequest({
    required int orderId,
    required String method,
    required String phone,
    String? providerName,
  }) async {
    try {
      final body = json.encode({
        'orderId': orderId,
        'method': method,
        'phone': phone,
        'providerName': providerName,
      });

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/payments/pay'),
        headers: {'Content-Type': 'application/json'},
        body: body,
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) return data['data'];
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  // ── WAAFI DIRECT MOBILE PAYMENT ───────────────────────────────────────────
  /// Sends a payment push to the customer's Waafi phone.
  /// Returns the payment record on success, or throws on failure.
  Future<Map<String, dynamic>> processWaafiPayment({
    required int orderId,
    required String phone,
  }) async {
    final body = json.encode({'orderId': orderId, 'phone': phone});

    final response = await http.post(
      Uri.parse('${ApiConstants.baseUrl}/payments/waafi'),
      headers: {'Content-Type': 'application/json'},
      body: body,
    );

    final data = json.decode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'];
    }

    // Propagate backend error message to the controller
    throw Exception(data['message'] ?? 'Waafi payment failed');
  }

  // ── CONFIRM PAYMENT MANUALLY ──────────────────────────────────────────────
  Future<Map<String, dynamic>?> confirmPayment({
    required int paymentId,
    required String status, // 'paid' | 'failed'
    String? providerRef,
  }) async {
    try {
      final response = await http.patch(
        Uri.parse('${ApiConstants.baseUrl}/payments/pay/$paymentId/confirm'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'status': status, 'providerRef': providerRef}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) return data['data'];
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  // ── GET PAYMENT BY ORDER ──────────────────────────────────────────────────
  Future<Map<String, dynamic>?> getPaymentByOrderId(int orderId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/payments/order/$orderId'),
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) return data['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ── PROCESS CHECKOUT PAYMENT DIRECTLY ──────────────────────────────────────
  Future<Map<String, dynamic>?> processCheckoutPayment({
    required String type,
    int? tableId,
    int? addressId,
    required List<dynamic> items,
    required String phone,
    required String token,
    String? notes,
  }) async {
    try {
      final body = json.encode({
        'type': type,
        'tableId': tableId,
        'addressId': addressId,
        'items': items
            .map(
              (item) => {
                'menuItemId': item['menuItemId'] ?? item['menuItem']['id'],
                'quantity': item['quantity'],
              },
            )
            .toList(),
        'phone': phone,
        'notes': notes ?? 'Ordered via App',
      });

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/payments/checkout-pay'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: body,
      );

      print('Checkout-pay Response Code: ${response.statusCode}');
      print('Checkout-pay Response Body: ${response.body}');

      final data = json.decode(response.body);
      if (response.statusCode == 201 && data['success'] == true) {
        return data['data'];
      }
      throw Exception(data['message'] ?? 'Unknown error');
    } catch (e) {
      rethrow;
    }
  }
}
