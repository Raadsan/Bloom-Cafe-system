import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../core/api/api_constants.dart';

class PaymentRemoteDataSource {
  Future<List<dynamic>> getPaymentMethods() async {
    try {
      final response = await http.get(Uri.parse('${ApiConstants.baseUrl}/payments/methods'));
      
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

  Future<Map<String, dynamic>?> createPaymentRequest({
    required int orderId,
    required String method,
    required String phone,
    String? providerName,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConstants.baseUrl}/payments/pay'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'orderId': orderId,
          'method': method,
          'phone': phone,
          'providerName': providerName,
        }),
      );

      if (response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success']) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }
}
