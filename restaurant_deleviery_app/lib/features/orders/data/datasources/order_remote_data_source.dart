import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class OrderRemoteDataSource {
  Future<List<dynamic>> getAllOrders(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.baseUrl}/orders/all'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'] ?? [];
        }
      }
      return [];
    } catch (e) {
      rethrow;
    }
  }

  Future<dynamic> createOrder({
    required String type,
    int? tableId,
    int? addressId,
    required List<dynamic> items,
    required String token,
    String? notes,
  }) async {
    try {
      final orderData = {
        'type': type,
        'tableId': tableId,
        'addressId': addressId,
        'items': items.map((item) => {
          'menuItemId': item['menuItemId'] ?? item['menuItem']['id'],
          'quantity': item['quantity'],
        }).toList(),
        'notes': notes,
      };

      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/orders'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode(orderData),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'];
        }
      }
      throw Exception(json.decode(response.body)['message'] ?? 'Failed to create order');
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> deleteOrder(int orderId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConstants.baseUrl}/orders/$orderId'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }
      return false;
    } catch (e) {
      print('deleteOrder DataSource Error: $e');
      return false;
    }
  }
}
